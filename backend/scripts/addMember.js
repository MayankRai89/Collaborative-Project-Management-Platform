require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/UserModel");
const Project = require("../models/ProjectModel");
const ProjectMember = require("../models/ProjectMemberModel");

(async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/collaborative_pm";
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    const email = "aisha@example.com";
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: "Aisha Khan",
        email,
        password: "Member@123",
        role: "team_member",
        isActive: true,
      });
      console.log(`Successfully created new team member: ${user.name} (${user.email})`);
    } else {
      console.log(`User ${user.email} already exists.`);
    }

    // Automatically associate with active projects so PM can assign tasks right away
    const activeProjects = await Project.find({ status: "active" });
    for (const proj of activeProjects) {
      const existing = await ProjectMember.findOne({
        project: proj._id,
        user: user._id,
      });

      if (!existing) {
        await ProjectMember.create({
          project: proj._id,
          user: user._id,
          role: "team_member",
        });
        console.log(`  Added ${user.name} to squad: "${proj.name}"`);
      } else {
        console.log(`  Already in squad: "${proj.name}"`);
      }
    }

    console.log("\n--- NEW TEAM MEMBER READY ---");
    console.log(`Name:     ${user.name}`);
    console.log(`Email:    ${user.email}`);
    console.log(`Password: Member@123`);
    console.log(`Role:     ${user.role}`);
    console.log("-----------------------------\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Failed to create team member:", err);
    process.exit(1);
  }
})();
