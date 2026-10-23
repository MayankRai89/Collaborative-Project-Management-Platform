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
} = require("../controllers/userController");

router.use(authMiddleware); // everything below needs a logged-in user

// Any logged-in user (declared BEFORE '/:id' so "me" isn't treated as an id)
router.patch("/me", updateMe);

// Admin only
router.use(requireRole("admin"));
router.get("/", listUsers);
router.post("/", createUser);
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", deactivateUser);

module.exports = router;
