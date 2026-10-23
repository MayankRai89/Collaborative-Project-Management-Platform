const mongoose = require("mongoose");

const PROJECT_ROLES = ["project_manager", "team_member", "viewer"];

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: PROJECT_ROLES,
      default: "team_member",
    },
  },
  { timestamps: true },
);

// A user can only have one membership per project
projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });
projectMemberSchema.index({ user: 1 });

const ProjectMember = mongoose.model("ProjectMember", projectMemberSchema);

module.exports = ProjectMember;
module.exports.PROJECT_ROLES = PROJECT_ROLES;
