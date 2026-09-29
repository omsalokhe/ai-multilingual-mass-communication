import { Search, Bell, ChevronRight, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import { useAuth } from "../context/AuthContext";

export interface TopBarProps {
  title?: string;
  crumbs?: { label: string; to?: string }[];
  children?: React.ReactNode;
}

export default function TopBar({ title: _title, crumbs, children }: TopBarProps) {
  const { profile, generalSettings, toggleDarkMode } = useAppSettings();
  const { user } = useAuth();
  const isDark = generalSettings.darkMode;

  return (
    <header className={`px-5 py-3 flex items-center justify-between gap-4 shrink-0 border-b transition-colors duration-300 ${
      isDark
        ? "bg-slate-900 border-slate-700"
        : "bg-white border-slate-200"
    }`}>
      {crumbs && crumbs.length > 0 ? (
        <nav className={`flex items-center gap-1.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {crumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight size={12} className={isDark ? "text-slate-500" : "text-slate-400"} />}
              {crumb.to ? (
                <Link to={crumb.to} className={`font-medium transition-colors ${
                  isDark ? "hover:text-blue-400" : "hover:text-blue-600"
                }`}>
                  {crumb.label}
                </Link>
              ) : (
                <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : (
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          />
          <input
            type="text"
            placeholder="Search campaigns, audiences, or templates..."
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 ${
              isDark
                ? "bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:ring-blue-500/30 focus:border-blue-500"
                : "bg-slate-50 border-slate-200 text-slate-600 placeholder:text-slate-400 focus:ring-blue-500/20 focus:border-blue-400"
            }`}
          />
        </div>
      )}

      {/* Right side actions */}
      <div className="flex items-center gap-3 ml-auto">
        {children}

        {/* Dark mode toggle */}
        <button
          id="theme-toggle"
          onClick={toggleDarkMode}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={`relative p-2 rounded-lg transition-all duration-300 cursor-pointer ${
            isDark
              ? "bg-slate-800 hover:bg-slate-700 text-amber-400 shadow-inner shadow-slate-950/30"
              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
          }`}
        >
          <span className="animate-theme-icon block" key={isDark ? "moon" : "sun"}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </span>
        </button>

        {/* Notifications */}
        <button className={`relative p-2 rounded-lg transition-colors ${
          isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"
        }`}>
          <Bell size={18} className={isDark ? "text-slate-400" : "text-slate-500"} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User avatar */}
        <div className={`flex items-center gap-2.5 pl-3 border-l ${isDark ? "border-slate-700" : "border-slate-200"}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : profile.avatarInitials}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{user?.full_name || profile.fullName}</span>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{user?.role || profile.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
