const User = require("../models/UserModel");
const ProjectMember = require("../models/ProjectMemberModel");
const Task = require("../models/TaskModel");
const { ROLES } = User;

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/users?page=1&limit=10&role=viewer&isActive=true&search=priya
exports.listUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const filter = {};
    if (ROLES.includes(req.query.role)) filter.role = req.query.role;
    if (req.query.isActive === "true" || req.query.isActive === "false") {
      filter.isActive = req.query.isActive === "true";
    }
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const regex = new RegExp(escapeRegex(req.query.search.trim()), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [data, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const userIds = data.map((u) => u._id);
    const [memberships, tasks] = await Promise.all([
      ProjectMember.find({ user: { $in: userIds } }).populate("project", "name status"),
      Task.find({ assignee: { $in: userIds } })
        .select("title status project version")
        .populate("project", "name status"),
    ]);

    const usersWithAssignments = data.map((u) => {
      const uObj = u.toObject();
      const userMemberships = memberships.filter(
        (m) => m.user && m.user.equals(u._id)
      );
      const userTasks = tasks.filter(
        (t) => t.assignee && t.assignee.equals(u._id)
      );
      return {
        ...uObj,
        projects: userMemberships.map((m) => ({
          _id: m.project?._id,
          name: m.project?.name || "Untitled Project",
          status: m.project?.status || "active",
          role: m.role,
        })),
        tasks: userTasks.map((t) => ({
          _id: t._id,
          title: t.title,
          status: t.status,
          version: t.version,
          projectId: t.project?._id,
          projectName: t.project?.name || "Unknown Project",
        })),
      };
    });

    res.json({
      data: usersWithAssignments,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// POST /api/users
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isSelf = user._id.equals(req.user._id);
    if (isSelf && req.body.role && req.body.role !== user.role) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role" });
    }
    if (isSelf && req.body.isActive === false) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate your own account" });
    }

    // Whitelist: only these fields can be changed, nothing else from req.body
    ["name", "email", "role", "isActive", "password"].forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    await user.save(); // save() (not findByIdAndUpdate) so password hashing and validation run
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id  -> deactivates, never deletes
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.equals(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate your own account" });
    }

    user.isActive = false;
    await user.save();
    res.json({ message: "User deactivated", user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/me  -> any logged-in user edits their own profile
exports.updateMe = async (req, res, next) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (name) user.name = name;

    if (newPassword) {
      if (!currentPassword || !(await user.comparePassword(currentPassword))) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
      user.password = newPassword;
    }

    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
// GET /api/users/lookup?search=ra   (admin or project_manager) -> minimal fields only
exports.lookupUsers = async (req, res, next) => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";

    const filter = {
      isActive: true,
      role: { $ne: "admin" },
    };

    if (search.length > 0) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const data = await User.find(filter)
      .select("name email role")
      .limit(100);

    res.json({ data });
  } catch (err) {
    next(err);
  }
};
