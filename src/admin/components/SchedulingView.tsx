import React from 'react';
import {
  AlertCircle,
  Copy,
  ExternalLink,
  HelpCircle,
  MoreHorizontal,
  Plus,
  Search,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { EventType } from '../../services/availabilityService';
import { AdminProfile } from '../types';

const TABS = ['Event types', 'Single-use links', 'Meeting polls'];

interface SchedulingViewProps {
  activeTab: string;
  events: EventType[];
  isSidebarOpen: boolean;
  newEventColor: string;
  newEventName: string;
  profile: AdminProfile | null;
  selectedIds: Set<string>;
  onCopyLink: (event: EventType) => void;
  onCreateClick: () => void;
  onEditEvent: (event: EventType) => void;
  onTabChange: (tab: string) => void;
  onToggleSelection: (id: string) => void;
  onViewLandingPage: () => void;
}

export const SchedulingView: React.FC<SchedulingViewProps> = ({
  activeTab,
  events,
  isSidebarOpen,
  newEventColor,
  newEventName,
  profile,
  selectedIds,
  onCopyLink,
  onCreateClick,
  onEditEvent,
  onTabChange,
  onToggleSelection,
  onViewLandingPage,
}) => (
  <div className="max-w-5xl mx-auto">
    <SchedulingHeader onCreateClick={onCreateClick} />
    <SchedulingTabs activeTab={activeTab} onTabChange={onTabChange} />
    <EventTypeSearch />

    <div className="space-y-6">
      <ProfileEventTypeHeader profile={profile} onViewLandingPage={onViewLandingPage} />

      {isSidebarOpen && (
        <DraftEventCard color={newEventColor} name={newEventName} />
      )}

      {events.map(event => (
        <EventTypeCard
          key={event.id}
          event={event}
          isSelected={selectedIds.has(event.id)}
          onCopyLink={onCopyLink}
          onEditEvent={onEditEvent}
          onToggleSelection={onToggleSelection}
        />
      ))}
    </div>
  </div>
);

const SchedulingHeader: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-bold">Scheduling</h1>
      <HelpCircle className="w-5 h-5 text-slate-400 cursor-pointer" />
    </div>
    <button
      onClick={onCreateClick}
      className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
    >
      <Plus className="w-5 h-5" />
      <span>Create</span>
      <span className="border-l border-white/30 pl-2 ml-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </button>
  </div>
);

const SchedulingTabs: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => (
  <div className="border-b border-slate-200 mb-6">
    <div className="flex gap-8">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            'pb-4 text-sm font-bold transition-all relative',
            activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          {tab}
          {activeTab === tab && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      ))}
    </div>
  </div>
);

const EventTypeSearch = () => (
  <div className="mb-8">
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder="Search event types"
        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
      />
    </div>
  </div>
);

const ProfileEventTypeHeader: React.FC<{
  profile: AdminProfile | null;
  onViewLandingPage: () => void;
}> = ({ profile, onViewLandingPage }) => (
  <div className="flex items-center justify-between py-6 border-b border-slate-100">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold overflow-hidden">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          (profile?.full_name?.[0] || 'S').toUpperCase()
        )}
      </div>
      <span className="font-bold text-slate-800">{profile?.full_name || 'Sohrab sheikh'}</span>
    </div>
    <div className="flex items-center gap-4">
      <button
        onClick={onViewLandingPage}
        className="text-blue-600 text-sm font-bold flex items-center gap-2 hover:underline"
      >
        <ExternalLink className="w-4 h-4" />
        View landing page
      </button>
      <div className="w-px h-4 bg-slate-200" />
      <MoreHorizontal className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600" />
    </div>
  </div>
);

const DraftEventCard: React.FC<{ color: string; name: string }> = ({ color, name }) => (
  <div className="bg-blue-50/50 border border-blue-200 rounded-lg shadow-sm overflow-hidden flex animate-in fade-in slide-in-from-top-2 duration-300">
    <div className="w-2" style={{ backgroundColor: color }} />
    <div className="flex-1 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            disabled
            className="mt-1.5 w-4 h-4 rounded border-slate-300 text-blue-600 opacity-50"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{name}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <AlertCircle className="w-4 h-4 text-orange-500 fill-orange-500 text-white" />
              <span>30 min • No location set • One-on-One</span>
            </div>
            <p className="text-sm text-slate-500">Weekdays, 9 am - 5 pm</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const EventTypeCard: React.FC<{
  event: EventType;
  isSelected: boolean;
  onCopyLink: (event: EventType) => void;
  onEditEvent: (event: EventType) => void;
  onToggleSelection: (id: string) => void;
}> = ({ event, isSelected, onCopyLink, onEditEvent, onToggleSelection }) => (
  <div
    onClick={() => onEditEvent(event)}
    className={cn(
      'bg-white border rounded-lg shadow-sm overflow-hidden flex hover:shadow-md transition-all cursor-pointer group',
      isSelected ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200'
    )}
  >
    <div
      className={cn('w-2', !event.color.startsWith('bg-[') && event.color)}
      style={{ backgroundColor: event.color.startsWith('bg-[') ? event.color.slice(4, -1) : undefined }}
    />
    <div className="flex-1 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelection(event.id);
            }}
            className="mt-1.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
              {event.title}
            </h3>
            <p className="text-sm text-slate-500 mb-1">
              {event.duration} min • {event.location} • {event.type}
            </p>
            <p className="text-sm text-slate-500">Weekdays, 9 am - 5 pm</p>
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onCopyLink(event)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy link
          </button>
          <div className="w-px h-6 bg-slate-200" />
          <MoreHorizontal className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600" />
        </div>
      </div>
    </div>
  </div>
);
