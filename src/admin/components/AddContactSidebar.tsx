import React from 'react';
import { X, Upload, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { availabilityService } from '../../services/availabilityService';
import { toast } from 'sonner';
import { countries, Country } from '../../constants/countries';
import { timezones, Timezone } from '../../constants/timezones';

interface AddContactSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddContactSidebar: React.FC<AddContactSidebarProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    company: '',
    linkedin: '',
    timezone: '',
    country: '',
    city: '',
    state: ''
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState<Country>(countries[0]); // Default to US
  const [countrySearch, setCountrySearch] = React.useState('');
  
  const [isTimezoneSelectorOpen, setIsTimezoneSelectorOpen] = React.useState(false);
  const [timezoneSearch, setTimezoneSearch] = React.useState('');
  const timezoneDropdownRef = React.useRef<HTMLDivElement>(null);

  const isFormValid = formData.name.trim() !== '' && formData.email.trim() !== '';

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch)
  );

  const filteredTimezones = timezones.filter(tz => 
    tz.name.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    tz.region.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  // Group timezones by region
  const groupedTimezones = filteredTimezones.reduce((acc, tz) => {
    if (!acc[tz.region]) acc[tz.region] = [];
    acc[tz.region].push(tz);
    return acc;
  }, {} as Record<string, Timezone[]>);

  const getCurrentTimeInTimezone = (offsetMinutes: number) => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const tzDate = new Date(utc + (60000 * offsetMinutes));
    return tzDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(event.target as Node)) {
        setIsTimezoneSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Create a booking record to represent this contact
      // We use a placeholder event_slug and current time for start/end
      const now = new Date().toISOString();
      const fullPhone = formData.phone ? `${selectedCountry.code} ${formData.phone}` : '';
      
      await availabilityService.createBooking({
        name: formData.name,
        email: formData.email,
        mobile_number: fullPhone,
        company_name: formData.company,
        timezone: formData.timezone,
        event_slug: 'manual-contact',
        start_time: now,
        end_time: now,
      } as any);

      toast.success('Contact saved successfully', {
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      onSuccess();
      onClose();
      setFormData({
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
        company: '',
        linkedin: '',
        timezone: '',
        country: '',
        city: '',
        state: ''
      });
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isCountrySelectorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCountrySelectorOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Select country code</h3>
                  <button 
                    onClick={() => setIsCountrySelectorOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search country or code"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={`${country.name}-${country.code}`}
                    onClick={() => {
                      setSelectedCountry(country);
                      setIsCountrySelectorOpen(false);
                      setCountrySearch('');
                    }}
                    className={cn(
                      "w-full px-6 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors group",
                      selectedCountry.name === country.name && "bg-blue-600 text-white hover:bg-blue-600"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{country.flag}</span>
                      <span className={cn(
                        "text-sm font-medium",
                        selectedCountry.name === country.name ? "text-white" : "text-slate-700"
                      )}>
                        {country.name}
                      </span>
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      selectedCountry.name === country.name ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                    )}>
                      {country.code}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Add Contact</h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Upload Image Section */}
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
                      Upload image
                    </button>
                    <p className="text-xs text-slate-400 mt-2">JPG, GIF, or PNG. Max size of 5MB.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Full name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Phone <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCountrySelectorOpen(true)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-2 border-r border-slate-200 hover:bg-slate-50 transition-colors h-2/3"
                      >
                        <span className="text-lg">{selectedCountry.flag}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-20 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Job title <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Company <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">LinkedIn <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input
                      type="text"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Time zone <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <div className="relative" ref={timezoneDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsTimezoneSelectorOpen(!isTimezoneSelectorOpen)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all flex items-center justify-between text-slate-700"
                      >
                        <span className={cn(!formData.timezone && "text-slate-400")}>
                          {formData.timezone || 'Time zone'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>

                      <AnimatePresence>
                        {isTimezoneSelectorOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[400px]"
                          >
                            <div className="p-3 border-b border-slate-100">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Search..."
                                  value={timezoneSearch}
                                  onChange={(e) => setTimezoneSearch(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                              {Object.entries(groupedTimezones).map(([region, tzs]) => (
                                <div key={region} className="mb-4 last:mb-0">
                                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {region}
                                  </div>
                                  {tzs.map((tz) => (
                                    <button
                                      key={tz.name}
                                      type="button"
                                      onClick={() => {
                                        setFormData({ ...formData, timezone: tz.name });
                                        setIsTimezoneSelectorOpen(false);
                                        setTimezoneSearch('');
                                      }}
                                      className={cn(
                                        "w-full px-3 py-2.5 flex items-center justify-between rounded-lg hover:bg-blue-50 transition-colors group text-left",
                                        formData.timezone === tz.name && "bg-blue-50 text-blue-600"
                                      )}
                                    >
                                      <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">
                                        {tz.label}
                                      </span>
                                      <span className="text-sm text-slate-400 font-mono">
                                        {getCurrentTimeInTimezone(tz.offset)}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ))}
                              {Object.keys(groupedTimezones).length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                  No time zones found
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Country <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <div className="relative">
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none text-slate-700"
                      >
                        <option value="">Country</option>
                        <option value="US">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="IN">India</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">City <span className="text-slate-400 font-normal">(Optional)</span></label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">State <span className="text-slate-400 font-normal">(Optional)</span></label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  onClick={onClose}
                  className="px-6 py-2 border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all",
                    isFormValid && !isSubmitting
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? 'Saving...' : 'Save contact'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
