import React from 'react';
import { Info, User } from 'lucide-react';
import { countries, timezones } from '../../../constants/profileData';
import { CustomSelect } from './CustomSelect';

export const ProfileSettingsPanel: React.FC<{
  fileInputRef: React.RefObject<HTMLInputElement>;
  formData: any;
  isUploading: boolean;
  onBack: () => void;
  onDeleteAvatar: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onUpdateFormData: (updates: any) => void;
  onUploadClick: () => void;
  profile: any;
}> = ({
  fileInputRef,
  formData,
  isUploading,
  onBack,
  onDeleteAvatar,
  onFileChange,
  onSave,
  onUpdateFormData,
  onUploadClick,
  profile,
}) => (
  <div className="space-y-12 pb-32">
    <div className="flex items-center gap-6">
      <div className="w-[88px] h-[88px] bg-[#f1f5f9] rounded-full flex items-center justify-center overflow-hidden border border-[#e2e8f0]">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <User className="w-[48px] h-[48px] text-[#94a3b8]" />
        )}
      </div>
      <div className="space-y-4">
        <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".jpg,.jpeg,.png" className="hidden" />
        <div className="flex items-center gap-3">
          <button
            onClick={onUploadClick}
            disabled={isUploading}
            className="px-6 py-2.5 border-[1.5px] border-[#e2e8f0] rounded-full text-[14px] font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900" />}
            {isUploading ? 'Uploading...' : 'Upload picture'}
          </button>
          {profile?.avatar_url && (
            <button
              onClick={onDeleteAvatar}
              className="px-6 py-2.5 border-[1.5px] border-red-100 rounded-full text-[14px] font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-[13px] text-[#64748b]">JPG, JPEG or PNG. Max size of 5MB.</p>
      </div>
    </div>

    <div className="grid gap-x-8 gap-y-8">
      <LabeledInput label="Name" value={formData.name} onChange={(name) => onUpdateFormData({ name })} />
      <LabeledInput label="Email" type="email" value={formData.email} placeholder="your@email.com" onChange={(email) => onUpdateFormData({ email })} />

      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-sm font-bold text-[#1a1a1a]">
          Welcome Message
          <Info className="w-3.5 h-3.5 text-[#94a3b8] cursor-help" />
        </label>
        <textarea
          rows={4}
          value={formData.welcomeMessage}
          onChange={(e) => onUpdateFormData({ welcomeMessage: e.target.value })}
          className="w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-lg text-sm text-[#334155] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
        />
      </div>

      <CustomSelect label="Language" value={formData.language} options={['English', 'Spanish', 'French']} onChange={(language) => onUpdateFormData({ language })} className="w-[325px]" />

      <div className="flex gap-6">
        <CustomSelect label="Date Format" value={formData.dateFormat} options={['MM/DD/YYYY', 'DD/MM/YYYY']} onChange={(dateFormat) => onUpdateFormData({ dateFormat })} showInfo className="flex-1" />
        <CustomSelect label="Time Format" value={formData.timeFormat} options={['12h (am/pm)', '24h']} onChange={(timeFormat) => onUpdateFormData({ timeFormat })} showInfo className="flex-1" />
      </div>

      <CustomSelect label="Country" value={formData.country} options={countries} onChange={(country) => onUpdateFormData({ country })} className="w-[325px]" />

      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold text-[#1a1a1a]">Time Zone</label>
          <span className="text-[12px] text-[#64748b]">Current Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}</span>
        </div>
        <CustomSelect label="" value={formData.timezone} options={timezones} onChange={(timezone) => onUpdateFormData({ timezone })} hasSearch isTimezone />
      </div>
    </div>

    <div className="pt-10 flex items-center justify-between border-t border-[#f1f5f9]">
      <div className="flex items-center gap-3">
        <button onClick={onSave} className="px-6 py-2.5 bg-[#006bff] text-white rounded-full text-[14px] font-bold hover:bg-[#0052cc] transition-colors">
          Save Changes
        </button>
        <button onClick={onBack} className="px-6 py-2.5 border-[1.5px] border-[#e2e8f0] rounded-full text-[14px] font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors">
          Cancel
        </button>
      </div>
      <button className="px-6 py-2.5 bg-[#d93a00] text-white rounded-full text-[14px] font-bold hover:bg-[#b83100] transition-colors">
        Delete Account
      </button>
    </div>
  </div>
);

const LabeledInput: React.FC<{
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}> = ({ label, type = 'text', value, placeholder, onChange }) => (
  <div className="space-y-2.5">
    <label className="flex items-center gap-1.5 text-sm font-bold text-[#1a1a1a]">
      {label}
      <Info className="w-3.5 h-3.5 text-[#94a3b8] cursor-help" />
    </label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-[325px] px-4 py-3 bg-white border border-[#e2e8f0] rounded-lg text-sm text-[#334155] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
    />
  </div>
);
