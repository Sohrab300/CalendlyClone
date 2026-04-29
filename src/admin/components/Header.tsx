import React from 'react';
import { User, ChevronDown, Bell, Star, Link2, Settings2, LogOut, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAdminLogout } from '../hooks/useAdminLogout';

interface HeaderProps {
  onNavigateToSettings: (tab?: string) => void;
  profile?: any;
  variant?: 'default' | 'settings';
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToSettings, profile, variant = 'default' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const handleLogout = useAdminLogout();
  const isSettings = variant === 'settings';

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={cn(
      'bg-white flex items-center justify-end gap-6 sticky top-0 z-[100]',
      isSettings ? 'h-20 px-11' : 'h-16 px-8 border-b border-slate-200'
    )}>
      <div className={cn('flex items-center', isSettings ? 'gap-6' : 'gap-4')}>
        <button className={cn('hover:bg-slate-100 rounded-full transition-colors relative', isSettings ? 'p-0' : 'p-2')}>
          {isSettings ? (
            <UserPlus className="w-5 h-5 text-[#0b1f3a]" />
          ) : (
            <>
              <Bell className="w-5 h-5 text-slate-600" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </>
          )}
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className={cn('flex items-center cursor-pointer hover:bg-slate-50 rounded-lg transition-colors', isSettings ? 'gap-4 p-0' : 'gap-2 p-1')}
          >
            <div className={cn(
              'rounded-full flex items-center justify-center font-bold overflow-hidden',
              isSettings
                ? 'w-11 h-11 bg-[#eef3fb] text-[#0b1f3a] text-[15px]'
                : 'w-8 h-8 bg-blue-600 text-white text-xs ring-2 ring-blue-100 ring-offset-2'
            )}>
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                (profile?.full_name?.[0] || 'S').toUpperCase()
              )}
            </div>
            <ChevronDown className={cn(isSettings ? 'w-4 h-4 text-[#0b1f3a]' : 'w-4 h-4 text-slate-400', 'transition-transform', isOpen && 'rotate-180')} />
          </div>

          {isOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Profile Info */}
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-[17px] font-bold text-slate-900 mb-1">{profile?.full_name || 'Sohrab sheikh'}</h3>
              </div>

              {/* Account Settings Section */}
              <div className="p-2 border-b border-slate-100">
                <p className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Account settings</p>
                <div className="space-y-0.5">
                  <button 
                    onClick={() => {
                      onNavigateToSettings('Profile');
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
                  >
                    <User className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    <span>Profile</span>
                  </button>
                  <button 
                    onClick={() => {
                      onNavigateToSettings('Branding');
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
                  >
                    <Star className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    <span>Branding</span>
                  </button>
                  <button 
                    onClick={() => {
                      onNavigateToSettings('My Link');
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
                  >
                    <Link2 className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    <span>My Link</span>
                  </button>
                  <button 
                    onClick={() => {
                      onNavigateToSettings();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-lg transition-colors group"
                  >
                    <Settings2 className="w-4 h-4 text-slate-400" />
                    <span>All settings</span>
                  </button>
                </div>
              </div>

              {/* Visit / Logout */}
              <div className="p-2 bg-slate-50/50">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors group"
                >
                  <LogOut className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
