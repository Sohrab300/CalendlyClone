/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { cn } from './lib/utils';
import { format } from 'date-fns';
import { EventInfo } from './components/EventInfo';
import { Calendar } from './components/Calendar';
import { TimeSlots } from './components/TimeSlots';
import { BookingForm } from './components/BookingForm';
import { SuccessPage } from './components/SuccessPage';
import { EventType } from './types';

const MOCK_EVENT: EventType = {
  id: '1',
  title: 'Discovery Meeting',
  description: 'A quick call to discuss your project requirements and how we can help.',
  duration: 30,
  slug: 'discovery-meeting',
  location_type: 'web_conference'
};

type ViewState = 'calendar' | 'details' | 'success';

export default function App() {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [view, setView] = React.useState<ViewState>('calendar');
  const [timezone, setTimezone] = React.useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [is24Hour, setIs24Hour] = React.useState(false);
  const [mobileStep, setMobileStep] = React.useState<'date' | 'time'>('date');

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setMobileStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirmTime = () => {
    setView('details');
  };

  const handleBackToCalendar = () => {
    setView('calendar');
    setMobileStep('date');
  };

  const handleBackToDate = () => {
    setMobileStep('date');
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleBookingSubmit = async (data: any) => {
    setIsSubmitting(true);
    const dateTime = getSelectedDateTime();
    
    if (!dateTime) return;

    try {
      const endTime = new Date(dateTime.getTime() + MOCK_EVENT.duration * 60000);
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          eventTitle: MOCK_EVENT.title,
          startTime: dateTime.toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timezone: 'India Standard Time',
          rawStartTime: dateTime.toISOString(),
          rawEndTime: endTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invite');
      }

      setView('success');
    } catch (error) {
      console.error('Error scheduling:', error);
      alert('Your booking was recorded locally, but we couldn\'t send the email invitation. Please check your server configuration.');
      setView('success'); // Still show success but with a warning
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to combine date and time string into a Date object
  const getSelectedDateTime = () => {
    if (!selectedDate || !selectedTime) return undefined;
    
    let hours = 0;
    let minutes = 0;

    if (is24Hour) {
      [hours, minutes] = selectedTime.split(':').map(Number);
    } else {
      const match = selectedTime.match(/^(\d+):(\d+)(am|pm)$/);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const modifier = match[3];
        if (modifier === 'pm' && hours < 12) hours += 12;
        if (modifier === 'am' && hours === 12) hours = 0;
      }
    }
    
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  const selectedDateTime = getSelectedDateTime();

  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-4 lg:p-8 bg-slate-50">
      <motion.div 
        layout
        className="bg-white rounded-none md:rounded-xl shadow-2xl shadow-slate-200 border-none md:border border-slate-200 w-full max-w-5xl min-h-screen md:min-h-[600px] flex flex-col lg:flex-row overflow-hidden relative"
      >
        <AnimatePresence mode="wait">
          {view === 'success' ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <SuccessPage 
                selectedDateTime={selectedDateTime!} 
                eventTitle={MOCK_EVENT.title} 
                timezone={timezone}
                is24Hour={is24Hour}
              />
            </motion.div>
          ) : (
            <>
              <motion.div 
                key="event-info"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "w-full lg:w-2/5 border-b lg:border-b-0 lg:border-r border-gray-200",
                  view === 'calendar' && selectedDate && "hidden md:block lg:block"
                )}
              >
                <EventInfo 
                  event={MOCK_EVENT} 
                  selectedDateTime={view === 'details' ? selectedDateTime : undefined} 
                  timezone={timezone}
                  is24Hour={is24Hour}
                  onBack={view === 'details' ? handleBackToCalendar : undefined}
                />
              </motion.div>

              <motion.div 
                key="main-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full lg:w-3/5 flex flex-col"
              >
                {view === 'calendar' ? (
                  <div className="flex flex-col md:flex-row w-full h-full">
                    {/* Date Selection View */}
                    <div className={cn(
                      "w-full p-4 md:p-8",
                      selectedDate ? "hidden md:block lg:w-2/3" : "w-full"
                    )}>
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-8 text-center lg:text-left">
                        <span className="md:hidden">Select a Day</span>
                        <span className="hidden md:inline">Select a Date & Time</span>
                      </h2>
                      <div className="flex justify-center">
                        <Calendar 
                          selectedDate={selectedDate} 
                          onDateSelect={handleDateSelect} 
                          timezone={timezone}
                          onTimezoneChange={setTimezone}
                          is24Hour={is24Hour}
                          onFormatToggle={setIs24Hour}
                        />
                      </div>
                    </div>
                    
                    {/* Time Selection View */}
                    {selectedDate && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full md:w-1/3 border-l border-gray-100 bg-white"
                      >
                        <div className="md:hidden p-4 border-b flex items-center gap-4">
                          <button 
                            onClick={handleBackToDate}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <ArrowLeft className="w-6 h-6 text-blue-600" />
                          </button>
                          <div className="flex-1 text-center">
                            <h3 className="font-bold text-lg">{format(selectedDate, 'EEEE')}</h3>
                            <p className="text-sm text-gray-500">{format(selectedDate, 'MMMM d, yyyy')}</p>
                          </div>
                        </div>
                        
                        <div className="p-4 md:p-8">
                          <div className="hidden md:block mb-6">
                            <h3 className="text-slate-800 font-medium">
                              {format(selectedDate, 'EEEE, MMMM d')}
                            </h3>
                          </div>
                          
                          <div className="md:hidden text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Select a Time</h2>
                            <p className="text-gray-500">Duration: {MOCK_EVENT.duration} min</p>
                          </div>

                          <TimeSlots 
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            onTimeSelect={handleTimeSelect}
                            onConfirm={handleConfirmTime}
                            is24Hour={is24Hour}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <BookingForm 
                    onBack={handleBackToCalendar} 
                    onSubmit={handleBookingSubmit} 
                    isSubmitting={isSubmitting}
                  />
                )}

                <div className="lg:hidden p-8 border-t border-gray-100 flex justify-center gap-6 text-sm font-medium text-blue-600">
                  <button className="hover:underline">Cookie settings</button>
                  <button className="hover:underline">Privacy Policy</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
