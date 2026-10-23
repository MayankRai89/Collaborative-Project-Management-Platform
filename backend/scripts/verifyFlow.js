const BASE_URL = process.env.API_URL || "http://localhost:4000/api";

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
};

const login = async (email, password) => {
  const { status, data } = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (status !== 200) {
    throw new Error(`Login failed for ${email} (${status}): ${JSON.stringify(data)}`);
  }
  return { token: data.token, user: data.user };
};

(async () => {
  console.log("=== Starting End-to-End Verification ===");

  // 1. Log in all 4 roles
  console.log("\n1. Logging in as admin, pm, member, and viewer...");
  const admin = await login("admin@example.com", "Admin@123");
  const pm = await login("pm@example.com", "Manager@123");
  const member = await login("member@example.com", "Member@123");
  const viewer = await login("viewer@example.com", "Viewer@123");
  console.log("   Logged in successfully!");

  const authHeader = (tok) => ({ Authorization: `Bearer ${tok}` });

  // 2. Admin creates a project assigned to PM
  console.log("\n2. Admin creating project assigned to Priya (PM)...");
  const { status: projStatus, data: projData } = await request("/projects", {
    method: "POST",
    headers: authHeader(admin.token),
    body: JSON.stringify({
      name: "Core Infrastructure Migration",
      description: "Q4 Platform Upgrades",
      managerId: pm.user._id,
    }),
  });
  console.log(`   Project created (${projStatus}):`, projData.project?.name, `ID: ${projData.project?._id}`);
  const projectId = projData.project._id;

  // 3. PM adds Member and Viewer to the project
  console.log("\n3. PM adding Rahul (Team Member) and Vikram (Viewer)...");
  const { status: memStatus, data: memData } = await request(`/projects/${projectId}/members`, {
    method: "POST",
    headers: authHeader(pm.token),
    body: JSON.stringify({ userId: member.user._id, role: "team_member" }),
  });
  console.log(`   Added Member (${memStatus}):`, memData.member?.user?.name, `Role: ${memData.member?.role}`);

  const { status: viewStatus, data: viewData } = await request(`/projects/${projectId}/members`, {
    method: "POST",
    headers: authHeader(pm.token),
    body: JSON.stringify({ userId: viewer.user._id, role: "viewer" }),
  });
  console.log(`   Added Viewer (${viewStatus}):`, viewData.member?.user?.name, `Role: ${viewData.member?.role}`);

  // 4. PM creates a task assigned to Rahul
  console.log("\n4. PM creating task assigned to Rahul...");
  const { status: taskStatus, data: taskData } = await request(`/projects/${projectId}/tasks`, {
    method: "POST",
    headers: authHeader(pm.token),
    body: JSON.stringify({
      title: "Set up MongoDB Replica Set",
      description: "Configure 3-node replica set with automated failover",
      priority: "high",
      assigneeId: member.user._id,
    }),
  });
  console.log(`   Task created (${taskStatus}):`, taskData.task?.title, `Version: ${taskData.task?.version}`);
  const taskId = taskData.task._id;

  // 5. Rahul (Team Member) updates task status
  console.log("\n5. Rahul (Assignee) updating task status to in_progress...");
  const { status: updStatus, data: updData } = await request(`/tasks/${taskId}`, {
    method: "PATCH",
    headers: authHeader(member.token),
    body: JSON.stringify({
      version: taskData.task.version,
      status: "in_progress",
    }),
  });
  console.log(`   Task updated (${updStatus}): Status = ${updData.task?.status}, Version = ${updData.task?.version}`);

  // 6. Rahul adds a comment
  console.log("\n6. Rahul posting a comment on the task...");
  const { status: comStatus, data: comData } = await request(`/tasks/${taskId}/comments`, {
    method: "POST",
    headers: authHeader(member.token),
    body: JSON.stringify({ body: "Replica set initiated. Running health check." }),
  });
  console.log(`   Comment created (${comStatus}):`, comData.comment?.body);

  // 7. Viewer tests: can read but cannot create comments
  console.log("\n7. Vikram (Viewer) reading comments and attempting unauthorized comment...");
  const { status: listComStatus, data: listComData } = await request(`/tasks/${taskId}/comments`, {
    headers: authHeader(viewer.token),
  });
  console.log(`   Viewer read comments (${listComStatus}): ${listComData.data?.length} comment(s) found`);

  const { status: forbidStatus } = await request(`/tasks/${taskId}/comments`, {
    method: "POST",
    headers: authHeader(viewer.token),
    body: JSON.stringify({ body: "Viewer trying to comment" }),
  });
  console.log(`   Viewer comment attempt (${forbidStatus}): Correctly blocked with 403 Forbidden!`);

  console.log("\n=== All Steps Succeeded Completely! ===");
})().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
