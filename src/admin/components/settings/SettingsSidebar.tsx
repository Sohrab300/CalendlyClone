import React from 'react';
import {
  Bell,
  ChevronLeft,
  Link2,
  LogOut,
  Shield,
  Star,
  User,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useAdminLogout } from '../../hooks/useAdminLogout';

interface SettingsSidebarProps {
  activeTab: string;
  onBack: () => void;
  onTabChange: (tab: string) => void;
}

const ACCOUNT_ITEMS = [
  { icon: User, label: 'Profile' },
  { icon: Star, label: 'Branding' },
  { icon: Link2, label: 'My Link' },
  { icon: Bell, label: 'Communication settings' },
  { icon: Shield, label: 'Security' },
];

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onBack, onTabChange }) => {
  const handleLogout = useAdminLogout();

  return (
    <div className="w-[280px] border-r border-[#f1f5f9] flex flex-col p-6 overflow-y-auto bg-white shrink-0">
      <div onClick={onBack} className="flex items-center gap-2 mb-8 cursor-pointer group">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
          <span className="text-white font-bold text-xl">C</span>
        </div>
        <span className="text-xl font-bold text-blue-600">Calendly</span>
      </div>

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#006bff] hover:text-[#0052cc] text-[14px] font-bold mb-10 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to home
      </button>

      <h2 className="text-[15px] font-bold text-[#1a1a1a] mb-8">Account settings</h2>

      <div className="space-y-1.5 flex-1">
        <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] px-4 mb-3">Account</p>
        {ACCOUNT_ITEMS.map(item => (
          <SettingsSidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={activeTab === item.label}
            onClick={() => onTabChange(item.label)}
          />
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-[#f1f5f9]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-[#475569] hover:text-[#1a1a1a] text-sm font-semibold transition-colors group w-full"
        >
          <LogOut className="w-[18px] h-[18px] text-[#94a3b8] group-hover:text-[#475569]" />
          <span className="flex-1 text-left">Logout</span>
        </button>
      </div>
    </div>
  );
};

const SettingsSidebarItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors',
      isActive ? 'bg-blue-50 text-blue-700' : 'text-[#475569] hover:bg-[#f8fafc] hover:text-[#1e293b]'
    )}
  >
    <Icon className={cn('w-[18px] h-[18px]', isActive ? 'text-blue-700' : 'text-[#94a3b8]')} />
    <span>{label}</span>
  </button>
);
