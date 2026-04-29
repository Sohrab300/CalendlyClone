import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Loader2, Globe, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { format, addMinutes, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import {
  useParams,
  Navigate,
  useLocation,
  Link,
  useNavigate,
} from "react-router-dom";
import { EventInfo } from "../components/EventInfo";
import { Calendar } from "../components/Calendar";
import { TimeSlots } from "../components/TimeSlots";
import { BookingForm } from "../components/BookingForm";
import { SuccessPage } from "../components/SuccessPage";
import { VerificationStep } from "../components/VerificationStep";
import { TimeZoneSelector } from "../components/TimeZoneSelector";
import CookieSettingsPanel from "../components/CookieSettingsPanel";
import { MOCK_EVENTS } from "../constants";
import {
  availabilityService,
  DayAvailability,
  DateOverride,
  Booking,
  EventType,
  getAvailableTimeSlots,
} from "../services/availabilityService";

type ViewState = "calendar" | "details" | "success" | "verification";

export default function SchedulingPage() {
  const { userSlug, eventSlug } = useParams<{
    userSlug: string;
    eventSlug: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [event, setEvent] = React.useState<EventType | null>(null);
  const [hostProfile, setHostProfile] = React.useState<any>(null);

  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [view, setView] = React.useState<ViewState>("calendar");
  const [pendingData, setPendingData] = React.useState<any>(null);
  const [timezone, setTimezone] = React.useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [is24Hour, setIs24Hour] = React.useState(false);
  const [mobileStep, setMobileStep] = React.useState<"date" | "time">("date");
  const [isSelectorOpen, setIsSelectorOpen] = React.useState(false);
  const [isCookieSettingsOpen, setIsCookieSettingsOpen] = React.useState(false);
  const [now, setNow] = React.useState(new Date());
  const cameFromLandingPage = Boolean((location.state as any)?.fromLandingPage);
  const landingPath = (location.state as any)?.landingPath || `/${userSlug}`;

  // Update the clock every minute for timezone label
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const getTimezoneLabel = (tz: string) => {
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "numeric",
      hour12: !is24Hour,
    });

    const nameFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "long",
    });

    const time = timeFormatter.format(now);
    const parts = nameFormatter.formatToParts(now);
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value || tz;

    return `${tzName} (${time})`;
  };

  // Availability state
  const [weeklyHours, setWeeklyHours] = React.useState<DayAvailability[]>([]);
  const [overrides, setOverrides] = React.useState<DateOverride[]>([]);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [allBookings, setAllBookings] = React.useState<Booking[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      // Force a full state reset on navigation
      setView("calendar");
      setSelectedDate(null);
      setSelectedTime(null);
      setPendingData(null);
      setMobileStep("date");
      setIsSubmitting(false);
      setBookings([]);
      setAllBookings([]);

      setIsLoading(true);
      console.log("🔄 SchedulingPage: Loading data for", {
        userSlug,
        eventSlug,
      });

      try {
        // Fetch host profile first
        const profile = userSlug
          ? await availabilityService.getProfile(userSlug).catch((err) => {
              console.error("Error fetching profile:", err);
              return null;
            })
          : null;

        if (!profile) {
          console.warn("❌ Host profile not found:", userSlug);
          setIsLoading(false);
          return;
        }

        // Fetch only this host's event types
        const events = await availabilityService
          .getEventTypes(profile.id)
          .catch((err) => {
            console.error("Error fetching host event types:", err);
            return [];
          });

        const foundEvent = events.find((e) => e.slug === eventSlug);

        if (!foundEvent) {
          console.warn("❌ Event not found:", eventSlug);
          setIsLoading(false);
          return;
        }

        setEvent(foundEvent);
        setHostProfile(profile);
        setAllBookings(
          await availabilityService.getAllBookings(profile.id).catch((err) => {
            console.error("Error fetching host bookings:", err);
            return [];
          }),
        );

        // Handle timezone display logic
        if (foundEvent.timezone_display === "lock" && profile?.timezone) {
          setTimezone(profile.timezone);
        } else {
          setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
        }

        if (foundEvent.use_custom_schedule) {
          setWeeklyHours(foundEvent.custom_weekly_hours || []);
          setOverrides(foundEvent.custom_date_overrides || []);
        } else {
          try {
            let scheduleId = foundEvent.schedule_id;

            if (!scheduleId) {
              const activeSchedule = await availabilityService
                .getActiveSchedule()
                .catch(() => null);
              scheduleId = activeSchedule?.id;
            }

            if (scheduleId) {
              const [weekly, dateOverrides] = await Promise.all([
                availabilityService.getWeeklyHours(scheduleId).catch(() => []),
                availabilityService
                  .getDateOverrides(scheduleId)
                  .catch(() => []),
              ]);
              setWeeklyHours(weekly);
              setOverrides(dateOverrides);
            }
          } catch (scheduleErr) {
            console.error("Error loading schedule:", scheduleErr);
          }
        }
      } catch (error) {
        console.error("CRITICAL: Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userSlug && eventSlug) {
      loadData();
    }
  }, [userSlug, eventSlug, location.key]); // Depend on location.key to ensure restart on "Schedule another event"

  React.useEffect(() => {
    if (selectedDate && hostProfile?.id) {
      const loadBookings = async () => {
        try {
          const dayBookings = await availabilityService.getBookings(
            selectedDate,
            hostProfile.id,
          );
          setBookings(dayBookings);
        } catch (error) {
          console.error("Error loading bookings:", error);
        }
      };
      loadBookings();
    }
  }, [selectedDate, hostProfile?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return <Navigate to="/" replace />;
  }

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return false;

    // Check date range
    if (event.date_range_kind === "relative" && event.date_range_value) {
      let maxDate = new Date(today);
      if (event.date_range_type === "calendar_days") {
        maxDate.setDate(maxDate.getDate() + event.date_range_value);
      } else if (event.date_range_type === "weekdays") {
        let added = 0;
        while (added < event.date_range_value) {
          maxDate.setDate(maxDate.getDate() + 1);
          const day = maxDate.getDay();
          if (day !== 0 && day !== 6) {
            added++;
          }
        }
      }
      if (date > maxDate) return false;
    } else if (
      event.date_range_kind === "range" &&
      event.date_range_start &&
      event.date_range_end
    ) {
      const start = new Date(event.date_range_start);
      const end = new Date(event.date_range_end);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      if (date < start || date > end) return false;
    } else if (event.date_range_kind === "indefinite") {
      // No limit into the future
    }

    return (
      getAvailableTimeSlots({
        selectedDate: date,
        is24Hour,
        weeklyHours,
        overrides,
        bookings: allBookings,
        duration: event.duration,
        timeIncrement: event.time_increment,
        hostTimezone: hostProfile?.timezone || "Asia/Kolkata",
        inviteeTimezone: timezone,
        minimumNotice: event.minimum_notice,
      }).length > 0
    );
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setMobileStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirmTime = () => {
    setView("details");
  };

  const handleBackToCalendar = () => {
    setView("calendar");
    setMobileStep("date");
  };

  const handleEventInfoBack = () => {
    if (view === "details") {
      handleBackToCalendar();
      return;
    }

    if (cameFromLandingPage) {
      navigate(landingPath);
    }
  };

  const handleBackToDate = () => {
    setMobileStep("date");
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleBookingSubmit = async (data: any) => {
    if (isSubmitting) return; // Guard against multiple submissions
    setIsSubmitting(true);

    if (event?.require_email_verification) {
      try {
        const response = await fetch("/api/verification/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            meetingName: event.title,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => null);
          throw new Error(err?.error || "Failed to send verification code");
        }

        setPendingData(data);
        setView("verification");
      } catch (err: any) {
        console.error("Verification error:", err);
        alert(
          err.message || "Failed to send verification code. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    await processFinalBooking(data);
  };

  const handleVerifyCode = async (code: string) => {
    if (!pendingData) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingData.email, code }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Invalid verification code");
      }

      await processFinalBooking(pendingData);
    } catch (err: any) {
      console.error("Verification failed:", err);
      alert(err.message || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingData || !event) return;
    const response = await fetch("/api/verification/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: pendingData.email,
        meetingName: event.title,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || "Failed to resend verification code");
    }
  };

  const processFinalBooking = async (data: any) => {
    setIsSubmitting(true);
    const dateTime = getSelectedDateTime();

    if (!dateTime || !event) {
      console.error("Missing dateTime or event:", { dateTime, event });
      alert("Unable to determine meeting time. Please re-select your slot.");
      setIsSubmitting(false);
      return;
    }

    try {
      const endTime = new Date(dateTime.getTime() + event.duration * 60000);

      const inviteeName =
        data.name ||
        (data.firstName && data.lastName
          ? `${data.firstName} ${data.lastName}`
          : data.firstName || data.lastName || "Invitee");

      // Extract fields from custom answers if they exist
      let mobileNumber = data.mobile_number;
      let companyName = data.company_name || null;

      if (event.questions) {
        event.questions.forEach((q) => {
          if (!q.status) return;
          const answer = data.customAnswers[q.id];
          if (!answer) return;

          const label = q.label.toLowerCase();
          const answerText =
            typeof answer === "string"
              ? answer
              : answer.value ||
                (Array.isArray(answer.values) ? answer.values.join(", ") : "");

          if (
            (q.type === "phone" ||
              label.includes("phone") ||
              label.includes("mobile")) &&
            !mobileNumber
          ) {
            mobileNumber = answerText;
          } else if (label.includes("company") && !companyName) {
            companyName = answerText;
          }
        });
      }

      // Save to Supabase
      await availabilityService.createBooking({
        event_slug: event.slug,
        host_id: hostProfile.id,
        start_time: dateTime.toISOString(),
        end_time: endTime.toISOString(),
        name: inviteeName,
        email: data.email,
        mobile_number: mobileNumber,
        company_name: companyName,
        notes: data.notes || "",
        timezone: timezone,
        guests: data.guests,
        custom_answers: data.customAnswers,
      });

      // Also call the mock API for email simulation
      try {
        const whatsapp =
          Object.values(data.customAnswers).find(
            (val: any) => typeof val === "string" && val.startsWith("+"),
          ) || mobileNumber;
        const automationType =
          (
            Object.values(data.customAnswers).find(
              (val: any) =>
                val &&
                typeof val === "object" &&
                Array.isArray((val as any).values),
            ) as any
          )?.values || [];

        await fetch("/api/schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            name: inviteeName,
            whatsapp,
            automationType,
            eventTitle: event.title,
            hostUsername: userSlug,
            startTime: dateTime.toLocaleString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            endTime: endTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            timezone: timezone,
            rawStartTime: dateTime.toISOString(),
            rawEndTime: endTime.toISOString(),
          }),
        });
      } catch (e) {
        console.warn("Meeting API failed, check server configuration:", e);
      }

      setView("success");
    } catch (error) {
      console.error("Error scheduling:", error);
      alert("Failed to schedule booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to combine date and time string into a Date object
  const getSelectedDateTime = () => {
    if (!selectedDate || !selectedTime) return undefined;

    let hours = 0;
    let minutes = 0;

    const match = selectedTime.match(/^(\d+):(\d+)(am|pm)?$/);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const modifier = match[3];
      if (modifier === "pm" && hours < 12) hours += 12;
      if (modifier === "am" && hours === 12) hours = 0;
    }

    // Create a date-time string in the INVITEE's timezone
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dateTimeStr = `${dateStr} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;

    // Convert invitee-local time to UTC Date object
    return fromZonedTime(dateTimeStr, timezone);
  };

  const selectedDateTime = getSelectedDateTime();

  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-4 lg:p-8 bg-slate-50">
      <motion.div
        layout
        className="bg-[#fafafa] rounded-none md:rounded-sm shadow-2xl shadow-slate-200 border-none md:border border-slate-200 w-full max-w-5xl min-h-screen md:min-h-[750px] flex flex-col lg:flex-row overflow-hidden relative"
      >
        <AnimatePresence mode="wait">
          {view === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <SuccessPage
                selectedDateTime={selectedDateTime!}
                event={event}
                timezone={timezone}
                is24Hour={is24Hour}
                hostProfile={hostProfile}
                onCookieSettingsClick={() => setIsCookieSettingsOpen(true)}
              />
            </motion.div>
          ) : view === "verification" ? (
            <motion.div
              key="verification"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full h-full bg-white flex flex-col items-center justify-center p-8 text-center"
            >
              <VerificationStep
                email={pendingData?.email}
                onVerify={handleVerifyCode}
                onResend={handleResendCode}
                onBack={() => setView("details")}
                isVerifying={isSubmitting}
              />
            </motion.div>
          ) : (
            <>
              <motion.div
                key="event-info"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "w-full lg:w-[35%] border-b lg:border-b-0 lg:border-r border-gray-200",
                  view === "calendar" &&
                    selectedDate &&
                    "hidden md:block lg:block",
                )}
              >
                <EventInfo
                  event={event}
                  selectedDateTime={
                    view === "details" ? selectedDateTime : undefined
                  }
                  timezone={timezone}
                  is24Hour={is24Hour}
                  onBack={
                    view === "details" || cameFromLandingPage
                      ? handleEventInfoBack
                      : undefined
                  }
                  showBackButtonOnDesktop={
                    view === "details" || cameFromLandingPage
                  }
                  hostProfile={hostProfile}
                  onCookieSettingsClick={() => setIsCookieSettingsOpen(true)}
                />
              </motion.div>

              <motion.div
                key="main-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full lg:w-[75%] flex flex-col"
              >
                {view === "calendar" ? (
                  <div className="flex flex-col md:flex-row w-full h-full">
                    {/* Date Selection View */}
                    <div
                      className={cn(
                        "w-full p-4 pt-6 md:p-8",
                        selectedDate ? "hidden md:block lg:w-[60%]" : "w-full",
                      )}
                    >
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-8 text-center lg:text-left">
                        <span className="md:hidden">Select a Day</span>
                        <span className="hidden md:inline">
                          Select a Date & Time
                        </span>
                      </h2>
                      <div className="flex justify-center">
                        <Calendar
                          selectedDate={selectedDate}
                          onDateSelect={handleDateSelect}
                          timezone={timezone}
                          onTimezoneChange={setTimezone}
                          is24Hour={is24Hour}
                          onFormatToggle={setIs24Hour}
                          isDateAvailable={isDateAvailable}
                          isTimezoneLocked={event.timezone_display === "lock"}
                        />
                      </div>
                    </div>

                    {/* Time Selection View */}
                    {selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full md:w-[40%] bg-white"
                      >
                        <div className="md:hidden p-4 border-b border-gray-200 flex flex-col items-center gap-4">
                          <button
                            onClick={handleBackToDate}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-300 absolute left-4"
                          >
                            <ArrowLeft className="w-7 h-7 text-blue-600" />
                          </button>
                          <div className="flex-1 text-center">
                            <h3 className="font-bold text-lg">
                              {format(selectedDate, "EEEE")}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {format(selectedDate, "MMMM d, yyyy")}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-left text-slate-900 mb-3">
                              Time zone
                            </h4>
                            <button
                              onClick={() =>
                                event.timezone_display !== "lock" &&
                                setIsSelectorOpen(true)
                              }
                              className={cn(
                                "inline-flex items-center gap-2 text-slate-700 transition-colors group mx-auto",
                                event.timezone_display === "lock"
                                  ? "cursor-default"
                                  : "hover:text-slate-900",
                              )}
                            >
                              <Globe className="w-4 h-4 text-slate-900" />
                              <span
                                className={cn(
                                  "text-sm font-medium border-b border-transparent",
                                  event.timezone_display !== "lock" &&
                                    "group-hover:border-slate-900",
                                )}
                              >
                                {getTimezoneLabel(timezone)}
                              </span>
                              {event.timezone_display !== "lock" && (
                                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        {isSelectorOpen && (
                          <div className="fixed inset-0 z-[100] md:hidden">
                            <TimeZoneSelector
                              isOpen={isSelectorOpen}
                              onClose={() => setIsSelectorOpen(false)}
                              selectedTimezone={timezone}
                              onSelect={setTimezone}
                              is24Hour={is24Hour}
                              onToggleFormat={setIs24Hour}
                            />
                          </div>
                        )}

                        <div className="py-4 md:p-0 md:pt-24 flex flex-col min-h-0">
                          <div className="hidden md:block mb-6">
                            <h3 className="text-slate-800 font-medium">
                              {format(selectedDate, "EEEE, MMMM d")}
                            </h3>
                          </div>

                          <div className="md:hidden text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                              Select a Time
                            </h2>
                            <p className="text-gray-500 mb-4">
                              Duration: {event.duration} min
                            </p>
                          </div>

                          <TimeSlots
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            onTimeSelect={handleTimeSelect}
                            onConfirm={handleConfirmTime}
                            is24Hour={is24Hour}
                            weeklyHours={weeklyHours}
                            overrides={overrides}
                            bookings={bookings}
                            duration={event.duration}
                            timeIncrement={event.time_increment}
                            hostTimezone={
                              hostProfile?.timezone || "Asia/Kolkata"
                            }
                            inviteeTimezone={timezone}
                            minimumNotice={event.minimum_notice}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <BookingForm
                    onSubmit={handleBookingSubmit}
                    isSubmitting={isSubmitting}
                    event={event}
                  />
                )}

                <div className="lg:hidden p-8 border-t border-gray-100 flex justify-center gap-6 text-sm font-medium text-blue-600">
                  <button
                    onClick={() => setIsCookieSettingsOpen(true)}
                    className="hover:underline"
                  >
                    Cookie settings
                  </button>
                  <a
                    href="https://calendly.com/legal/privacy-notice"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Privacy Policy
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <CookieSettingsPanel
          isOpen={isCookieSettingsOpen}
          onClose={() => setIsCookieSettingsOpen(false)}
        />
      </motion.div>
    </div>
  );
}
