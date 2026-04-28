import React from "react";
import { motion } from "motion/react";
import { ChevronRight, Loader2 } from "lucide-react";
import { Link, useParams, Navigate } from "react-router-dom";
import { cn } from "../lib/utils";
import CookieSettingsPanel from "../components/CookieSettingsPanel";
import {
  availabilityService,
  EventType,
} from "../services/availabilityService";

export default function LandingPage() {
  const { userSlug } = useParams<{ userSlug: string }>();
  const [events, setEvents] = React.useState<EventType[]>([]);
  const [profile, setProfile] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isCookieSettingsOpen, setIsCookieSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      if (!userSlug) return;

      try {
        const profileData = await availabilityService.getProfile(userSlug);

        if (!profileData) {
          setError("Profile not found");
          return;
        }

        const eventsData = await availabilityService.getEventTypes(
          profileData.id,
        );

        setEvents(eventsData);
        setProfile(profileData);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [userSlug]);

  const defaultWelcomeMessage =
    "Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.";
  const welcomeMessage = profile?.welcome_message || defaultWelcomeMessage;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          404 - {error || "Page not found"}
        </h1>
        <p className="text-slate-500 mb-6 text-center">
          The scheduling page you're looking for doesn't exist or may have
          moved.
        </p>
        <Link to="/admin" className="text-blue-600 font-bold hover:underline">
          Go to Admin Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg w-full max-w-6xl min-h-[680px] flex flex-col relative overflow-hidden"
      >
        <div className="flex-1 p-4 md:p-12 flex flex-col items-center">
          <h1 className="text-xl font-bold text-slate-700 mb-6">
            {profile?.full_name || "Host"}
          </h1>

          <p className="text-center text-slate-500 max-w-sm mb-12 leading-relaxed">
            {welcomeMessage}
          </p>

          <div className="h-px bg-slate-300 w-full md:w-[90%] lg:w-[80%] mb-8" />

          <div className="w-full md:w-[90%] lg:w-[80%] grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/${userSlug}/${event.slug}`}
                state={{ fromLandingPage: true, landingPath: `/${userSlug}` }}
                className="flex items-start justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors group"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full",
                          !event.color.startsWith("bg-[") && event.color,
                        )}
                        style={{
                          backgroundColor: event.color.startsWith("bg-[")
                            ? event.color.slice(4, -1)
                            : undefined,
                        }}
                      />
                      <span className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </span>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-900" />
                  </div>
                  <p className="text-sm text-slate-500 mt-8">
                    {event.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="p-8">
          <button
            onClick={() => setIsCookieSettingsOpen(true)}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Cookie settings
          </button>
        </div>
      </motion.div>

      <CookieSettingsPanel
        isOpen={isCookieSettingsOpen}
        onClose={() => setIsCookieSettingsOpen(false)}
      />
    </div>
  );
}
