import React from 'react';
import { Info } from 'lucide-react';

export const BrandingSettingsPanel: React.FC<{
  brandLogoInputRef: React.RefObject<HTMLInputElement>;
  isUploadingBrand: boolean;
  onBack: () => void;
  onBrandLogoFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBrandLogo: () => void;
  onSave: () => void;
  profile: any;
}> = ({
  brandLogoInputRef,
  isUploadingBrand,
  onBack,
  onBrandLogoFileChange,
  onRemoveBrandLogo,
  onSave,
  profile,
}) => (
  <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="space-y-8">
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
              <img src={profile.brand_logo_url} alt="Brand Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <span className="text-2xl font-bold text-[#94a3b8] tracking-tight">No Logo</span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <input type="file" ref={brandLogoInputRef} onChange={onBrandLogoFileChange} accept=".jpg,.jpeg,.png,.gif" className="hidden" />
          <button
            onClick={() => brandLogoInputRef.current?.click()}
            disabled={isUploadingBrand}
            className="px-6 py-2.5 border-[1.5px] border-[#e2e8f0] rounded-lg text-[14px] font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
          >
            {isUploadingBrand && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900" />}
            {isUploadingBrand ? 'Uploading...' : 'Upload image'}
          </button>
          {profile?.brand_logo_url && (
            <button onClick={onRemoveBrandLogo} className="px-6 py-2.5 border-[1.5px] border-red-100 rounded-lg text-[14px] font-bold text-red-600 hover:bg-red-50 transition-colors">
              Remove
            </button>
          )}
          <p className="text-[13px] text-[#64748b]">JPG, GIF or PNG. Max size of 5MB.</p>
        </div>
      </div>

      <div className="pt-10 flex items-center gap-3 border-t border-[#f1f5f9]">
        <button onClick={onSave} className="px-6 py-2.5 bg-[#006bff] text-white rounded-full text-[14px] font-bold hover:bg-[#0052cc] transition-colors">
          Save Changes
        </button>
        <button onClick={onBack} className="px-6 py-2.5 border-[1.5px] border-[#e2e8f0] rounded-full text-[14px] font-bold text-[#1a1a1a] hover:bg-[#f8fafc] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  </div>
);
