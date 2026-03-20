import React from 'react';
import { Clock, Video, Globe, Calendar, ArrowLeft } from 'lucide-react';
import { EventType } from '../types';

interface EventInfoProps {
  event: EventType;
  selectedDateTime?: Date;
  timezone?: string;
  is24Hour?: boolean;
  onBack?: () => void;
}

export const EventInfo: React.FC<EventInfoProps> = ({ event, selectedDateTime, timezone, is24Hour, onBack }) => {
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
    <div className="p-6 md:p-8 h-full flex flex-col">
      {onBack && (
        <button 
          onClick={onBack}
          className="md:hidden self-start p-2 -ml-2 mb-4 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
      )}
      
      <div className="mb-8">
        <div className="hidden md:flex w-16 h-16 bg-black rounded-full items-center justify-center mb-6 overflow-hidden">
           <span className="text-white font-bold text-xl">HV</span>
        </div>
        
        <div className="md:hidden flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4 overflow-hidden">
             <span className="text-white font-bold text-lg">HV</span>
          </div>
        </div>

        <p className="text-gray-500 font-medium mb-1 text-center md:text-left">Hv Technologies</p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 text-center md:text-left">{event.title}</h1>
        
        <div className="space-y-4 max-w-md mx-auto md:mx-0">
          <div className="flex items-center text-gray-600 font-semibold">
            <Clock className="w-5 h-5 mr-3 opacity-70 shrink-0" />
            <span>{event.duration} min</span>
          </div>
          
          <div className="flex items-start text-gray-600 font-semibold">
            <Video className="w-5 h-5 mr-3 mt-0.5 opacity-70 shrink-0" />
            <span>Web conferencing details provided upon confirmation.</span>
          </div>

          {selectedDateTime && (
            <>
              <div className="flex items-start text-gray-600 font-semibold">
                <Calendar className="w-5 h-5 mr-3 mt-0.5 opacity-70 shrink-0" />
                <span>
                  {selectedDateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: !is24Hour }).toLowerCase()} - 
                  {new Date(selectedDateTime.getTime() + event.duration * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: !is24Hour }).toLowerCase()}, 
                  {selectedDateTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
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

      <div className="hidden md:flex mt-auto pt-8 gap-4 text-sm font-medium text-blue-600">
        <button className="hover:underline">Cookie settings</button>
        <button className="hover:underline">Privacy Policy</button>
      </div>
    </div>
  );
};
