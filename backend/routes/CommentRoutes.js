const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const loadComment = require("../middleware/commentAccess");
const { loadProject } = require("../middleware/projectAccess");
const { deleteComment } = require("../controllers/commentController");

router.use(authMiddleware);

// Who may delete is decided inside the controller (manager: any, team member: own only)
router.delete("/:id", loadComment, loadProject("projectId"), deleteComment);

module.exports = router;
