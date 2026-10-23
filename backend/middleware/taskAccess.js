const mongoose = require("mongoose");
const Task = require("../models/TaskModel");

// Loads the task, then hands its project id to loadProject('projectId'),
// which does the membership check and sets req.project and req.projectRole.
const loadTask = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    req.task = task;
    req.params.projectId = task.project.toString();
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = loadTask;
