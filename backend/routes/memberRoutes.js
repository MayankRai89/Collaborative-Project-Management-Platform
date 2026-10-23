const router = require("express").Router({ mergeParams: true }); // gives us req.params.id from the parent route
const {
  loadProject,
  requireProjectRole,
} = require("../middleware/projectAccess");
const {
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
} = require("../controllers/memberController");

// authMiddleware already ran in projectRoutes before this router
router.use(loadProject());

router.get("/", listMembers); // any member, or admin
router.post("/", requireProjectRole("admin", "project_manager"), addMember);
router.patch(
  "/:userId",
  requireProjectRole("admin", "project_manager"),
  updateMemberRole,
);
router.delete(
  "/:userId",
  requireProjectRole("admin", "project_manager"),
  removeMember,
);

module.exports = router;
