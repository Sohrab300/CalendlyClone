import React from 'react';
import { ChevronDown, ChevronRight, ChevronUp, HelpCircle, Search, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const SecuritySettingsPanel: React.FC<{
  events: any[];
  eventSearchTerm: string;
  formData: any;
  onClearSelectedEvents: () => void;
  onEventSearchChange: (value: string) => void;
  onToggleBulkVerification: (enabled: boolean) => void;
  onToggleSelectedEvent: (id: string) => void;
  profile: any;
  securitySubTab: string;
  selectedEventIds: string[];
  setSecuritySubTab: (tab: string) => void;
}> = ({
  events,
  eventSearchTerm,
  formData,
  onClearSelectedEvents,
  onEventSearchChange,
  onToggleBulkVerification,
  onToggleSelectedEvent,
  profile,
  securitySubTab,
  selectedEventIds,
  setSecuritySubTab,
}) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-32">
    <SecuritySubTabs activeTab={securitySubTab} onTabChange={setSecuritySubTab} />

    {securitySubTab === 'Booking' ? (
      <BookingSecurityPanel
        events={events}
        eventSearchTerm={eventSearchTerm}
        formData={formData}
        onClearSelectedEvents={onClearSelectedEvents}
        onEventSearchChange={onEventSearchChange}
        onToggleBulkVerification={onToggleBulkVerification}
        onToggleSelectedEvent={onToggleSelectedEvent}
        profile={profile}
        selectedEventIds={selectedEventIds}
      />
    ) : (
      <BlockedSourcesEmptyState />
    )}
  </div>
);

const SecuritySubTabs: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => (
  <div className="flex items-center gap-8 border-b border-[#f1f5f9] mb-8">
    {['Booking', 'Blocked sources'].map(tab => (
      <button
        key={tab}
        onClick={() => onTabChange(tab)}
        className={cn(
          'pb-3 text-sm font-bold transition-all border-b-2',
          activeTab === tab ? 'border-[#006bff] text-[#1a1a1a]' : 'border-transparent text-[#64748b] hover:text-[#1a1a1a]'
        )}
      >
        {tab}
      </button>
    ))}
  </div>
);

