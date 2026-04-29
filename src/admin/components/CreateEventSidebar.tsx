import React from "react";
import {
  X,
  ChevronDown,
  Clock,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  ChevronUp,
  Plus,
  AlignLeft,
  Zap,
  DollarSign,
  Bell,
  CheckSquare,
  ChevronLeft,
  CalendarClock,
  Settings2,
  FileText,
  CircleDollarSign,
  ExternalLink,
  Trash2,
  GripVertical,
  Info,
  Lock,
  Mail,
  MessageSquare,
  MoreVertical,
  ChevronRight,
  Pencil,
  RefreshCw,
  Copy,
  List,
  Search,
  Check,
  PlusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isToday,
  parseISO,
  isSameMonth,
  isBefore,
} from "date-fns";
import { cn } from "../../lib/utils";
import ReactQuill from "react-quill-new";
import { toast } from "sonner";
import {
  availabilityService,
  CustomQuestion,
  ConfirmationLink,
  DayAvailability,
  formatTime,
  TimeSlot,
  parseTime,
} from "../../services/availabilityService";
import { TimePicker } from "./TimePicker";

const DAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const INITIAL_AVAILABILITY: DayAvailability[] = [
  { day_index: 0, enabled: false, slots: [] },
  {
    day_index: 1,
    enabled: true,
    slots: [{ id: "1", start: "9:00am", end: "5:00pm" }],
  },
  {
    day_index: 2,
    enabled: true,
    slots: [{ id: "2", start: "9:00am", end: "5:00pm" }],
  },
  {
    day_index: 3,
    enabled: true,
    slots: [{ id: "3", start: "9:00am", end: "5:00pm" }],
  },
  {
    day_index: 4,
    enabled: true,
    slots: [{ id: "4", start: "9:00am", end: "5:00pm" }],
  },
  {
    day_index: 5,
    enabled: true,
    slots: [{ id: "5", start: "9:00am", end: "5:00pm" }],
  },
  { day_index: 6, enabled: false, slots: [] },
];

interface CreateEventSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  setEventName: (name: string) => void;
  eventColor: string;
  setEventColor: (color: string) => void;
  onCreate: (data: {
    title: string;
    duration: number;
    color: string;
    schedule_id: string | null;
    description?: string;
    buffer_before?: number;
    buffer_after?: number;
    meeting_limit_count?: number;
    meeting_limit_period?: string;
    slug?: string;
    time_increment?: number;
    timezone_display?: "detect" | "lock";
    invitee_detail_type?: "name_email" | "first_last_email";
    autofill_enabled?: boolean;
    allow_guests?: boolean;
    questions?: CustomQuestion[];
    confirmation_type?: "display" | "redirect";
    confirmation_links?: ConfirmationLink[];
    date_range_kind?: "relative" | "range" | "indefinite";
    date_range_value?: number;
    date_range_type?: "calendar_days" | "weekdays";
    date_range_start?: string;
    date_range_end?: string;
    minimum_notice?: number;
    use_custom_schedule?: boolean;
    custom_weekly_hours?: any[];
    custom_date_overrides?: any[];
  }) => void;
  schedules: { id: string; name: string; is_active: boolean }[];
  editingEvent?: any;
  profile?: any;
  onNavigateToAvailability?: (scheduleId: string) => void;
}

const COLORS = [
  { name: "Red", value: "#FF471A" },
  { name: "Light pink", value: "#FF6680" },
  { name: "Magenta", value: "#E600E6" },
  { name: "Violet", value: "#8247E5" },
  { name: "Blue", value: "#0066FF" },
  { name: "Cyan", value: "#00E6E6" },
  { name: "Lime green", value: "#1AE61A" },
  { name: "Electric lime", value: "#BFFF00" },
  { name: "Bright yellow", value: "#FFD700" },
  { name: "Orange", value: "#FF9900" },
];

