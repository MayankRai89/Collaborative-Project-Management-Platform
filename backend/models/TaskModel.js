const mongoose = require("mongoose");

const STATUSES = ["todo", "in_progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, default: "" },
    status: { type: String, enum: STATUSES, default: "todo" },
    priority: { type: String, enum: PRIORITIES, default: "medium" },
    dueDate: { type: Date, default: null },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Our own optimistic-lock counter. Starts at 1, +1 on every successful update
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    versionKey: false, // turn off Mongoose's __v so there is only ONE version field to explain
  },
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1, status: 1 });

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
