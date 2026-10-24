require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}
const User = require("../models/UserModel");
const Project = require("../models/ProjectModel");
const ProjectMember = require("../models/ProjectMemberModel");
const Task = require("../models/TaskModel");
const Comment = require("../models/CommentModel");

const usersData = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@123",
    role: "admin",
  },
  {
    name: "Priya Manager",
    email: "pm@example.com",
    password: "Manager@123",
    role: "project_manager",
  },
  {
    name: "Rahul Member",
    email: "member@example.com",
    password: "Member@123",
    role: "team_member",
  },
  {
    name: "Aisha Khan",
    email: "aisha@example.com",
    password: "Member@123",
    role: "team_member",
  },
  {
    name: "Vikram Viewer",
    email: "viewer@example.com",
    password: "Viewer@123",
    role: "viewer",
  },
];

(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/collaborative_pm";
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log("Cleaning existing database collections...");
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      ProjectMember.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
    ]);

    // 1. Seed Users (use create() sequentially so the pre('save') bcrypt hook runs)
    console.log("Seeding users...");
    const createdUsers = {};
    for (const u of usersData) {
      const doc = await User.create(u);
      createdUsers[u.email] = doc;
      console.log(`  Created ${u.role.padEnd(16)}: ${u.email}`);
    }

    const admin = createdUsers["admin@example.com"];
    const pm = createdUsers["pm@example.com"];
    const member = createdUsers["member@example.com"];
    const member2 = createdUsers["aisha@example.com"];
    const viewer = createdUsers["viewer@example.com"];

    // 2. Seed Projects
    console.log("Seeding projects...");
    const project1 = await Project.create({
      name: "Core Infrastructure Migration",
      description: "Migration to scalable microservices, containerization, and automated CI/CD pipeline.",
      status: "active",
      manager: pm._id,
      createdBy: admin._id,
    });

    const project2 = await Project.create({
      name: "Client Portal & Mobile UI",
      description: "Streetwear aesthetic responsive web portal and mobile lookbook interface.",
      status: "active",
      manager: pm._id,
      createdBy: pm._id,
    });

    const project3 = await Project.create({
      name: "Real-time Telemetry & Audit",
      description: "Optimistic concurrency tracking, event logging, and telemetry metrics.",
      status: "active",
      manager: pm._id,
      createdBy: admin._id,
    });

    console.log(`  Created 3 projects: "${project1.name}", "${project2.name}", "${project3.name}"`);

    // 3. Seed Project Members
    console.log("Seeding project memberships...");
    await ProjectMember.create([
      // Project 1 members
      { project: project1._id, user: pm._id, role: "project_manager" },
      { project: project1._id, user: member._id, role: "team_member" },
      { project: project1._id, user: member2._id, role: "team_member" },
      { project: project1._id, user: viewer._id, role: "viewer" },

      // Project 2 members
      { project: project2._id, user: pm._id, role: "project_manager" },
      { project: project2._id, user: member._id, role: "team_member" },
      { project: project2._id, user: member2._id, role: "team_member" },
      { project: project2._id, user: viewer._id, role: "viewer" },

      // Project 3 members
      { project: project3._id, user: pm._id, role: "project_manager" },
      { project: project3._id, user: member._id, role: "team_member" },
      { project: project3._id, user: member2._id, role: "team_member" },
    ]);
    console.log("  Created project memberships for PM, Member, and Viewer.");

    // 4. Seed Tasks
    console.log("Seeding tasks...");
    const task1 = await Task.create({
      project: project1._id,
      title: "Configure MongoDB Replica Set & Sharding",
      description: "Deploy 3-node MongoDB replica set with automated failover and backup daemon.",
      status: "in_progress",
      priority: "high",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 days
      assignee: member._id,
      createdBy: pm._id,
      version: 1,
    });

    const task2 = await Task.create({
      project: project1._id,
      title: "Kubernetes Ingress and TLS Certificate Automation",
      description: "Setup cert-manager with Let's Encrypt automated renewal and zero-downtime routing.",
      status: "todo",
      priority: "medium",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // +10 days
      assignee: member._id,
      createdBy: pm._id,
      version: 1,
    });

    const task3 = await Task.create({
      project: project1._id,
      title: "Docker Compose Development Environment",
      description: "Standardize local developer onboarding with containerized services.",
      status: "done",
      priority: "low",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // -2 days
      assignee: member._id,
      createdBy: admin._id,
      version: 2,
    });

    const task4 = await Task.create({
      project: project2._id,
      title: "High-Contrast Brutalist Design System",
      description: "Implement custom color palette, typography tokens, and sharp-edge cards.",
      status: "done",
      priority: "high",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assignee: member._id,
      createdBy: pm._id,
      version: 1,
    });

    const task5 = await Task.create({
      project: project2._id,
      title: "Implement Optimistic Concurrency Conflict UI",
      description: "Add resolution modal when two members edit the same task concurrently (409 conflict).",
      status: "in_progress",
      priority: "high",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      assignee: member._id,
      createdBy: pm._id,
      version: 1,
    });

    const task6 = await Task.create({
      project: project3._id,
      title: "Event Stream Audit Logger",
      description: "Record all project status transitions and permission checks into audit stream.",
      status: "todo",
      priority: "medium",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      assignee: member._id,
      createdBy: admin._id,
      version: 1,
    });

    console.log("  Created 6 tasks across all projects.");

    // 5. Seed Comments
    console.log("Seeding comments...");
    await Comment.create([
      {
        task: task1._id,
        project: project1._id,
        author: member._id,
        body: "Initial 3-node cluster configured. Running replication lag diagnostics now.",
      },
      {
        task: task1._id,
        project: project1._id,
        author: pm._id,
        body: "Looks solid. Make sure failover test is documented in the team wiki.",
      },
      {
        task: task5._id,
        project: project2._id,
        author: member._id,
        body: "Version check working properly; testing 409 handling with concurrent browser tabs.",
      },
    ]);
    console.log("  Created discussion comments on active tasks.");

    console.log("\n=========================================");
    console.log(" Database seeded successfully!");
    console.log(" Database Name: collaborative_pm");
    console.log(" Collections populated: users, projects, projectmembers, tasks, comments");
    console.log("=========================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
})();
