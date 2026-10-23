// Usage: router.use(requireRole('admin'))  or  requireRole('admin', 'project_manager')
const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    // authMiddleware must run before this, so req.user exists
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to perform this action" });
    }
    next();
  };

module.exports = requireRole;
