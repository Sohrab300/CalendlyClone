import React from 'react';
import { CheckCircle2, User, Calendar as CalendarIcon, Globe, Video } from 'lucide-react';
import { format } from 'date-fns';

interface SuccessPageProps {
  selectedDateTime: Date;
  eventTitle: string;
  timezone: string;
  is24Hour: boolean;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ selectedDateTime, eventTitle, timezone, is24Hour }) => {
  const getTimezoneName = (tz: string) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'long',
      });
      const parts = formatter.formatToParts(new Date());
      return parts.find(p => p.type === 'timeZoneName')?.value || tz;
    } catch (e) {
      return tz;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-12 w-full max-w-4xl mx-auto text-center">
      <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-full flex items-center justify-center mb-8 overflow-hidden">
         <span className="text-white font-bold text-lg md:text-xl">HV</span>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4">
        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">You are scheduled</h1>
      </div>
      
      <p className="text-gray-600 mb-8 md:mb-12 text-sm md:text-base">A calendar invitation has been sent to your email address.</p>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 md:p-8 text-left shadow-sm">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6">{eventTitle}</h2>
        
        <div className="space-y-4">
          <div className="flex items-start text-gray-600 font-semibold text-sm md:text-base">
            <User className="w-5 h-5 mr-3 mt-0.5 opacity-60 shrink-0" />
            <span>Hv Technologies</span>
          </div>
          
          <div className="flex items-start text-gray-600 font-semibold text-sm md:text-base">
            <CalendarIcon className="w-5 h-5 mr-3 mt-0.5 opacity-60 shrink-0" />
            <span>
              {selectedDateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: !is24Hour }).toLowerCase()} - 
              {new Date(selectedDateTime.getTime() + 30 * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: !is24Hour }).toLowerCase()}, 
              {format(selectedDateTime, 'EEEE, MMMM d, yyyy')}
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

      <div className="mt-12">
        <p className="text-xs text-gray-400 mb-4">Powered by HVTech</p>
        <div className="flex gap-4 justify-center">
          <button className="text-sm font-medium text-blue-600 hover:underline">Cookie settings</button>
          <button className="text-sm font-medium text-blue-600 hover:underline">Privacy Policy</button>
        </div>
      </div>
    </div>
  );
};
