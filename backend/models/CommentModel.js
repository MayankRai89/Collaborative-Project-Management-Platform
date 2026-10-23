const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    // Stored redundantly so access checks and "delete a whole project" don't need a join through tasks
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

commentSchema.index({ task: 1, createdAt: 1 });
commentSchema.index({ project: 1 });

module.exports = mongoose.model("Comment", commentSchema);
