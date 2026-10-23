const Project = require("../models/ProjectModel");
const ProjectMember = require("../models/ProjectMemberModel");
const User = require("../models/UserModel");
const Task = require("../models/TaskModel");
const Comment = require("../models/CommentModel");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Only active users with the project_manager role can be assigned as a project's manager
const findValidManager = async (managerId) => {
  const manager = await User.findById(managerId);
  if (!manager || !manager.isActive || manager.role !== "project_manager")
    return null;
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
      // Non-admins only see projects they belong to
      const memberships = await ProjectMember.find({ user: req.user._id });
      roleByProject = new Map(
        memberships.map((m) => [m.project.toString(), m.role]),
      );
      filter._id = { $in: memberships.map((m) => m.project) };
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

    const data = projects.map((p) => ({
      ...p.toObject(),
      myRole: roleByProject ? roleByProject.get(p._id.toString()) : "admin",
    }));

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
              "managerId must be an active user with the project_manager role",
          });
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

    ["name", "description"].forEach((field) => {
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
            "managerId must be an active user with the project_manager role",
        });
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
