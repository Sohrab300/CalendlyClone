import React from "react";
import {
  CheckCircle2,
  User,
  Calendar as CalendarIcon,
  Globe,
  Video,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { EventType } from "../services/availabilityService";

interface SuccessPageProps {
  selectedDateTime: Date;
  event: EventType;
  timezone: string;
  is24Hour: boolean;
  hostProfile?: any;
  onCookieSettingsClick?: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({
  selectedDateTime,
  event,
  timezone,
  is24Hour,
  hostProfile,
  onCookieSettingsClick,
}) => {
  const getTimezoneName = (tz: string) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "long",
      });
      const parts = formatter.formatToParts(new Date());
      return parts.find((p) => p.type === "timeZoneName")?.value || tz;
    } catch (e) {
      return tz;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const confirmationLinks =
    event.confirmation_links?.filter((l) => l.status) || [];
  const hostName = hostProfile?.full_name || "Host";

  const isInternalLink = (url: string) => {
    try {
      const currentOrigin = window.location.origin;
      const urlObj = new URL(url, currentOrigin);
      return urlObj.origin === currentOrigin;
    } catch (e) {
      // If it's a relative path like /Habibi/60min
      return url.startsWith("/");
    }
  };

  const getRelativePath = (url: string) => {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.pathname + urlObj.search + urlObj.hash;
    } catch (e) {
      return url;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full p-4 md:px-10 md:py-8 text-center bg-white rounded-md">
      {hostProfile?.brand_logo_url ? (
        <div className="mb-4">
          <img
            src={hostProfile.brand_logo_url}
            alt={hostName}
            className="h-12 md:h-16 w-auto object-contain mx-auto"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-full flex items-center justify-center mb-4 overflow-hidden">
          <span className="text-white font-bold text-lg md:text-xl">
            {getInitials(hostName)}
          </span>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mb-4">
        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">
          You are scheduled
        </h1>
      </div>

      <p className="text-gray-600 mb-6 md:mb-10 text-sm md:text-base">
        A calendar invitation has been sent to your email address.
      </p>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 md:p-8 text-left shadow-sm">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6">
          {event.title}
        </h2>

        <div className="space-y-4">
          <div className="flex items-start text-gray-600 font-semibold text-sm md:text-base">
            <User className="w-5 h-5 mr-3 mt-0.5 opacity-60 shrink-0" />
            <span>{hostName}</span>
          </div>

          <div className="flex items-start text-gray-600 font-semibold text-sm md:text-base">
            <CalendarIcon className="w-5 h-5 mr-3 mt-0.5 opacity-60 shrink-0" />
            <span>
              {selectedDateTime
                .toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: !is24Hour,
                  timeZone: timezone,
                })
                .toLowerCase()}{" "}
              -
              {new Date(selectedDateTime.getTime() + event.duration * 60000)
                .toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: !is24Hour,
                  timeZone: timezone,
                })
                .toLowerCase()}
              ,
              {selectedDateTime.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: timezone,
              })}
            </span>
          </div>

          <div className="flex items-start text-gray-600 font-semibold text-sm md:text-base">
            <Globe className="w-5 h-5 mr-3 mt-0.5 opacity-60 shrink-0" />
            <span>{getTimezoneName(timezone)}</span>
          </div>

          <div className="flex items-start text-gray-600 font-semibold text-sm md:text-base">
            <Video className="w-5 h-5 mr-3 mt-0.5 opacity-60 shrink-0" />
            <span>Web conferencing details to follow.</span>
          </div>
        </div>
      </div>

      {confirmationLinks.length > 0 && (
        <div className="mt-10 w-full max-w-md space-y-3">
          {confirmationLinks.map((link) => {
            const url = link.isDefault ? event.link : link.url;
            return isInternalLink(url) ? (
              <Link
                key={link.id}
                to={getRelativePath(url)}
                className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-600 hover:shadow-md transition-all group"
              >
                <span className="font-bold text-slate-800 group-hover:text-blue-600">
                  {link.name}
                </span>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </Link>
            ) : (
              <a
                key={link.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-600 hover:shadow-md transition-all group"
              >
                <span className="font-bold text-slate-800 group-hover:text-blue-600">
                  {link.name}
                </span>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </a>
            );
          })}
        </div>
      )}

      <div className="mt-10 w-full">
        <div className="flex gap-4 justify-start w-full">
          <button
            onClick={onCookieSettingsClick}
            className="hover:underline text-[#014eba]"
          >
            Cookie settings
          </button>
        </div>
      </div>
    </div>
  );
};
