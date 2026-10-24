const Comment = require("../models/CommentModel");
const User = require("../models/UserModel");

// GET /api/tasks/:id/comments?page=1&limit=20   (oldest first, like a conversation)
exports.listComments = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const filter = { task: req.task._id, threadType: "task_thread" };

    const [data, total] = await Promise.all([
      Comment.find(filter)
        .populate("author", "name email role")
        .populate("recipient", "name email role")
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Comment.countDocuments(filter),
    ]);

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

// POST /api/tasks/:id/comments   body: { body, category, recipientId }
exports.createComment = async (req, res, next) => {
  try {
    if (req.project.status === "archived") {
      return res
        .status(400)
        .json({
          message: "Archived projects are read-only. Restore it first.",
        });
    }

    if (req.projectRole === "viewer") {
      return res
        .status(403)
        .json({ message: "Viewers have read-only access and cannot post updates." });
    }

    const { body, category: reqCategory, recipientId } = req.body;
    if (typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ message: "Comment body is required" });
    }
    if (body.trim().length > 1000) {
      return res
        .status(400)
        .json({ message: "Comment must be 1000 characters or fewer" });
    }

    const validCategories = [
      "general",
      "progress_update",
      "blocker",
      "pm_directive",
      "admin_instruction",
      "status_request",
    ];

    let category = "general";
    if (reqCategory && validCategories.includes(reqCategory)) {
      category = reqCategory;
    } else {
      // Smart default based on sender identity
      if (req.user.role === "admin") {
        category = "admin_instruction";
      } else if (req.projectRole === "project_manager") {
        category = "pm_directive";
      } else if (req.task.assignee && req.task.assignee.equals(req.user._id)) {
        category = "progress_update";
      }
    }

    let recipient = null;
    if (recipientId) {
      const recipientUser = await User.findById(recipientId);
      if (recipientUser && recipientUser.isActive) {
        recipient = recipientUser._id;
      }
    }

    const comment = await Comment.create({
      task: req.task._id,
      project: req.project._id,
      author: req.user._id,
      recipient,
      body: body.trim(),
      category,
      threadType: "task_thread",
    });
    await comment.populate("author", "name email role");
    if (comment.recipient) {
      await comment.populate("recipient", "name email role");
    }

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id/updates   (Tier A: Admin <-> PM Project Updates Thread)
exports.listProjectUpdates = async (req, res, next) => {
  try {
    const filter = {
      project: req.project._id,
      threadType: "admin_pm_thread",
    };

    const data = await Comment.find(filter)
      .populate("author", "name email role")
      .populate("recipient", "name email role")
      .sort({ createdAt: 1 });

    res.json({ data });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/updates   (Tier A: Admin <-> PM Project Updates Thread)
exports.createProjectUpdate = async (req, res, next) => {
  try {
    if (req.project.status === "archived") {
      return res
        .status(400)
        .json({
          message: "Archived projects are read-only. Restore it first.",
        });
    }

    const isProjectManager =
      req.projectRole === "project_manager" ||
      (req.project.manager && req.project.manager.equals(req.user._id));
    const isAdmin = req.user.role === "admin" || req.projectRole === "admin";

    if (!isAdmin && !isProjectManager) {
      return res.status(403).json({
        message: "Only Admin and the assigned Project Manager can post in this project update thread.",
      });
    }

    const { body, category: reqCategory, recipientId } = req.body;
    if (typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ message: "Update message body is required" });
    }

    let category = isAdmin ? "status_request" : "admin_pm_update";
    if (reqCategory) category = reqCategory;

    let recipient = null;
    if (recipientId) {
      const recipientUser = await User.findById(recipientId);
      if (recipientUser && recipientUser.isActive) {
        recipient = recipientUser._id;
      }
    } else {
      // Default recipient: If Admin posted, target the PM; if PM posted, target the Admin/PM
      if (isAdmin && req.project.manager) {
        recipient = req.project.manager;
      }
    }

    const comment = await Comment.create({
      project: req.project._id,
      task: null,
      author: req.user._id,
      recipient,
      body: body.trim(),
      category,
      threadType: "admin_pm_thread",
    });
    await comment.populate("author", "name email role");
    if (comment.recipient) {
      await comment.populate("recipient", "name email role");
    }

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/comments/:id
exports.deleteComment = async (req, res, next) => {
  try {
    if (req.project.status === "archived") {
      return res
        .status(400)
        .json({
          message: "Archived projects are read-only. Restore it first.",
        });
    }

    if (req.projectRole === "viewer") {
      return res
        .status(403)
        .json({ message: "Viewers have read-only access and cannot delete comments." });
    }

    const isManager = ["admin", "project_manager"].includes(req.projectRole);
    const isOwnComment = req.comment.author.equals(req.user._id);

    if (!isManager && !isOwnComment) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }

    await req.comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
};
