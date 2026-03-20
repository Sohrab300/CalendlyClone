import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface BookingFormProps {
  onBack: () => void;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onBack, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    whatsapp: '',
    automationType: [] as string[],
  });

  const automationOptions = [
    'Whatsapp Automation',
    'AI Calling',
    'CRM Automations',
    'PDF Generator',
    'Insta or Facebook Automations',
    'Facebook Marketplace Automations',
    'Lead Nurturing Automations',
    'Apps or Websites',
    'Digital Marketing Services',
    'Something Else'
  ];

  const [errors, setErrors] = React.useState({
    email: '',
  });

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleCheckboxChange = (option: string) => {
    setFormData(prev => ({
      ...prev,
      automationType: prev.automationType.includes(option)
        ? prev.automationType.filter(i => i !== option)
        : [...prev.automationType, option]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    
    setErrors({ email: '' });
    onSubmit(formData);
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-2xl overflow-y-auto h-full custom-scrollbar bg-white">
      <button 
        onClick={onBack}
        className="hidden md:flex mb-8 p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-blue-600" />
      </button>

      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-8 text-center md:text-left">Enter Details</h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto md:mx-0">
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Name *</label>
          <input
            required
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Email *</label>
          <input
            required
            type="email"
            className={cn(
              "w-full p-3 border rounded-lg focus:ring-2 outline-none transition-all",
              errors.email 
                ? "border-red-500 focus:ring-red-500" 
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            )}
            value={formData.email}
            onChange={e => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) validateEmail(e.target.value) && setErrors({ email: '' });
            }}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>}
        </div>

        <button type="button" className="text-blue-600 font-bold border border-blue-600 rounded-full px-4 py-1.5 text-sm hover:bg-blue-50 transition-colors">
          Add Guests
        </button>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-4">What kind of automation are you looking for? *</label>
          <div className="space-y-3">
            {automationOptions.map(option => (
              <label key={option} className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={formData.automationType.includes(option)}
                  onChange={() => handleCheckboxChange(option)}
                />
                <span className="ml-3 text-sm text-slate-700 font-medium group-hover:text-slate-900">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">What is your whatsapp number? *</label>
          <div className="flex">
            <div className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50">
               <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-5 h-auto mr-2" />
               <span className="text-sm text-gray-600">+91</span>
            </div>
            <input
              required
              type="tel"
              className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.whatsapp}
              onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          By proceeding, you confirm that you have read and agree to{' '}
          <a href="#" className="text-blue-600 hover:underline">Calendly's Terms of Use</a> and{' '}
          <a href="#" className="text-blue-600 hover:underline">Privacy Notice</a>.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-all shadow-lg shadow-blue-100",
            isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
          )}
        >
          {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
        </button>
      </form>

      <div className="mt-12 pt-8 flex gap-4 text-sm font-medium text-blue-600">
        <button className="hover:underline">Cookie settings</button>
        <button className="hover:underline">Privacy Policy</button>
      </div>
    </div>
  );
};
