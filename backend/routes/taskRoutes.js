const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const loadTask = require("../middleware/taskAccess");
const {
  loadProject,
  requireProjectRole,
} = require("../middleware/projectAccess");
const {
  listMyTasks,
  getTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

router.use(authMiddleware);

router.get("/mine", listMyTasks); // declared BEFORE '/:id'

// loadTask finds the task, loadProject checks the caller belongs to its project
const access = [loadTask, loadProject("projectId")];

router.get("/:id", access, getTask);
router.patch("/:id", access, updateTask); // field-level permissions are inside the controller
router.delete(
  "/:id",
  access,
  requireProjectRole("admin", "project_manager"),
  deleteTask,
);

module.exports = router;
