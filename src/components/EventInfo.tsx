import React from "react";
import { Clock, Video, Globe, Calendar, ArrowLeft } from "lucide-react";
import { EventType } from "../types";

interface EventInfoProps {
  event: EventType;
  selectedDateTime?: Date;
  timezone?: string;
  is24Hour?: boolean;
  onBack?: () => void;
  hostProfile?: any;
  onCookieSettingsClick?: () => void;
}

export const EventInfo: React.FC<EventInfoProps> = ({
  event,
  selectedDateTime,
  timezone,
  is24Hour,
  onBack,
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

  const hostName = hostProfile?.full_name || "Hv Technologies";
  const brandLogo = hostProfile?.brand_logo_url;

  return (
    <div className="h-full flex flex-col">
      {onBack && (
        <button
          onClick={onBack}
          className="md:hidden self-start p-2 -ml-2 mb-4 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
      )}

      {brandLogo && (
        <div className="border-b border-b-gray-200 flex items-center justify-center px-6 md:px-8 max-lg:h-[20%]">
          <img
            src={brandLogo}
            alt={hostName}
            className="w-[50%] h-[50%] md:w-[65%] md:h-[65%] object-contain bg-white p-2"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <div className="mb-8 px-6 pt-6 md:px-8 md:pt-8">
        <div className="hidden md:flex w-16 h-16 bg-black rounded-full items-center justify-center mb-2 overflow-hidden">
          {brandLogo ? (
            <img
              src={brandLogo}
              alt={hostName}
              className="w-full h-full object-contain bg-white p-2"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-white font-bold text-xl">
              {hostName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          )}
        </div>

        <div className="md:hidden flex flex-col items-center mb-4">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center overflow-hidden">
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={hostName}
                className="w-full h-full object-contain bg-white p-1"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {hostName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <p className="text-[#1a1a1a9c] font-medium text-lg mb-1 text-center md:text-left font-['Proxima_Nova',sans-serif]">
          {hostName}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 text-center md:text-left">
          {event.title}
        </h1>

        <div className="space-y-4 max-w-md mx-auto md:mx-0">
          <div className="flex items-center text-gray-600 font-semibold">
            <Clock className="w-5 h-5 mr-3 opacity-70 shrink-0" />
            <span>{event.duration} min</span>
          </div>

          <div className="flex items-start text-gray-600 font-semibold">
            <Video className="w-5 h-5 mr-3 mt-0.5 opacity-70 shrink-0" />
            <span>Web conferencing details provided upon confirmation.</span>
          </div>

          <div className="text-gray-500">{event.description}</div>

          {selectedDateTime && (
            <>
              <div className="flex items-start text-gray-600 font-semibold">
                <Calendar className="w-5 h-5 mr-3 mt-0.5 opacity-70 shrink-0" />
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

              {timezone && (
                <div className="flex items-start text-gray-600 font-semibold">
                  <Globe className="w-5 h-5 mr-3 mt-0.5 opacity-70 shrink-0" />
                  <span>{getTimezoneName(timezone)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="hidden md:flex mt-auto p-8 gap-4 text-sm font-medium text-blue-600">
        <button onClick={onCookieSettingsClick} className="hover:underline">
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
    </div>
  );
};
