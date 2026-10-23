const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    // Stored on all comments so access checks and "delete a whole project" work uniformly
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
    // Target recipient / @mention for Tier B (PM -> Specific Team Member) or Tier A
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    category: {
      type: String,
      enum: [
        "general",
        "progress_update",
        "blocker",
        "pm_directive",
        "admin_instruction",
        "status_request",
        "admin_pm_update",
      ],
      default: "general",
    },
    threadType: {
      type: String,
      enum: ["task_thread", "admin_pm_thread"],
      default: "task_thread",
    },
  },
  { timestamps: true },
);

commentSchema.index({ task: 1, createdAt: 1 });
commentSchema.index({ project: 1, threadType: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
