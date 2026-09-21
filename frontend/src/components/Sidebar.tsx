import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
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
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/campaigns", icon: Megaphone, label: "Campaigns" },
  { to: "/audience", icon: Users, label: "Audience" },
  { to: "/content-templates", icon: FileText, label: "Content & Templates" },
  { to: "/channels", icon: Radio, label: "Channels" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/reports", icon: ClipboardList, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-3 left-3 z-50 md:hidden rounded-lg bg-white border border-slate-200 p-2 shadow-sm hover:bg-slate-50 transition-colors"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setCollapsed(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed z-40 top-0 left-0 h-full w-[240px] bg-white border-r border-slate-200
          flex flex-col transition-transform duration-200
          md:translate-x-0 md:static md:z-auto
          ${collapsed ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm">
            <Zap className="text-white" size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 leading-tight">
              ConnectAI
            </span>
            <span className="text-[11px] text-slate-400 leading-tight">
              Communication Platform
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setCollapsed(false)}
              className={() =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  isActive(item.to)
                    ? "bg-blue-50 text-blue-700 border-l-3 border-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <item.icon size={18} className={isActive(item.to) ? "text-blue-600" : "text-slate-400"} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User area */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              OS
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-700 truncate">Om Sabitha</span>
              <span className="text-[10px] text-slate-400 truncate">Campaign Manager</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
