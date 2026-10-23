import { Link } from "react-router-dom";
import { useAuth, ROLE_LABELS } from "../utils/auth";
import { LogOut, Bell, Search } from "lucide-react";

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E5E5E0] bg-[#FFFFFF] px-6 lg:px-10">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-[#0A0A0A] hover:bg-[#F5F5F2] border border-[#0A0A0A]"
            aria-label="Toggle Navigation"
          >
            <span className="font-mono text-xs font-bold">[MENU]</span>
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2">
          <span className="bg-[#0A0A0A] text-[#C6FF3D] font-mono font-bold text-xs px-2 py-0.5">
            PROJECT_OS
          </span>
          <span className="text-xs font-mono text-[#737373] tracking-widest uppercase">
            // TELEMETRY ACTIVE
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-xs font-mono font-bold px-2.5 py-1 uppercase tracking-widest bg-[#0A0A0A] text-[#C6FF3D] border border-black">
            [{ROLE_LABELS[user.role] || user.role}]
          </span>
        )}
        <div className="h-8 w-8 bg-[#0A0A0A] text-white font-mono font-bold flex items-center justify-center text-xs border border-black">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : "OP"}
        </div>
      </div>
    </header>
  );
}