export const CreateEventSidebar: React.FC<CreateEventSidebarProps> = ({
  isOpen,
  onClose,
  eventName,
  setEventName,
  eventColor,
  setEventColor,
  onCreate,
  schedules,
  editingEvent,
  profile,
  onNavigateToAvailability,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = React.useState(false);
  const [expandedSection, setExpandedSection] = React.useState<string | null>(
    "",
  );
  const [duration, setDuration] = React.useState(() => {
    if (!editingEvent) return "30 min";
    const d = editingEvent.duration;
    if (d === 15) return "15 min";
    if (d === 30) return "30 min";
    if (d === 45) return "45 min";
    if (d === 60) return "1 hr";
    return "Custom";
  });
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] =
    React.useState(false);
  const [isCustomUnitDropdownOpen, setIsCustomUnitDropdownOpen] =
    React.useState(false);
  const [customValue, setCustomValue] = React.useState(() => {
    if (!editingEvent) return "";
    const d = editingEvent.duration;
    if ([15, 30, 45, 60].includes(d)) return "";
    return d >= 60 && d % 60 === 0 ? (d / 60).toString() : d.toString();
  });
  const [customUnit, setCustomUnit] = React.useState(() => {
    if (!editingEvent) return "min";
    const d = editingEvent.duration;
    if ([15, 30, 45, 60].includes(d)) return "min";
    return d >= 60 && d % 60 === 0 ? "hr" : "min";
  });
  const [showMoreOptions, setShowMoreOptions] = React.useState(false);

  const activeSchedule =
    schedules.find((s) => s.is_active) ||
    (schedules.length > 0
      ? schedules[0]
      : { id: "", name: "Working hours (default)" });
  const [selectedScheduleId, setSelectedScheduleId] = React.useState(
    editingEvent?.schedule_id || activeSchedule.id,
  );
  const [isScheduleDropdownOpen, setIsScheduleDropdownOpen] =
    React.useState(false);

  const [description, setDescription] = React.useState(
    editingEvent?.description || "",
  );
  const [bufferBefore, setBufferBefore] = React.useState(
    editingEvent?.buffer_before || 0,
  );
  const [bufferAfter, setBufferAfter] = React.useState(
    editingEvent?.buffer_after || 0,
  );
  const [meetingLimitCount, setMeetingLimitCount] = React.useState<
    number | null
  >(editingEvent?.meeting_limit_count ?? null);
  const [meetingLimitPeriod, setMeetingLimitPeriod] = React.useState(
    editingEvent?.meeting_limit_period || "day",
  );
  const [showBufferSettings, setShowBufferSettings] = React.useState(
    !!(editingEvent?.buffer_before || editingEvent?.buffer_after),
  );
  const [showLimitSettings, setShowLimitSettings] = React.useState(
    editingEvent?.meeting_limit_count !== null &&
      editingEvent?.meeting_limit_count !== undefined,
  );
  const [activeBufferDropdown, setActiveBufferDropdown] = React.useState<
    "before" | "after" | null
  >(null);
  const [isLimitPeriodDropdownOpen, setIsLimitPeriodDropdownOpen] =
    React.useState(false);

  const [slug, setSlug] = React.useState(editingEvent?.slug || "");
  const [timeIncrement, setTimeIncrement] = React.useState(
    editingEvent?.time_increment || 30,
  );
  const [timezoneDisplay, setTimezoneDisplay] = React.useState<
    "detect" | "lock"
  >(editingEvent?.timezone_display || "detect");
  const [isIncrementDropdownOpen, setIsIncrementDropdownOpen] =
    React.useState(false);

  const [inviteeDetailType, setInviteeDetailType] = React.useState<
    "name_email" | "first_last_email"
  >(editingEvent?.invitee_detail_type || "name_email");
  const [autofillEnabled, setAutofillEnabled] = React.useState(
    editingEvent?.autofill_enabled ?? true,
  );
  const [allowGuests, setAllowGuests] = React.useState(
    editingEvent?.allow_guests || false,
  );
  const [questions, setQuestions] = React.useState<CustomQuestion[]>(
    editingEvent?.questions || [],
  );

  const [useCustomSchedule, setUseCustomSchedule] = React.useState(
    editingEvent?.use_custom_schedule || false,
  );
  const [customWeeklyHours, setCustomWeeklyHours] = React.useState<
    DayAvailability[]
  >(editingEvent?.custom_weekly_hours || INITIAL_AVAILABILITY);
  const [customDateOverrides, setCustomDateOverrides] = React.useState<any[]>(
    editingEvent?.custom_date_overrides || [],
  );
  const [openPicker, setOpenPicker] = React.useState<{
    dayIndex: number | "modal";
    slotId: string;
    type: "start" | "end";
  } | null>(null);
  const [copyingFrom, setCopyingFrom] = React.useState<number | null>(null);
  const [selectedCopyDays, setSelectedCopyDays] = React.useState<Set<number>>(
    new Set(),
  );
  const [isOverrideModalOpen, setIsOverrideModalOpen] = React.useState(false);
  const [modalSelectedDates, setModalSelectedDates] = React.useState<Date[]>(
    [],
  );
  const [modalSlots, setModalSlots] = React.useState<TimeSlot[]>([
    { id: "1", start: "9:00am", end: "5:00pm" },
  ]);
  const [overrideSearchQuery, setOverrideSearchQuery] = React.useState("");
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const toggleDay = (index: number) => {
    const newAvailability = [...customWeeklyHours];
    newAvailability[index].enabled = !newAvailability[index].enabled;
    if (
      newAvailability[index].enabled &&
      newAvailability[index].slots.length === 0
    ) {
      newAvailability[index].slots = [
        {
          id: Math.random().toString(36).substr(2, 9),
          start: "9:00am",
          end: "5:00pm",
        },
      ];
    }
    setCustomWeeklyHours(newAvailability);
  };

  const addSlot = (dayIndex: number) => {
    const newAvailability = [...customWeeklyHours];
    const day = newAvailability[dayIndex];

    if (!day.enabled) {
      day.enabled = true;
      day.slots = [
        {
          id: Math.random().toString(36).substr(2, 9),
          start: "9:00am",
          end: "5:00pm",
        },
      ];
    } else {
      const lastSlot = day.slots[day.slots.length - 1];
      const startMinutes = parseTime(lastSlot.end) + 60;
      const endMinutes = startMinutes + 60;

      const newSlot = {
        id: Math.random().toString(36).substr(2, 9),
        start: formatTime(startMinutes),
        end: formatTime(endMinutes),
      };
      day.slots.push(newSlot);
    }
    setCustomWeeklyHours(newAvailability);
  };

  const removeSlot = (dayIndex: number, slotId: string) => {
    const newAvailability = [...customWeeklyHours];
    newAvailability[dayIndex].slots = newAvailability[dayIndex].slots.filter(
      (s) => s.id !== slotId,
    );
    if (newAvailability[dayIndex].slots.length === 0) {
      newAvailability[dayIndex].enabled = false;
    }
    setCustomWeeklyHours(newAvailability);
  };

  const updateSlot = (
    dayIndex: number | "modal",
    slotId: string,
    type: "start" | "end",
    time: string,
  ) => {
    if (dayIndex === "modal") {
      setModalSlots((prev) =>
        prev.map((s) => {
          if (s.id === slotId) {
            const updated = { ...s, [type]: time };
            if (
              type === "start" &&
              parseTime(updated.start) >= parseTime(updated.end)
            ) {
              updated.end = formatTime(parseTime(updated.start) + 60);
            }
            return updated;
          }
          return s;
        }),
      );
      return;
    }
    const newAvailability = [...customWeeklyHours];
    const slot = newAvailability[dayIndex].slots.find((s) => s.id === slotId);
    if (slot) {
      slot[type] = time;
      if (type === "start" && parseTime(slot.start) >= parseTime(slot.end)) {
        slot.end = formatTime(parseTime(slot.start) + 60);
      }
    }
    setCustomWeeklyHours(newAvailability);
  };

  const copyDay = (dayIndex: number) => {
    setCopyingFrom(dayIndex);
    setSelectedCopyDays(new Set());
  };

  const applyCopy = () => {
    if (copyingFrom === null) return;

    const sourceSlots = customWeeklyHours[copyingFrom].slots;
    const newAvailability = [...customWeeklyHours];

    selectedCopyDays.forEach((targetIndex) => {
      if (targetIndex === copyingFrom) return;
      newAvailability[targetIndex].enabled = true;
      newAvailability[targetIndex].slots = sourceSlots.map((slot) => ({
        ...slot,
        id: Math.random().toString(36).substr(2, 9),
      }));
    });

    setCustomWeeklyHours(newAvailability);
    setCopyingFrom(null);
  };

  const toggleModalDate = (date: Date) => {
    const exists = modalSelectedDates.find((d) => isSameDay(d, date));
    if (exists) {
      setModalSelectedDates((prev) => prev.filter((d) => !isSameDay(d, date)));
    } else {
      setModalSelectedDates((prev) =>
        [...prev, date].sort((a, b) => a.getTime() - b.getTime()),
      );
    }
  };

  const applyOverride = () => {
    if (modalSelectedDates.length === 0) return;
    const newOverride = {
      id: Math.random().toString(36).substr(2, 9),
      dates: modalSelectedDates.map((d) => d.toISOString()),
      slots: [...modalSlots],
    };
    setCustomDateOverrides((prev) => [...prev, newOverride]);
    setIsOverrideModalOpen(false);
    setModalSelectedDates([]);
    setModalSlots([{ id: "1", start: "9:00am", end: "5:00pm" }]);
  };

  const removeOverride = (id: string) => {
    setCustomDateOverrides((prev) => prev.filter((o) => o.id !== id));
  };

  const formatDateRange = (dates: any[]) => {
    if (dates.length === 0) return "";
    const sorted = [...dates]
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());
    const start = sorted[0];
    const end = sorted[sorted.length - 1];

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    if (sorted.length === 1)
      return `${monthNames[start.getMonth()]} ${start.getDate()}`;

    let isConsecutive = true;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1].getTime() - sorted[i].getTime() > 86400000) {
        isConsecutive = false;
        break;
      }
    }

    if (isConsecutive)
      return `${monthNames[start.getMonth()]} ${start.getDate()} – ${end.getDate()}`;
    return `${monthNames[start.getMonth()]} ${start.getDate()}, ...`;
  };

  const [isDetailTypeDropdownOpen, setIsDetailTypeDropdownOpen] =
    React.useState(false);
  const [activeQuestionDropdown, setActiveQuestionDropdown] = React.useState<
    string | null
  >(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedColor = COLORS.find((c) => c.value === eventColor) || COLORS[3];

  const durationOptions = ["15 min", "30 min", "45 min", "1 hr", "Custom"];

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const [showPaymentTooltip, setShowPaymentTooltip] = React.useState(false);
  const [activeInfoPopup, setActiveInfoPopup] = React.useState<
    "workflows" | "basic" | null
  >(null);
  const [activeMoreTooltip, setActiveMoreTooltip] = React.useState<
    string | null
  >(null);

  // Confirmation Page State
  const [afterBookingOption, setAfterBookingOption] = React.useState(
    editingEvent?.confirmation_type === "redirect"
      ? "Redirect to an external site"
      : "Display confirmation page",
  );
  const [isAfterBookingDropdownOpen, setIsAfterBookingDropdownOpen] =
    React.useState(false);
  const [confirmationLinks, setConfirmationLinks] = React.useState<
    ConfirmationLink[]
  >(
    editingEvent?.confirmation_links || [
      {
        id: "default",
        name: "Schedule another event",
        url: "",
        isDefault: true,
        status: true,
      },
    ],
  );

  // Availability State
  const [dateRangeKind, setDateRangeKind] = React.useState<
    "relative" | "range" | "indefinite"
  >(editingEvent?.date_range_kind || "relative");
  const [dateRangeValue, setDateRangeValue] = React.useState(
    editingEvent?.date_range_value || 60,
  );
  const [dateRangeType, setDateRangeType] = React.useState<
    "calendar_days" | "weekdays"
  >(editingEvent?.date_range_type || "calendar_days");
  const [dateRangeStart, setDateRangeStart] = React.useState(
    editingEvent?.date_range_start || "",
  );
  const [dateRangeEnd, setDateRangeEnd] = React.useState(
    editingEvent?.date_range_end || "",
  );
  const [tempDateRangeStart, setTempDateRangeStart] = React.useState(
    editingEvent?.date_range_start || "",
  );
  const [tempDateRangeEnd, setTempDateRangeEnd] = React.useState(
    editingEvent?.date_range_end || "",
  );
  const [minimumNotice, setMinimumNotice] = React.useState(
    editingEvent?.minimum_notice || 4,
  );
  const [weeklyHours, setWeeklyHours] = React.useState<DayAvailability[]>([]);
  const [isDateRangeExpanded, setIsDateRangeExpanded] = React.useState(false);
  const [isDateRangeTypeDropdownOpen, setIsDateRangeTypeDropdownOpen] =
    React.useState(false);
  const [isNoticeDropdownOpen, setIsNoticeDropdownOpen] = React.useState(false);
  const [isFixedDatePickerOpen, setIsFixedDatePickerOpen] =
    React.useState(false);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
  const [viewDate, setViewDate] = React.useState(new Date());
  const [datePickerTop, setDatePickerTop] = React.useState(0);
  const datePickerRef = React.useRef<HTMLDivElement>(null);
  const datePickerTriggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (isFixedDatePickerOpen) {
      setTempDateRangeStart(dateRangeStart);
      setTempDateRangeEnd(dateRangeEnd);
      if (dateRangeStart) {
        setViewDate(startOfMonth(new Date(dateRangeStart)));
      } else {
        setViewDate(startOfMonth(new Date()));
      }

      if (datePickerTriggerRef.current) {
        const rect = datePickerTriggerRef.current.getBoundingClientRect();
        setDatePickerTop(rect.top);
      }
    }
  }, [isFixedDatePickerOpen, dateRangeStart, dateRangeEnd]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsFixedDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (selectedScheduleId) {
      availabilityService
        .getWeeklyHours(selectedScheduleId)
        .then((hours) => setWeeklyHours(hours))
        .catch((err) => console.error("Error fetching weekly hours:", err));
    }
  }, [selectedScheduleId]);

  if (!isOpen) return null;

  const toggleSection = (title: string) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

  const handleDurationSelect = (option: string) => {
    setDuration(option);
    setIsDurationDropdownOpen(false);
  };

  const handleSaveDescription = async () => {
    if (editingEvent) {
      try {
        await availabilityService.updateEventType(editingEvent.id, {
          description,
        });
        toast.success("Description updated successfully");
      } catch (error) {
        console.error("Error updating description:", error);
        toast.error("Failed to update description");
      }
    }
  };

  const bufferOptions = [
    { label: "0 min", value: 0 },
    { label: "5 min", value: 5 },
    { label: "10 min", value: 10 },
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "45 min", value: 45 },
    { label: "1 hr", value: 60 },
    { label: "1 hr 30 min", value: 90 },
    { label: "2 hr", value: 120 },
    { label: "2 hr 30 min", value: 150 },
    { label: "3 hr", value: 180 },
  ];

  const incrementOptions = [
    { label: "5 min", value: 5 },
    { label: "10 min", value: 10 },
    { label: "15 min", value: 15 },
    { label: "20 min", value: 20 },
    { label: "30 min", value: 30 },
    { label: "60 min", value: 60 },
  ];

  const quillModules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "bullet" }, { list: "ordered" }],
      ["link"],
      ["clean"],
    ],
  };

  const moreOptionsSections = [
    {
      icon: AlignLeft,
      title: "Description",
      desc: "Tell your invitees what this meeting is about",
    },
    {
      icon: CalendarClock,
      title: "Limits and buffers",
      desc: "Buffer times, max limits",
    },
    {
      icon: Calendar,
      title: "Free/busy rules",
      desc: "Allow invitees to book over selected meetings on your connected calendars",
    },
    {
      icon: Settings2,
      title: "Booking page options",
      desc: "/30min • 30 min increments • auto time zone",
    },
    {
      icon: FileText,
      title: "Invitee form",
      desc: "Asking for name, email, +1 question",
    },
    {
      icon: CircleDollarSign,
      title: "Payment",
      desc: "Collect payment for your event",
    },
    {
      icon: Bell,
      title: "Notifications and workflows",
      desc: "Calendar invitations",
    },
    {
      icon: CheckSquare,
      title: "Confirmation page",
      desc: "Display confirmation page",
    },
  ];

  const handleDateClick = (day: Date) => {
    const start = tempDateRangeStart ? new Date(tempDateRangeStart) : null;
    const end = tempDateRangeEnd ? new Date(tempDateRangeEnd) : null;

    if (!start || (start && end)) {
      setTempDateRangeStart(day.toISOString());
      setTempDateRangeEnd("");
    } else {
      if (day < start) {
        setTempDateRangeEnd(start.toISOString());
        setTempDateRangeStart(day.toISOString());
      } else {
        setTempDateRangeEnd(day.toISOString());
      }
    }
  };

  const renderOverrideCalendar = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const startDateView = startOfWeek(monthStart);
    const endDateView = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDateView, end: endDateView });

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-8 px-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentMonth(subMonths(currentMonth, 1));
            }}
            className="p-2 hover:bg-[#f1f5f9] rounded-full transition-colors text-[#64748b]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-bold text-[#1e293b] text-base">
            {format(monthDate, "MMMM yyyy")}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentMonth(addMonths(currentMonth, 1));
            }}
            className="p-2 hover:bg-[#f1f5f9] rounded-full transition-colors text-[#64748b]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-4">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div
              key={d}
              className="text-[11px] font-bold text-[#94a3b8] text-center py-2"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-2">
          {days.map((day, i) => {
            const isSelected = modalSelectedDates.find((d) =>
              isSameDay(d, day),
            );
            const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
            const isTodayDate = isToday(day);
            const isPastDate = isBefore(
              startOfDay(day),
              startOfDay(new Date()),
            );

            return (
              <div
                key={i}
                className={cn(
                  "relative h-12 flex items-center justify-center text-[10px] font-bold",
                  !isCurrentMonth && "opacity-0 pointer-events-none",
                )}
              >
                <div
                  onClick={(e) => {
                    if (isPastDate) return;
                    e.stopPropagation();
                    toggleModalDate(day);
                  }}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full transition-all relative z-10 cursor-pointer text-sm",
                    isSelected
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                      : isTodayDate
                        ? "bg-blue-50 text-blue-600"
                        : isPastDate
                          ? "text-[#e2e8f0] cursor-not-allowed"
                          : "text-[#334155] hover:bg-[#f8fafc]",
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendar = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const startDateView = startOfWeek(monthStart);
    const endDateView = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDateView, end: endDateView });

    const start = tempDateRangeStart ? new Date(tempDateRangeStart) : null;
    const end = tempDateRangeEnd ? new Date(tempDateRangeEnd) : null;
    const isFirstMonth = isSameMonth(monthDate, new Date());

    return (
      <div className="w-72">
        <div className="flex items-center justify-between mb-6 px-2">
          <button
            type="button"
            disabled={isFirstMonth}
            onClick={(e) => {
              e.stopPropagation();
              if (!isFirstMonth) setViewDate(subMonths(viewDate, 1));
            }}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              isFirstMonth
                ? "opacity-0 cursor-default"
                : "hover:bg-slate-100 text-slate-600",
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-bold text-slate-900 text-base">
            {format(monthDate, "MMMM yyyy")}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewDate(addMonths(viewDate, 1));
            }}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div
              key={d}
              className="text-[10px] font-bold text-slate-400 text-center py-2"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day, i) => {
            const isSelectedStart = start && isSameDay(day, start);
            const isSelectedEnd = end && isSameDay(day, end);

            let effectiveStart = start;
            let effectiveEnd = end;
            if (start && !end && hoverDate) {
              if (hoverDate < start) {
                effectiveStart = hoverDate;
                effectiveEnd = start;
              } else {
                effectiveStart = start;
                effectiveEnd = hoverDate;
              }
            }

            const isEffectiveStart =
              effectiveStart && isSameDay(day, effectiveStart);
            const isEffectiveEnd = effectiveEnd && isSameDay(day, effectiveEnd);
            const isInRange =
              effectiveStart &&
              effectiveEnd &&
              isWithinInterval(day, {
                start: effectiveStart,
                end: effectiveEnd,
              });
            const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
            const isTodayDate = isToday(day);
            const isSelected = isEffectiveStart || isEffectiveEnd;
            const isPastDate = isBefore(
              startOfDay(day),
              startOfDay(new Date()),
            );

            return (
              <div
                key={i}
                className={cn(
                  "relative h-10 flex items-center justify-center text-sm font-medium",
                  !isCurrentMonth && "opacity-0 pointer-events-none",
                  isPastDate && "text-slate-300 pointer-events-none",
                )}
                onClick={(e) => {
                  if (isPastDate) return;
                  e.stopPropagation();
                  handleDateClick(day);
                }}
                onMouseEnter={() =>
                  start && !end && !isPastDate && setHoverDate(day)
                }
                onMouseLeave={() => setHoverDate(null)}
              >
                {isInRange && !isEffectiveStart && !isEffectiveEnd && (
                  <div className="absolute inset-y-1 inset-x-0 bg-blue-50 z-0" />
                )}
                {isEffectiveStart &&
                  effectiveEnd &&
                  !isSameDay(effectiveStart, effectiveEnd) && (
                    <div className="absolute inset-y-1 right-0 left-1/2 bg-blue-50 z-0" />
                  )}
                {isEffectiveEnd &&
                  effectiveStart &&
                  !isSameDay(effectiveStart, effectiveEnd) && (
                    <div className="absolute inset-y-1 left-0 right-1/2 bg-blue-50 z-0" />
                  )}

                <div
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-full transition-all relative z-10 cursor-pointer",
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                      : isTodayDate
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.aside
      initial={{ width: 0, x: 400 }}
      animate={{ width: 400, x: 0 }}
      exit={{ width: 0, x: 400 }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className="h-full shrink-0 overflow-hidden bg-white shadow-2xl z-50 border-l border-slate-200"
    >
      <div className="w-[400px] h-full flex flex-col">
        <div className="px-4 pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div
          className={cn(
            "flex-1",
            isFixedDatePickerOpen
              ? "overflow-hidden"
              : "overflow-y-auto overflow-x-visible",
          )}
        >
          <div className="relative border-b-2 border-slate-300 px-6 py-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Event type
            </p>

            <div
              className={cn(
                "group flex items-center gap-3 p-2 -ml-2 rounded-lg transition-all cursor-pointer border-2 border-transparent",
                isEditing ? "border-blue-500" : "hover:bg-slate-50",
              )}
              onClick={() => !isEditing && setIsEditing(true)}
            >
              <div className="relative">
                <div
                  className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsColorPickerOpen(!isColorPickerOpen);
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedColor.value }}
                  />
                  {isEditing ? (
                    isColorPickerOpen ? (
                      <ChevronUp className="w-3 h-3 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    )
                  ) : null}
                </div>

                <AnimatePresence>
                  {isColorPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50"
                    >
                      {COLORS.map((color) => (
                        <button
                          key={color.name}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-sm text-slate-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventColor(color.value);
                            setIsColorPickerOpen(false);
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
                  className="flex-1 text-2xl font-bold text-slate-900 bg-transparent outline-none"
                />
              ) : (
                <h2 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {eventName}
                </h2>
              )}
            </div>
            <p className="text-sm text-slate-500">One-on-One</p>
          </div>

          <div className="space-y-0 divide-y divide-slate-300">
            {!showMoreOptions ? (
              <>
                {/* Duration Section */}
                <div className="py-5 px-6">
                  <div
                    className="group cursor-pointer"
                    onClick={() => toggleSection("Duration")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-slate-900">
                        Duration
                      </span>
                      {expandedSection === "Duration" ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                    {expandedSection !== "Duration" && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {duration === "Custom"
                            ? `${customValue} ${customUnit}`
                            : duration}
                        </span>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedSection === "Duration" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-visible mt-4"
                      >
                        <div className="relative mb-4">
                          <button
                            onClick={() =>
                              setIsDurationDropdownOpen(!isDurationDropdownOpen)
                            }
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm transition-all bg-white",
                              isDurationDropdownOpen
                                ? "border-blue-500 ring-2 ring-blue-100"
                                : "border-slate-200 hover:border-slate-300",
                            )}
                          >
                            <span className="text-slate-700">{duration}</span>
                            {isDurationDropdownOpen ? (
                              <ChevronUp className="w-4 h-4 text-blue-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          <AnimatePresence>
                            {isDurationDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1"
                              >
                                {durationOptions.map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => handleDurationSelect(opt)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                                  >
                                    <span>{opt}</span>
                                    {duration === opt && (
                                      <div className="w-4 h-4 flex items-center justify-center">
                                        <div className="w-2 h-3.5 border-b-2 border-r-2 border-blue-600 rotate-45 mb-1" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {duration === "Custom" && (
                          <div className="flex gap-2 mb-4">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={customValue}
                                onChange={(e) => setCustomValue(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Value"
                              />
                            </div>
                            <div className="relative w-32">
                              <button
                                onClick={() =>
                                  setIsCustomUnitDropdownOpen(
                                    !isCustomUnitDropdownOpen,
                                  )
                                }
                                className={cn(
                                  "w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm transition-all bg-white",
                                  isCustomUnitDropdownOpen
                                    ? "border-blue-500 ring-2 ring-blue-100"
                                    : "border-slate-200 hover:border-slate-300",
                                )}
                              >
                                <span className="text-slate-700">
                                  {customUnit}
                                </span>
                                {isCustomUnitDropdownOpen ? (
                                  <ChevronUp className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </button>

                              <AnimatePresence>
                                {isCustomUnitDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1"
                                  >
                                    {["min", "hr"].map((unit) => (
                                      <button
                                        key={unit}
                                        onClick={() => {
                                          setCustomUnit(unit);
                                          setIsCustomUnitDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                                      >
                                        <span>{unit}</span>
                                        {customUnit === unit && (
                                          <div className="w-4 h-4 flex items-center justify-center">
                                            <div className="w-2 h-3.5 border-b-2 border-r-2 border-blue-600 rotate-45 mb-1" />
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Availability Section */}
                <div className="py-5 px-6">
                  <div
                    className="group cursor-pointer"
                    onClick={() => toggleSection("Availability")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-slate-900">
                        Availability
                      </span>
                      {expandedSection === "Availability" ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                    {expandedSection !== "Availability" && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {dateRangeKind === "indefinite"
                            ? "Indefinitely"
                            : dateRangeKind === "range"
                              ? "Within date range"
                              : `${dateRangeValue} ${dateRangeType.replace("_", " ")}`}{" "}
                          into the future • {minimumNotice}h notice
                        </span>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedSection === "Availability" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-visible mt-6 space-y-8"
                      >
                        {/* Date-range */}
                        <div className="space-y-4">
                          <h4 className="text-base font-bold text-slate-900">
                            Date-range
                          </h4>
                          <div className="text-sm text-slate-600 leading-relaxed">
                            Invitees can schedule{" "}
                            <span className="relative inline-block">
                              <button
                                onClick={() =>
                                  setIsDateRangeExpanded(!isDateRangeExpanded)
                                }
                                className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                              >
                                {dateRangeKind === "indefinite"
                                  ? "indefinitely"
                                  : dateRangeKind === "range"
                                    ? "within a date range"
                                    : `${dateRangeValue} ${dateRangeType.replace("_", " ")}`}
                                {isDateRangeExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            </span>{" "}
                            into the future with at least{" "}
                            <span className="relative inline-block">
                              <button
                                onClick={() =>
                                  setIsNoticeDropdownOpen(!isNoticeDropdownOpen)
                                }
                                className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                              >
                                {minimumNotice} hours{" "}
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              <AnimatePresence>
                                {isNoticeDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1"
                                  >
                                    {[1, 2, 4, 12, 24].map((val) => (
                                      <button
                                        key={val}
                                        onClick={() => {
                                          setMinimumNotice(val);
                                          setIsNoticeDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs font-medium text-slate-700"
                                      >
                                        {val} hours
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </span>{" "}
                            notice
                          </div>

                          <AnimatePresence>
                            {isDateRangeExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-visible"
                              >
                                <div className="pl-4 border-l-2 border-slate-100 space-y-4 mt-2">
                                  {/* Relative Range Option */}
                                  <div className="flex items-start gap-3">
                                    <button
                                      onClick={() =>
                                        setDateRangeKind("relative")
                                      }
                                      className={cn(
                                        "mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                        dateRangeKind === "relative"
                                          ? "border-blue-600 bg-blue-600"
                                          : "border-slate-300",
                                      )}
                                    >
                                      {dateRangeKind === "relative" && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                      )}
                                    </button>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <input
                                        type="text"
                                        value={dateRangeValue}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(
                                            /[^0-9]/g,
                                            "",
                                          );
                                          setDateRangeValue(
                                            val ? parseInt(val) : 0,
                                          );
                                        }}
                                        className="w-20 h-10 px-3 border border-slate-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                      <div className="relative">
                                        <button
                                          onClick={() =>
                                            setIsDateRangeTypeDropdownOpen(
                                              !isDateRangeTypeDropdownOpen,
                                            )
                                          }
                                          className="h-10 px-4 border border-slate-200 rounded-lg flex items-center gap-2 text-sm text-slate-700 hover:border-slate-300 transition-colors"
                                        >
                                          <span>
                                            {dateRangeType.replace("_", " ")}
                                          </span>
                                          <ChevronDown
                                            className={cn(
                                              "w-4 h-4 text-slate-400 transition-transform",
                                              isDateRangeTypeDropdownOpen &&
                                                "rotate-180",
                                            )}
                                          />
                                        </button>
                                        <AnimatePresence>
                                          {isDateRangeTypeDropdownOpen && (
                                            <motion.div
                                              initial={{ opacity: 0, y: 5 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              exit={{ opacity: 0, y: 5 }}
                                              className="absolute top-full right-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1"
                                            >
                                              <button
                                                onClick={() => {
                                                  setDateRangeType(
                                                    "calendar_days",
                                                  );
                                                  setIsDateRangeTypeDropdownOpen(
                                                    false,
                                                  );
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors group"
                                              >
                                                <div className="flex items-center justify-between">
                                                  <span className="text-sm font-bold text-slate-900">
                                                    calendar days
                                                  </span>
                                                  {dateRangeType ===
                                                    "calendar_days" && (
                                                    <div className="w-2 h-3.5 border-b-2 border-r-2 border-blue-600 rotate-45 mb-1" />
                                                  )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                  Counts every day on the
                                                  calendar including days you're
                                                  unavailable
                                                </p>
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setDateRangeType("weekdays");
                                                  setIsDateRangeTypeDropdownOpen(
                                                    false,
                                                  );
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors group"
                                              >
                                                <div className="flex items-center justify-between">
                                                  <span className="text-sm font-bold text-slate-900">
                                                    weekdays
                                                  </span>
                                                  {dateRangeType ===
                                                    "weekdays" && (
                                                    <div className="w-2 h-3.5 border-b-2 border-r-2 border-blue-600 rotate-45 mb-1" />
                                                  )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                  Excludes weekends and only
                                                  counts Mon - Fri
                                                </p>
                                              </button>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                      <span className="text-sm text-slate-600">
                                        into the future
                                      </span>
                                    </div>
                                  </div>

                                  {/* Fixed Range Option */}
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => setDateRangeKind("range")}
                                      className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                        dateRangeKind === "range"
                                          ? "border-blue-600 bg-blue-600"
                                          : "border-slate-300",
                                      )}
                                    >
                                      {dateRangeKind === "range" && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                      )}
                                    </button>
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm text-slate-700">
                                        Within a date range
                                      </span>
                                      {dateRangeKind === "range" && (
                                        <div className="relative">
                                          <button
                                            ref={datePickerTriggerRef}
                                            onClick={() =>
                                              setIsFixedDatePickerOpen(
                                                !isFixedDatePickerOpen,
                                              )
                                            }
                                            className={cn(
                                              "h-10 px-4 border rounded-lg flex items-center gap-2 text-sm transition-all bg-white min-w-[220px]",
                                              isFixedDatePickerOpen
                                                ? "border-blue-600 ring-4 ring-blue-50"
                                                : "border-slate-200 hover:border-slate-300",
                                              (!dateRangeStart ||
                                                !dateRangeEnd) &&
                                                "border-red-200 bg-red-50/30",
                                            )}
                                          >
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span
                                              className={cn(
                                                "font-medium",
                                                dateRangeStart && dateRangeEnd
                                                  ? "text-slate-900"
                                                  : "text-slate-400",
                                              )}
                                            >
                                              {dateRangeStart && dateRangeEnd
                                                ? `${format(new Date(dateRangeStart), "MMM d")} - ${format(new Date(dateRangeEnd), "MMM d, yyyy")}`
                                                : "Select date range"}
                                            </span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Indefinite Option */}
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() =>
                                        setDateRangeKind("indefinite")
                                      }
                                      className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                        dateRangeKind === "indefinite"
                                          ? "border-blue-600 bg-blue-600"
                                          : "border-slate-300",
                                      )}
                                    >
                                      {dateRangeKind === "indefinite" && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                      )}
                                    </button>
                                    <span className="text-sm text-slate-700">
                                      Indefinitely into the future
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Schedule Selection */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            Schedule:
                          </span>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setIsScheduleDropdownOpen(
                                  !isScheduleDropdownOpen,
                                )
                              }
                              className="text-sm text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              {useCustomSchedule
                                ? "Custom"
                                : schedules.find(
                                    (s) => s.id === selectedScheduleId,
                                  )?.name || "Select a schedule"}
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <AnimatePresence>
                              {isScheduleDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1"
                                >
                                  {schedules.map((opt) => (
                                    <button
                                      key={opt.id}
                                      onClick={() => {
                                        setSelectedScheduleId(opt.id);
                                        setUseCustomSchedule(false);
                                        setIsScheduleDropdownOpen(false);
                                      }}
                                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                                    >
                                      <span
                                        className={cn(
                                          selectedScheduleId === opt.id &&
                                            !useCustomSchedule &&
                                            "font-bold text-blue-600",
                                        )}
                                      >
                                        {opt.name}
                                      </span>
                                      {selectedScheduleId === opt.id &&
                                        !useCustomSchedule && (
                                          <Check className="w-4 h-4 text-blue-600" />
                                        )}
                                    </button>
                                  ))}
                                  <div className="h-px bg-slate-100 my-1" />
                                  <button
                                    onClick={() => {
                                      setUseCustomSchedule(true);
                                      // If custom hours are still at initial state, pre-populate with current schedule hours
                                      if (
                                        JSON.stringify(customWeeklyHours) ===
                                          JSON.stringify(
                                            INITIAL_AVAILABILITY,
                                          ) &&
                                        weeklyHours.length > 0
                                      ) {
                                        setCustomWeeklyHours(weeklyHours);
                                      }
                                      setIsScheduleDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                                  >
                                    <span
                                      className={cn(
                                        useCustomSchedule &&
                                          "font-bold text-blue-600",
                                      )}
                                    >
                                      Custom schedule
                                    </span>
                                    {useCustomSchedule && (
                                      <Check className="w-4 h-4 text-blue-600" />
                                    )}
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Availability Preview Box / Custom Editor */}
                        <div className="border border-[#e2e8f0] rounded-xl overflow-hidden bg-white shadow-sm">
                          {!useCustomSchedule ? (
                            <>
                              <div className="p-5 flex items-start justify-between border-b border-[#f1f5f9] bg-[#f8fafc]/30">
                                <p className="text-[15px] text-[#475569] font-medium leading-[1.6] pr-4">
                                  This event type uses the weekly and custom
                                  hours saved on the schedule
                                </p>
                                <button
                                  onClick={() =>
                                    onNavigateToAvailability?.(
                                      selectedScheduleId,
                                    )
                                  }
                                  className="p-1.5 hover:bg-[#f1f5f9] rounded-md transition-all text-[#64748b] hover:text-[#1e293b]"
                                >
                                  <Pencil className="w-[18px] h-[18px]" />
                                </button>
                              </div>

                              <div className="p-6 space-y-7">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2.5 text-[#334155]">
                                    <RefreshCw className="w-[18px] h-[18px]" />
                                    <span className="text-[15px] font-semibold">
                                      Weekly hours
                                    </span>
                                  </div>

                                  <div className="space-y-3.5">
                                    {["S", "M", "T", "W", "T", "F", "S"].map(
                                      (day, idx) => {
                                        const dayHours = weeklyHours.find(
                                          (h) => h.day_index === idx,
                                        );
                                        const isEnabled =
                                          dayHours?.enabled &&
                                          dayHours.slots.length > 0;

                                        return (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-4"
                                          >
                                            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-bold bg-[#004dc0] text-white">
                                              {day}
                                            </div>
                                            <div className="text-[14px]">
                                              {isEnabled ? (
                                                <span className="text-[#334155] font-medium">
                                                  {dayHours.slots.map(
                                                    (slot, sIdx) => (
                                                      <React.Fragment
                                                        key={sIdx}
                                                      >
                                                        {sIdx > 0 && ", "}
                                                        {slot.start} -{" "}
                                                        {slot.end}
                                                      </React.Fragment>
                                                    ),
                                                  )}
                                                </span>
                                              ) : (
                                                <span className="text-[#94a3b8] font-medium">
                                                  Unavailable
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>
                                </div>

                                <div className="text-[12px] text-[#475569] font-medium pl-[4px]">
                                  India, Sri Lanka Time
                                </div>

                                <div className="space-y-4 pt-1">
                                  <div className="flex items-center gap-2.5 text-[#334155]">
                                    <Calendar className="w-[18px] h-[18px]" />
                                    <span className="text-[15px] font-semibold">
                                      Date-specific hours
                                    </span>
                                  </div>
                                  <p className="text-[15px] text-[#334155] pl-[2px] font-medium">
                                    None
                                  </p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="p-6 space-y-10">
                              {/* Interactive Weekly Hours */}
                              <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-1">
                                  <RefreshCw className="w-[18px] h-[18px] text-[#475569]" />
                                  <span className="text-[15px] font-semibold text-[#1e293b]">
                                    Weekly hours
                                  </span>
                                </div>
                                <p className="text-[14px] text-[#64748b]">
                                  Set when you are available for meetings
                                </p>

                                <div className="space-y-5">
                                  {["S", "M", "T", "W", "T", "F", "S"].map(
                                    (dayChar, idx) => {
                                      const day = customWeeklyHours[idx];
                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-start gap-4"
                                        >
                                          <button
                                            onClick={() => toggleDay(idx)}
                                            className={cn(
                                              "w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-bold transition-colors shrink-0 mt-1",
                                              day.enabled
                                                ? "bg-[#004dc0] text-white"
                                                : "bg-[#f1f5f9] text-[#94a3b8] hover:bg-slate-200",
                                            )}
                                          >
                                            {dayChar}
                                          </button>

                                          <div className="flex-1 space-y-3">
                                            {!day.enabled ? (
                                              <div className="flex items-center gap-4 h-[34px]">
                                                <span className="text-[14px] text-[#94a3b8] font-medium">
                                                  Unavailable
                                                </span>
                                                <button
                                                  onClick={() => addSlot(idx)}
                                                  className="p-1 hover:bg-[#f1f5f9] rounded-full transition-colors"
                                                >
                                                  <Plus className="w-5 h-5 text-[#94a3b8]" />
                                                </button>
                                              </div>
                                            ) : (
                                              day.slots.map(
                                                (slot, slotIndex) => (
                                                  <div
                                                    key={slot.id}
                                                    className="flex items-center gap-3"
                                                  >
                                                    <div className="relative">
                                                      <button
                                                        onClick={() =>
                                                          setOpenPicker({
                                                            dayIndex: idx,
                                                            slotId: slot.id,
                                                            type: "start",
                                                          })
                                                        }
                                                        className={cn(
                                                          "w-28 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#334155] hover:border-blue-600 transition-all text-center",
                                                          openPicker?.dayIndex ===
                                                            idx &&
                                                            openPicker?.slotId ===
                                                              slot.id &&
                                                            openPicker?.type ===
                                                              "start" &&
                                                            "border-blue-600 ring-2 ring-blue-100",
                                                        )}
                                                      >
                                                        {slot.start}
                                                      </button>
                                                      <TimePicker
                                                        value={slot.start}
                                                        isOpen={
                                                          openPicker?.dayIndex ===
                                                            idx &&
                                                          openPicker?.slotId ===
                                                            slot.id &&
                                                          openPicker?.type ===
                                                            "start"
                                                        }
                                                        onClose={() =>
                                                          setOpenPicker(null)
                                                        }
                                                        onChange={(time) =>
                                                          updateSlot(
                                                            idx,
                                                            slot.id,
                                                            "start",
                                                            time,
                                                          )
                                                        }
                                                      />
                                                    </div>

                                                    <span className="text-[#94a3b8]">
                                                      -
                                                    </span>

                                                    <div className="relative">
                                                      <button
                                                        onClick={() =>
                                                          setOpenPicker({
                                                            dayIndex: idx,
                                                            slotId: slot.id,
                                                            type: "end",
                                                          })
                                                        }
                                                        className={cn(
                                                          "w-28 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#334155] hover:border-blue-600 transition-all text-center",
                                                          openPicker?.dayIndex ===
                                                            idx &&
                                                            openPicker?.slotId ===
                                                              slot.id &&
                                                            openPicker?.type ===
                                                              "end" &&
                                                            "border-blue-600 ring-2 ring-blue-100",
                                                        )}
                                                      >
                                                        {slot.end}
                                                      </button>
                                                      <TimePicker
                                                        value={slot.end}
                                                        isOpen={
                                                          openPicker?.dayIndex ===
                                                            idx &&
                                                          openPicker?.slotId ===
                                                            slot.id &&
                                                          openPicker?.type ===
                                                            "end"
                                                        }
                                                        onClose={() =>
                                                          setOpenPicker(null)
                                                        }
                                                        onChange={(time) =>
                                                          updateSlot(
                                                            idx,
                                                            slot.id,
                                                            "end",
                                                            time,
                                                          )
                                                        }
                                                        minTime={slot.start}
                                                      />
                                                    </div>

                                                    <div className="flex items-center gap-1.5 ml-1">
                                                      <button
                                                        onClick={() =>
                                                          removeSlot(
                                                            idx,
                                                            slot.id,
                                                          )
                                                        }
                                                        className="p-1.5 hover:bg-[#f1f5f9] rounded-lg transition-colors text-[#334155] hover:text-[#ef4444]"
                                                      >
                                                        <X className="w-4 h-4" />
                                                      </button>
                                                      {slotIndex === 0 && (
                                                        <button
                                                          onClick={() =>
                                                            addSlot(idx)
                                                          }
                                                          className="p-1.5 hover:bg-[#f1f5f9] rounded-lg transition-colors text-[#004dc0] hover:text-[#004dc0]"
                                                        >
                                                          <PlusCircle className="w-5 h-5" />
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>
                                                ),
                                              )
                                            )}
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>

                              <div className="text-[14px] text-blue-600 font-bold flex items-center gap-2 cursor-pointer hover:underline">
                                India, Sri Lanka Time{" "}
                                <ChevronDown className="w-4 h-4" />
                              </div>

                              {/* Custom Date-specific hours */}
                              <div className="space-y-4 pt-4 border-t border-[#f1f5f9]">
                                <div className="flex items-center gap-2.5 text-[#334155] mb-2">
                                  <Calendar className="w-[18px] h-[18px]" />
                                  <span className="text-[15px] font-semibold">
                                    Date-specific hours
                                  </span>
                                </div>
                                <p className="text-[14px] text-[#64748b] mb-4">
                                  Adjust hours for specific days
                                </p>

                                <button
                                  onClick={() => setIsOverrideModalOpen(true)}
                                  className="flex items-center gap-2 px-6 py-2 border border-[#e2e8f0] rounded-full text-[14px] font-bold text-[#334155] hover:bg-[#f8fafc] transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  Hours
                                </button>

                                {customDateOverrides.length > 0 && (
                                  <div className="space-y-4 pt-4">
                                    {customDateOverrides.map((override) => (
                                      <div
                                        key={override.id}
                                        className="flex items-start justify-between group"
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[14px] font-bold text-[#334155]">
                                              {formatDateRange(override.dates)}
                                            </span>
                                            <div className="flex flex-col items-end">
                                              {override.slots.map((slot) => (
                                                <span
                                                  key={slot.id}
                                                  className="text-[13px] text-[#64748b]"
                                                >
                                                  {slot.start} – {slot.end}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() =>
                                            removeOverride(override.id)
                                          }
                                          className="ml-4 p-1 text-[#94a3b8] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="py-2">
                {/* Description Section */}
                <div className="py-6 border-b border-slate-100">
                  <div
                    className="group cursor-pointer"
                    onClick={() => {
                      if (expandedSection === "Description") {
                        handleSaveDescription();
                      }
                      toggleSection("Description");
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-slate-900">
                        Description
                      </span>
                      {expandedSection === "Description" ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                    {expandedSection !== "Description" && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <AlignLeft className="w-4 h-4" />
                        <span className="truncate">
                          {description && description !== "<p><br></p>"
                            ? description.replace(/<[^>]*>/g, "").trim() ||
                              "Tell your invitees what this meeting is about"
                            : "Tell your invitees what this meeting is about"}
                        </span>
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {expandedSection === "Description" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4"
                      >
                        <div className="border border-slate-100 rounded-lg overflow-hidden">
                          <ReactQuill
                            theme="snow"
                            value={description}
                            onChange={setDescription}
                            modules={quillModules}
                            placeholder="Write a summary and any details your invitee should know about the event"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Limits and Buffers Section */}
                <div className="py-6 border-b border-slate-100">
                  <div
                    className="group cursor-pointer"
                    onClick={() => toggleSection("Limits and buffers")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-slate-900">
                        Limits and buffers
                      </span>
                      {expandedSection === "Limits and buffers" ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                    {expandedSection !== "Limits and buffers" && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <CalendarClock className="w-4 h-4" />
                        <div className="space-y-1">
                          {(bufferBefore > 0 || bufferAfter > 0) && (
                            <p>
                              Buffers: {bufferBefore}m before, {bufferAfter}m
                              after
                            </p>
                          )}
                          {meetingLimitCount !== null ? (
                            <p>
                              Limit: {meetingLimitCount} per{" "}
                              {meetingLimitPeriod}
                            </p>
                          ) : (
                            <p>No meeting limit</p>
                          )}
                          {!(bufferBefore > 0 || bufferAfter > 0) &&
                            meetingLimitCount === null && (
                              <p>Buffer times, max limits</p>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {expandedSection === "Limits and buffers" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 ml-8 space-y-6"
                      >
                        {/* Buffer Times */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-1">
                            Buffer times
                          </h4>
                          <p className="text-xs text-slate-500 mb-3">
                            Add buffer time before or after booked events
                          </p>

                          {!showBufferSettings ? (
                            <button
                              onClick={() => setShowBufferSettings(true)}
                              className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:text-blue-700"
                            >
                              <Plus className="w-4 h-4" />
                              Set buffer time
                            </button>
                          ) : (
                            <div className="space-y-4 border-l-2 border-slate-100 pl-4 py-2">
                              <div>
                                <label className="text-xs text-slate-500 block mb-2">
                                  Before event:
                                </label>
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setActiveBufferDropdown(
                                        activeBufferDropdown === "before"
                                          ? null
                                          : "before",
                                      )
                                    }
                                    className={cn(
                                      "w-full flex items-center justify-between px-4 py-2.5 border rounded-lg text-sm transition-all bg-white",
                                      activeBufferDropdown === "before"
                                        ? "border-blue-500 ring-2 ring-blue-100"
                                        : "border-slate-200 hover:border-slate-300",
                                    )}
                                  >
                                    <span>
                                      {
                                        bufferOptions.find(
                                          (o) => o.value === bufferBefore,
                                        )?.label
                                      }
                                    </span>
                                    <ChevronDown
                                      className={cn(
                                        "w-4 h-4 text-slate-400 transition-transform",
                                        activeBufferDropdown === "before" &&
                                          "rotate-180 text-blue-500",
                                      )}
                                    />
                                  </button>
                                  <AnimatePresence>
                                    {activeBufferDropdown === "before" && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto custom-scrollbar"
                                      >
                                        {bufferOptions.map((opt) => (
                                          <button
                                            key={opt.value}
                                            onClick={() => {
                                              setBufferBefore(opt.value);
                                              setActiveBufferDropdown(null);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                                          >
                                            <span>{opt.label}</span>
                                            {bufferBefore === opt.value && (
                                              <div className="w-2 h-3.5 border-b-2 border-r-2 border-blue-600 rotate-45 mb-1" />
                                            )}
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>

                              <div>
                                <label className="text-xs text-slate-500 block mb-2">
                                  After event:
                                </label>
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setActiveBufferDropdown(
                                        activeBufferDropdown === "after"
                                          ? null
                                          : "after",
                                      )
                                    }
                                    className={cn(
                                      "w-full flex items-center justify-between px-4 py-2.5 border rounded-lg text-sm transition-all bg-white",
                                      activeBufferDropdown === "after"
                                        ? "border-blue-500 ring-2 ring-blue-100"
                                        : "border-slate-200 hover:border-slate-300",
                                    )}
                                  >
                                    <span>
                                      {
                                        bufferOptions.find(
                                          (o) => o.value === bufferAfter,
                                        )?.label
                                      }
                                    </span>
                                    <ChevronDown
                                      className={cn(
                                        "w-4 h-4 text-slate-400 transition-transform",
                                        activeBufferDropdown === "after" &&
                                          "rotate-180 text-blue-500",
                                      )}
                                    />
                                  </button>
                                  <AnimatePresence>
                                    {activeBufferDropdown === "after" && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto custom-scrollbar"
                                      >
                                        {bufferOptions.map((opt) => (
                                          <button
                                            key={opt.value}
                                            onClick={() => {
                                              setBufferAfter(opt.value);
                                              setActiveBufferDropdown(null);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                                          >
                                            <span>{opt.label}</span>
                                            {bufferAfter === opt.value && (
                                              <div className="w-2 h-3.5 border-b-2 border-r-2 border-blue-600 rotate-45 mb-1" />
                                            )}
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Meeting Limits */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-1">
                            Meeting limits
                          </h4>
                          <p className="text-xs text-slate-500 mb-3">
                            Set the maximum meetings allowed for this event type
                          </p>

                          {!showLimitSettings ? (
                            <button
                              onClick={() => {
                                setShowLimitSettings(true);
                                setMeetingLimitCount(1);
                              }}
                              className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:text-blue-700"
                            >
                              <Plus className="w-4 h-4" />
                              Set limit
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 border-l-2 border-slate-100 pl-4 py-2">
                              <div className="w-20">
                                <input
                                  type="number"
                                  value={meetingLimitCount || ""}
                                  onChange={(e) =>
                                    setMeetingLimitCount(
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center font-bold"
                                />
                              </div>
                              <span className="text-sm text-slate-600">
                                meetings per
                              </span>
                              <div className="relative flex-1">
                                <button
                                  onClick={() =>
                                    setIsLimitPeriodDropdownOpen(
                                      !isLimitPeriodDropdownOpen,
                                    )
                                  }
                                  className={cn(
                                    "w-full flex items-center justify-between px-4 py-2.5 border rounded-lg text-sm transition-all bg-white",
                                    isLimitPeriodDropdownOpen
                                      ? "border-blue-500 ring-2 ring-blue-100"
                                      : "border-slate-200 hover:border-slate-300",
                                  )}
                                >
                                  <span>{meetingLimitPeriod}</span>
                                  <ChevronDown
                                    className={cn(
                                      "w-4 h-4 text-slate-400 transition-transform",
                                      isLimitPeriodDropdownOpen &&
                                        "rotate-180 text-blue-500",
                                    )}
                                  />
                                </button>
                                <AnimatePresence>
                                  {isLimitPeriodDropdownOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 5 }}
                                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1"
                                    >
                                      {["day", "week", "month"].map(
                                        (period) => (
                                          <button
                                            key={period}
                                            onClick={() => {
                                              setMeetingLimitPeriod(period);
                                              setIsLimitPeriodDropdownOpen(
                                                false,
                                              );
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                                          >
                                            <span>{period}</span>
                                            {meetingLimitPeriod === period && (
                                              <div className="w-2 h-3.5 border-b-2 border-r-2 border-blue-600 rotate-45 mb-1" />
                                            )}
                                          </button>
                                        ),
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <button
                                onClick={() => {
                                  setShowLimitSettings(false);
                                  setMeetingLimitCount(null);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                          {showLimitSettings && (
                            <button className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:text-blue-700 mt-4 ml-4">
                              <Plus className="w-4 h-4" />
                              Add another limit
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Free/busy rules Section */}
                <div className="py-6 border-b border-slate-100">
                  <div
                    className="group cursor-pointer"
                    onClick={() => toggleSection("Free/busy rules")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-slate-900">
                        Free/busy rules
                      </span>
                      {expandedSection === "Free/busy rules" ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                    {expandedSection !== "Free/busy rules" && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          Allow invitees to book over selected meetings on your
                          connected calendars
                        </span>
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {expandedSection === "Free/busy rules" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 space-y-6"
                      >
                        <div className="space-y-4">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            Allow invitees to book over selected meetings on
                            your{" "}
                            <a
                              href="#"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              connected calendars
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </p>

                          <button className="flex items-center gap-2 text-blue-600 text-sm font-bold hover:text-blue-700 transition-colors">
                            <Plus className="w-4 h-4" />
                            Add meeting exception
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Booking page options Section */}
                <div className="py-6 border-b border-slate-100">
                  <div
                    className="group cursor-pointer"
                    onClick={() => toggleSection("Booking page options")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-slate-900">
                        Booking page options
                      </span>
                      {expandedSection === "Booking page options" ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                    {expandedSection !== "Booking page options" && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Settings2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          /{slug || "event-slug"} • {timeIncrement} min
                          increments •{" "}
                          {timezoneDisplay === "detect" ? "auto" : "locked"}{" "}
                          time zone
                        </span>
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {expandedSection === "Booking page options" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 space-y-8"
                      >
                        {/* Event Slug */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-1">
                            You can edit the slug for your event
                          </h4>
                          <p className="text-xs text-slate-500 mb-3">
                            {window.location.origin}/
                            {profile?.username || "user"}/
                          </p>
                          <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                            placeholder="event-slug"
                          />
                        </div>

                        {/* Start Time Increments */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-1">
                            Start time increments
                          </h4>
                          <p className="text-xs text-slate-500 mb-3">
                            Set the frequency of available time slots for
                            invitees
                          </p>

                          <div className="border-l-2 border-slate-100 pl-4 py-2">
                            <label className="text-xs text-slate-500 block mb-2">
                              Show available start times in increments of...
                            </label>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setIsIncrementDropdownOpen(
                                    !isIncrementDropdownOpen,
                                  )
                                }
                                className={cn(
                                  "w-full flex items-center justify-between px-4 py-2.5 border rounded-lg text-sm transition-all bg-white",
                                  isIncrementDropdownOpen
                                    ? "border-blue-500 ring-2 ring-blue-100"
                                    : "border-slate-200 hover:border-slate-300",
                                )}
                              >
                                <span>
                                  {
                                    incrementOptions.find(
                                      (o) => o.value === timeIncrement,
                                    )?.label
                                  }
                                </span>
                                <ChevronDown
                                  className={cn(
                                    "w-4 h-4 text-slate-400 transition-transform",
                                    isIncrementDropdownOpen &&
                                      "rotate-180 text-blue-500",
                                  )}
                                />
                              </button>
                              <AnimatePresence>
                                {isIncrementDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto custom-scrollbar"
                                  >
                                    {incrementOptions.map((opt) => (
                                      <button
                                        key={opt.value}
                                        onClick={() => {
                                          setTimeIncrement(opt.value);
                                          setIsIncrementDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                                      >
                                        <span>{opt.label}</span>
                                        {timeIncrement === opt.value && (
                                          <div className="w-2 h-3.5 border-b-2 border-r-2 border-blue-600 rotate-45 mb-1" />
                                        )}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        {/* Time Zone Display */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-1">
                            Time zone display
                          </h4>
                          <p className="text-xs text-slate-500 mb-3">
                            Sets how timezone shows on your booking page
                          </p>

                          <div className="border-l-2 border-slate-100 pl-4 py-2 space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer group">
                              <div className="relative flex items-center justify-center mt-0.5">
                                <input
                                  type="radio"
                                  name="timezoneDisplay"
                                  checked={timezoneDisplay === "detect"}
                                  onChange={() => setTimezoneDisplay("detect")}
                                  className="sr-only"
                                />
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 transition-all",
                                    timezoneDisplay === "detect"
                                      ? "border-blue-600 bg-white"
                                      : "border-slate-300 group-hover:border-slate-400",
                                  )}
                                />
                                {timezoneDisplay === "detect" && (
                                  <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600" />
                                )}
                              </div>
                              <span className="text-sm text-slate-700">
                                Automatically detect and show the times in my
                                invitee's time zone
                              </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer group">
                              <div className="relative flex items-center justify-center mt-0.5">
                                <input
                                  type="radio"
                                  name="timezoneDisplay"
                                  checked={timezoneDisplay === "lock"}
                                  onChange={() => setTimezoneDisplay("lock")}
                                  className="sr-only"
                                />
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 transition-all",
                                    timezoneDisplay === "lock"
                                      ? "border-blue-600 bg-white"
                                      : "border-slate-300 group-hover:border-slate-400",
                                  )}
                                />
                                {timezoneDisplay === "lock" && (
                                  <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600" />
                                )}
                              </div>
                              <span className="text-sm text-slate-700">
                                Lock the timezone (best for in-person events)
                              </span>
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Invitee form Section */}
                <div className="py-6 border-b border-slate-100">
                  <div
                    className="group cursor-pointer"
                    onClick={() => toggleSection("Invitee form")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-slate-900">
                        Invitee form
                      </span>
                      {expandedSection === "Invitee form" ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                    {expandedSection !== "Invitee form" && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {inviteeDetailType === "name_email"
                            ? "Name, Email"
                            : "First Name, Last Name, Email"}
                          {questions.length > 0
                            ? ` • +${questions.length} question${questions.length > 1 ? "s" : ""}`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {expandedSection === "Invitee form" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 space-y-8"
                      >
                        {/* Invitee details */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-1">
                            Invitee details
                          </h4>
                          <p className="text-xs text-slate-500 mb-3">
                            Collect invitees first name and email, or full name
                            and email
                          </p>

                          <div className="border-l-2 border-slate-100 pl-4 py-2 space-y-4">
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setIsDetailTypeDropdownOpen(
                                    !isDetailTypeDropdownOpen,
                                  )
                                }
                                className={cn(
                                  "w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm transition-all bg-white",
                                  isDetailTypeDropdownOpen
                                    ? "border-blue-500 ring-2 ring-blue-100"
                                    : "border-slate-200 hover:border-slate-300",
                                )}
                              >
                                <span className="text-slate-700">
                                  {inviteeDetailType === "name_email"
                                    ? "Name, Email"
                                    : "First Name, Last Name, Email"}
                                </span>
                                <ChevronDown
                                  className={cn(
                                    "w-4 h-4 text-slate-400 transition-transform",
                                    isDetailTypeDropdownOpen &&
                                      "rotate-180 text-blue-500",
                                  )}
                                />
                              </button>
                              <AnimatePresence>
                                {isDetailTypeDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1"
                                  >
                                    {[
                                      {
                                        id: "name_email",
                                        label: "Name, Email",
                                      },
                                      {
                                        id: "first_last_email",
                                        label: "First Name, Last Name, Email",
                                      },
                                    ].map((opt) => (
                                      <button
                                        key={opt.id}
                                        onClick={() => {
                                          setInviteeDetailType(opt.id as any);
                                          setIsDetailTypeDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                                      >
                                        <span>{opt.label}</span>
                                        {inviteeDetailType === opt.id && (
                                          <div className="w-4 h-4 flex items-center justify-center">
                                            <div className="w-2 h-3.5 border-b-2 border-r-2 border-blue-600 rotate-45 mb-1" />
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer group">
                              <div className="relative flex items-center justify-center mt-0.5">
                                <input
                                  type="checkbox"
                                  checked={autofillEnabled}
                                  onChange={(e) =>
                                    setAutofillEnabled(e.target.checked)
                                  }
                                  className="sr-only"
                                />
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                                    autofillEnabled
                                      ? "border-blue-600 bg-blue-600"
                                      : "border-slate-300 group-hover:border-slate-400 bg-white",
                                  )}
                                >
                                  {autofillEnabled && (
                                    <div className="w-1.5 h-2.5 border-b-2 border-r-2 border-white rotate-45 mb-0.5" />
                                  )}
                                </div>
                              </div>
                              <span className="text-sm text-slate-700">
                                Autofill Invitee Name, Email, and Text Reminder
                                Phone Number (when applicable) from prior
                                bookings
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Invitee guests */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-1">
                            Invitee guests
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">
                              Allow invitees to add guests
                            </span>
                            <button
                              onClick={() => setAllowGuests(!allowGuests)}
                              className={cn(
                                "w-10 h-5 rounded-full transition-colors relative",
                                allowGuests ? "bg-blue-600" : "bg-slate-200",
                              )}
                            >
                              <div
                                className={cn(
                                  "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                  allowGuests ? "right-1" : "left-1",
                                )}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Invitee questions */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900">
                              Invitee questions
                            </h4>
                          </div>

                          <div className="space-y-8">
                            {questions.map((q, idx) => (
                              <div
                                key={q.id}
                                className="border-l-2 border-slate-100 pl-6 py-2 space-y-6 relative group/question"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                                    <span className="text-base font-bold text-slate-900">
                                      Question {idx + 1}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setQuestions(
                                        questions.filter(
                                          (item) => item.id !== q.id,
                                        ),
                                      )
                                    }
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>

                                <div className="space-y-4">
                                  <textarea
                                    value={q.label}
                                    onChange={(e) => {
                                      const newQuestions = [...questions];
                                      newQuestions[idx].label = e.target.value;
                                      setQuestions(newQuestions);
                                    }}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none min-h-[100px] font-medium text-slate-700"
                                    placeholder="Enter your question"
                                  />

                                  <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                    <div className="relative flex items-center justify-center">
                                      <input
                                        type="checkbox"
                                        checked={q.required}
                                        onChange={(e) => {
                                          const newQuestions = [...questions];
                                          newQuestions[idx].required =
                                            e.target.checked;
                                          setQuestions(newQuestions);
                                        }}
                                        className="sr-only"
                                      />
                                      <div
                                        className={cn(
                                          "w-6 h-6 rounded border-2 transition-all flex items-center justify-center",
                                          q.required
                                            ? "border-blue-600 bg-blue-600"
                                            : "border-slate-300 group-hover:border-slate-400 bg-white",
                                        )}
                                      >
                                        {q.required && (
                                          <div className="w-2 h-3.5 border-b-2 border-r-2 border-white rotate-45 mb-1" />
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-base font-medium text-slate-700">
                                      Required
                                    </span>
                                  </label>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-base font-bold text-slate-900 block">
                                    Answer Type
                                  </label>
                                  <div className="relative">
                                    <button
                                      onClick={() =>
                                        setActiveQuestionDropdown(
                                          activeQuestionDropdown === q.id
                                            ? null
                                            : q.id,
                                        )
                                      }
                                      className={cn(
                                        "w-full flex items-center justify-between px-4 py-3.5 border rounded-xl text-base transition-all bg-white font-medium",
                                        activeQuestionDropdown === q.id
                                          ? "border-blue-500 ring-2 ring-blue-100"
                                          : "border-slate-200 hover:border-slate-300",
                                      )}
                                    >
                                      <span>
                                        {q.type === "text" && "One Line"}
                                        {q.type === "textarea" &&
                                          "Multiple Lines"}
                                        {q.type === "radio" && "Radio Buttons"}
                                        {q.type === "checkbox" && "Checkboxes"}
                                        {q.type === "select" && "Dropdown"}
                                        {q.type === "phone" && "Phone Number"}
                                      </span>
                                      <ChevronDown
                                        className={cn(
                                          "w-5 h-5 text-slate-400 transition-transform",
                                          activeQuestionDropdown === q.id &&
                                            "rotate-180 text-blue-500",
                                        )}
                                      />
                                    </button>
                                    <AnimatePresence>
                                      {activeQuestionDropdown === q.id && (
                                        <motion.div
                                          initial={{ opacity: 0, y: 5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: 5 }}
                                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-2 overflow-hidden"
                                        >
                                          {[
                                            { id: "text", label: "One Line" },
                                            {
                                              id: "textarea",
                                              label: "Multiple Lines",
                                            },
                                            {
                                              id: "radio",
                                              label: "Radio Buttons",
                                            },
                                            {
                                              id: "checkbox",
                                              label: "Checkboxes",
                                            },
                                            { id: "select", label: "Dropdown" },
                                            {
                                              id: "phone",
                                              label: "Phone Number",
                                            },
                                          ].map((opt) => (
                                            <button
                                              key={opt.id}
                                              onClick={() => {
                                                const newQuestions = [
                                                  ...questions,
                                                ];
                                                newQuestions[idx].type =
                                                  opt.id as any;
                                                if (
                                                  [
                                                    "radio",
                                                    "checkbox",
                                                    "select",
                                                  ].includes(opt.id) &&
                                                  (!newQuestions[idx].options ||
                                                    newQuestions[idx].options
                                                      ?.length === 0)
                                                ) {
                                                  newQuestions[idx].options = [
                                                    "",
                                                    "",
                                                    "",
                                                  ];
                                                }
                                                setQuestions(newQuestions);
                                                setActiveQuestionDropdown(null);
                                              }}
                                              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 text-base text-slate-700 transition-colors font-medium"
                                            >
                                              <span>{opt.label}</span>
                                              {q.type === opt.id && (
                                                <div className="w-5 h-5 flex items-center justify-center">
                                                  <div className="w-2 h-4 border-b-2 border-r-2 border-blue-600 rotate-45 mb-1" />
                                                </div>
                                              )}
                                            </button>
                                          ))}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>

                                {/* Options for Radio/Checkbox/Select */}
                                {["radio", "checkbox", "select"].includes(
                                  q.type,
                                ) && (
                                  <div className="space-y-4 pl-4 border-l-2 border-slate-50">
                                    {q.options?.map((option, optIdx) => (
                                      <div key={optIdx} className="space-y-1">
                                        <div className="flex items-center gap-3">
                                          <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                                          <div className="flex-1 relative">
                                            <input
                                              type="text"
                                              value={option}
                                              onChange={(e) => {
                                                const newQuestions = [
                                                  ...questions,
                                                ];
                                                if (newQuestions[idx].options) {
                                                  newQuestions[idx].options![
                                                    optIdx
                                                  ] = e.target.value;
                                                  setQuestions(newQuestions);
                                                }
                                              }}
                                              className={cn(
                                                "w-full px-4 py-3.5 border rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium",
                                                !option &&
                                                  "border-red-200 bg-red-50/30",
                                              )}
                                              placeholder={`Option ${optIdx + 1}`}
                                            />
                                          </div>
                                          <button
                                            onClick={() => {
                                              const newQuestions = [
                                                ...questions,
                                              ];
                                              if (newQuestions[idx].options) {
                                                newQuestions[idx].options =
                                                  newQuestions[
                                                    idx
                                                  ].options!.filter(
                                                    (_, i) => i !== optIdx,
                                                  );
                                                setQuestions(newQuestions);
                                              }
                                            }}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                          >
                                            <Trash2 className="w-5 h-5" />
                                          </button>
                                        </div>
                                        {!option && (
                                          <p className="text-xs text-red-500 font-medium ml-7">
                                            This field is required
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const newQuestions = [...questions];
                                        if (newQuestions[idx].options) {
                                          newQuestions[idx].options!.push("");
                                          setQuestions(newQuestions);
                                        }
                                      }}
                                      className="flex items-center gap-2 text-blue-600 text-base font-bold hover:text-blue-700 transition-colors ml-7"
                                    >
                                      <Plus className="w-5 h-5" />
                                      Add another
                                    </button>

                                    <label className="flex items-center gap-3 cursor-pointer group w-fit ml-7 pt-2">
                                      <div className="relative flex items-center justify-center">
                                        <input
                                          type="checkbox"
                                          checked={q.includeOther}
                                          onChange={(e) => {
                                            const newQuestions = [...questions];
                                            newQuestions[idx].includeOther =
                                              e.target.checked;
                                            setQuestions(newQuestions);
                                          }}
                                          className="sr-only"
                                        />
                                        <div
                                          className={cn(
                                            "w-6 h-6 rounded border-2 transition-all flex items-center justify-center",
                                            q.includeOther
                                              ? "border-blue-600 bg-blue-600"
                                              : "border-slate-300 group-hover:border-slate-400 bg-white",
                                          )}
                                        >
                                          {q.includeOther && (
                                            <div className="w-2 h-3.5 border-b-2 border-r-2 border-white rotate-45 mb-1" />
                                          )}
                                        </div>
                                      </div>
                                      <span className="text-base font-medium text-slate-700">
                                        Include "Other" option
                                      </span>
                                    </label>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <label className="text-base font-bold text-slate-900 block">
                                    Status
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <span className="text-base font-medium text-slate-500">
                                      {q.status ? "On" : "Off"}
                                    </span>
                                    <button
                                      onClick={() => {
                                        const newQuestions = [...questions];
                                        newQuestions[idx].status =
                                          !newQuestions[idx].status;
                                        setQuestions(newQuestions);
                                      }}
                                      className={cn(
                                        "w-12 h-6 rounded-full transition-colors relative",
                                        q.status
                                          ? "bg-blue-600"
                                          : "bg-slate-200",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                          q.status ? "right-1" : "left-1",
                                        )}
                                      />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              setQuestions([
                                ...questions,
                                {
                                  id: Math.random().toString(36).substr(2, 9),
                                  label: "",
                                  type: "textarea",
                                  required: false,
                                  status: true,
                                  options: ["", "", ""],
                                  includeOther: false,
                                },
                              ]);
                            }}
                            className="flex items-center gap-2 text-blue-600 text-base font-bold hover:text-blue-700 transition-colors pt-4"
                          >
                            <Plus className="w-5 h-5" />
                            Add new question
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Payment Section */}
                <div className="py-6 border-b border-slate-100">
                  <div
                    className="group cursor-pointer"
                    onClick={() => toggleSection("Payment")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-slate-900">
                        Payment
                      </span>
                      {expandedSection === "Payment" ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                    {expandedSection !== "Payment" && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <CircleDollarSign className="w-4 h-4" />
                        <span>Collect payment for your event</span>
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {expandedSection === "Payment" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4"
                      >
                        <div className="bg-blue-50/50 rounded-xl p-6 text-center space-y-4 border border-blue-100/50">
                          <div className="space-y-2">
                            <h4 className="text-base font-bold text-slate-900">
                              Connect a payment processor
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed max-w-[280px] mx-auto">
                              To collect payments with Calendly, you must first
                              connect either Stripe or PayPal to your Calendly
                              account.
                            </p>
                          </div>
                          <div className="relative inline-block">
                            <button
                              onMouseEnter={() => setShowPaymentTooltip(true)}
                              onMouseLeave={() => setShowPaymentTooltip(false)}
                              onClick={() => {
                                setShowPaymentTooltip(true);
                                setTimeout(
                                  () => setShowPaymentTooltip(false),
                                  2000,
                                );
                              }}
                              className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-400 transition-all shadow-md shadow-blue-100"
                            >
                              Go to integrations
                            </button>

                            <AnimatePresence>
                              {showPaymentTooltip && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10, x: "-50%" }}
                                  animate={{ opacity: 1, y: 0, x: "-50%" }}
                                  exit={{ opacity: 0, y: 10, x: "-50%" }}
                                  className="absolute bottom-full left-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg whitespace-nowrap z-[70] pointer-events-none"
                                >
                                  Coming soon
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Notifications and workflows Section */}
                <div className="py-6 border-b border-slate-100">
                  <div
                    className="group cursor-pointer"
                    onClick={() => toggleSection("Notifications and workflows")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-slate-900">
                        Notifications and workflows
                      </span>
                      {expandedSection === "Notifications and workflows" ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                    {expandedSection !== "Notifications and workflows" && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Bell className="w-4 h-4" />
                        <span>Calendar invitations</span>
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {expandedSection === "Notifications and workflows" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 space-y-6"
                      >
                        {/* Workflows */}
                        <div className="space-y-3 relative">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900">
                              Workflows
                            </h4>
                            <button
                              onClick={() =>
                                setActiveInfoPopup(
                                  activeInfoPopup === "workflows"
                                    ? null
                                    : "workflows",
                                )
                              }
                              className="focus:outline-none"
                            >
                              <Info
                                className={cn(
                                  "w-4 h-4 transition-colors",
                                  activeInfoPopup === "workflows"
                                    ? "text-blue-900"
                                    : "text-slate-400 hover:text-blue-900",
                                )}
                              />
                            </button>
                          </div>

                          <AnimatePresence>
                            {activeInfoPopup === "workflows" && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute left-0 top-8 w-full max-w-[320px] bg-[#0A2540] text-white p-6 rounded-2xl shadow-2xl z-[60] space-y-6"
                              >
                                <p className="text-sm leading-relaxed font-medium">
                                  Workflows are automated pre- and post-meeting
                                  emails and texts sent to invitees or hosts.
                                  They're fully customizable, and can be applied
                                  to multiple events, making them easy to manage
                                  and update.
                                </p>
                                <button
                                  onClick={() => setActiveInfoPopup(null)}
                                  className="w-full py-3 border border-white/30 rounded-full text-sm font-bold hover:bg-white/10 transition-colors"
                                >
                                  Got it
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex gap-3">
                            <Lock className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700 leading-relaxed">
                              Only the owner of the event type can make changes
                              to workflows
                            </p>
                          </div>

                          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex items-center justify-center">
                            <span className="text-slate-400 font-medium">
                              None
                            </span>
                          </div>
                        </div>

                        {/* Basic notifications */}
                        <div className="space-y-3 relative">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900">
                              Basic notifications
                            </h4>
                            <button
                              onClick={() =>
                                setActiveInfoPopup(
                                  activeInfoPopup === "basic" ? null : "basic",
                                )
                              }
                              className="focus:outline-none"
                            >
                              <Info
                                className={cn(
                                  "w-4 h-4 transition-colors",
                                  activeInfoPopup === "basic"
                                    ? "text-blue-900"
                                    : "text-slate-400 hover:text-blue-900",
                                )}
                              />
                            </button>
                          </div>

                          <AnimatePresence>
                            {activeInfoPopup === "basic" && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute left-0 top-8 w-full max-w-[320px] bg-[#0A2540] text-white p-6 rounded-2xl shadow-2xl z-[60] space-y-6"
                              >
                                <div className="space-y-4">
                                  <p className="text-sm leading-relaxed font-medium">
                                    Basic notifications apply to this event
                                    only.
                                  </p>
                                  <p className="text-sm leading-relaxed font-medium">
                                    For more flexible notifications that scale
                                    across events, see workflows (above).
                                    Workflows include additional templates, and
                                    can be sent to invitees and hosts.
                                  </p>
                                </div>
                                <button
                                  onClick={() => setActiveInfoPopup(null)}
                                  className="w-full py-3 border border-white/30 rounded-full text-sm font-bold hover:bg-white/10 transition-colors"
                                >
                                  Got it
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                            {/* Calendar invitation */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                  <Mail className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">
                                    Calendar invitation
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Immediately after booking
                                  </p>
                                </div>
                              </div>
                              <div className="relative">
                                <button
                                  onClick={() => {
                                    setActiveMoreTooltip(
                                      activeMoreTooltip === "calendar"
                                        ? null
                                        : "calendar",
                                    );
                                    if (activeMoreTooltip !== "calendar") {
                                      setTimeout(
                                        () => setActiveMoreTooltip(null),
                                        2000,
                                      );
                                    }
                                  }}
                                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors group/dots"
                                >
                                  <MoreVertical className="w-5 h-5 text-slate-400 group-hover/dots:text-slate-900" />
                                </button>
                                <AnimatePresence>
                                  {activeMoreTooltip === "calendar" && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 5, x: "-50%" }}
                                      animate={{ opacity: 1, y: 0, x: "-50%" }}
                                      exit={{ opacity: 0, y: 5, x: "-50%" }}
                                      className="absolute bottom-full left-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg whitespace-nowrap z-[70] pointer-events-none"
                                    >
                                      Coming soon
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            {/* Email reminders */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                  <Mail className="w-5 h-5 text-slate-600" />
                                </div>
                                <p className="text-sm font-bold text-slate-900">
                                  Email reminders
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded tracking-wider">
                                  Off
                                </span>
                                <div className="relative">
                                  <button
                                    onClick={() => {
                                      setActiveMoreTooltip(
                                        activeMoreTooltip === "email_reminders"
                                          ? null
                                          : "email_reminders",
                                      );
                                      if (
                                        activeMoreTooltip !== "email_reminders"
                                      ) {
                                        setTimeout(
                                          () => setActiveMoreTooltip(null),
                                          2000,
                                        );
                                      }
                                    }}
                                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors group/dots"
                                  >
                                    <MoreVertical className="w-5 h-5 text-slate-400 group-hover/dots:text-slate-900" />
                                  </button>
                                  <AnimatePresence>
                                    {activeMoreTooltip ===
                                      "email_reminders" && (
                                      <motion.div
                                        initial={{
                                          opacity: 0,
                                          y: 5,
                                          x: "-50%",
                                        }}
                                        animate={{
                                          opacity: 1,
                                          y: 0,
                                          x: "-50%",
                                        }}
                                        exit={{ opacity: 0, y: 5, x: "-50%" }}
                                        className="absolute bottom-full left-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg whitespace-nowrap z-[70] pointer-events-none"
                                      >
                                        Coming soon
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>

                            {/* Text reminders */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                  <MessageSquare className="w-5 h-5 text-slate-600" />
                                </div>
                                <p className="text-sm font-bold text-slate-900">
                                  Text reminders
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded tracking-wider">
                                  Off
                                </span>
                                <div className="relative">
                                  <button
                                    onClick={() => {
                                      setActiveMoreTooltip(
                                        activeMoreTooltip === "text_reminders"
                                          ? null
                                          : "text_reminders",
                                      );
                                      if (
                                        activeMoreTooltip !== "text_reminders"
                                      ) {
                                        setTimeout(
                                          () => setActiveMoreTooltip(null),
                                          2000,
                                        );
                                      }
                                    }}
                                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors group/dots"
                                  >
                                    <MoreVertical className="w-5 h-5 text-slate-400 group-hover/dots:text-slate-900" />
                                  </button>
                                  <AnimatePresence>
                                    {activeMoreTooltip === "text_reminders" && (
                                      <motion.div
                                        initial={{
                                          opacity: 0,
                                          y: 5,
                                          x: "-50%",
                                        }}
                                        animate={{
                                          opacity: 1,
                                          y: 0,
                                          x: "-50%",
                                        }}
                                        exit={{ opacity: 0, y: 5, x: "-50%" }}
                                        className="absolute bottom-full left-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg whitespace-nowrap z-[70] pointer-events-none"
                                      >
                                        Coming soon
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>

                            {/* Email follow-up */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                  <Mail className="w-5 h-5 text-slate-600" />
                                </div>
                                <p className="text-sm font-bold text-slate-900">
                                  Email follow-up
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded tracking-wider">
                                  Off
                                </span>
                                <div className="relative">
                                  <button
                                    onClick={() => {
                                      setActiveMoreTooltip(
                                        activeMoreTooltip === "email_followup"
                                          ? null
                                          : "email_followup",
                                      );
                                      if (
                                        activeMoreTooltip !== "email_followup"
                                      ) {
                                        setTimeout(
                                          () => setActiveMoreTooltip(null),
                                          2000,
                                        );
                                      }
                                    }}
                                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors group/dots"
                                  >
                                    <MoreVertical className="w-5 h-5 text-slate-400 group-hover/dots:text-slate-900" />
                                  </button>
                                  <AnimatePresence>
                                    {activeMoreTooltip === "email_followup" && (
                                      <motion.div
                                        initial={{
                                          opacity: 0,
                                          y: 5,
                                          x: "-50%",
                                        }}
                                        animate={{
                                          opacity: 1,
                                          y: 0,
                                          x: "-50%",
                                        }}
                                        exit={{ opacity: 0, y: 5, x: "-50%" }}
                                        className="absolute bottom-full left-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg whitespace-nowrap z-[70] pointer-events-none"
                                      >
                                        Coming soon
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confirmation page Section */}
                <div className="py-6 border-b border-slate-100">
                  <div
                    className="group cursor-pointer"
                    onClick={() => toggleSection("Confirmation page")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold text-slate-900">
                        Confirmation page
                      </span>
                      {expandedSection === "Confirmation page" ? (
                        <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>
                    {expandedSection !== "Confirmation page" && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <CheckSquare className="w-4 h-4" />
                        <span>Display confirmation page</span>
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {expandedSection === "Confirmation page" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-6 space-y-8"
                      >
                        {/* After booking dropdown */}
                        <div className="space-y-3">
                          <label className="text-base font-medium text-slate-900">
                            After booking
                          </label>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setIsAfterBookingDropdownOpen(
                                  !isAfterBookingDropdownOpen,
                                )
                              }
                              className={cn(
                                "w-full flex items-center justify-between px-4 py-3 border rounded-xl transition-all text-left",
                                isAfterBookingDropdownOpen
                                  ? "border-blue-600 ring-4 ring-blue-50"
                                  : "border-slate-200 hover:border-slate-300",
                              )}
                            >
                              <span className="text-slate-900">
                                {afterBookingOption}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "w-5 h-5 text-blue-600 transition-transform",
                                  isAfterBookingDropdownOpen && "rotate-180",
                                )}
                              />
                            </button>

                            <AnimatePresence>
                              {isAfterBookingDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
                                >
                                  <div
                                    className="px-4 py-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer group"
                                    onClick={() => {
                                      setAfterBookingOption(
                                        "Display confirmation page",
                                      );
                                      setIsAfterBookingDropdownOpen(false);
                                    }}
                                  >
                                    <span className="text-slate-900">
                                      Display confirmation page
                                    </span>
                                    {afterBookingOption ===
                                      "Display confirmation page" && (
                                      <CheckSquare className="w-5 h-5 text-blue-600" />
                                    )}
                                  </div>
                                  <div
                                    className="px-4 py-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer group"
                                    onClick={() => {
                                      // Optional: show coming soon tooltip or just keep it as is
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-slate-900">
                                        Redirect to an external site
                                      </span>
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded tracking-wider">
                                        Coming soon
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Links on confirmation page */}
                        <div className="space-y-6">
                          <label className="text-base font-medium text-slate-900">
                            Links on confirmation page
                          </label>

                          <div className="space-y-6">
                            {confirmationLinks.map((link, index) => (
                              <div
                                key={link.id}
                                className="relative pl-6 border-l-2 border-slate-100 space-y-4"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {link.isDefault && (
                                      <Lock className="w-4 h-4 text-slate-900" />
                                    )}
                                    <span className="text-sm font-bold text-slate-900">
                                      Link name
                                    </span>
                                  </div>
                                  {!link.isDefault && (
                                    <button
                                      onClick={() =>
                                        setConfirmationLinks(
                                          confirmationLinks.filter(
                                            (l) => l.id !== link.id,
                                          ),
                                        )
                                      }
                                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  <input
                                    type="text"
                                    value={link.name}
                                    onChange={(e) => {
                                      const newLinks = [...confirmationLinks];
                                      newLinks[index].name = e.target.value;
                                      setConfirmationLinks(newLinks);
                                    }}
                                    placeholder="Link name"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all text-slate-900"
                                  />

                                  {!link.isDefault && (
                                    <input
                                      type="text"
                                      value={link.url}
                                      onChange={(e) => {
                                        const newLinks = [...confirmationLinks];
                                        newLinks[index].url = e.target.value;
                                        setConfirmationLinks(newLinks);
                                      }}
                                      placeholder="https://example.com"
                                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all text-slate-900"
                                    />
                                  )}
                                </div>

                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-slate-600">
                                    Status
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-900">
                                      {link.status ? "On" : "Off"}
                                    </span>
                                    <button
                                      onClick={() => {
                                        const newLinks = [...confirmationLinks];
                                        newLinks[index].status =
                                          !newLinks[index].status;
                                        setConfirmationLinks(newLinks);
                                      }}
                                      className={cn(
                                        "w-10 h-5 rounded-full relative transition-colors",
                                        link.status
                                          ? "bg-blue-600"
                                          : "bg-slate-200",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                                          link.status
                                            ? "left-[22px]"
                                            : "left-0.5",
                                        )}
                                      />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() =>
                              setConfirmationLinks([
                                ...confirmationLinks,
                                {
                                  id: Math.random().toString(),
                                  name: "",
                                  url: "",
                                  isDefault: false,
                                  status: true,
                                },
                              ])
                            }
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add new link
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Other Sections (Placeholders) */}
                {moreOptionsSections.slice(8).map((section, idx) => (
                  <div
                    key={idx}
                    className="py-6 border-b border-slate-100 last:border-0"
                  >
                    <div className="group cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg font-bold text-slate-900">
                          {section.title}
                        </span>
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <section.icon className="w-4 h-4" />
                        <span>{section.desc}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-4 bg-white">
          <div className="flex items-center gap-4">
            {!showMoreOptions ? (
              <button
                onClick={() => setShowMoreOptions(true)}
                className="text-slate-600 hover:text-slate-900 transition-colors font-bold text-sm"
              >
                More options
              </button>
            ) : (
              <button
                onClick={() => setShowMoreOptions(false)}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors font-bold text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            <button
              onClick={() => {
                if (
                  dateRangeKind === "range" &&
                  (!dateRangeStart || !dateRangeEnd)
                ) {
                  toast.error("Please select a date range");
                  setIsDateRangeExpanded(true);
                  setIsFixedDatePickerOpen(true);
                  return;
                }

                let durationValue = 30;
                if (duration === "15 min") durationValue = 15;
                else if (duration === "30 min") durationValue = 30;
                else if (duration === "45 min") durationValue = 45;
                else if (duration === "1 hr") durationValue = 60;
                else if (duration === "Custom") {
                  durationValue = parseInt(customValue) || 30;
                  if (customUnit === "hr") durationValue *= 60;
                }

                onCreate({
                  title: eventName,
                  duration: durationValue,
                  color: eventColor,
                  schedule_id: useCustomSchedule ? null : selectedScheduleId,
                  description,
                  buffer_before: bufferBefore,
                  buffer_after: bufferAfter,
                  meeting_limit_count: showLimitSettings
                    ? meetingLimitCount
                    : null,
                  meeting_limit_period: showLimitSettings
                    ? meetingLimitPeriod
                    : null,
                  slug: slug,
                  time_increment: timeIncrement,
                  timezone_display: timezoneDisplay,
                  invitee_detail_type: inviteeDetailType,
                  autofill_enabled: autofillEnabled,
                  allow_guests: allowGuests,
                  questions: questions,
                  confirmation_type:
                    afterBookingOption === "Redirect to an external site"
                      ? "redirect"
                      : "display",
                  confirmation_links: confirmationLinks,
                  date_range_kind: dateRangeKind,
                  date_range_value: dateRangeValue,
                  date_range_type: dateRangeType,
                  date_range_start: dateRangeStart || null,
                  date_range_end: dateRangeEnd || null,
                  minimum_notice: minimumNotice,
                  use_custom_schedule: useCustomSchedule,
                  custom_weekly_hours: useCustomSchedule
                    ? customWeeklyHours
                    : null,
                  custom_date_overrides: useCustomSchedule
                    ? customDateOverrides
                    : null,
                });
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-colors"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>

      {/* Date Override Modal */}
      <AnimatePresence>
        {isOverrideModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOverrideModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[900px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Left Side: Calendar */}
              <div className="flex-1 p-8 border-r border-[#f1f5f9] overflow-y-auto">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1e293b] mb-2">
                    Select the date(s) you want to assign specific hours
                  </h2>
                </div>

                <div className="space-y-8">
                  {/* Search and Quick Selection could be here */}
                  <div className="bg-[#f8fafc] p-1 rounded-xl flex gap-1 mb-8">
                    <button className="flex-1 py-2 text-sm font-bold bg-white rounded-lg shadow-sm text-blue-600">
                      Calendar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    {renderOverrideCalendar(currentMonth)}
                  </div>
                </div>
              </div>

              {/* Right Side: Hours */}
              <div className="w-full md:w-[380px] p-8 bg-[#f8fafc] flex flex-col overflow-y-auto">
                <div className="mb-8">
                  <h3 className="font-bold text-[#1e293b] mb-2">
                    What hours are you available?
                  </h3>
                  {modalSelectedDates.length > 0 ? (
                    <p className="text-sm text-[#64748b]">
                      Applying to {modalSelectedDates.length}{" "}
                      {modalSelectedDates.length === 1 ? "date" : "dates"}
                    </p>
                  ) : (
                    <p className="text-sm text-[#64748b]">
                      Select dates on the calendar first
                    </p>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  {modalSelectedDates.length > 0 && (
                    <div className="space-y-3">
                      {modalSlots.map((slot, sIdx) => (
                        <div key={slot.id} className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <button
                              onClick={() =>
                                setOpenPicker({
                                  dayIndex: "modal",
                                  slotId: slot.id,
                                  type: "start",
                                })
                              }
                              className="w-full px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm font-bold text-[#334155] hover:border-blue-600 transition-all text-center"
                            >
                              {slot.start}
                            </button>
                            <TimePicker
                              value={slot.start}
                              isOpen={
                                openPicker?.dayIndex === "modal" &&
                                openPicker?.slotId === slot.id &&
                                openPicker?.type === "start"
                              }
                              onClose={() => setOpenPicker(null)}
                              onChange={(time) =>
                                updateSlot("modal", slot.id, "start", time)
                              }
                              isModal
                            />
                          </div>
                          <span className="text-[#94a3b8]">-</span>
                          <div className="relative flex-1">
                            <button
                              onClick={() =>
                                setOpenPicker({
                                  dayIndex: "modal",
                                  slotId: slot.id,
                                  type: "end",
                                })
                              }
                              className="w-full px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm font-bold text-[#334155] hover:border-blue-600 transition-all text-center"
                            >
                              {slot.end}
                            </button>
                            <TimePicker
                              value={slot.end}
                              isOpen={
                                openPicker?.dayIndex === "modal" &&
                                openPicker?.slotId === slot.id &&
                                openPicker?.type === "end"
                              }
                              onClose={() => setOpenPicker(null)}
                              onChange={(time) =>
                                updateSlot("modal", slot.id, "end", time)
                              }
                              minTime={slot.start}
                              isModal
                            />
                          </div>
                          <button
                            onClick={() =>
                              setModalSlots((prev) =>
                                prev.filter((s) => s.id !== slot.id),
                              )
                            }
                            className="p-1 text-[#94a3b8] hover:text-[#ef4444]"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          setModalSlots((prev) => [
                            ...prev,
                            {
                              id: Math.random().toString(36).substr(2, 9),
                              start: "9:00am",
                              end: "5:00pm",
                            },
                          ])
                        }
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add another interval
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    disabled={modalSelectedDates.length === 0}
                    onClick={applyOverride}
                    className="w-full py-3 bg-[#1e293b] text-white rounded-xl font-bold hover:bg-[#0f172a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setIsOverrideModalOpen(false)}
                    className="w-full py-3 text-[#64748b] font-bold hover:text-[#1e293b]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFixedDatePickerOpen && (
          <motion.div
            ref={datePickerRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ top: datePickerTop, right: 416 }}
            className="fixed bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] p-8 flex flex-col gap-8 min-w-[650px]"
          >
            <div className="flex flex-col sm:flex-row gap-12">
              {renderCalendar(viewDate)}
              <div className="hidden sm:block border-l border-slate-100" />
              {renderCalendar(addMonths(viewDate, 1))}
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setTempDateRangeStart(dateRangeStart);
                  setTempDateRangeEnd(dateRangeEnd);
                  setIsFixedDatePickerOpen(false);
                }}
                className="px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!tempDateRangeStart || !tempDateRangeEnd}
                onClick={() => {
                  setDateRangeStart(tempDateRangeStart);
                  setDateRangeEnd(tempDateRangeEnd);
                  setIsFixedDatePickerOpen(false);
                }}
                className={cn(
                  "px-8 py-2.5 text-sm font-bold rounded-full transition-all",
                  tempDateRangeStart && tempDateRangeEnd
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed",
                )}
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};
