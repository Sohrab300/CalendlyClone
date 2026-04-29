import React from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { availabilityService } from '../../services/availabilityService';

const DEFAULT_WELCOME_MESSAGE = 'Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.';

export function useSettings(onProfileUpdate?: (profile: any) => void) {
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
    welcomeMessage: DEFAULT_WELCOME_MESSAGE,
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h (am/pm)',
    country: 'India',
    timezone: 'Asia/Kolkata',
    useCalendlyBranding: true,
    username: '',
    email: '',
  });

  React.useEffect(() => {
    loadProfile();
    loadEvents();
  }, []);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const loadEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEvents(await availabilityService.getEventTypes(user.id));
    } catch (err) {
      console.error('Error loading events:', err);
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let query = supabase.from('profiles').select('*');
      if (user) query = query.eq('id', user.id);

      const { data: profileData } = await query.limit(1).single();
      if (!profileData) return;

      setProfile(profileData);
      setFormData({
        name: profileData.full_name || 'User',
        welcomeMessage: profileData.welcome_message || DEFAULT_WELCOME_MESSAGE,
        language: profileData.language || 'English',
        dateFormat: profileData.date_format || 'DD/MM/YYYY',
        timeFormat: profileData.time_format || '12h (am/pm)',
        country: profileData.country || (Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Asia/Kolkata') ? 'India' : 'United States'),
        timezone: profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        useCalendlyBranding: profileData.use_calendly_branding ?? true,
        username: profileData.username || '',
        email: profileData.email || user?.email || '',
      });
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    if (!validateFile(file, ['image/jpeg', 'image/jpg', 'image/png'])) return;

    setIsUploading(true);
    try {
      await removeStoredFile('avatars', profile.avatar_url, 'avatars');
      const publicUrl = await uploadPublicFile('avatars', `avatars/${profile.id}-${Math.random()}.${file.name.split('.').pop()}`, file);
      await upsertProfile({ avatar_url: publicUrl });
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
    if (!profile?.avatar_url) return;
    try {
      await removeStoredFile('avatars', profile.avatar_url, 'avatars');
      await upsertProfile({ avatar_url: null });
      toast.success('Profile picture removed');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove profile picture');
    }
  };

  const handleBrandLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    if (!validateFile(file, ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'], 'Only JPG, JPEG, PNG, and GIF files are allowed')) return;

    setIsUploadingBrand(true);
    try {
      await removeStoredFile('brand-logos', profile.brand_logo_url, 'brand-logos');
      const publicUrl = await uploadPublicFile('brand-logos', `brand-logos/brand-${profile.id}-${Math.random()}.${file.name.split('.').pop()}`, file);
      await upsertProfile({ brand_logo_url: publicUrl });
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
    if (!profile?.brand_logo_url) return;
    try {
      await removeStoredFile('brand-logos', profile.brand_logo_url, 'brand-logos');
      await upsertProfile({ brand_logo_url: null });
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

      await upsertProfile({});
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

    const previousProfile = { ...profile };
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
      setProfile(previousProfile);
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
      setEvents(prev => prev.map(event =>
        selectedEventIds.includes(event.id) ? { ...event, require_email_verification: enabled } : event
      ));
      setSelectedEventIds([]);
    } catch (err) {
      console.error('Error updating verification:', err);
      toast.error('Failed to update verification');
    }
  };

  const toggleSelectedEvent = (id: string) => {
    setSelectedEventIds(prev => prev.includes(id) ? prev.filter(eventId => eventId !== id) : [...prev, id]);
  };

  const upsertProfile = async (overrides: Record<string, any>) => {
    const { data: updatedData, error } = await supabase
      .from('profiles')
      .upsert({
        id: profile?.id && !profile.id?.startsWith('mock-id') ? profile.id : undefined,
        username: formData.username || profile?.username || '',
        full_name: formData.name || profile?.full_name,
        welcome_message: formData.welcomeMessage || profile?.welcome_message,
        language: formData.language || profile?.language,
        date_format: formData.dateFormat || profile?.date_format,
        time_format: formData.timeFormat || profile?.time_format,
        country: formData.country || profile?.country,
        timezone: formData.timezone || profile?.timezone,
        host_notifications_enabled: profile?.host_notifications_enabled ?? true,
        use_calendly_branding: formData.useCalendlyBranding,
        brand_logo_url: profile?.brand_logo_url,
        avatar_url: profile?.avatar_url,
        email: formData.email,
        ...overrides,
      }, { onConflict: 'username' })
      .select()
      .single();

    if (error) throw error;
    if (updatedData) {
      setProfile(updatedData);
      onProfileUpdate?.(updatedData);
    }
  };

  return {
    brandLogoInputRef,
    events,
    eventSearchTerm,
    fileInputRef,
    formData,
    handleBrandLogoFileChange,
    handleDeleteAvatar,
    handleFileChange,
    handleRemoveBrandLogo,
    handleSave,
    handleToggleBulkVerification,
    handleToggleNotifications,
    handleUploadClick,
    isLoading,
    isUploading,
    isUploadingBrand,
    profile,
    selectedEventIds,
    setEventSearchTerm,
    setSelectedEventIds,
    toggleSelectedEvent,
    updateFormData,
  };
}

const validateFile = (file: File, allowedTypes: string[], typeMessage = 'Only JPG, JPEG, and PNG files are allowed') => {
  if (!allowedTypes.includes(file.type)) {
    toast.error(typeMessage);
    return false;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('File size must be less than 5MB');
    return false;
  }
  return true;
};

const removeStoredFile = async (bucket: string, publicUrl: string | undefined, pathPrefix: string) => {
  if (!publicUrl) return;
  try {
    const oldFileName = publicUrl.split('/').pop();
    if (oldFileName) await supabase.storage.from(bucket).remove([`${pathPrefix}/${oldFileName}`]);
  } catch (error) {
    console.warn(`Failed to cleanup ${bucket} file:`, error);
  }
};

const uploadPublicFile = async (bucket: string, filePath: string, file: File) => {
  const { error } = await supabase.storage.from(bucket).upload(filePath, file);
  if (error) {
    if (error.message.includes('bucket not found')) {
      throw new Error(`Supabase Storage bucket "${bucket}" not found. Please create it in your Supabase dashboard.`);
    }
    throw error;
  }

  return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
};
