import { useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../utils/api";
import { useAuth } from "../../utils/auth";
import {
  Shield,
  Briefcase,
  Send,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
} from "lucide-react";

const CATEGORY_STYLES = {
  status_request: "bg-[#0A0A0A] text-[#C6FF3D] border border-black",
  admin_instruction: "bg-[#EF4444] text-white border border-black",
  admin_pm_update: "bg-[#C6FF3D] text-[#0A0A0A] border border-black",
  progress_update: "bg-[#C6FF3D] text-[#0A0A0A] border border-black",
  blocker: "bg-[#EF4444] text-white border border-black animate-pulse",
  general: "bg-[#F5F5F2] text-[#0A0A0A] border border-[#E5E5E0]",
};

const CATEGORY_LABELS = {
  status_request: "STATUS REQUEST",
  admin_instruction: "ADMIN DIRECTIVE",
  admin_pm_update: "PM STATUS REPORT",
  progress_update: "PROGRESS UPDATE",
  blocker: "BLOCKER ALERT",
  general: "GENERAL NOTE",
};

export default function ProjectUpdates() {
  const { project, myRole } = useOutletContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === "admin" || user?.systemRole === "admin";
  const isAssignedPm =
    project?.manager?._id === user?._id || project?.manager === user?._id;
  const isPm = user?.role === "project_manager" || myRole === "project_manager" || isAssignedPm;
  const canPost = isAdmin || isPm;

  const [messageText, setMessageText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    isAdmin ? "status_request" : "admin_pm_update"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const { data: updatesRes, isLoading } = useQuery({
    queryKey: ["project-updates", project._id],
    queryFn: () => api.get(`/projects/${project._id}/updates`),
  });

  const updates = updatesRes?.data || [];

  const postMutation = useMutation({
    mutationFn: (payload) => api.post(`/projects/${project._id}/updates`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-updates", project._id] });
      setMessageText("");
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to post update message.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-updates", project._id] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    postMutation.mutate({
      body: messageText.trim(),
      category: selectedCategory,
    });
  };

  const insertQuickTemplate = (text, category) => {
    setMessageText(text);
    if (category) setSelectedCategory(category);
  };

  const pmName = project.manager?.name || "UNASSIGNED PM";

  return (
    <div className="space-y-8">
      {/* HEADER HERO BAR */}
      <div className="border border-[#0A0A0A] bg-[#0A0A0A] text-white p-6 shadow-[4px_4px_0px_0px_#C6FF3D]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#282828] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#C6FF3D] text-[#0A0A0A] font-black px-2 py-0.5 text-xs font-mono tracking-widest uppercase">
                TIER A // EXECUTIVE THREAD
              </span>
              <span className="text-xs font-mono text-[#A3A3A3] uppercase">
                PROJECT LEVEL UPDATES
              </span>
            </div>
            <h2 className="font-['Bebas_Neue','Oswald'] text-3xl tracking-wide text-white">
              ADMIN ↔ PROJECT MANAGER DIRECT UPDATE THREAD
            </h2>
          </div>

          {/* Connected Parties Badges */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="border border-[#383838] bg-[#141414] px-3 py-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#C6FF3D]" />
              <div>
                <div className="text-[10px] text-[#737373] uppercase">SYSTEM ADMIN</div>
                <div className="font-bold text-white">ORGANIZATION LEAD</div>
              </div>
            </div>
            <div className="text-[#C6FF3D] font-bold">&harr;</div>
            <div className="border border-[#383838] bg-[#141414] px-3 py-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#C6FF3D]" />
              <div>
                <div className="text-[10px] text-[#737373] uppercase">ASSIGNED PM</div>
                <div className="font-bold text-white">{pmName}</div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs font-mono text-[#A3A3A3] leading-relaxed">
          This thread enables direct, bidirectional status reporting between the System Admin and the Project Manager.
          The Admin uses this thread to request milestone progress reports and issue project directives, while the Project Manager
          submits status updates, sprint health reports, and escalates organizational blockers.
        </p>

        {/* 1-Click Quick Message Templates */}
        {canPost && (
          <div className="mt-4 pt-4 border-t border-[#282828] flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="text-[#737373] text-[11px] uppercase mr-1">QUICK PROMPTS:</span>
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    insertQuickTemplate(
                      `@${pmName} — Please share the latest milestone progress report and timeline update for this sprint.`,
                      "status_request"
                    )
                  }
                  className="border border-[#383838] bg-[#181818] px-2.5 py-1 text-white hover:border-[#C6FF3D] hover:text-[#C6FF3D] transition-colors"
                >
                  ⚡ Request Status Report
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertQuickTemplate(
                      `@${pmName} — Priority directive: Please expedite task delivery and confirm resource availability.`,
                      "admin_instruction"
                    )
                  }
                  className="border border-[#383838] bg-[#181818] px-2.5 py-1 text-white hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
                >
                  🚨 Issue Directive
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    insertQuickTemplate(
                      `All sprint deliverables are tracking on schedule. Team velocity is optimal and all tasks are distributed.`,
                      "admin_pm_update"
                    )
                  }
                  className="border border-[#383838] bg-[#181818] px-2.5 py-1 text-white hover:border-[#C6FF3D] hover:text-[#C6FF3D] transition-colors"
                >
                  ⚡ Submit Status Report
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertQuickTemplate(
                      `Attention Admin: We have encountered an infrastructure dependency blocker requiring administrative resolution.`,
                      "blocker"
                    )
                  }
                  className="border border-[#383838] bg-[#181818] px-2.5 py-1 text-white hover:border-[#EF4444] hover:text-[#EF4444] transition-colors"
                >
                  🚨 Escalate Blocker
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* THREAD MESSAGES LIST */}
      <div className="border border-[#0A0A0A] bg-white p-6 shadow-[4px_4px_0px_0px_#0A0A0A]">
        <div className="flex items-center justify-between border-b border-[#0A0A0A] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#0A0A0A]" />
            <h3 className="font-['Bebas_Neue','Oswald'] text-2xl tracking-wide uppercase text-[#0A0A0A]">
              UPDATE LOG ({updates.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-[#737373]">
            CHRONOLOGICAL AUDIT TRAIL
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center font-mono text-xs text-[#737373]">
            // QUERYING_PROJECT_UPDATE_LOGS...
          </div>
        ) : updates.length === 0 ? (
          <div className="border border-dashed border-[#0A0A0A] p-12 text-center bg-[#FAF9F5]">
            <p className="font-['Bebas_Neue','Oswald'] text-2xl text-[#0A0A0A] uppercase tracking-wider">
              // NO UPDATES RECORDED YET
            </p>
            <p className="text-xs font-mono text-[#737373] mt-1 max-w-md mx-auto">
              Use the form below to post the first direct update between the System Admin and Project Manager.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((item) => {
              const isAuthor = item.author?._id === user?._id || item.author === user?._id;
              const canDelete = isAuthor || isAdmin;
              const isSenderAdmin = item.author?.role === "admin";

              return (
                <div
                  key={item._id}
                  className={`border border-[#0A0A0A] p-4 transition-all ${
                    isSenderAdmin
                      ? "bg-[#FAF9F5] border-l-4 border-l-[#0A0A0A]"
                      : "bg-[#FAFFF2] border-l-4 border-l-[#C6FF3D]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5E0] pb-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 uppercase ${
                          isSenderAdmin
                            ? "bg-[#0A0A0A] text-[#C6FF3D]"
                            : "bg-[#181818] text-white"
                        }`}
                      >
                        {isSenderAdmin ? "👑 ADMIN" : "👔 PROJECT MANAGER"}
                      </span>

                      <span className="font-bold text-xs font-mono text-[#0A0A0A]">
                        {item.author?.name || "Operative"}
                      </span>

                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 uppercase ${
                          CATEGORY_STYLES[item.category] || CATEGORY_STYLES.general
                        }`}
                      >
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-[#737373]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => {
                            if (window.confirm("Delete this update message?")) {
                              deleteMutation.mutate(item._id);
                            }
                          }}
                          className="text-[#737373] hover:text-[#EF4444] transition-colors p-1"
                          title="Delete message"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-mono text-[#0A0A0A] leading-relaxed whitespace-pre-wrap">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* POST FORM */}
        {canPost ? (
          <form onSubmit={handleSubmit} className="mt-8 border-t border-[#0A0A0A] pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-bold uppercase text-[#0A0A0A]">
                COMPOSE UPDATE MESSAGE ({user?.name} [{isAdmin ? "ADMIN" : "PROJECT MANAGER"}])
              </label>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-[#737373]">CATEGORY:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-black bg-white px-2 py-1 text-xs font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                >
                  <option value="status_request">STATUS REQUEST (ADMIN &rarr; PM)</option>
                  <option value="admin_pm_update">STATUS REPORT (PM &rarr; ADMIN)</option>
                  <option value="admin_instruction">ADMIN DIRECTIVE</option>
                  <option value="blocker">BLOCKER ESCALATION</option>
                  <option value="general">GENERAL COMMUNICATION</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <div className="border border-[#EF4444] bg-[#FEF2F2] p-3 text-xs font-mono font-bold text-[#EF4444]">
                [!] {errorMsg}
              </div>
            )}

            <textarea
              rows={3}
              placeholder={
                isAdmin
                  ? `Address project manager @${pmName} with instructions, questions, or progress requests...`
                  : `Report sprint progress, delivery updates, or blockers back to the Admin...`
              }
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full border border-black p-3 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
              required
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={postMutation.isPending || !messageText.trim()}
                className="flex items-center gap-2 border border-black bg-[#0A0A0A] text-white px-5 py-2.5 text-xs font-mono font-bold uppercase hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-colors disabled:opacity-50 shadow-[2px_2px_0px_0px_#0A0A0A]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{postMutation.isPending ? "TRANSMITTING..." : "POST UPDATE MESSAGE ->"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 border border-dashed border-[#737373] p-4 text-center font-mono text-xs text-[#737373] bg-[#FAF9F5]">
            [READ-ONLY] You are viewing this project as a team member or viewer.
            Only the System Admin and the Project Manager can post directly to this executive update thread.
          </div>
        )}
      </div>
    </div>
  );
}
