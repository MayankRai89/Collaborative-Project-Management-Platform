const mongoose = require("mongoose");
const Project = require("../models/ProjectModel");
const ProjectMember = require("../models/ProjectMemberModel");

// Loads the project and works out the caller's role IN THIS PROJECT.
// Sets req.project, req.projectRole ('admin' | 'project_manager' | 'team_member' | 'viewer')
const loadProject =
  (paramName = "id") =>
  async (req, res, next) => {
    try {
      const projectId = req.params[paramName];
      if (!mongoose.isValidObjectId(projectId)) {
        return res.status(400).json({ message: "Invalid project id" });
      }

      const project = await Project.findById(projectId);
      if (!project)
        return res.status(404).json({ message: "Project not found" });

      if (req.user.role === "admin") {
        req.projectRole = "admin"; // admins can see every project
      } else {
        const membership = await ProjectMember.findOne({
          project: project._id,
          user: req.user._id,
        });
        // 404, not 403: don't reveal that a project exists to people outside it
        if (!membership)
          return res.status(404).json({ message: "Project not found" });
        req.projectRole = membership.role;
        req.membership = membership;
      }

      req.project = project;
      next();
    } catch (err) {
      next(err);
    }
  };

// Usage: requireProjectRole('admin', 'project_manager')
const requireProjectRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!allowedRoles.includes(req.projectRole)) {
      return res
        .status(403)
        .json({
          message:
            "You do not have permission to perform this action in this project",
        });
    }
    next();
  };

module.exports = { loadProject, requireProjectRole };
