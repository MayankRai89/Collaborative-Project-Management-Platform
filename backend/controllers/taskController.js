const mongoose = require("mongoose");
const Task = require("../models/TaskModel");
const ProjectMember = require("../models/ProjectMemberModel");
const { STATUSES, PRIORITIES } = Task;

const MANAGER_FIELDS = [
  "title",
  "description",
  "status",
  "priority",
  "dueDate",
  "assigneeId",
];
const MEMBER_FIELDS = ["title", "description", "status"]; // team member, own tasks only
const SORT_FIELDS = ["createdAt", "updatedAt", "dueDate"];

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isValidDate = (v) =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));

const archivedGuard = (req, res) => {
  if (req.project.status === "archived") {
    res
      .status(400)
      .json({ message: "Archived projects are read-only. Restore it first." });
    return true;
  }
  return false;
};
const Comment = require("../models/CommentModel");
// An assignee must be an ACTIVE project manager or team member OF THIS PROJECT (never a viewer)
const validateAssignee = async (projectId, assigneeId) => {
  if (typeof assigneeId !== "string" || !mongoose.isValidObjectId(assigneeId))
    return null;
  const membership = await ProjectMember.findOne({
    project: projectId,
    user: assigneeId,
    role: { $in: ["project_manager", "team_member"] },
  }).populate("user", "isActive");
  return membership?.user?.isActive ? membership.user._id : null;
};

const buildTaskFilter = (query, userId) => {
  const filter = {};
  if (STATUSES.includes(query.status)) filter.status = query.status;
  if (PRIORITIES.includes(query.priority)) filter.priority = query.priority;

  if (query.assignee === "me") filter.assignee = userId;
  else if (query.assignee === "unassigned") filter.assignee = null;
  else if (
    typeof query.assignee === "string" &&
    mongoose.isValidObjectId(query.assignee)
  ) {
    filter.assignee = query.assignee;
  }

  if (typeof query.search === "string" && query.search.trim()) {
    filter.title = new RegExp(escapeRegex(query.search.trim()), "i");
  }
  return filter;
};

const paginate = async (baseFilter, query, populateProject = false) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 100);
  const sortField = SORT_FIELDS.includes(query.sortBy)
    ? query.sortBy
    : "createdAt";
  const sortDir = query.order === "asc" ? 1 : -1;

  let find = Task.find(baseFilter)
    .populate("assignee", "name email")
    .sort({ [sortField]: sortDir })
    .skip((page - 1) * limit)
    .limit(limit);
  if (populateProject) find = find.populate("project", "name status");

  const [data, total] = await Promise.all([
    find,
    Task.countDocuments(baseFilter),
  ]);
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
};

// GET /api/projects/:id/tasks?status=todo&assignee=me&priority=high&search=login&page=1
exports.listProjectTasks = async (req, res, next) => {
  try {
    const filter = {
      project: req.project._id,
      ...buildTaskFilter(req.query, req.user._id),
    };
    res.json(await paginate(filter, req.query));
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/mine   -> tasks assigned to me across all my projects
exports.listMyTasks = async (req, res, next) => {
  try {
    const filter = {
      ...buildTaskFilter(req.query, req.user._id),
      assignee: req.user._id,
    };
    res.json(await paginate(filter, req.query, true));
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/tasks   (admin or project manager)
exports.createTask = async (req, res, next) => {
  try {
    if (archivedGuard(req, res)) return;

    const { title, description, status, priority, dueDate, assigneeId } =
      req.body;

    let assignee = null;
    if (assigneeId) {
      assignee = await validateAssignee(req.project._id, assigneeId);
      if (!assignee) {
        return res.status(400).json({
          message:
            "assigneeId must be an active project manager or team member of this project",
        });
      }
    }
    if (dueDate && !isValidDate(dueDate)) {
      return res.status(400).json({ message: "dueDate must be a valid date" });
    }

    const task = await Task.create({
      project: req.project._id,
      title,
      description,
      status,
      priority,
      dueDate: dueDate || null,
      assignee,
      createdBy: req.user._id,
    });
    await task.populate("assignee", "name email");

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    await req.task.populate("assignee", "name email");
    res.json({ task: req.task, myRole: req.projectRole });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id    body: { version, ...fieldsToChange }
exports.updateTask = async (req, res, next) => {
  try {
    const { version } = req.body;
    if (!Number.isInteger(version)) {
      return res.status(400).json({
        message:
          "version (integer) is required: send the version you last loaded",
      });
    }
    if (archivedGuard(req, res)) return;

    const task = req.task;
    const isManager = ["admin", "project_manager"].includes(req.projectRole);
    const isAssignee = task.assignee && task.assignee.equals(req.user._id);

    // 1. Who may edit this task at all?
    if (!isManager && !(req.projectRole === "team_member" && isAssignee)) {
      return res
        .status(403)
        .json({ message: "You can only update tasks assigned to you" });
    }

    // 2. Which fields may they change?
    const requested = Object.keys(req.body).filter((k) => k !== "version");
    if (requested.length === 0)
      return res.status(400).json({ message: "No fields to update" });

    const unknown = requested.filter((k) => !MANAGER_FIELDS.includes(k));
    if (unknown.length)
      return res
        .status(400)
        .json({ message: `Unknown fields: ${unknown.join(", ")}` });

    const allowed = isManager ? MANAGER_FIELDS : MEMBER_FIELDS;
    const forbidden = requested.filter((k) => !allowed.includes(k));
    if (forbidden.length) {
      return res.status(403).json({
        message: `You are not allowed to change: ${forbidden.join(", ")}`,
      });
    }

    // 3. Validate and translate the changes
    const changes = {};
    for (const key of requested) {
      const value = req.body[key];
      if (key === "assigneeId") {
        if (value === null) {
          changes.assignee = null; // unassign
        } else {
          const assignee = await validateAssignee(task.project, value);
          if (!assignee) {
            return res.status(400).json({
              message:
                "assigneeId must be an active project manager or team member of this project",
            });
          }
          changes.assignee = assignee;
        }
      } else if (key === "dueDate") {
        if (value !== null && !isValidDate(value)) {
          return res
            .status(400)
            .json({ message: "dueDate must be a valid date or null" });
        }
        changes.dueDate = value;
      } else {
        changes[key] = value;
      }
    }

    // 4. THE CONFLICT CHECK: one atomic operation. It matches only if the version is still what the client saw.
    const updated = await Task.findOneAndUpdate(
      { _id: task._id, version },
      { $set: changes, $inc: { version: 1 } },
      { new: true, runValidators: true },
    ).populate("assignee", "name email");

    if (!updated) {
      // No match: the task was deleted, or someone else changed it first
      const latest = await Task.findById(task._id).populate(
        "assignee",
        "name email",
      );
      if (!latest)
        return res.status(404).json({ message: "Task no longer exists" });

      return res.status(409).json({
        message:
          "This task was changed by someone else. Review the latest version and try again.",
        currentTask: latest,
      });
    }

    res.json({ task: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id   (admin or project manager, checked in the route)
exports.deleteTask = async (req, res, next) => {
  try {
    if (archivedGuard(req, res)) return;

    // TODO Step 8: also delete this task's comments here
    await req.task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
};
