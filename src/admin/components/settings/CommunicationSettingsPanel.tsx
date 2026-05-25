import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const CommunicationSettingsPanel: React.FC<{
  onConnectGoogle: () => void;
  onToggleNotifications: (enabled: boolean) => void;
  profile: any;
}> = ({ onConnectGoogle, onToggleNotifications, profile }) => {
  const enabled = profile?.host_notifications_enabled ?? true;
  const isGoogleConnected = Boolean(profile?.google_refresh_token);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-10">
        <div>
          <h3 className="text-sm font-bold text-[#1a1a1a] mb-5">Google Calendar connection</h3>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
            <div className="flex items-start justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-[#1a1a1a]">
                    {isGoogleConnected ? 'Google connected' : 'Google not connected'}
                  </p>
                  {isGoogleConnected && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
                <p className="max-w-xl text-[14px] leading-relaxed text-[#475569]">
                  Connect Google so DevSchedule can create Calendar events,
                  generate Google Meet links, and send booking notifications
                  from your account.
                </p>
              </div>
              <button
                type="button"
                onClick={onConnectGoogle}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition',
                  isGoogleConnected
                    ? 'border border-[#cbd5e1] text-[#334155] hover:bg-[#f8fafc]'
                    : 'bg-[#006bff] text-white hover:bg-[#0052cc]'
                )}
              >
                <ExternalLink className="h-4 w-4" />
                {isGoogleConnected ? 'Reconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </div>

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
