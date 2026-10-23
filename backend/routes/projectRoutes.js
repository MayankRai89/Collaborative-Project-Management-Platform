const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  loadProject,
  requireProjectRole,
} = require("../middleware/projectAccess");
const {
  listProjects,
  getProject,
  createProject,
  updateProject,
  assignManager,
  archiveProject,
  restoreProject,
  deleteProject,
} = require("../controllers/projectController");
const {
  listProjectTasks,
  createTask,
} = require("../controllers/taskController");
const {
  listProjectUpdates,
  createProjectUpdate,
} = require("../controllers/commentController");

router.use(authMiddleware);

router.use("/:id/members", require("./memberRoutes"));
router.get("/:id/tasks", loadProject(), listProjectTasks);
router.post(
  "/:id/tasks",
  loadProject(),
  requireProjectRole("admin", "project_manager"),
  createTask,
);

// Tier A: Project Updates (Admin <-> Project Manager)
router.get("/:id/updates", loadProject(), listProjectUpdates);
router.post("/:id/updates", loadProject(), createProjectUpdate);

router.get("/", listProjects); // filtered by membership inside the controller
router.post("/", requireRole("admin"), createProject);

router.get("/:id", loadProject(), getProject); // any member, or admin
router.patch(
  "/:id",
  loadProject(),
  requireProjectRole("admin", "project_manager"),
  updateProject,
);
router.patch(
  "/:id/manager",
  loadProject(),
  requireProjectRole("admin"),
  assignManager,
);
router.patch(
  "/:id/archive",
  loadProject(),
  requireProjectRole("admin", "project_manager"),
  archiveProject,
);
router.patch(
  "/:id/restore",
  loadProject(),
  requireProjectRole("admin", "project_manager"),
  restoreProject,
);
router.delete(
  "/:id",
  loadProject(),
  requireProjectRole("admin"),
  deleteProject,
);

module.exports = router;
