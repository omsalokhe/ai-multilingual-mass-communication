import { useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import {
  LayoutDashboard,
  CloudLightning,
  Megaphone,
  Users,
  FileText,
  Radio,
  BarChart3,
  ClipboardList,
  Settings,
  Menu,
  X,
  Zap,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  key: string;
  fallback: string;
  /** Which roles can see this item. undefined = everyone */
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", icon: LayoutDashboard, key: "nav_dashboard", fallback: "Dashboard" },
  { to: "/crisis-monitor", icon: CloudLightning, key: "nav_crisis_monitor", fallback: "Crisis & Weather", roles: ["ADMIN", "SUPER_ADMIN", "CAMPAIGN_MANAGER", "COMMUNICATION_TEAM"] },
  { to: "/approvals", icon: ShieldCheck, key: "nav_approvals", fallback: "Approvals", roles: ["ADMIN", "SUPER_ADMIN"] },
  { to: "/campaigns", icon: Megaphone, key: "nav_campaigns", fallback: "Campaigns", roles: ["ADMIN", "SUPER_ADMIN", "CAMPAIGN_MANAGER", "COMMUNICATION_TEAM"] },
  { to: "/audience", icon: Users, key: "nav_audience", fallback: "Audience", roles: ["ADMIN", "SUPER_ADMIN", "CAMPAIGN_MANAGER"] },
  { to: "/content-templates", icon: FileText, key: "nav_templates", fallback: "Content & Templates", roles: ["ADMIN", "SUPER_ADMIN", "CAMPAIGN_MANAGER", "COMMUNICATION_TEAM"] },
  { to: "/channels", icon: Radio, key: "nav_channels", fallback: "Channels", roles: ["ADMIN", "SUPER_ADMIN", "CAMPAIGN_MANAGER"] },
  { to: "/analytics", icon: BarChart3, key: "nav_analytics", fallback: "Analytics", roles: ["ADMIN", "SUPER_ADMIN", "CAMPAIGN_MANAGER"] },
  { to: "/reports", icon: ClipboardList, key: "nav_reports", fallback: "Reports", roles: ["ADMIN", "SUPER_ADMIN", "CAMPAIGN_MANAGER"] },
  { to: "/settings", icon: Settings, key: "nav_settings", fallback: "Settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile, t, generalSettings } = useAppSettings();
  const { user, logout } = useAuth();
  const isDark = generalSettings.darkMode;

  const userRole = (user?.role || "").toUpperCase();

  // Filter nav items based on user role
  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (!item.roles) return true; // visible to all
      return item.roles.includes(userRole);
    });
  }, [userRole]);

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`fixed top-3 left-3 z-50 md:hidden rounded-lg border p-2 shadow-sm transition-colors ${
          isDark
            ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
            : "bg-white border-slate-200 hover:bg-slate-50"
        }`}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {collapsed && (
        <div
          className={`fixed inset-0 z-30 md:hidden ${isDark ? "bg-black/40" : "bg-black/20"}`}
          onClick={() => setCollapsed(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed z-40 top-0 left-0 h-full w-[240px] border-r
          flex flex-col transition-all duration-300
          md:translate-x-0 md:static md:z-auto
          ${collapsed ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isDark
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
          }
        `}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 px-5 py-5 border-b ${isDark ? "border-slate-700/60" : "border-slate-100"}`}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm">
            <Zap className="text-white" size={18} />
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-bold leading-tight ${isDark ? "text-slate-100" : "text-slate-800"}`}>
              ConnectAI
            </span>
            <span className={`text-[11px] leading-tight ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Communication Platform
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setCollapsed(false)}
              className={() =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive(item.to)
                    ? isDark
                      ? "bg-blue-500/15 text-blue-400 border-l-3 border-blue-500"
                      : "bg-blue-50 text-blue-700 border-l-3 border-blue-600"
                    : isDark
                      ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <item.icon size={18} className={
                isActive(item.to)
                  ? isDark ? "text-blue-400" : "text-blue-600"
                  : isDark ? "text-slate-500" : "text-slate-400"
              } />
              {t(item.key) || item.fallback}
            </NavLink>
          ))}
        </nav>

        {/* User area & Logout */}
        <div className={`px-4 py-3 border-t flex items-center justify-between gap-2 ${isDark ? "border-slate-700/60" : "border-slate-100"}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : profile.avatarInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-xs font-semibold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                {user?.full_name || profile.fullName}
              </span>
              <span className={`text-[10px] font-medium truncate uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {user?.role || profile.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              isDark
                ? "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            }`}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}

