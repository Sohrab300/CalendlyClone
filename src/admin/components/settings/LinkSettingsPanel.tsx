import React from 'react';

export const LinkSettingsPanel: React.FC<{
  formData: any;
  onSave: () => void;
  onUpdateFormData: (updates: any) => void;
}> = ({ formData, onSave, onUpdateFormData }) => (
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
            onChange={(e) => onUpdateFormData({ username: e.target.value.replace(/[^a-zA-Z0-9-]/g, '') })}
            className="flex-1 px-4 py-3 bg-white border border-[#e2e8f0] rounded-r-lg text-sm text-[#1a1a1a] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium"
            placeholder="username"
          />
        </div>
      </div>

      <div className="pt-6 border-t border-[#f1f5f9]">
        <button onClick={onSave} className="px-8 py-2.5 bg-[#006bff] text-white rounded-full text-[14px] font-bold hover:bg-[#0052cc] transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  </div>
);
