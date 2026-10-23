const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const { login, logout, me } = require("../controllers/authController");

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);

module.exports = router;
