import React from "react";
import {
  AlertCircle,
  Copy,
  ExternalLink,
  HelpCircle,
  MoreHorizontal,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { DayAvailability, EventType } from "../../services/availabilityService";
import { AdminProfile, ScheduleOption } from "../types";

const TABS = ["Event types"]; //, 'Single-use links', 'Meeting polls'

interface SchedulingViewProps {
  activeTab: string;
  editingEvent: EventType | null;
  events: EventType[];
  isSidebarOpen: boolean;
  newEventColor: string;
  newEventName: string;
  profile: AdminProfile | null;
  schedules: ScheduleOption[];
  selectedIds: Set<string>;
  weeklyHoursByScheduleId: Record<string, DayAvailability[]>;
  onCopyLink: (event: EventType) => void;
  onCreateClick: () => void;
  onEditEvent: (event: EventType) => void;
  onTabChange: (tab: string) => void;
  onToggleSelection: (id: string) => void;
  onToggleSingleStatus?: (event: EventType) => void;
  onViewLandingPage: () => void;
}

export const SchedulingView: React.FC<SchedulingViewProps> = ({
  activeTab,
  editingEvent,
  events,
  isSidebarOpen,
  newEventColor,
  newEventName,
  profile,
  schedules,
  selectedIds,
  weeklyHoursByScheduleId,
  onCopyLink,
  onCreateClick,
  onEditEvent,
  onTabChange,
  onToggleSelection,
  onToggleSingleStatus,
  onViewLandingPage,
}) => (
  <div className="w-full md:max-w-5xl md:mx-auto">
    <SchedulingHeader onCreateClick={onCreateClick} />
    <SchedulingTabs activeTab={activeTab} onTabChange={onTabChange} />
    <EventTypeSearch />

    <div className="space-y-6">
      <ProfileEventTypeHeader
        profile={profile}
        onViewLandingPage={onViewLandingPage}
      />

      {isSidebarOpen && !editingEvent && (
        <DraftEventCard
          color={newEventColor}
          name={newEventName}
          scheduleSummary={getDefaultScheduleSummary(
            schedules,
            weeklyHoursByScheduleId,
          )}
        />
      )}

      {events.map((event) => (
        <EventTypeCard
          key={event.id}
          event={event}
          isSelected={selectedIds.has(event.id)}
          previewColor={
            editingEvent?.id === event.id ? newEventColor : undefined
          }
          previewTitle={
            editingEvent?.id === event.id ? newEventName : undefined
          }
          scheduleSummary={getEventScheduleSummary(
            event,
            schedules,
            weeklyHoursByScheduleId,
          )}
          onCopyLink={onCopyLink}
          onEditEvent={onEditEvent}
          onToggleSelection={onToggleSelection}
          onToggleSingleStatus={onToggleSingleStatus}
        />
      ))}
    </div>
  </div>
);

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const normalizeTimeToMinutes = (value: string) => {
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];

  if (meridiem === "pm" && hours !== 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const formatMinutes = (value: number) => {
  const rounded = Math.round(value / 5) * 5;
  const hours24 = Math.floor(rounded / 60) % 24;
  const minutes = rounded % 60;
  const meridiem = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 || 12;

  return minutes === 0
    ? `${hours12} ${meridiem}`
    : `${hours12}:${minutes.toString().padStart(2, "0")} ${meridiem}`;
};

const summarizeDays = (days: number[]) => {
  const uniqueDays = [...new Set(days)].sort((a, b) => a - b);
  const key = uniqueDays.join(",");

  if (key === "1,2,3,4,5") return "Weekdays";
  if (key === "0,6") return "Weekends";
  if (key === "0,1,2,3,4,5,6") return "Every day";

  return uniqueDays.map((day) => DAY_LABELS[day]).join(", ");
};

const summarizeWeeklyHours = (weeklyHours?: DayAvailability[] | null) => {
  const slots = (weeklyHours || []).flatMap((day) =>
    day.enabled
      ? (day.slots || []).map((slot) => ({
          dayIndex: day.day_index,
          start: normalizeTimeToMinutes(slot.start),
          end: normalizeTimeToMinutes(slot.end),
        }))
      : [],
  );
  const validSlots = slots.filter(
    (slot): slot is { dayIndex: number; start: number; end: number } =>
      slot.start !== null && slot.end !== null,
  );

  if (validSlots.length === 0) return "No availability set";

  const averageStart =
    validSlots.reduce((total, slot) => total + slot.start, 0) /
    validSlots.length;
  const averageEnd =
    validSlots.reduce((total, slot) => total + slot.end, 0) / validSlots.length;

  return `${summarizeDays(validSlots.map((slot) => slot.dayIndex))}, ${formatMinutes(
    averageStart,
  )} - ${formatMinutes(averageEnd)}`;
};

const getDefaultScheduleSummary = (
  schedules: ScheduleOption[],
  weeklyHoursByScheduleId: Record<string, DayAvailability[]>,
) => {
  const schedule = schedules.find((item) => item.is_active) || schedules[0];
  return summarizeWeeklyHours(
    schedule ? weeklyHoursByScheduleId[schedule.id] : null,
  );
};

const getEventScheduleSummary = (
  event: EventType,
  schedules: ScheduleOption[],
  weeklyHoursByScheduleId: Record<string, DayAvailability[]>,
) => {
  if (event.use_custom_schedule) {
    return summarizeWeeklyHours(
      event.custom_weekly_hours as DayAvailability[] | null,
    );
  }

  const schedule =
    schedules.find((item) => item.id === event.schedule_id) ||
    schedules.find((item) => item.is_active) ||
    schedules[0];

  return summarizeWeeklyHours(
    schedule ? weeklyHoursByScheduleId[schedule.id] : null,
  );
};

const SchedulingHeader: React.FC<{ onCreateClick: () => void }> = ({
  onCreateClick,
}) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-bold">Scheduling</h1>
      <HelpCircle className="w-4 h-5 md:w-5 md:h-5 text-slate-400 cursor-pointer" />
    </div>
    <button
      onClick={onCreateClick}
      className="bg-blue-600 text-white max-md:text-sm px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
    >
      <Plus className="w-4 h-5 md:w-5 md:h-5" />
      <span>Create</span>
      <span className="border-l border-white/30 pl-2 ml-1">
        <svg
          className="w-3 h-3 md:w-4 md:h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
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
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "pb-4 text-sm font-bold transition-all relative",
            activeTab === tab
              ? "text-blue-600"
              : "text-slate-500 hover:text-slate-800",
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
          (profile?.full_name?.[0] || "S").toUpperCase()
        )}
      </div>
      <span className="font-bold text-slate-800">
        {profile?.full_name || "Sohrab sheikh"}
      </span>
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

