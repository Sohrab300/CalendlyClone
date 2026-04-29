import React from "react";
import {
  Calendar,
  Users,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAdminLogout } from "../hooks/useAdminLogout";

interface SidebarProps {
  onCreateClick?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCreateClick,
  activeTab,
  onTabChange,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const handleLogout = useAdminLogout();

  const menuItems = [
    { icon: LinkIcon, label: "Scheduling" },
    { icon: Calendar, label: "Meetings" },
    { icon: Clock, label: "Availability" },
    { icon: Users, label: "Contacts" },
  ];

  return (
    <div
      className={cn(
        "h-screen shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="p-6 flex items-center justify-between">
        <div
          onClick={() => onTabChange("Scheduling")}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-blue-600">Calendly</span>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1 hover:bg-slate-100 rounded-lg transition-colors`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="px-4 mb-6">
        <button
          onClick={onCreateClick}
          className={cn(
            "w-full flex items-center justify-center text-[14px] gap-2 py-2 rounded-full hover:bg-blue-50 transition-al border border-black",
            isCollapsed ? "px-0" : "px-4",
          )}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && (
            <>
              <span>Create</span>
            </>
          )}
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => onTabChange(item.label)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all",
              activeTab === item.label
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="px-2 py-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0 text-slate-400" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};