const BookingSecurityPanel: React.FC<{
  events: any[];
  eventSearchTerm: string;
  formData: any;
  onClearSelectedEvents: () => void;
  onEventSearchChange: (value: string) => void;
  onToggleBulkVerification: (enabled: boolean) => void;
  onToggleSelectedEvent: (id: string) => void;
  profile: any;
  selectedEventIds: string[];
}> = ({
  events,
  eventSearchTerm,
  formData,
  onClearSelectedEvents,
  onEventSearchChange,
  onToggleBulkVerification,
  onToggleSelectedEvent,
  profile,
  selectedEventIds,
}) => {
  const filteredEvents = events.filter(event => event.title.toLowerCase().includes(eventSearchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-[#1a1a1a] mb-6">Booking</h3>
          <div className="space-y-2">
            <h4 className="text-[15px] font-bold text-[#1a1a1a]">Require email verification to book</h4>
            <p className="text-[14px] text-[#475569] max-w-2xl leading-relaxed">
              For Event Types with email verification enabled, invitees must confirm their email before completing a booking. <a href="https://calendly.com/help/how-to-require-email-verification-for-event-types" target="_blank" rel="noopener noreferrer" className="text-[#006bff] hover:underline">Learn more</a>
            </p>
          </div>
        </div>

        <div className="relative max-w-[400px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search event types"
            value={eventSearchTerm}
            onChange={(e) => onEventSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#e2e8f0] rounded-lg text-sm text-[#334155] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {selectedEventIds.length > 0 && (
          <BulkVerificationBar
            selectedCount={selectedEventIds.length}
            onClear={onClearSelectedEvents}
            onToggleBulkVerification={onToggleBulkVerification}
          />
        )}

        <EventVerificationTable
          events={filteredEvents}
          formData={formData}
          onToggleSelectedEvent={onToggleSelectedEvent}
          profile={profile}
          selectedEventIds={selectedEventIds}
        />
      </div>
    </div>
  );
};

const BulkVerificationBar: React.FC<{
  selectedCount: number;
  onClear: () => void;
  onToggleBulkVerification: (enabled: boolean) => void;
}> = ({ selectedCount, onClear, onToggleBulkVerification }) => (
  <div className="flex items-center justify-between bg-white border border-[#e2e8f0] rounded-lg p-5 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-4">
        <button onClick={() => onToggleBulkVerification(true)} className="px-[22px] py-3.5 border border-[#1a1a1a] rounded-full text-sm font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors leading-none">
          Enable Verification
        </button>
        <button onClick={() => onToggleBulkVerification(false)} className="px-[22px] py-3.5 border border-[#1a1a1a] rounded-full text-sm font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors leading-none">
          Disable Verification
        </button>
      </div>
      <span className="text-[15px] font-medium text-[#475569]">
        {selectedCount} {selectedCount === 1 ? 'event' : 'events'} selected
      </span>
    </div>
    <button onClick={onClear} className="p-1.5 hover:bg-[#f1f5f9] rounded-full transition-colors">
      <X className="w-9 h-9 text-[#1a1a1a] stroke-[1.5]" />
    </button>
  </div>
);

const EventVerificationTable: React.FC<{
  events: any[];
  formData: any;
  onToggleSelectedEvent: (id: string) => void;
  profile: any;
  selectedEventIds: string[];
}> = ({ events, formData, onToggleSelectedEvent, profile, selectedEventIds }) => (
  <div className="border border-[#e2e8f0] rounded-lg overflow-hidden bg-white">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-white border-b border-[#e2e8f0]">
          <th className="px-5 py-4 w-12" />
          <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]"><SortableHeader label="Name" /></th>
          <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]">
            <div className="flex items-center gap-1.5 cursor-pointer">Verification <ChevronDown className="w-4 h-4 text-[#94a3b8]" /></div>
          </th>
          <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]">Type</th>
          <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]">Owned by</th>
          <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]">Team</th>
          <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]"><SortableHeader label="Last edited" /></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#e2e8f0]">
        {events.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-5 py-12 text-center text-[#64748b] text-sm italic">No event types found.</td>
          </tr>
        ) : events.map(event => (
          <tr key={event.id} className={cn('hover:bg-[#f8fafc] transition-colors group', selectedEventIds.includes(event.id) && 'bg-[#f8fafc]')}>
            <td className="px-5 py-5">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[#cbd5e1] text-[#006bff] focus:ring-[#006bff] cursor-pointer"
                checked={selectedEventIds.includes(event.id)}
                onChange={() => onToggleSelectedEvent(event.id)}
              />
            </td>
            <td className="px-5 py-5">
              <div className="flex items-center gap-3">
                <div
                  className={cn('w-4 h-4 rounded-full flex-shrink-0', !event.color.startsWith('bg-[') && event.color)}
                  style={{ backgroundColor: event.color.startsWith('bg-[') ? event.color.slice(4, -1) : (event.color.startsWith('#') ? event.color : undefined) }}
                />
                <span className="text-sm font-bold text-[#1a1a1a] truncate max-w-[200px]">{event.title}</span>
              </div>
            </td>
            <td className="px-5 py-5 text-[14px] text-[#475569]">{event.require_email_verification ? 'Enabled' : ''}</td>
            <td className="px-5 py-5 text-[14px] text-[#475569]">One-on-One</td>
            <td className="px-5 py-5 text-[14px] text-[#475569] truncate max-w-[120px]">{profile?.full_name || formData.name}</td>
            <td className="px-5 py-5 text-[14px] text-[#475569]" />
            <td className="px-5 py-5 text-[14px] text-[#475569]">
              {event.created_at ? new Date(event.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '18 April 2026'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SortableHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-1.5 cursor-pointer">
    {label}
    <div className="flex flex-col">
      <ChevronUp className="w-3.5 h-3.5 text-[#94a3b8]" />
      <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] -mt-2" />
    </div>
  </div>
);

const BlockedSourcesEmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="w-[140px] h-[140px] mb-8 relative">
      <div className="absolute inset-0 bg-[#f8fafc] rounded-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#006bff]">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#e2e8f0]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
        </div>
      </div>
    </div>
    <h3 className="text-[20px] font-bold text-[#1a1a1a] mb-4">No blocked sources yet</h3>
    <p className="text-[15px] text-[#475569] max-w-[480px] leading-relaxed mb-6">
      Blocking someone uses their identity fingerprint to prevent future interactions, without relying on their email address. You can block people from the 'Meetings' page.
    </p>
    <a href="https://calendly.com/help" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[14px] font-bold text-[#006bff] hover:underline">
      <HelpCircle className="w-4 h-4" />
      Learn more
      <ChevronRight className="w-4 h-4 ml-0.5" />
    </a>
  </div>
);
