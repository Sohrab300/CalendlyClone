import React from 'react';
import { cn } from '../../../lib/utils';

export const CommunicationSettingsPanel: React.FC<{
  onToggleNotifications: (enabled: boolean) => void;
  profile: any;
}> = ({ onToggleNotifications, profile }) => {
  const enabled = profile?.host_notifications_enabled ?? true;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-10">
        <div>
          <h3 className="text-sm font-bold text-[#1a1a1a] mb-5">Email notifications when added to event types</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onToggleNotifications(!enabled)}
              className={cn(
                'w-[46px] h-[26px] rounded-full transition-all relative flex items-center px-1 duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                enabled ? 'bg-[#006bff]' : 'bg-[#e2e8f0]'
              )}
            >
              <div className={cn('w-[18px] h-[18px] bg-white rounded-full transition-transform shadow-md transform', enabled ? 'translate-x-[20px]' : 'translate-x-0')} />
            </button>
            <p className="text-[15px] font-medium text-[#475569]">Receive an email when someone adds you as a host to an event type</p>
          </div>
        </div>
      </div>

      <p className="text-[14px] text-[#64748b] pt-4 border-t border-[#f1f5f9]">Your changes to this page are saved automatically.</p>
    </div>
  );
};