const getStyleAndClassForColor = (colorStr?: string) => {
  if (!colorStr) return { className: "bg-blue-600" };
  if (colorStr.startsWith("bg-[")) {
    return { style: { backgroundColor: colorStr.slice(4, -1) } };
  }
  if (colorStr.startsWith("#") || colorStr.startsWith("rgb")) {
    return { style: { backgroundColor: colorStr } };
  }
  if (colorStr.startsWith("bg-")) {
    return { className: colorStr };
  }
  return { style: { backgroundColor: colorStr } };
};

const DraftEventCard: React.FC<{
  color: string;
  name: string;
  scheduleSummary: string;
}> = ({ color, name, scheduleSummary }) => {
  const colorProps = getStyleAndClassForColor(color);
  return (
    <div className="bg-blue-50/50 border border-blue-200 rounded-lg shadow-sm overflow-hidden flex animate-in fade-in slide-in-from-top-2 duration-300">
      <div
        className={cn("w-2 shrink-0", colorProps.className)}
        style={colorProps.style}
      />
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
              <p className="text-sm text-slate-500">{scheduleSummary}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventTypeCard: React.FC<{
  event: EventType;
  isSelected: boolean;
  previewColor?: string;
  previewTitle?: string;
  scheduleSummary: string;
  onCopyLink: (event: EventType) => void;
  onEditEvent: (event: EventType) => void;
  onToggleSelection: (id: string) => void;
  onToggleSingleStatus?: (event: EventType) => void;
}> = ({
  event,
  isSelected,
  previewColor,
  previewTitle,
  scheduleSummary,
  onCopyLink,
  onEditEvent,
  onToggleSelection,
  onToggleSingleStatus,
}) => {
  const displayColor = previewColor || event.color;
  const displayTitle = previewTitle || event.title;
  const colorProps = getStyleAndClassForColor(displayColor);
  const isOff = event.is_active === false;

  return (
    <div
      onClick={() => onEditEvent(event)}
      className={cn(
        "bg-white border rounded-lg shadow-sm overflow-hidden flex hover:shadow-md transition-all cursor-pointer group",
        isSelected ? "border-blue-600 bg-blue-50/30" : "border-slate-200",
        isOff && "opacity-80 bg-slate-50/50",
      )}
    >
      <div
        className={cn("w-2 shrink-0", colorProps.className, isOff && "opacity-50")}
        style={colorProps.style}
      />
      <div className="flex-1 p-4 md:p-6">
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
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {displayTitle}
                </h3>
                {isOff && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 rounded-full">
                    Off (Hidden)
                  </span>
                )}
              </div>
              <p className="text-[12px] md:text-sm text-slate-500 mb-1">
                {event.duration} min • {event.location} • {event.type}
              </p>
              <p className="text-sm text-slate-500">{scheduleSummary}</p>
            </div>
          </div>
          <div
            className="flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {onToggleSingleStatus && (
              <button
                type="button"
                onClick={() => onToggleSingleStatus(event)}
                title={isOff ? "Turn event ON" : "Turn event OFF (Hide from landing page)"}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-bold transition-colors",
                  isOff
                    ? "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
                )}
              >
                {isOff ? (
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                ) : (
                  <ToggleRight className="w-4 h-4 text-blue-600" />
                )}
                <span>{isOff ? "OFF" : "ON"}</span>
              </button>
            )}

            <button
              onClick={() => onCopyLink(event)}
              className="flex items-center gap-2 px-2 py-1 md:px-4 md:py-2 border border-slate-200 rounded-full text-[12px] md:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
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
};
