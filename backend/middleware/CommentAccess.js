const mongoose = require("mongoose");
const Comment = require("../models/CommentModel");

// Same pattern as loadTask: find the comment, then let loadProject('projectId') check membership
const loadComment = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    req.comment = comment;
    req.params.projectId = comment.project.toString();
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = loadComment;
