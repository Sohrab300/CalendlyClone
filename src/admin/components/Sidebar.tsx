import React from 'react';
import { 
  Calendar, 
  Users, 
  Clock, 
  Zap, 
  LayoutGrid, 
  Route, 
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  onCreateClick?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCreateClick, activeTab, onTabChange }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const menuItems = [
    { icon: LinkIcon, label: 'Scheduling' },
    { icon: Calendar, label: 'Meetings' },
    { icon: Clock, label: 'Availability' },
    { icon: Users, label: 'Contacts' },
  ];

  return (
    <div 
      className={cn(
        "h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        <div 
          onClick={() => onTabChange('Scheduling')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          {!isCollapsed && <span className="text-xl font-bold text-blue-600">Calendly</span>}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-4 mb-6">
        <button 
          onClick={onCreateClick}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all",
            isCollapsed ? "px-0" : "px-4"
          )}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && (
            <>
              <span>Create</span>
              <span className="border-l border-white/30 pl-2 ml-1">
                <ChevronDown className="w-4 h-4" />
              </span>
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
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
};
