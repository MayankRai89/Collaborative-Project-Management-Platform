require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/UserModel");

const users = [
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
    name: "Vikram Viewer",
    email: "viewer@example.com",
    password: "Viewer@123",
    role: "viewer",
  },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.deleteMany({});

  // create() one by one so the pre('save') hook hashes each password (insertMany would skip it)
  for (const u of users) await User.create(u);

  console.log("Seeded users:");
  users.forEach((u) =>
    console.log(`  ${u.role.padEnd(16)} ${u.email} / ${u.password}`),
  );
  process.exit(0);
})();
