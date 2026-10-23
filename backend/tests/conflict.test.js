import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createRequire } from "node:module";

const load = createRequire(import.meta.url);
const { connectTestDb, disconnectTestDb, createUser, setupWorld } = load(
  "./helpers",
);

let w; // the shared world
let task; // a fresh task for every test, so tests cannot affect each other

beforeAll(async () => {
  await connectTestDb();
  w = await setupWorld();
});
afterAll(disconnectTestDb);

beforeEach(async () => {
  const res = await w.as.pm.post(`${w.base}/tasks`, {
    title: "Conflict test",
    assigneeId: w.users.member.id,
  });
  task = res.body.task;
});

const url = () => `/api/tasks/${task._id}`;
const getTask = async (id = task._id) =>
  (await w.as.pm.get(`/api/tasks/${id}`)).body.task;

describe("optimistic locking with the version field", () => {
  it("a new task starts at version 1", () => {
    expect(task.version).toBe(1);
  });

  it("a successful update raises the version by exactly 1", async () => {
    const res = await w.as.pm.patch(url(), { version: 1, title: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.task.version).toBe(2);
  });

  it("a stale update gets 409 with the latest task, and does not overwrite the newer value", async () => {
    // User A (PM) saves first, moving the task from version 1 to 2
    const first = await w.as.pm.patch(url(), { version: 1, title: "PM title" });
    expect(first.status).toBe(200);

    // User B (member) still holds version 1 and submits
    const stale = await w.as.member.patch(url(), {
      version: 1,
      status: "in_progress",
    });
    expect(stale.status).toBe(409);
    expect(stale.body.currentTask.version).toBe(2);
    expect(stale.body.currentTask.title).toBe("PM title");

    // Nothing from the stale request was saved
    const after = await getTask();
    expect(after.title).toBe("PM title");
    expect(after.status).toBe("todo");
    expect(after.version).toBe(2);
  });

  it("the client can recover by retrying with the version from currentTask", async () => {
    await w.as.pm.patch(url(), { version: 1, title: "PM title" });
    const stale = await w.as.member.patch(url(), {
      version: 1,
      status: "in_progress",
    });
    expect(stale.status).toBe(409);

    const retry = await w.as.member.patch(url(), {
      version: stale.body.currentTask.version,
      status: "in_progress",
    });
    expect(retry.status).toBe(200);
    expect(retry.body.task.version).toBe(3);
    expect(retry.body.task.status).toBe("in_progress");
    expect(retry.body.task.title).toBe("PM title"); // the other user's change is preserved
  });

  it("with simultaneous updates on the same version, exactly one wins (5 rounds)", async () => {
    for (let i = 0; i < 5; i++) {
      const t = (
        await w.as.pm.post(`${w.base}/tasks`, { title: `Race ${i}` })
      ).body.task;

      const [a, b] = await Promise.all([
        w.as.pm.patch(`/api/tasks/${t._id}`, { version: 1, title: "From PM" }),
        w.as.admin.patch(`/api/tasks/${t._id}`, {
          version: 1,
          title: "From admin",
        }),
      ]);

      expect([a.status, b.status].sort()).toEqual([200, 409]);
      expect((await getTask(t._id)).version).toBe(2); // incremented once, never twice
    }
  });

  it("a missing or non-integer version is rejected (400)", async () => {
    expect((await w.as.pm.patch(url(), { title: "No version" })).status).toBe(
      400,
    );
    expect(
      (await w.as.pm.patch(url(), { version: "1", title: "String version" }))
        .status,
    ).toBe(400);
    expect((await getTask()).version).toBe(1);
  });

  it("updating a deleted task returns 404", async () => {
    expect((await w.as.pm.delete(url())).status).toBe(200);
    expect(
      (await w.as.pm.patch(url(), { version: 1, title: "Ghost" })).status,
    ).toBe(404);
  });

  it("removing an assignee from the project bumps the task version, so an open edit conflicts", async () => {
    const temp = await createUser("temp-assignee", "team_member");
    await w.as.pm.post(`${w.base}/members`, {
      userId: temp.id,
      role: "team_member",
    });
    const t = (
      await w.as.pm.post(`${w.base}/tasks`, {
        title: "Temp task",
        assigneeId: temp.id,
      })
    ).body.task;
    expect(t.version).toBe(1);

    await w.as.pm.delete(`${w.base}/members/${temp.id}`);

    const afterRemoval = await getTask(t._id);
    expect(afterRemoval.assignee).toBeNull();
    expect(afterRemoval.version).toBe(2);

    const stale = await w.as.pm.patch(`/api/tasks/${t._id}`, {
      version: 1,
      title: "Stale edit",
    });
    expect(stale.status).toBe(409);
  });
});
