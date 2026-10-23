import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import { useAuth, ROLE_LABELS } from "../utils/auth";
import DashboardLayout from "../components/layouts/DashboardLayout";
import { UserCheck, KeyRound, Shield, Check, AlertCircle } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => api.patch("/users/me", payload),
    onSuccess: (res) => {
      setStatusMsg("PROFILE UPDATED SUCCESSFULLY");
      setErrorMsg("");
      setCurrentPassword("");
      setNewPassword("");
      queryClient.setQueryData(["me"], res);
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to update profile");
      setStatusMsg("");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");

    const payload = {};
    if (name.trim() && name !== user?.name) payload.name = name.trim();
    if (newPassword) {
      if (!currentPassword) {
        setErrorMsg("CURRENT PASSWORD IS REQUIRED TO SET A NEW PASSWORD");
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      setStatusMsg("NO CHANGES SPECIFIED");
      return;
    }

    updateProfileMutation.mutate(payload);
  };

  return (
    <DashboardLayout
      title="OPERATIVE // PROFILE"
      subtitle="IDENTITY CREDENTIALS & SECURITY PROTOCOLS"
    >
      <div className="max-w-2xl border border-[#0A0A0A] bg-white p-6 sm:p-10 shadow-[4px_4px_0px_0px_#0A0A0A]">
        {/* IDENTITY BANNER */}
        <div className="flex items-center gap-4 border-b border-[#E5E5E0] pb-6 mb-6">
          <div className="h-14 w-14 bg-[#0A0A0A] text-[#C6FF3D] font-mono font-bold text-xl flex items-center justify-center border border-black">
            {user?.name?.slice(0, 2).toUpperCase() || "OP"}
          </div>
          <div>
            <div className="text-xs font-mono text-[#737373] uppercase tracking-wider">
              AUTHENTICATED IDENTITY
            </div>
            <h2 className="font-['Bebas_Neue','Oswald'] text-3xl text-[#0A0A0A]">
              {user?.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-[#0A0A0A] text-[#C6FF3D] px-2 py-0.5 text-[10px] font-mono font-bold">
                [{ROLE_LABELS[user?.role] || user?.role}]
              </span>
              <span className="text-xs font-mono text-[#737373]">{user?.email}</span>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="mb-6 border border-[#0A0A0A] bg-[#C6FF3D] p-3 text-xs font-mono font-bold text-[#0A0A0A] flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 border border-[#EF4444] bg-[#FEF2F2] p-3 text-xs font-mono font-bold text-[#EF4444] flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>[!] {errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono font-bold uppercase mb-1.5">
              DISPLAY NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase mb-1.5">
              EMAIL ADDRESS (READ-ONLY)
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full border border-[#D4D4D0] bg-[#F5F5F2] text-[#737373] p-2.5 text-xs font-mono cursor-not-allowed"
            />
          </div>

          <div className="border-t border-[#E5E5E0] pt-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="h-4 w-4 text-[#0A0A0A]" />
              <h3 className="font-['Bebas_Neue','Oswald'] text-2xl uppercase text-[#0A0A0A]">
                UPDATE CREDENTIALS
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5">
                  CURRENT PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5">
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="MINIMUM 8 CHARACTERS"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-black p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#C6FF3D]"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#E5E5E0] pt-6 flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="border border-black bg-[#0A0A0A] text-white px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-widest hover:bg-[#C6FF3D] hover:text-[#0A0A0A] transition-all disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? "SAVING..." : "COMMIT PROFILE UPDATES ->"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
