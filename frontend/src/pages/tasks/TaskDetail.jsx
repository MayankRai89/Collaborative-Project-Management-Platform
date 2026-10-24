import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../utils/api";
import { useAuth } from "../../utils/auth";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "todo", label: "TO DO" },
  { value: "in_progress", label: "IN PROGRESS" },
  { value: "review", label: "IN REVIEW" },
  { value: "done", label: "DONE" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "LOW" },
  { value: "medium", label: "MEDIUM" },
  { value: "high", label: "HIGH" },
  { value: "urgent", label: "URGENT" },
];

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Task query
  const { data: taskRes, isLoading: isTaskLoading, error: taskError, refetch } = useQuery({
    queryKey: ["task", id],
    queryFn: () => api.get(`/tasks/${id}`),
  });

  const task = taskRes?.task || taskRes?.data;
  const myRole = taskRes?.myRole || (user?.role === "admin" ? "admin" : "viewer");
  const canManage =
    user?.role === "admin" ||
    user?.systemRole === "admin" ||
    user?.role === "project_manager" ||
    myRole === "project_manager";
  const isAssignee = task?.assignee?._id === user?._id || task?.assignee === user?._id;
  const canEdit = canManage || (myRole === "team_member" && isAssignee);

  // Project members for assignee dropdown
  const projectId = task?.project?._id || task?.project;
  const { data: membersRes } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => api.get(`/projects/${projectId}/members`),
    enabled: !!projectId,
  });
  const members = membersRes?.data || [];

  // Comments query
  const { data: commentsRes, isLoading: isCommentsLoading } = useQuery({
    queryKey: ["task-comments", id],
    queryFn: () => api.get(`/tasks/${id}/comments`),
    enabled: !!task && !taskError,
  });

  const comments = commentsRes?.data || [];

  // Local form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [commentText, setCommentText] = useState("");
  const defaultCategory =
    user?.role === "admin"
      ? "admin_instruction"
      : myRole === "project_manager"
      ? "pm_directive"
      : isAssignee
      ? "progress_update"
      : "general";
  const [commentCategory, setCommentCategory] = useState(defaultCategory);
  const [commentRecipientId, setCommentRecipientId] = useState("");

  // Conflict state (409)
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState(null); // { currentTask, myChanges }

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "todo");
      setPriority(task.priority || "medium");
      setAssigneeId(task.assignee?._id || task.assignee || "");
    }
  }, [task]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/tasks/${id}`, payload),
    onSuccess: (resData) => {
      const updated = resData?.task || resData?.data;
      if (updated) {
        queryClient.setQueryData(["task", id], (old) => ({
          ...old,
          task: updated,
          data: updated,
        }));
      }
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      setConflictModalOpen(false);
      setConflictData(null);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        // Backend returned optimistic locking conflict
        const serverTask = err.data?.currentTask;
        setConflictData({
          currentTask: serverTask,
          myChanges: { title, description, status, priority, assigneeId },
        });
        setConflictModalOpen(true);
      } else {
        alert(err.message || "Failed to update task");
      }
    },
  });

  // Post comment mutation with category and recipient target
  const postCommentMutation = useMutation({
    mutationFn: ({ body, category, recipientId }) =>
      api.post(`/tasks/${id}/comments`, { body, category, recipientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", id] });
      setCommentText("");
      setCommentRecipientId("");
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", id] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      navigate(`/projects/${task.project._id || task.project}`);
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      title,
      description,
      status,
      version: task?.version,
    };
    if (canManage) {
      payload.priority = priority;
      payload.assigneeId = assigneeId || null;
    }
    updateMutation.mutate(payload);
  };

  const handleResolveUseLatest = () => {
    if (conflictData?.currentTask) {
      const serverTask = conflictData.currentTask;
      setTitle(serverTask.title || "");
      setDescription(serverTask.description || "");
      setStatus(serverTask.status || "todo");
      setPriority(serverTask.priority || "medium");
      setAssigneeId(serverTask.assignee?._id || serverTask.assignee || "");
      queryClient.setQueryData(["task", id], (old) => ({
        ...old,
        task: serverTask,
        data: serverTask,
      }));
    }
    setConflictModalOpen(false);
  };

  const handleResolveReapply = () => {
    if (conflictData?.currentTask) {
      const payload = {
        title,
        description,
        status,
        version: conflictData.currentTask.version,
      };
      if (canManage) {
        payload.priority = priority;
        payload.assigneeId = assigneeId || null;
      }
      updateMutation.mutate(payload);
    }
  };

  if (isTaskLoading) {
    return (
      <DashboardLayout>
        <div className="border border-[#0A0A0A] bg-white p-12 text-center font-mono text-xs text-[#737373]">
          // QUERYING_TASK_TELEMETRY...
        </div>
      </DashboardLayout>
    );
  }

  if (taskError || !task) {
    return (
      <DashboardLayout>
        <div className="border border-[#EF4444] bg-[#FEF2F2] p-8 text-center">
          <p className="font-['Bebas_Neue','Oswald'] text-3xl text-[#EF4444] uppercase">
            // TASK NODE NOT FOUND
          </p>
          <Link
            to="/projects"
            className="mt-6 inline-flex items-center gap-2 border border-black bg-black text-white px-4 py-2 text-xs font-mono font-bold uppercase hover:bg-[#C6FF3D] hover:text-black"
          >
            RETURN TO PROJECTS
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* TOP NAVIGATION & VERSION BADGE */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#737373] hover:text-[#0A0A0A] uppercase transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>&larr; BACK TO PROJECT</span>
        </Link>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-[#0A0A0A] text-[#C6FF3D] px-2.5 py-1 font-bold border border-black">
            LOCK_VER: v{task.version ?? 1}
          </span>
          <span className="text-[#737373]">#{task._id.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT 2 COLS: TASK EDIT FORM */}
        <div className="lg:col-span-2 border border-[#0A0A0A] bg-white p-6 sm:p-8 shadow-[4px_4px_0px_0px_#0A0A0A]">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 mb-6">
            <h1 className="font-['Bebas_Neue','Oswald'] text-4xl text-[#0A0A0A] uppercase leading-none">
              TASK SPECIFICATION
            </h1>
            {canManage && (
              <button
                onClick={() => {
                  if (window.confirm("Permanently delete this task and all comment history?")) {
                    deleteTaskMutation.mutate();
                  }
                }}
                className="text-[#EF4444] hover:text-black p-1 transition-colors"
                title="Delete Task"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-mono font-bold uppercase mb-1.5">
                TASK TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canEdit}
                className={`w-full border border-black p-3 text-sm font-bold font-sans outline-none focus:ring-2 focus:ring-[#C6FF3D] ${
                  !canEdit ? "bg-[#F5F5F2] cursor-not-allowed text-[#737373]" : "bg-white"
                }`}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5">
                  PROGRESS STATUS
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!canEdit}
                  className={`w-full border border-black p-2.5 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-[#C6FF3D] ${
                    !canEdit ? "bg-[#F5F5F2] cursor-not-allowed text-[#737373]" : "bg-white"
                  }`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5">
                  PRIORITY TIER
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={!canManage}
                  className={`w-full border border-black p-2.5 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-[#C6FF3D] ${
                    !canManage ? "bg-[#F5F5F2] cursor-not-allowed text-[#737373]" : "bg-white"
                  }`}
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono font-bold uppercase">
                    ASSIGNED OPERATIVE
                  </label>
                  {isAssignee && (
                    <span className="bg-[#C6FF3D] text-[#0A0A0A] px-1.5 py-0.2 text-[9px] font-mono font-bold border border-black uppercase">
                      ⚡ ASSIGNED TO YOU
                    </span>
                  )}
                </div>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  disabled={!canManage}
                  className={`w-full border border-black p-2.5 text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-[#C6FF3D] ${
                    !canManage ? "bg-[#F5F5F2] cursor-not-allowed text-[#737373]" : "bg-white"
                  }`}
                >
                  <option value="">UNASSIGNED</option>
                  {members
                    .filter((m) => m.role !== "viewer" && m.user?.isActive)
                    .map((m) => (
                      <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                        {m.user?.name || "Operative"} ({m.user?.email || ""}) [{m.role.replace("_", " ").toUpperCase()}]
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase mb-1.5">
                DESCRIPTION & REQUIREMENTS
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                className={`w-full border border-black p-3 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D] ${
                  !canEdit ? "bg-[#F5F5F2] cursor-not-allowed text-[#737373]" : "bg-white"
                }`}
                placeholder="DETAILED SPECS..."
              />
            </div>

            <div className="flex items-center justify-between border-t border-[#E5E5E0] pt-6">
              <div className="text-[10px] font-mono text-[#737373]">
                LAST UPDATED: {new Date(task.updatedAt || Date.now()).toLocaleTimeString()}
              </div>

              {canEdit ? (
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="border border-black bg-[#0A0A0A] text-white px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-widest hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-all disabled:opacity-50"
                >
                  {updateMutation.isPending ? "SAVING..." : "COMMIT CHANGES ->"}
                </button>
              ) : (
                <span className="border border-[#737373] text-[#737373] px-3.5 py-2 text-[10px] font-mono font-bold uppercase bg-[#F5F5F2]">
                  [READ-ONLY PRIVILEGES]
                </span>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT 1 COL: COMMENTS THREAD */}
        <div className="border border-[#0A0A0A] bg-white p-6 shadow-[4px_4px_0px_0px_#0A0A0A] flex flex-col justify-between">
          <div>
            <div className="flex flex-col gap-1 border-b border-[#0A0A0A] pb-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="bg-[#0A0A0A] text-[#C6FF3D] font-mono text-[9px] font-bold px-1.5 py-0.2 uppercase border border-black">
                  TIER B // TASK UPDATE THREAD
                </span>
                <span className="font-mono text-xs font-bold text-[#737373]">
                  [{comments.length} UPDATES]
                </span>
              </div>
              <h3 className="font-['Bebas_Neue','Oswald'] text-2xl uppercase tracking-wide text-[#0A0A0A]">
                PM ↔ {task?.assignee?.name ? task.assignee.name.toUpperCase() : "UNASSIGNED SQUAD MEMBER"}
              </h3>
            </div>

            {/* COMMENTS LIST */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {isCommentsLoading ? (
                <div className="text-xs font-mono text-[#737373]">LOADING COMMS...</div>
              ) : comments.length === 0 ? (
                <div className="border border-dashed border-[#E5E5E0] p-6 text-center text-xs font-mono text-[#737373]">
                  NO ACTIVITY LOGGED. POST THE FIRST UPDATE.
                </div>
              ) : (
                comments.map((c) => {
                  const cat = c.category || "general";
                  const borderClass =
                    cat === "admin_instruction"
                      ? "border-l-4 border-l-[#EF4444] bg-[#FFF5F5]"
                      : cat === "pm_directive"
                      ? "border-l-4 border-l-[#C6FF3D] bg-[#FAFFF2]"
                      : cat === "progress_update"
                      ? "border-l-4 border-l-[#10B981] bg-[#F4FFF8]"
                      : cat === "blocker"
                      ? "border-l-4 border-l-[#F59E0B] bg-[#FFFBEB]"
                      : "border border-[#0A0A0A] bg-[#FAF9F5]";

                  return (
                    <div
                      key={c._id}
                      className={`border border-[#0A0A0A] p-3 text-xs font-mono ${borderClass}`}
                    >
                      <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-1.5 mb-2 text-[10px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#0A0A0A]">
                            {c.author?.name || "OPERATIVE"}
                          </span>
                          <span className="text-[9px] px-1 border border-black uppercase bg-white">
                            {c.author?.role?.replace("_", " ") || "MEMBER"}
                          </span>

                          {cat === "admin_instruction" && (
                            <span className="bg-[#EF4444] text-white px-1.5 py-0.2 text-[8px] font-bold uppercase border border-black">
                              🔴 ADMIN DIRECTIVE
                            </span>
                          )}
                          {cat === "pm_directive" && (
                            <span className="bg-[#0A0A0A] text-[#C6FF3D] px-1.5 py-0.2 text-[8px] font-bold uppercase border border-black">
                              📋 PM DIRECTIVE
                            </span>
                          )}
                          {cat === "progress_update" && (
                            <span className="bg-[#C6FF3D] text-[#0A0A0A] px-1.5 py-0.2 text-[8px] font-bold uppercase border border-black">
                              ⚡ PROGRESS UPDATE
                            </span>
                          )}
                          {cat === "blocker" && (
                            <span className="bg-[#F59E0B] text-black px-1.5 py-0.2 text-[8px] font-bold uppercase border border-black">
                              ⚠️ BLOCKER
                            </span>
                          )}

                          {c.recipient && (
                            <span className="bg-[#0A0A0A] text-[#C6FF3D] px-1.5 py-0.2 text-[8px] font-bold uppercase border border-black">
                              &rarr; @{c.recipient.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[#737373]">
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                          {(c.author?._id === user?._id || user?.role === "admin") && (
                            <button
                              onClick={() => deleteCommentMutation.mutate(c._id)}
                              className="text-[#EF4444] hover:text-black"
                              title="Delete comment"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[#0A0A0A] whitespace-pre-wrap">{c.body || c.text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* POST COMMENT FORM WITH CATEGORY TABS & RECIPIENT */}
          {myRole !== "viewer" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (commentText.trim()) {
                  postCommentMutation.mutate({
                    body: commentText.trim(),
                    category: commentCategory,
                    recipientId: commentRecipientId || undefined,
                  });
                }
              }}
              className="mt-6 pt-4 border-t border-[#0A0A0A]"
            >
              {/* Quick Prompt Button for PM or Admin to ask for status */}
              {task?.assignee && (canManage || user?.role === "admin") && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCommentText(`@${task.assignee.name} — Please provide your status update and current progress on this task.`);
                      setCommentCategory(user?.role === "admin" ? "admin_instruction" : "pm_directive");
                      setCommentRecipientId(task.assignee._id || task.assignee);
                    }}
                    className="w-full border border-black bg-[#FAF9F5] hover:bg-[#C6FF3D] text-[#0A0A0A] p-2 text-[11px] font-mono font-bold uppercase transition-colors text-left flex items-center justify-between shadow-[2px_2px_0px_0px_#0A0A0A]"
                  >
                    <span>⚡ ASK @{task.assignee.name.toUpperCase()} FOR STATUS UPDATE</span>
                    <span className="text-[9px] underline">CLICK TO PRE-FILL</span>
                  </button>
                </div>
              )}

              {/* Category selector pills & recipient tag */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#737373] uppercase font-bold">
                    CATEGORY:
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-[#737373] uppercase">TAG OPERATIVE:</span>
                    <select
                      value={commentRecipientId}
                      onChange={(e) => setCommentRecipientId(e.target.value)}
                      className="border border-black bg-white px-2 py-0.5 text-[10px] font-mono uppercase outline-none focus:ring-1 focus:ring-[#C6FF3D]"
                    >
                      <option value="">ALL SQUAD</option>
                      {members.map((m) => (
                        <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                          @{m.user?.name || "Operative"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {user?.role === "admin" && (
                    <button
                      type="button"
                      onClick={() => setCommentCategory("admin_instruction")}
                      className={`text-[10px] font-mono px-2 py-0.5 border border-black uppercase font-bold transition-all ${
                        commentCategory === "admin_instruction"
                          ? "bg-[#EF4444] text-white shadow-[2px_2px_0px_0px_#0A0A0A]"
                          : "bg-white text-black hover:bg-[#FAF9F5]"
                      }`}
                    >
                      🔴 ADMIN DIRECTIVE
                    </button>
                  )}

                  {(canManage || user?.role === "admin") && (
                    <button
                      type="button"
                      onClick={() => setCommentCategory("pm_directive")}
                      className={`text-[10px] font-mono px-2 py-0.5 border border-black uppercase font-bold transition-all ${
                        commentCategory === "pm_directive"
                          ? "bg-[#0A0A0A] text-[#C6FF3D] shadow-[2px_2px_0px_0px_#0A0A0A]"
                          : "bg-white text-black hover:bg-[#FAF9F5]"
                      }`}
                    >
                      📋 PM GUIDANCE
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setCommentCategory("progress_update")}
                    className={`text-[10px] font-mono px-2 py-0.5 border border-black uppercase font-bold transition-all ${
                      commentCategory === "progress_update"
                        ? "bg-[#C6FF3D] text-[#0A0A0A] shadow-[2px_2px_0px_0px_#0A0A0A]"
                        : "bg-white text-black hover:bg-[#F5F5F2]"
                    }`}
                  >
                    ⚡ PROGRESS UPDATE
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommentCategory("blocker")}
                    className={`text-[10px] font-mono px-2 py-0.5 border border-black uppercase font-bold transition-all ${
                      commentCategory === "blocker"
                        ? "bg-[#F59E0B] text-black shadow-[2px_2px_0px_0px_#0A0A0A]"
                        : "bg-white text-black hover:bg-[#FAF9F5]"
                    }`}
                  >
                    ⚠️ BLOCKER
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommentCategory("general")}
                    className={`text-[10px] font-mono px-2 py-0.5 border border-black uppercase font-bold transition-all ${
                      commentCategory === "general"
                        ? "bg-[#0A0A0A] text-white shadow-[2px_2px_0px_0px_#0A0A0A]"
                        : "bg-white text-black hover:bg-[#FAF9F5]"
                    }`}
                  >
                    💬 NOTE
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  commentCategory === "progress_update"
                    ? "Log progress update on this task for the Project Manager..."
                    : commentCategory === "blocker"
                    ? "Report active impediments or blocker details..."
                    : commentCategory === "admin_instruction"
                    ? "Issue leadership directives to the Project Manager and team..."
                    : commentCategory === "pm_directive"
                    ? "Provide task instructions or acceptance criteria for the operative..."
                    : "Post comment note..."
                }
                className="w-full border border-black p-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
              />
              <button
                type="submit"
                disabled={postCommentMutation.isPending || !commentText.trim()}
                className="mt-2 w-full border border-black bg-[#0A0A0A] text-white py-2 text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>
                  {commentCategory === "progress_update"
                    ? "SUBMIT PROGRESS UPDATE"
                    : commentCategory === "blocker"
                    ? "SUBMIT BLOCKER REPORT"
                    : commentCategory === "admin_instruction"
                    ? "ISSUE ADMIN DIRECTIVE"
                    : commentCategory === "pm_directive"
                    ? "ISSUE PM GUIDANCE"
                    : "POST NOTE"}
                </span>
              </button>
            </form>
          ) : (
            <div className="mt-6 pt-4 border-t border-[#0A0A0A] text-center">
              <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider">
                // OBSERVATION PRIVILEGES ONLY (COMMENTS LOCKED)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 409 CONFLICT MODAL */}
      {conflictModalOpen && conflictData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-2xl border-2 border-[#EF4444] bg-[#FFFFFF] p-6 sm:p-8 shadow-[8px_8px_0px_0px_#EF4444]">
            <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-6">
              <span className="bg-[#EF4444] text-white p-2">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#EF4444] tracking-widest uppercase">
                  CONCURRENCY CONFLICT DETECTED [HTTP 409]
                </span>
                <h3 className="font-['Bebas_Neue','Oswald'] text-4xl text-[#0A0A0A] uppercase leading-none">
                  THIS TASK CHANGED
                </h3>
              </div>
            </div>

            <p className="text-xs font-mono text-[#525252] mb-6">
              Another operative committed updates to this task while you were editing. To prevent overwriting work, inspect the discrepancies below:
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-6">
              {/* YOUR CHANGES */}
              <div className="border border-black p-4 bg-[#FAF9F5]">
                <div className="font-bold border-b border-black pb-1 mb-2 text-[#0A0A0A]">
                  YOUR ATTEMPTED CHANGES
                </div>
                <div className="space-y-1.5">
                  <div><strong>Title:</strong> {conflictData.myChanges.title}</div>
                  <div><strong>Status:</strong> {conflictData.myChanges.status}</div>
                  <div><strong>Priority:</strong> {conflictData.myChanges.priority}</div>
                  <div><strong>Description:</strong> {conflictData.myChanges.description?.slice(0, 60)}...</div>
                </div>
              </div>

              {/* SERVER VERSION */}
              <div className="border-2 border-[#C6FF3D] p-4 bg-[#0A0A0A] text-white">
                <div className="font-bold border-b border-[#282828] pb-1 mb-2 text-[#C6FF3D]">
                  LATEST SERVER VERSION (v{conflictData.currentTask?.version})
                </div>
                <div className="space-y-1.5 text-[#F5F5F2]">
                  <div><strong>Title:</strong> {conflictData.currentTask?.title}</div>
                  <div><strong>Status:</strong> {conflictData.currentTask?.status}</div>
                  <div><strong>Priority:</strong> {conflictData.currentTask?.priority}</div>
                  <div><strong>Description:</strong> {conflictData.currentTask?.description?.slice(0, 60)}...</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-black pt-4">
              <button
                type="button"
                onClick={handleResolveUseLatest}
                className="border border-black bg-white px-5 py-2.5 text-xs font-mono font-bold uppercase hover:bg-[#F5F5F2]"
              >
                USE LATEST (DISCARD MINE)
              </button>
              <button
                type="button"
                onClick={handleResolveReapply}
                className="border border-black bg-[#0A0A0A] text-[#C6FF3D] px-5 py-2.5 text-xs font-mono font-bold uppercase hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-all"
              >
                RE-APPLY MY CHANGES (OVERWRITE v{conflictData.currentTask?.version})
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
