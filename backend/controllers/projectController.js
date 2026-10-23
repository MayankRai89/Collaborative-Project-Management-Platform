const Project = require("../models/ProjectModel");
const ProjectMember = require("../models/ProjectMemberModel");
const User = require("../models/UserModel");
const Task = require("../models/TaskModel");
const Comment = require("../models/CommentModel");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Any active user can be appointed as a project manager by an Admin
const findValidManager = async (managerId) => {
  if (!managerId) return null;
  const manager = await User.findById(managerId);
  if (!manager || !manager.isActive) return null;
  return manager;
};

// GET /api/projects?page=1&limit=10&status=active&search=website
exports.listProjects = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const filter = {};
    let roleByProject = null;

    if (req.user.role !== "admin") {
      // Non-admins see projects where they are a member OR the assigned manager
      const memberships = await ProjectMember.find({ user: req.user._id });
      const memberProjectIds = memberships.map((m) => m.project);
      roleByProject = new Map(
        memberships.map((m) => [m.project.toString(), m.role]),
      );
      filter.$or = [
        { _id: { $in: memberProjectIds } },
        { manager: req.user._id },
      ];
    }

    if (["active", "archived"].includes(req.query.status))
      filter.status = req.query.status;
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      filter.name = new RegExp(escapeRegex(req.query.search.trim()), "i");
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate("manager", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Project.countDocuments(filter),
    ]);

    const projectIds = projects.map((p) => p._id);
    const [allMembers, allTasks] = await Promise.all([
      ProjectMember.find({ project: { $in: projectIds } }).populate(
        "user",
        "name email role isActive"
      ),
      Task.find({ project: { $in: projectIds } })
        .populate("assignee", "name email")
        .sort({ createdAt: -1 }),
    ]);

    const data = projects.map((p) => {
      const projObj = p.toObject();
      const isAssignedManager =
        p.manager &&
        (p.manager._id
          ? p.manager._id.equals(req.user._id)
          : p.manager.equals(req.user._id));
      let myRole = roleByProject
        ? roleByProject.get(p._id.toString())
        : req.user.role === "admin"
        ? "admin"
        : null;
      if (!myRole && isAssignedManager) {
        myRole = "project_manager";
      }

      const projMembers = allMembers
        .filter((m) => m.project && m.project.equals(p._id))
        .map((m) => ({
          _id: m._id,
          role: m.role,
          user: m.user,
        }));

      const projTasks = allTasks
        .filter((t) => t.project && t.project.equals(p._id))
        .map((t) => ({
          _id: t._id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          version: t.version,
          assignee: t.assignee,
        }));

      return {
        ...projObj,
        myRole: myRole || (req.user.role === "admin" ? "admin" : "viewer"),
        members: projMembers,
        tasks: projTasks,
      };
    });

    res.json({
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id   (loadProject already checked access)
exports.getProject = async (req, res, next) => {
  try {
    await req.project.populate("manager", "name email");
    res.json({ project: req.project, myRole: req.projectRole });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects   (admin)
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, managerId } = req.body;

    let manager = null;
    if (managerId) {
      manager = await findValidManager(managerId);
      if (!manager) {
        return res
          .status(400)
          .json({
            message:
              "managerId must be a valid active user",
          });
      }
      if (manager.role !== "admin" && manager.role !== "project_manager") {
        manager.role = "project_manager";
        await manager.save();
      }
    }

    const project = await Project.create({
      name,
      description,
      manager: manager?._id ?? null,
      createdBy: req.user._id,
    });

    if (manager) {
      await ProjectMember.create({
        project: project._id,
        user: manager._id,
        role: "project_manager",
      });
    }

    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:id   (admin or the project's manager)
exports.updateProject = async (req, res, next) => {
  try {
    if (req.project.status === "archived") {
      return res
        .status(400)
        .json({
          message: "Archived projects are read-only. Restore it first.",
        });
    }

    ["name", "description", "adminNotes"].forEach((field) => {
      if (req.body[field] !== undefined) req.project[field] = req.body[field];
    });

    await req.project.save();
    res.json({ project: req.project });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:id/manager   (admin only)
exports.assignManager = async (req, res, next) => {
  try {
    const manager = await findValidManager(req.body.managerId);
    if (!manager) {
      return res
        .status(400)
        .json({
          message:
            "managerId must be a valid active user",
        });
    }

    if (manager.role !== "admin" && manager.role !== "project_manager") {
      manager.role = "project_manager";
      await manager.save();
    }

    const previousId = req.project.manager;
    if (previousId && !previousId.equals(manager._id)) {
      // Old manager stays in the project, but as a regular team member
      await ProjectMember.updateOne(
        { project: req.project._id, user: previousId },
        { role: "team_member" },
      );
    }

    await ProjectMember.findOneAndUpdate(
      { project: req.project._id, user: manager._id },
      { role: "project_manager" },
      { upsert: true, setDefaultsOnInsert: true },
    );

    req.project.manager = manager._id;
    await req.project.save();
    await req.project.populate("manager", "name email");

    res.json({ project: req.project });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:id/archive   (admin or project manager)
exports.archiveProject = async (req, res, next) => {
  try {
    req.project.status = "archived";
    await req.project.save();
    res.json({ project: req.project });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:id/restore   (admin or project manager)
exports.restoreProject = async (req, res, next) => {
  try {
    req.project.status = "active";
    await req.project.save();
    res.json({ project: req.project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id   (admin only, permanent)
exports.deleteProject = async (req, res, next) => {
  try {
    await ProjectMember.deleteMany({ project: req.project._id });
    await Task.deleteMany({ project: req.project._id });
    await Comment.deleteMany({ project: req.project._id });
    await req.project.deleteOne();
    res.json({ message: "Project deleted" });
  } catch (err) {
    next(err);
  }
};
