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
const {
  listComments,
  createComment,
} = require("../controllers/commentController");

router.use(authMiddleware);

router.get("/mine", listMyTasks); // declared BEFORE '/:id'

const access = [loadTask, loadProject("projectId")];

router.get("/:id", access, getTask);
router.patch("/:id", access, updateTask);
router.delete(
  "/:id",
  access,
  requireProjectRole("admin", "project_manager"),
  deleteTask,
);

// Comments live under their task
router.get("/:id/comments", access, listComments);
router.post(
  "/:id/comments",
  access,
  requireProjectRole("admin", "project_manager", "team_member"),
  createComment,
);

module.exports = router;
