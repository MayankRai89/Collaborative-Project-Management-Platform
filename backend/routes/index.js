const router = require("express").Router();

router.use("/auth", require("./authRoutes"));
// later steps add: users, projects, tasks, comments

module.exports = router;
