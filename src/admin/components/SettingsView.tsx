import React from 'react';
import { 
  ChevronLeft, User, Star, Link2, Bell, Shield, Lock, Cookie, HelpCircle, LogOut, Info, 
  ChevronDown, Search, Check, ChevronUp, ChevronRight, X 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { availabilityService } from '../../services/availabilityService';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { countries, timezones } from '../../constants/profileData';

interface SettingsSidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const SettingsSidebarItem: React.FC<SettingsSidebarItemProps> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors",
      isActive 
        ? "bg-blue-50 text-blue-700" 
        : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#1e293b]"
    )}
  >
    <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-blue-700" : "text-[#94a3b8]")} />
    <span>{label}</span>
  </button>
);

const CustomSelect: React.FC<{
  label: string;
  value: string;
  options: any[];
  onChange: (val: string) => void;
  showInfo?: boolean;
  hasSearch?: boolean;
  isTimezone?: boolean;
  className?: string;
}> = ({ label, value, options, onChange, showInfo, hasSearch, isTimezone, className }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = hasSearch 
    ? options.filter(opt => {
        const text = typeof opt === 'string' ? opt : opt.label;
        return text.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : options;

  const getCurrentTime = (offset: string) => {
    try {
      const now = new Date();
      const parts = offset.match(/([+-])(\d{2}):(\d{2})/);
      if (!parts) return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
      
      const [_, sign, hours, minutes] = parts;
      const offsetMs = (parseInt(hours) * 60 + parseInt(minutes)) * 60 * 1000 * (sign === '+' ? 1 : -1);
      
      // Calculate based on UTC
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const targetDate = new Date(utc + offsetMs);
      
      return targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
    } catch {
      return '';
    }
  };

  const selectedOption = isTimezone 
    ? options.find(opt => opt.name === value) || options.find(opt => opt.label === value)
    : value;

  const displayValue = isTimezone ? (selectedOption?.label || value) : value;

  return (
    <div className={cn("space-y-2.5 relative", className)} ref={dropdownRef}>
      <label className="flex items-center gap-1.5 text-sm font-bold text-[#1a1a1a]">
        {label}
        {showInfo && <Info className="w-3.5 h-3.5 text-[#94a3b8] cursor-help" />}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 bg-white border rounded-lg text-sm text-[#334155] flex items-center justify-between transition-all outline-none",
          isOpen ? "border-[#006bff] ring-[1px] ring-[#006bff]" : "border-[#e2e8f0] hover:border-[#cbd5e1]"
        )}
      >
        <span className="truncate">{displayValue}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#006bff]" /> : <ChevronDown className="w-4 h-4 text-[#94a3b8]" />}
      </button>

      {isOpen && (
        <div className={cn(
          "absolute inset-x-0 z-50 mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100",
          (isTimezone || label === 'Country') ? "bottom-full mb-2" : "top-full"
        )}>
          {hasSearch && (
            <div className="p-3 border-bottom border-[#f1f5f9]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#006bff] rounded-lg text-sm focus:outline-none ring-1 ring-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}
          <div className={cn("overflow-y-auto", (isTimezone || label === 'Country') ? "max-h-[300px]" : "max-h-[250px]")}>
            {isTimezone && <p className="text-[11px] font-bold text-[#b2b2b2] px-4 py-2 uppercase tracking-tight">Time Zone</p>}
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 italic">No results found</div>
            ) : filteredOptions.map((opt, i) => {
              const optVal = typeof opt === 'string' ? opt : opt.name || opt;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = isTimezone ? opt.name === value : optVal === value;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(optVal);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between hover:bg-[#f8fafc] transition-colors",
                    isSelected ? (isTimezone ? "bg-[#006bff] text-white" : "text-[#1a1a1a]") : "text-[#1a1a1a]"
                  )}
                >
                  <div className="flex flex-col">
                    <span>{optLabel}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {isTimezone && <span className={cn(isSelected ? "text-white" : "text-[#64748b]")}>{getCurrentTime(opt.offset)}</span>}
                    {isSelected && !isTimezone && <Check className="w-4 h-4 text-[#006bff]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const SettingsView: React.FC<{ 
  onBack: () => void;
  onProfileUpdate?: (profile: any) => void;
  initialTab?: string;
}> = ({ onBack, onProfileUpdate, initialTab = 'Profile' }) => {
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [securitySubTab, setSecuritySubTab] = React.useState('Booking');
  const [events, setEvents] = React.useState<any[]>([]);
  const [eventSearchTerm, setEventSearchTerm] = React.useState('');
  const [selectedEventIds, setSelectedEventIds] = React.useState<string[]>([]);
  const [profile, setProfile] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isUploadingBrand, setIsUploadingBrand] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const brandLogoInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    welcomeMessage: 'Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.',
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h (am/pm)',
    country: 'India',
    timezone: 'Asia/Kolkata',
    useCalendlyBranding: true,
    username: '',
    email: ''
  });

  React.useEffect(() => {
    loadProfile();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await availabilityService.getEventTypes();
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
    }
  };

  const handleToggleBulkVerification = async (enabled: boolean) => {
    if (selectedEventIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('event_types')
        .update({ require_email_verification: enabled })
        .in('id', selectedEventIds);

      if (error) throw error;

      toast.success(`Verification ${enabled ? 'enabled' : 'disabled'} for ${selectedEventIds.length} event(s)`);
      
      setEvents(prev => prev.map(e => 
        selectedEventIds.includes(e.id) ? { ...e, require_email_verification: enabled } : e
      ));
      
      setSelectedEventIds([]);
    } catch (err) {
      console.error('Error updating verification:', err);
      toast.error('Failed to update verification');
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase.from('profiles').select('*');
      if (user) query = query.eq('id', user.id);

      const { data: profileData } = await query.limit(1).single();
      
      const defaultWelcomeMessage = "Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.";
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
          name: profileData.full_name || 'User',
          welcomeMessage: profileData.welcome_message || defaultWelcomeMessage,
          language: profileData.language || 'English',
          dateFormat: profileData.date_format || 'DD/MM/YYYY',
          timeFormat: profileData.time_format || '12h (am/pm)',
          country: profileData.country || (Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Asia/Kolkata') ? 'India' : 'United States'),
          timezone: profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          useCalendlyBranding: profileData.use_calendly_branding ?? true,
          username: profileData.username || '',
          email: profileData.email || user?.email || ''
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, and PNG files are allowed');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Cleanup old file if it exists
      if (profile.avatar_url) {
        try {
          const oldFileName = profile.avatar_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('avatars').remove([`avatars/${oldFileName}`]);
          }
        } catch (e) {
          console.warn('Failed to cleanup old avatar:', e);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('bucket not found')) {
          throw new Error('Supabase Storage bucket "avatars" not found. Please create it in your Supabase dashboard.');
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Use upsert to ensure update works even if ID is temporary
      const { data: updatedData, error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: (profile && !profile.id?.startsWith('mock-id')) ? profile.id : undefined,
          username: profile.username || '',
          avatar_url: publicUrl,
          // Preserve other fields
          full_name: profile.full_name || formData.name,
          welcome_message: profile.welcome_message || formData.welcomeMessage,
          language: profile.language || formData.language,
          date_format: profile.date_format || formData.dateFormat,
          time_format: profile.time_format || formData.timeFormat,
          country: profile.country || formData.country,
          timezone: profile.timezone || formData.timezone,
          host_notifications_enabled: profile.host_notifications_enabled ?? true
        }, { onConflict: 'username' })
        .select()
        .single();

      if (updateError) throw updateError;

      if (updatedData) {
        setProfile(updatedData);
        onProfileUpdate?.(updatedData);
      }
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile || !profile.avatar_url) return;

    try {
      // Cleanup storage
      try {
        const oldFileName = profile.avatar_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage.from('avatars').remove([`avatars/${oldFileName}`]);
        }
      } catch (e) {
        console.warn('Failed to cleanup storage avatar:', e);
      }

      // 1. Update database first
      const { data: updatedData, error } = await supabase
        .from('profiles')
        .upsert({
          id: (profile && !profile.id?.startsWith('mock-id')) ? profile.id : undefined,
          username: formData.username || profile.username || '',
          avatar_url: null,
          // Preserve other fields
          full_name: profile.full_name || formData.name,
          welcome_message: profile.welcome_message || formData.welcomeMessage,
          language: profile.language || formData.language,
          date_format: profile.date_format || formData.dateFormat,
          time_format: profile.time_format || formData.timeFormat,
          country: profile.country || formData.country,
          timezone: profile.timezone || formData.timezone,
          host_notifications_enabled: profile.host_notifications_enabled ?? true,
          brand_logo_url: profile.brand_logo_url,
          use_calendly_branding: formData.useCalendlyBranding
        }, { onConflict: 'username' })
        .select()
        .single();

      if (error) throw error;

      // 2. Update local state
      if (updatedData) {
        setProfile(updatedData);
        onProfileUpdate?.(updatedData);
      }

      toast.success('Profile picture removed');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove profile picture');
    }
  };

  const handleBrandLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and GIF files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploadingBrand(true);
    try {
      // Cleanup old file if it exists
      if (profile.brand_logo_url) {
        try {
          const oldFileName = profile.brand_logo_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('brand-logos').remove([`brand-logos/${oldFileName}`]);
          }
        } catch (e) {
          console.warn('Failed to cleanup old brand logo:', e);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `brand-${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `brand-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-logos')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('bucket not found')) {
          throw new Error('Supabase Storage bucket "brand-logos" not found. Please create it in your Supabase dashboard.');
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(filePath);

      const { data: updatedData, error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: (profile && !profile.id?.startsWith('mock-id')) ? profile.id : undefined,
          username: formData.username || profile.username || '',
          brand_logo_url: publicUrl,
          // Preserve other fields
          full_name: profile.full_name || formData.name,
          welcome_message: profile.welcome_message || formData.welcomeMessage,
          language: profile.language || formData.language,
          date_format: profile.date_format || formData.dateFormat,
          time_format: profile.time_format || formData.timeFormat,
          country: profile.country || formData.country,
          timezone: profile.timezone || formData.timezone,
          host_notifications_enabled: profile.host_notifications_enabled ?? true,
          avatar_url: profile.avatar_url,
          use_calendly_branding: formData.useCalendlyBranding
        }, { onConflict: 'username' })
        .select()
        .single();

      if (updateError) throw updateError;

      if (updatedData) {
        setProfile(updatedData);
        onProfileUpdate?.(updatedData);
      }
      toast.success('Brand logo updated successfully');
    } catch (error: any) {
      console.error('Error uploading brand logo:', error);
      toast.error(error.message || 'Failed to upload brand logo');
    } finally {
      setIsUploadingBrand(false);
      if (brandLogoInputRef.current) brandLogoInputRef.current.value = '';
    }
  };

  const handleRemoveBrandLogo = async () => {
    if (!profile || !profile.brand_logo_url) return;

    try {
      // Cleanup storage
      try {
        const oldFileName = profile.brand_logo_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage.from('brand-logos').remove([`brand-logos/${oldFileName}`]);
        }
      } catch (e) {
        console.warn('Failed to cleanup storage brand logo:', e);
      }

      const { data: updatedData, error } = await supabase
        .from('profiles')
        .upsert({
          id: (profile && !profile.id?.startsWith('mock-id')) ? profile.id : undefined,
          username: formData.username || profile.username || '',
          brand_logo_url: null,
          // Preserve other fields
          full_name: profile.full_name || formData.name,
          welcome_message: profile.welcome_message || formData.welcomeMessage,
          language: profile.language || formData.language,
          date_format: profile.date_format || formData.dateFormat,
          time_format: profile.time_format || formData.timeFormat,
          country: profile.country || formData.country,
          timezone: profile.timezone || formData.timezone,
          host_notifications_enabled: profile.host_notifications_enabled ?? true,
          avatar_url: profile.avatar_url,
          use_calendly_branding: formData.useCalendlyBranding
        }, { onConflict: 'username' })
        .select()
        .single();

      if (error) throw error;

      if (updatedData) {
        setProfile(updatedData);
        onProfileUpdate?.(updatedData);
      }

      toast.success('Brand logo removed');
    } catch (error) {
      console.error('Error removing brand logo:', error);
      toast.error('Failed to remove brand logo');
    }
  };

  const handleSave = async () => {
    try {
      if (!profile?.id && !formData.username) {
        toast.error('Profile information is missing');
        return;
      }

      // Use upsert to handle both first-time creation and updates
      const { data: updatedData, error } = await supabase
        .from('profiles')
        .upsert({
          // Use the internal ID to ensure we update the correct record
          id: profile?.id,
          username: formData.username || profile?.username || '',
          full_name: formData.name,
          welcome_message: formData.welcomeMessage,
          language: formData.language,
          date_format: formData.dateFormat,
          time_format: formData.timeFormat,
          country: formData.country,
          timezone: formData.timezone,
          host_notifications_enabled: profile?.host_notifications_enabled ?? true,
          use_calendly_branding: formData.useCalendlyBranding,
          brand_logo_url: profile?.brand_logo_url,
          avatar_url: profile?.avatar_url,
          email: formData.email
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state with real database data
      if (updatedData) {
        setProfile(updatedData);
        onProfileUpdate?.(updatedData);
      }

      toast.success('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile. Please ensure all columns exist in Supabase.');
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!profile) {
      toast.error('Please save your profile details first.');
      return;
    }
    
    // Save previous state for rollback if needed
    const previousProfile = { ...profile };
    
    // Optimistic UI update
    setProfile({ ...profile, host_notifications_enabled: enabled });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ host_notifications_enabled: enabled })
        .eq('id', profile.id);
      
      if (error) throw error;
      toast.success('Communication settings updated');
      onProfileUpdate?.({ ...profile, host_notifications_enabled: enabled });
    } catch (err) {
      console.error('Error updating notifications:', err);
      toast.error('Failed to sync settings with database.');
      // Rollback on error
      setProfile(previousProfile);
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="flex h-full bg-white animate-in fade-in duration-500">
      {/* Sidebar */}
      <div className="w-[280px] border-r border-[#f1f5f9] flex flex-col p-6 overflow-y-auto bg-white">
        <div 
          onClick={onBack}
          className="flex items-center gap-2 mb-8 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-xl font-bold text-blue-600">Calendly</span>
        </div>

        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[#006bff] hover:text-[#0052cc] text-[14px] font-bold mb-10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to home
        </button>

        <h2 className="text-[15px] font-bold text-[#1a1a1a] mb-8">Account settings</h2>

        <div className="space-y-1.5 flex-1">
          <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] px-4 mb-3">Account</p>
          <SettingsSidebarItem icon={User} label="Profile" isActive={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
          <SettingsSidebarItem icon={Star} label="Branding" isActive={activeTab === 'Branding'} onClick={() => setActiveTab('Branding')} />
          <SettingsSidebarItem icon={Link2} label="My Link" isActive={activeTab === 'My Link'} onClick={() => setActiveTab('My Link')} />
          <SettingsSidebarItem icon={Bell} label="Communication settings" isActive={activeTab === 'Communication settings'} onClick={() => setActiveTab('Communication settings')} />
          <SettingsSidebarItem icon={Shield} label="Security" isActive={activeTab === 'Security'} onClick={() => setActiveTab('Security')} />
        </div>

        <div className="mt-8 pt-8 border-t border-[#f1f5f9] space-y-4">
          <button className="flex items-center gap-3 px-4 py-2 text-[#475569] hover:text-[#1a1a1a] text-sm font-semibold transition-colors group w-full">
            <HelpCircle className="w-[18px] h-[18px] text-[#94a3b8] group-hover:text-[#475569]" />
            <span className="flex-1 text-left">Help</span>
            <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
          </button>
          <button className="flex items-center gap-3 px-4 py-2 text-[#475569] hover:text-[#1a1a1a] text-sm font-semibold transition-colors group w-full">
            <LogOut className="w-[18px] h-[18px] text-[#94a3b8] group-hover:text-[#475569]" />
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white pt-12">
        <div className="max-w-[720px] mx-auto px-10">
          <div className="mb-12">
            <p className="text-[13px] font-bold text-[#64748b] mb-3">Account details</p>
            <h1 className="text-[28px] font-bold text-[#1a1a1a]">{activeTab}</h1>
          </div>

          <div className="h-[1px] bg-[#f1f5f9] w-full mb-12" />

          {activeTab === 'Profile' ? (
            <div className="space-y-12 pb-32">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <div className="w-[88px] h-[88px] bg-[#f1f5f9] rounded-full flex items-center justify-center overflow-hidden border border-[#e2e8f0]">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-[48px] h-[48px] text-[#94a3b8]" />
                  )}
                </div>
                <div className="space-y-4">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleUploadClick}
                      disabled={isUploading}
                      className="px-6 py-2.5 border-[1.5px] border-[#e2e8f0] rounded-full text-[14px] font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900" />
                      ) : null}
                      {isUploading ? 'Uploading...' : 'Upload picture'}
                    </button>
                    {profile?.avatar_url && (
                      <button 
                        onClick={handleDeleteAvatar}
                        className="px-6 py-2.5 border-[1.5px] border-red-100 rounded-full text-[14px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] text-[#64748b]">JPG, JPEG or PNG. Max size of 5MB.</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-x-8 gap-y-8">
                <div className="space-y-2.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[#1a1a1a]">
                    Name
                    <Info className="w-3.5 h-3.5 text-[#94a3b8] cursor-help" />
                  </label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-[325px] px-4 py-3 bg-white border border-[#e2e8f0] rounded-lg text-sm text-[#334155] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[#1a1a1a]">
                    Email
                    <Info className="w-3.5 h-3.5 text-[#94a3b8] cursor-help" />
                  </label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                    className="w-[325px] px-4 py-3 bg-white border border-[#e2e8f0] rounded-lg text-sm text-[#334155] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[#1a1a1a]">
                    Welcome Message
                    <Info className="w-3.5 h-3.5 text-[#94a3b8] cursor-help" />
                  </label>
                  <textarea 
                    rows={4}
                    value={formData.welcomeMessage}
                    onChange={(e) => setFormData({...formData, welcomeMessage: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-lg text-sm text-[#334155] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <CustomSelect 
                  label="Language" 
                  value={formData.language} 
                  options={['English', 'Spanish', 'French']} 
                  onChange={(v) => setFormData({...formData, language: v})}
                  className="w-[325px]"
                />

                <div className="flex gap-6">
                  <CustomSelect 
                    label="Date Format" 
                    value={formData.dateFormat} 
                    options={['MM/DD/YYYY', 'DD/MM/YYYY']} 
                    onChange={(v) => setFormData({...formData, dateFormat: v})}
                    showInfo
                    className="flex-1"
                  />
                  <CustomSelect 
                    label="Time Format" 
                    value={formData.timeFormat} 
                    options={['12h (am/pm)', '24h']} 
                    onChange={(v) => setFormData({...formData, timeFormat: v})}
                    showInfo
                    className="flex-1"
                  />
                </div>

                <CustomSelect 
                  label="Country" 
                  value={formData.country} 
                  options={countries} 
                  onChange={(v) => setFormData({...formData, country: v})}
                  className="w-[325px]"
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-[#1a1a1a]">Time Zone</label>
                    <span className="text-[12px] text-[#64748b]">Current Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}</span>
                  </div>
                  <CustomSelect 
                    label="" 
                    value={formData.timezone} 
                    options={timezones} 
                    onChange={(v) => setFormData({...formData, timezone: v})}
                    hasSearch
                    isTimezone
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-10 flex items-center justify-between border-t border-[#f1f5f9]">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-[#006bff] text-white rounded-full text-[14px] font-bold hover:bg-[#0052cc] transition-colors"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={onBack}
                    className="px-6 py-2.5 border-[1.5px] border-[#e2e8f0] rounded-full text-[14px] font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <button className="px-6 py-2.5 bg-[#d93a00] text-white rounded-full text-[14px] font-bold hover:bg-[#b83100] transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          ) : activeTab === 'Branding' ? (
            <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-8">
                {/* Logo Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-1.5">
                    <label className="text-sm font-bold text-[#1a1a1a]">Logo</label>
                    <Info className="w-3.5 h-3.5 text-[#94a3b8] cursor-help" />
                  </div>
                  <p className="text-[15px] text-[#475569]">
                    Your company branding will appear at the top-left corner of the scheduling page.
                  </p>
                  
                  <div className="w-full h-48 bg-white border border-[#e2e8f0] rounded-lg flex items-center justify-center relative overflow-hidden group">
                    {profile?.brand_logo_url ? (
                      <div className="w-full h-full flex items-center justify-center p-8 bg-white">
                        <img 
                          src={profile.brand_logo_url} 
                          alt="Brand Logo" 
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-[#94a3b8] tracking-tight">No Logo</span>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <input 
                      type="file" 
                      ref={brandLogoInputRef} 
                      onChange={handleBrandLogoFileChange} 
                      accept=".jpg,.jpeg,.png,.gif"
                      className="hidden"
                    />
                    <button 
                      onClick={() => brandLogoInputRef.current?.click()}
                      disabled={isUploadingBrand}
                      className="px-6 py-2.5 border-[1.5px] border-[#e2e8f0] rounded-lg text-[14px] font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                    >
                      {isUploadingBrand && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900" />}
                      {isUploadingBrand ? 'Uploading...' : 'Upload image'}
                    </button>
                    {profile?.brand_logo_url && (
                      <button 
                        onClick={handleRemoveBrandLogo}
                        className="px-6 py-2.5 border-[1.5px] border-red-100 rounded-lg text-[14px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                    <p className="text-[13px] text-[#64748b]">JPG, GIF or PNG. Max size of 5MB.</p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-10 flex items-center gap-3 border-t border-[#f1f5f9]">
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-[#006bff] text-white rounded-full text-[14px] font-bold hover:bg-[#0052cc] transition-colors"
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={onBack}
                    className="px-6 py-2.5 border-[1.5px] border-[#e2e8f0] rounded-full text-[14px] font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'My Link' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-10">
                <p className="text-[15px] text-[#475569] leading-relaxed">
                  Changing your Calendly URL will mean that all of your copied links will no longer work and will need to be updated.
                </p>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <div className="px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] border-r-0 rounded-l-lg text-sm text-[#64748b] font-medium whitespace-nowrap">
                      calendly-clone-sandy.vercel.app/
                    </div>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value.replace(/[^a-zA-Z0-9-]/g, '')})}
                      className="flex-1 px-4 py-3 bg-white border border-[#e2e8f0] rounded-r-lg text-sm text-[#1a1a1a] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
                      placeholder="username"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-[#f1f5f9]">
                  <button 
                    onClick={handleSave}
                    className="px-8 py-2.5 bg-[#006bff] text-white rounded-full text-[14px] font-bold hover:bg-[#0052cc] transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'Communication settings' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-10">
                <div>
                  <h3 className="text-sm font-bold text-[#1a1a1a] mb-5">Email notifications when added to event types</h3>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleToggleNotifications(!(profile?.host_notifications_enabled ?? true))}
                      className={cn(
                        "w-[46px] h-[26px] rounded-full transition-all relative flex items-center px-1 duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                        (profile?.host_notifications_enabled ?? true) ? "bg-[#006bff]" : "bg-[#e2e8f0]"
                      )}
                    >
                      <div className={cn(
                        "w-[18px] h-[18px] bg-white rounded-full transition-transform shadow-md transform",
                        (profile?.host_notifications_enabled ?? true) ? "translate-x-[20px]" : "translate-x-0"
                      )} />
                    </button>
                    <p className="text-[15px] font-medium text-[#475569]">Receive an email when someone adds you as a host to an event type</p>
                  </div>
                </div>
              </div>

              <p className="text-[14px] text-[#64748b] pt-4 border-t border-[#f1f5f9]">Your changes to this page are saved automatically.</p>
            </div>
          ) : activeTab === 'Security' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-32">
              {/* Subtabs */}
              <div className="flex items-center gap-8 border-b border-[#f1f5f9] mb-8">
                <button 
                  onClick={() => setSecuritySubTab('Booking')}
                  className={cn(
                    "pb-3 text-sm font-bold transition-all border-b-2",
                    securitySubTab === 'Booking' ? "border-[#006bff] text-[#1a1a1a]" : "border-transparent text-[#64748b] hover:text-[#1a1a1a]"
                  )}
                >
                  Booking
                </button>
                <button 
                  onClick={() => setSecuritySubTab('Blocked sources')}
                  className={cn(
                    "pb-3 text-sm font-bold transition-all border-b-2",
                    securitySubTab === 'Blocked sources' ? "border-[#006bff] text-[#1a1a1a]" : "border-transparent text-[#64748b] hover:text-[#1a1a1a]"
                  )}
                >
                  Blocked sources
                </button>
              </div>

              {securitySubTab === 'Booking' ? (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#1a1a1a] mb-6">Booking</h3>
                      <div className="space-y-2">
                        <h4 className="text-[15px] font-bold text-[#1a1a1a]">Require email verification to book</h4>
                        <p className="text-[14px] text-[#475569] max-w-2xl leading-relaxed">
                          For Event Types with email verification enabled, invitees must confirm their email before completing a booking. <a href="https://calendly.com/help/how-to-require-email-verification-for-event-types" target="_blank" rel="noopener noreferrer" className="text-[#006bff] hover:underline">Learn more</a>
                        </p>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-[400px]">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94a3b8]" />
                      <input 
                        type="text"
                        placeholder="Search event types"
                        value={eventSearchTerm}
                        onChange={(e) => setEventSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#e2e8f0] rounded-lg text-sm text-[#334155] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedEventIds.length > 0 && (
                      <div className="flex items-center justify-between bg-white border border-[#e2e8f0] rounded-lg p-5 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleToggleBulkVerification(true)}
                              className="px-[22px] py-3.5 border border-[#1a1a1a] rounded-full text-sm font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors leading-none"
                            >
                              Enable Verification
                            </button>
                            <button 
                              onClick={() => handleToggleBulkVerification(false)}
                              className="px-[22px] py-3.5 border border-[#1a1a1a] rounded-full text-sm font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors leading-none"
                            >
                              Disable Verification
                            </button>
                          </div>
                          <span className="text-[15px] font-medium text-[#475569]">
                            {selectedEventIds.length} {selectedEventIds.length === 1 ? 'event' : 'events'} selected
                          </span>
                        </div>
                        <button 
                          onClick={() => setSelectedEventIds([])}
                          className="p-1.5 hover:bg-[#f1f5f9] rounded-full transition-colors"
                        >
                          <X className="w-9 h-9 text-[#1a1a1a] stroke-[1.5]" />
                        </button>
                      </div>
                    )}

                    {/* Table */}
                    <div className="border border-[#e2e8f0] rounded-lg overflow-hidden bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-[#e2e8f0]">
                            <th className="px-5 py-4 w-12">
                              {/* No checkbox in header as requested */}
                            </th>
                            <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]">
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                Name <div className="flex flex-col"><ChevronUp className="w-3.5 h-3.5 text-[#94a3b8]" /><ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] -mt-2" /></div>
                              </div>
                            </th>
                            <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]">
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                Verification <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
                              </div>
                            </th>
                            <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]">Type</th>
                            <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]">Owned by</th>
                            <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]">Team</th>
                            <th className="px-5 py-4 text-[13px] font-bold text-[#1a1a1a]">
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                Last edited <div className="flex flex-col"><ChevronUp className="w-3.5 h-3.5 text-[#94a3b8]" /><ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] -mt-2" /></div>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                          {events.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-5 py-12 text-center text-[#64748b] text-sm italic">
                                No event types found.
                              </td>
                            </tr>
                          ) : (
                            events
                              .filter(e => e.title.toLowerCase().includes(eventSearchTerm.toLowerCase()))
                              .map(event => (
                                <tr key={event.id} className={cn(
                                  "hover:bg-[#f8fafc] transition-colors group",
                                  selectedEventIds.includes(event.id) && "bg-[#f8fafc]"
                                )}>
                                  <td className="px-5 py-5">
                                    <input 
                                      type="checkbox" 
                                      className="w-4 h-4 rounded border-[#cbd5e1] text-[#006bff] focus:ring-[#006bff] cursor-pointer" 
                                      checked={selectedEventIds.includes(event.id)}
                                      onChange={() => {
                                        setSelectedEventIds(prev => 
                                          prev.includes(event.id) ? prev.filter(id => id !== event.id) : [...prev, event.id]
                                        );
                                      }}
                                    />
                                  </td>
                                  <td className="px-5 py-5">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className={cn("w-4 h-4 rounded-full flex-shrink-0", !event.color.startsWith('bg-[') && event.color)}
                                        style={{ backgroundColor: event.color.startsWith('bg-[') ? event.color.slice(4, -1) : (event.color.startsWith('#') ? event.color : undefined) }}
                                      />
                                      <span className="text-sm font-bold text-[#1a1a1a] truncate max-w-[200px]">{event.title}</span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-5 text-[14px] text-[#475569]">
                                    {event.require_email_verification ? 'Enabled' : ''}
                                  </td>
                                  <td className="px-5 py-5 text-[14px] text-[#475569]">One-on-One</td>
                                  <td className="px-5 py-5 text-[14px] text-[#475569] truncate max-w-[120px]">{profile?.full_name || formData.name}</td>
                                  <td className="px-5 py-5 text-[14px] text-[#475569]"></td>
                                  <td className="px-5 py-5 text-[14px] text-[#475569]">
                                    {event.created_at ? new Date(event.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '18 April 2026'}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="w-[140px] h-[140px] mb-8 relative">
                    <div className="absolute inset-0 bg-[#f8fafc] rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#006bff]">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#e2e8f0]">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-[20px] font-bold text-[#1a1a1a] mb-4">No blocked sources yet</h3>
                  <p className="text-[15px] text-[#475569] max-w-[480px] leading-relaxed mb-6">
                    Blocking someone uses their identity fingerprint to prevent future interactions, without relying on their email address. You can block people from the 'Meetings' page.
                  </p>
                  <a 
                    href="https://calendly.com/help" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 text-[14px] font-bold text-[#006bff] hover:underline"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Learn more
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
              <p className="text-lg font-medium">{activeTab} coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
