const Comment = require("../models/CommentModel");

// GET /api/tasks/:id/comments?page=1&limit=20   (oldest first, like a conversation)
exports.listComments = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const filter = { task: req.task._id };

    const [data, total] = await Promise.all([
      Comment.find(filter)
        .populate("author", "name email")
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

// POST /api/tasks/:id/comments   body: { body }
exports.createComment = async (req, res, next) => {
  try {
    if (req.project.status === "archived") {
      return res
        .status(400)
        .json({
          message: "Archived projects are read-only. Restore it first.",
        });
    }

    const { body } = req.body;
    if (typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ message: "Comment body is required" });
    }
    if (body.trim().length > 1000) {
      return res
        .status(400)
        .json({ message: "Comment must be 1000 characters or fewer" });
    }

    const comment = await Comment.create({
      task: req.task._id,
      project: req.project._id,
      author: req.user._id,
      body,
    });
    await comment.populate("author", "name email");

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

    const isManager = ["admin", "project_manager"].includes(req.projectRole);
    const isOwnComment = req.comment.author.equals(req.user._id);
    const canDeleteOwn = isOwnComment && req.projectRole === "team_member";

    if (!isManager && !canDeleteOwn) {
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
