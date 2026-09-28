import { Search, Bell, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";

export interface TopBarProps {
  title?: string;
  crumbs?: { label: string; to?: string }[];
  children?: React.ReactNode;
}

export default function TopBar({ title: _title, crumbs, children }: TopBarProps) {
  const { profile } = useAppSettings();

  return (
    <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-4 shrink-0">
      {crumbs && crumbs.length > 0 ? (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          {crumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight size={12} className="text-slate-400" />}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-blue-600 transition-colors font-medium">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-800 font-semibold">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : (
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search campaigns, audiences, or templates..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-slate-50"
          />
        </div>
      )}

      {/* Right side actions */}
      <div className="flex items-center gap-3 ml-auto">
        {children}

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <Bell size={18} className="text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {profile.avatarInitials}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-slate-700">{profile.fullName}</span>
            <span className="text-[10px] text-slate-400">{profile.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
