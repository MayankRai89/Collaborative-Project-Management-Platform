const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  updateMe,
  lookupUsers,
} = require("../controllers/userController");

router.use(authMiddleware);

// Any logged-in user (declared BEFORE '/:id' so "me" isn't treated as an id)
router.patch("/me", updateMe);

// Admin or project manager (needs to find people to add to a project)
router.get("/lookup", requireRole("admin", "project_manager"), lookupUsers);

// Admin only
router.use(requireRole("admin"));
router.get("/", listUsers);
router.post("/", createUser);
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", deactivateUser);

module.exports = router;
