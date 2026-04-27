import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import { countries, Country } from '../constants/countries';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  required = false,
  placeholder = '',
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCountry, setSelectedCountry] = React.useState<Country>(
    countries.find(c => c.code === 'in') || countries[0]
  );
  const [phoneNumber, setPhoneNumber] = React.useState('');

  // Auto-detect country
  React.useEffect(() => {
    const detectCountry = async () => {
      try {
        // Try ipwho.is first as it's generally more reliable for client-side
        const response = await fetch('https://ipwho.is/');
        const data = await response.json();
        
        if (data.country_code) {
          const detected = countries.find(c => c.code.toLowerCase() === data.country_code.toLowerCase());
          if (detected) {
            setSelectedCountry(detected);
            return;
          }
        }
      } catch (error) {
        console.warn('Primary country detection failed, trying fallback...', error);
        
        // Fallback to ipapi.co
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          if (data.country_code) {
            const detected = countries.find(c => c.code.toLowerCase() === data.country_code.toLowerCase());
            if (detected) {
              setSelectedCountry(detected);
            }
          }
        } catch (fallbackError) {
          console.error('All country detection attempts failed:', fallbackError);
        }
      }
    };
    detectCountry();
  }, []);

  // Sync internal state with external value
  React.useEffect(() => {
    if (value) {
      // Try to find if value starts with any dial code
      const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
      const country = sortedCountries.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.slice(country.dialCode.length).trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d\s-]/g, '');
    setPhoneNumber(val);
    onChange(`${selectedCountry.dialCode} ${val}`);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    onChange(`${country.dialCode} ${phoneNumber}`);
  };

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dialCode.includes(searchQuery)
  );

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center w-full border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 border-r border-gray-200 transition-colors shrink-0"
        >
          <img
            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
            alt={selectedCountry.name}
            className="w-6 h-4 object-cover rounded-sm"
            referrerPolicy="no-referrer"
          />
          <span className="text-gray-700 font-medium min-w-[3rem] text-left">
            {selectedCountry.dialCode}
          </span>
        </button>
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          required={required}
          placeholder={placeholder}
          className="w-full p-3 outline-none bg-transparent"
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[9999] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Select country code</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search country or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={`${country.code}-${country.dialCode}`}
                        onClick={() => handleCountrySelect(country)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group ${
                          selectedCountry.code === country.code ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                            alt={country.name}
                            className="w-6 h-4 object-cover rounded-sm shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <span className={`text-sm ${
                            selectedCountry.code === country.code ? 'text-blue-700 font-semibold' : 'text-gray-700'
                          }`}>
                            {country.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-400 group-hover:text-gray-600">
                          {country.dialCode}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      No countries found
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
};
