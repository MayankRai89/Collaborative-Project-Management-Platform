const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const loadComment = require("../middleware/CommentAccess");
const { loadProject } = require("../middleware/projectAccess");
const { deleteComment } = require("../controllers/CommentController");

router.use(authMiddleware);

// Who may delete is decided inside the controller (manager: any, team member: own only)
router.delete("/:id", loadComment, loadProject("projectId"), deleteComment);

module.exports = router;
