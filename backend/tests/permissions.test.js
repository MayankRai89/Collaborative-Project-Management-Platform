import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRequire } from "node:module";

// The tests are ESM, our backend is CommonJS: load the backend natively with Node
const load = createRequire(import.meta.url);
const {
  PASSWORD,
  connectTestDb,
  disconnectTestDb,
  createUser,
  apiAs,
  setupWorld,
} = load("./helpers");

let w; // the "world": users, project, tasks

beforeAll(async () => {
  await connectTestDb();
  w = await setupWorld();
});
afterAll(disconnectTestDb);

const versionOf = async (taskId) =>
  (await w.as.pm.get(`/api/tasks/${taskId}`)).body.task.version;

describe("authentication", () => {
  it("rejects a request with no token (401)", async () => {
    expect((await apiAs().get("/api/auth/me")).status).toBe(401);
  });

  it("rejects a garbage token (401)", async () => {
    expect((await apiAs("not-a-real-token").get("/api/auth/me")).status).toBe(
      401,
    );
  });

  it("gives the same 401 message for a wrong password and an unknown email", async () => {
    const wrongPassword = await apiAs().post("/api/auth/login", {
      email: "pm@test.com",
      password: "wrong",
    });
    const unknownEmail = await apiAs().post("/api/auth/login", {
      email: "nobody@test.com",
      password: "wrong",
    });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it("stops a deactivated user immediately, even with a still-valid token", async () => {
    const temp = await createUser("temp-user", "team_member");
    expect((await apiAs(temp.token).get("/api/auth/me")).status).toBe(200);

    expect((await w.as.admin.delete(`/api/users/${temp.id}`)).status).toBe(200);

    expect((await apiAs(temp.token).get("/api/auth/me")).status).toBe(401);
    expect(
      (
        await apiAs().post("/api/auth/login", {
          email: temp.email,
          password: PASSWORD,
        })
      ).status,
    ).toBe(403);
  });
});

describe("user management (admin only)", () => {
  it.each(["pm", "member", "viewer"])(
    "%s cannot list users (403)",
    async (who) => {
      expect((await w.as[who].get("/api/users")).status).toBe(403);
    },
  );

  it("admin can list users", async () => {
    const res = await w.as.admin.get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(5);
  });

  it("a team member cannot create a user (403)", async () => {
    const res = await w.as.member.post("/api/users", {
      name: "X",
      email: "x@test.com",
      password: "secret123",
    });
    expect(res.status).toBe(403);
  });

  it("a team member cannot promote themselves to admin (403)", async () => {
    const res = await w.as.member.patch(`/api/users/${w.users.member.id}`, {
      role: "admin",
    });
    expect(res.status).toBe(403);
    expect(
      (await w.as.admin.get(`/api/users/${w.users.member.id}`)).body.user.role,
    ).toBe("team_member");
  });

  it("project manager can use user lookup, team member cannot", async () => {
    const ok = await w.as.pm.get("/api/users/lookup?search=mem");
    expect(ok.status).toBe(200);
    expect(ok.body.data.some((u) => u.email === "member@test.com")).toBe(true);
    expect(ok.body.data[0].password).toBeUndefined();

    expect((await w.as.member.get("/api/users/lookup?search=mem")).status).toBe(
      403,
    );
  });
});

describe("projects", () => {
  it("a project manager cannot create a project (403)", async () => {
    expect((await w.as.pm.post("/api/projects", { name: "Nope" })).status).toBe(
      403,
    );
  });

  it("an outsider sees no projects and gets 404 on a direct request", async () => {
    const list = await w.as.outsider.get("/api/projects");
    expect(list.body.data).toEqual([]);
    expect(
      (await w.as.outsider.get(`/api/projects/${w.project._id}`)).status,
    ).toBe(404);
  });

  it("a viewer can read the project and its tasks", async () => {
    const project = await w.as.viewer.get(`/api/projects/${w.project._id}`);
    expect(project.status).toBe(200);
    expect(project.body.myRole).toBe("viewer");

    const tasks = await w.as.viewer.get(`${w.base}/tasks`);
    expect(tasks.status).toBe(200);
    expect(tasks.body.total).toBeGreaterThanOrEqual(2);
  });

  it("a team member cannot update the project, and nothing changes", async () => {
    const res = await w.as.member.patch(`/api/projects/${w.project._id}`, {
      name: "Hacked",
    });
    expect(res.status).toBe(403);
    expect(
      (await w.as.admin.get(`/api/projects/${w.project._id}`)).body.project
        .name,
    ).toBe("Test Project");
  });

  it("the project manager can update the project (200)", async () => {
    const res = await w.as.pm.patch(`/api/projects/${w.project._id}`, {
      description: "Updated by PM",
    });
    expect(res.status).toBe(200);
    expect(res.body.project.description).toBe("Updated by PM");
  });

  it("a project manager cannot delete the project (403)", async () => {
    expect(
      (await w.as.pm.delete(`/api/projects/${w.project._id}`)).status,
    ).toBe(403);
  });
});

describe("team members", () => {
  it("a team member cannot add a member (403)", async () => {
    const res = await w.as.member.post(`${w.base}/members`, {
      userId: w.users.outsider.id,
      role: "team_member",
    });
    expect(res.status).toBe(403);
  });

  it("a viewer cannot remove a member (403)", async () => {
    const res = await w.as.viewer.delete(
      `${w.base}/members/${w.users.member.id}`,
    );
    expect(res.status).toBe(403);
  });

  it("a global viewer cannot be given a write role (400)", async () => {
    const res = await w.as.pm.patch(`${w.base}/members/${w.users.viewer.id}`, {
      role: "team_member",
    });
    expect(res.status).toBe(400);
  });

  it("project_manager cannot be granted through the members endpoint (400)", async () => {
    const res = await w.as.pm.post(`${w.base}/members`, {
      userId: w.users.outsider.id,
      role: "project_manager",
    });
    expect(res.status).toBe(400);
  });

  it("a project manager can add and remove a member", async () => {
    const temp = await createUser("temp-member", "team_member");
    expect(
      (
        await w.as.pm.post(`${w.base}/members`, {
          userId: temp.id,
          role: "team_member",
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await w.as.pm.post(`${w.base}/members`, {
          userId: temp.id,
          role: "team_member",
        })
      ).status,
    ).toBe(409);
    expect((await w.as.pm.delete(`${w.base}/members/${temp.id}`)).status).toBe(
      200,
    );
  });
});

describe("tasks", () => {
  it.each(["member", "viewer"])(
    "%s cannot create a task (403)",
    async (who) => {
      expect(
        (await w.as[who].post(`${w.base}/tasks`, { title: "Sneaky task" }))
          .status,
      ).toBe(403);
    },
  );

  it("a task cannot be assigned to a viewer (400)", async () => {
    const res = await w.as.pm.post(`${w.base}/tasks`, {
      title: "Bad assign",
      assigneeId: w.users.viewer.id,
    });
    expect(res.status).toBe(400);
  });

  it("a team member cannot change priority or reassign even on their own task (403)", async () => {
    const id = w.myTask._id;
    const priority = await w.as.member.patch(`/api/tasks/${id}`, {
      version: await versionOf(id),
      priority: "low",
    });
    const reassign = await w.as.member.patch(`/api/tasks/${id}`, {
      version: await versionOf(id),
      assigneeId: w.users.pm.id,
    });
    expect(priority.status).toBe(403);
    expect(reassign.status).toBe(403);
  });

  it("a team member cannot edit a task assigned to nobody else (403)", async () => {
    const id = w.otherTask._id;
    const res = await w.as.member.patch(`/api/tasks/${id}`, {
      version: await versionOf(id),
      status: "done",
    });
    expect(res.status).toBe(403);
  });

  it("a team member can change the status of their own task (200)", async () => {
    const id = w.myTask._id;
    const res = await w.as.member.patch(`/api/tasks/${id}`, {
      version: await versionOf(id),
      status: "in_progress",
    });
    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe("in_progress");
  });

  it("a viewer cannot update a task (403)", async () => {
    const id = w.myTask._id;
    const res = await w.as.viewer.patch(`/api/tasks/${id}`, {
      version: await versionOf(id),
      status: "done",
    });
    expect(res.status).toBe(403);
  });

  it("an outsider cannot see a task (404)", async () => {
    expect((await w.as.outsider.get(`/api/tasks/${w.myTask._id}`)).status).toBe(
      404,
    );
  });

  it("a team member cannot delete a task (403)", async () => {
    expect(
      (await w.as.member.delete(`/api/tasks/${w.myTask._id}`)).status,
    ).toBe(403);
    expect((await w.as.pm.get(`/api/tasks/${w.myTask._id}`)).status).toBe(200);
  });

  it("unknown fields are rejected, so clients cannot sneak in extra data (400)", async () => {
    const id = w.myTask._id;
    const res = await w.as.pm.patch(`/api/tasks/${id}`, {
      version: await versionOf(id),
      createdBy: w.users.member.id,
    });
    expect(res.status).toBe(400);
  });
});

describe("comments", () => {
  it("a viewer cannot comment (403)", async () => {
    expect(
      (
        await w.as.viewer.post(`/api/tasks/${w.myTask._id}/comments`, {
          body: "Hello",
        })
      ).status,
    ).toBe(403);
  });

  it("an outsider cannot read comments (404)", async () => {
    expect(
      (await w.as.outsider.get(`/api/tasks/${w.myTask._id}/comments`)).status,
    ).toBe(404);
  });

  it("an empty comment is rejected (400)", async () => {
    expect(
      (
        await w.as.member.post(`/api/tasks/${w.myTask._id}/comments`, {
          body: "   ",
        })
      ).status,
    ).toBe(400);
  });

  it("members delete only their own comments, managers delete any", async () => {
    const url = `/api/tasks/${w.myTask._id}/comments`;
    const pmComment = (await w.as.pm.post(url, { body: "PM note" })).body
      .comment;
    const ownComment = (await w.as.member.post(url, { body: "Member note" }))
      .body.comment;

    expect((await w.as.member.delete(`/api/comments/${pmComment._id}`)).status).toBe(
      403,
    );
    expect((await w.as.member.delete(`/api/comments/${ownComment._id}`)).status).toBe(
      200,
    );
    expect((await w.as.pm.delete(`/api/comments/${pmComment._id}`)).status).toBe(
      200,
    );
  });
});
