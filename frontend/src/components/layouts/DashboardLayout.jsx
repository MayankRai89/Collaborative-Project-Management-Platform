import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, ROLE_LABELS } from "../../utils/auth";
import {
  LayoutDashboard,
  FolderGit2,
  Users,
  UserCheck,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Briefcase,
  Layers,
  Eye,
  CheckSquare,
} from "lucide-react";

const ROLE_BADGE_STYLE = {
  admin: "bg-[#0A0A0A] text-[#C6FF3D] border border-[#C6FF3D]",
  project_manager:
    "bg-[#181818] text-white border-l-4 border-l-[#C6FF3D] border-[#282828]",
  team_member: "bg-[#FFFFFF] text-[#0A0A0A] border border-[#0A0A0A]",
  viewer: "bg-transparent text-[#737373] border border-dashed border-[#737373]",
};

export default function DashboardLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "01 // DASHBOARD", path: "/dashboard", icon: LayoutDashboard },
    { label: "02 // PROJECTS", path: "/projects", icon: FolderGit2 },
    { label: "03 // MY TASKS", path: "/tasks", icon: CheckSquare },
  ];

  if (user?.role === "admin") {
    navLinks.push({
      label: "04 // USERS [ADMIN]",
      path: "/users",
      icon: Users,
    });
  }

  navLinks.push({ label: "05 // PROFILE", path: "/profile", icon: UserCheck });

  return (
    <div className="flex min-h-screen bg-[#F5F5F2] text-[#0A0A0A]">
      {/* DESKTOP SIDEBAR: Pure dark monolithic lookbook */}
      <aside className="hidden lg:flex w-72 flex-col justify-between border-r border-[#282828] bg-[#0A0A0A] text-[#F5F5F2] p-6 shrink-0">
        <div>
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between border-b border-[#282828] pb-5">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="bg-[#C6FF3D] text-[#0A0A0A] font-black px-2 py-0.5 text-xs font-mono tracking-widest">
                SNITCH
              </span>
              <span className="font-['Bebas_Neue','Oswald'] text-2xl tracking-wider text-white">
                PROJECTS
              </span>
            </Link>
            <span className="h-2 w-2 rounded-full bg-[#C6FF3D] animate-pulse"></span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 space-y-2">
            {navLinks.map((link) => {
              const active =
                location.pathname === link.path ||
                location.pathname.startsWith(`${link.path}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center justify-between px-3.5 py-3 text-xs font-mono font-bold tracking-wider transition-all border ${
                    active
                      ? "bg-[#C6FF3D] text-[#0A0A0A] border-[#C6FF3D]"
                      : "border-transparent text-[#A3A3A3] hover:border-[#282828] hover:bg-[#141414] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </div>
                  {active && <span className="font-mono text-[10px]">●</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="border-t border-[#282828] pt-5">
          <div className="mb-3">
            <div className="text-[10px] font-mono text-[#737373] uppercase tracking-wider mb-1">
              AUTHENTICATED AS
            </div>
            <div className="text-sm font-bold text-white truncate">
              {user?.name}
            </div>
            <div className="text-xs font-mono text-[#737373] truncate">
              {user?.email}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-1 uppercase tracking-wider ${
                ROLE_BADGE_STYLE[user?.role] || ROLE_BADGE_STYLE.viewer
              }`}
            >
              [{ROLE_LABELS[user?.role] || user?.role}]
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#A3A3A3] hover:text-[#EF4444] transition-colors p-1"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span>EXIT</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* TOP BAR */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E5E5E0] bg-[#FFFFFF] px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#0A0A0A] hover:bg-[#F5F5F2] border border-[#0A0A0A]"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-mono tracking-widest text-[#737373] uppercase">
                SYSTEM // CONSOLE
              </span>
            </div>
          </div>

          {/* Top Bar Right: Role Badge & Quick User Info & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className={`text-[10px] sm:text-xs font-mono font-bold px-2 py-1 uppercase tracking-wider sm:tracking-widest ${
                ROLE_BADGE_STYLE[user?.role] || ROLE_BADGE_STYLE.viewer
              }`}
            >
              <span className="hidden sm:inline">ROLE: </span>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
            <div className="h-8 w-8 bg-[#0A0A0A] text-[#C6FF3D] font-mono font-bold flex items-center justify-center text-xs border border-black shrink-0">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 border border-[#0A0A0A] bg-white px-2.5 sm:px-3 py-1.5 text-xs font-mono font-bold text-[#0A0A0A] hover:bg-[#EF4444] hover:text-white hover:border-[#EF4444] transition-colors shadow-[2px_2px_0px_0px_#0A0A0A] active:translate-x-0.5 active:translate-y-0.5"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden xs:inline sm:inline">LOGOUT</span>
            </button>
          </div>
        </header>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#282828] bg-[#0A0A0A] p-6 text-white space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-xs font-mono font-bold tracking-wider ${
                  location.pathname === link.path
                    ? "bg-[#C6FF3D] text-[#0A0A0A]"
                    : "text-[#A3A3A3] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[#282828] pt-3 flex justify-between items-center">
              <span className="text-xs font-mono text-[#737373]">
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="text-xs font-mono font-bold text-[#EF4444]"
              >
                [ LOG OUT ]
              </button>
            </div>
          </div>
        )}

        {/* PAGE HEADER & BODY */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {(title || subtitle) && (
            <div className="border-b border-[#E5E5E0] pb-6 mb-8">
              {title && (
                <h1 className="font-['Bebas_Neue','Oswald'] text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#0A0A0A] uppercase leading-none">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 text-xs sm:text-sm font-mono text-[#737373] tracking-wide uppercase">
                  // {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
