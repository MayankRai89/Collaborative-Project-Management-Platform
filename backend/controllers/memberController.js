const ProjectMember = require("../models/ProjectMemberModel");
const User = require("../models/UserModel");
const Task = require("../models/TaskModel");

// Bumping `version` means anyone currently editing one of these tasks gets a 409 and sees the change
const unassignTasks = (projectId, userId) =>
  Task.updateMany(
    { project: projectId, assignee: userId },
    { $set: { assignee: null }, $inc: { version: 1 } },
  );

// 'project_manager' is deliberately NOT here: it can only be set through PATCH /projects/:id/manager
const ASSIGNABLE_ROLES = ["team_member", "viewer", "project_manager"];

const archivedGuard = (req, res) => {
  if (req.project.status === "archived") {
    res
      .status(400)
      .json({ message: "Archived projects are read-only. Restore it first." });
    return true;
  }
  return false;
};

// A user's project role can never exceed their global role (unless promoted to project_manager)
const exceedsGlobalRole = (user, projectRole) =>
  projectRole !== "project_manager" && user.role === "viewer" && projectRole !== "viewer";

// GET /api/projects/:id/members?role=viewer   (any member, or admin)
exports.listMembers = async (req, res, next) => {
  try {
    const filter = { project: req.project._id };
    if (ASSIGNABLE_ROLES.includes(req.query.role))
      filter.role = req.query.role;

    const data = await ProjectMember.find(filter)
      .populate("user", "name email role isActive")
      .sort({ createdAt: 1 });

    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/members   body: { userId, role }
exports.addMember = async (req, res, next) => {
  try {
    if (archivedGuard(req, res)) return;

    const { userId, role } = req.body;
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({
        message: `role must be one of: ${ASSIGNABLE_ROLES.join(", ")}`,
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: "User not found or deactivated" });
    }
    if (user.role === "admin") {
      return res
        .status(400)
        .json({ message: "Admins already have access to every project" });
    }
    if (exceedsGlobalRole(user, role)) {
      return res.status(400).json({
        message:
          "This user has a global viewer role, so they can only be a viewer",
      });
    }

    const existing = await ProjectMember.findOne({
      project: req.project._id,
      user: user._id,
    });
    if (existing)
      return res
        .status(409)
        .json({ message: "User is already a member of this project" });

    const member = await ProjectMember.create({
      project: req.project._id,
      user: user._id,
      role,
    });

    if (role === "project_manager") {
      if (user.role !== "admin" && user.role !== "project_manager") {
        user.role = "project_manager";
        await user.save();
      }
      const previousId = req.project.manager;
      if (previousId && !previousId.equals(user._id)) {
        await ProjectMember.updateOne(
          { project: req.project._id, user: previousId },
          { role: "team_member" },
        );
      }
      req.project.manager = user._id;
      await req.project.save();
    }

    await member.populate("user", "name email role");

    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:id/members/:userId   body: { role }
exports.updateMemberRole = async (req, res, next) => {
  try {
    if (archivedGuard(req, res)) return;

    const { role } = req.body;
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({
        message: `role must be one of: ${ASSIGNABLE_ROLES.join(", ")}`,
      });
    }

    const member = await ProjectMember.findOne({
      project: req.project._id,
      user: req.params.userId,
    });
    if (!member)
      return res
        .status(404)
        .json({ message: "Member not found in this project" });

    const user = await User.findById(member.user);
    if (exceedsGlobalRole(user, role)) {
      return res.status(400).json({
        message:
          "This user has a global viewer role, so they can only be a viewer",
      });
    }

    member.role = role;
    await member.save();

    if (role === "project_manager") {
      if (user.role !== "admin" && user.role !== "project_manager") {
        user.role = "project_manager";
        await user.save();
      }
      const previousId = req.project.manager;
      if (previousId && !previousId.equals(member.user)) {
        await ProjectMember.updateOne(
          { project: req.project._id, user: previousId },
          { role: "team_member" },
        );
      }
      req.project.manager = member.user;
      await req.project.save();
    } else if (
      req.project.manager &&
      req.project.manager.equals(member.user) &&
      role !== "project_manager"
    ) {
      req.project.manager = null;
      await req.project.save();
    }

    if (role === "viewer") await unassignTasks(req.project._id, member.user); // viewers can't own tasks
    await member.populate("user", "name email role");

    res.json({ member });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id/members/:userId
exports.removeMember = async (req, res, next) => {
  try {
    if (archivedGuard(req, res)) return;

    const member = await ProjectMember.findOne({
      project: req.project._id,
      user: req.params.userId,
    });
    if (!member)
      return res
        .status(404)
        .json({ message: "Member not found in this project" });

    if (member.role === "project_manager") {
      return res.status(400).json({
        message: "Assign a different project manager before removing this one",
      });
    }

    await unassignTasks(req.project._id, member.user);
    await member.deleteOne();
    res.json({ message: "Member removed" });
  } catch (err) {
    next(err);
  }
};
