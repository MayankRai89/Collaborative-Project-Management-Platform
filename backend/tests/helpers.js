const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../app");
const User = require("../models/UserModel");

const PASSWORD = "Test@1234";

async function connectTestDb() {
  const uri = process.env.MONGODB_URI || "";
  // Safety guard: tests delete data, so refuse to run on anything that is not a *_test database
  if (!/_test(\?|$)/.test(uri)) {
    throw new Error(
      `Refusing to run tests on "${uri}". The database name must end with _test`,
    );
  }
  await mongoose.connect(uri);
  await Promise.all(Object.values(mongoose.models).map((m) => m.init())); // make sure unique indexes exist
}

// deleteMany (not dropDatabase) so the indexes survive between runs
async function clearDb() {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})),
  );
}

const disconnectTestDb = () => mongoose.disconnect();

// Creates a user and logs in through the real login endpoint
async function createUser(key, role) {
  const user = await User.create({
    name: key,
    email: `${key}@test.com`,
    password: PASSWORD,
    role,
  });
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: user.email, password: PASSWORD });
  return { id: user._id.toString(), email: user.email, token: res.body.token };
}

// apiAs(token).get(url) sends the request as that user. apiAs() with no token = anonymous.
function apiAs(token) {
  const auth = (req) =>
    token ? req.set("Authorization", `Bearer ${token}`) : req;
  return {
    get: (url) => auth(request(app).get(url)),
    post: (url, body) => auth(request(app).post(url)).send(body),
    patch: (url, body) => auth(request(app).patch(url)).send(body),
    delete: (url) => auth(request(app).delete(url)),
  };
}

// One project with a PM, a team member, a viewer, an outsider (not in the project) and two tasks
async function setupWorld() {
  await clearDb();

  const users = {
    admin: await createUser("admin", "admin"),
    pm: await createUser("pm", "project_manager"),
    member: await createUser("member", "team_member"),
    viewer: await createUser("viewer", "viewer"),
    outsider: await createUser("outsider", "team_member"),
  };
  const as = Object.fromEntries(
    Object.entries(users).map(([k, u]) => [k, apiAs(u.token)]),
  );

  const project = (
    await as.admin.post("/api/projects", {
      name: "Test Project",
      managerId: users.pm.id,
    })
  ).body.project;
  const base = `/api/projects/${project._id}`;

  await as.pm.post(`${base}/members`, {
    userId: users.member.id,
    role: "team_member",
  });
  await as.pm.post(`${base}/members`, {
    userId: users.viewer.id,
    role: "viewer",
  });

  const myTask = (
    await as.pm.post(`${base}/tasks`, {
      title: "Assigned to member",
      assigneeId: users.member.id,
    })
  ).body.task;
  const otherTask = (
    await as.pm.post(`${base}/tasks`, { title: "Unassigned task" })
  ).body.task;

  return { users, as, project, base, myTask, otherTask };
}

module.exports = {
  PASSWORD,
  connectTestDb,
  disconnectTestDb,
  createUser,
  apiAs,
  setupWorld,
};
