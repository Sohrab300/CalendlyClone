import React from 'react';
import { AdminShell } from './AdminShell';
import { SettingsSidebar } from './settings/SettingsSidebar';
import { ProfileSettingsPanel } from './settings/ProfileSettingsPanel';
import { BrandingSettingsPanel } from './settings/BrandingSettingsPanel';
import { LinkSettingsPanel } from './settings/LinkSettingsPanel';
import { CommunicationSettingsPanel } from './settings/CommunicationSettingsPanel';
import { SecuritySettingsPanel } from './settings/SecuritySettingsPanel';
import { useSettings } from '../hooks/useSettings';

export const SettingsView: React.FC<{
  onBack: () => void;
  onProfileUpdate?: (profile: any) => void;
  initialTab?: string;
}> = ({ onBack, onProfileUpdate, initialTab = 'Profile' }) => {
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [securitySubTab, setSecuritySubTab] = React.useState('Booking');
  const settings = useSettings(onProfileUpdate);

  if (settings.isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <AdminShell
      sidebar={<SettingsSidebar activeTab={activeTab} onBack={onBack} onTabChange={setActiveTab} />}
      mainClassName="bg-white pt-12 animate-in fade-in duration-500"
    >
      <div className="max-w-[720px] mx-auto px-10">
        <div className="mb-12">
          <p className="text-[13px] font-bold text-[#64748b] mb-3">Account details</p>
          <h1 className="text-[28px] font-bold text-[#1a1a1a]">{activeTab}</h1>
        </div>

        <div className="h-[1px] bg-[#f1f5f9] w-full mb-12" />

        {activeTab === 'Profile' ? (
          <ProfileSettingsPanel
            fileInputRef={settings.fileInputRef}
            formData={settings.formData}
            isUploading={settings.isUploading}
            onBack={onBack}
            onDeleteAvatar={settings.handleDeleteAvatar}
            onFileChange={settings.handleFileChange}
            onSave={settings.handleSave}
            onUpdateFormData={settings.updateFormData}
            onUploadClick={settings.handleUploadClick}
            profile={settings.profile}
          />
        ) : activeTab === 'Branding' ? (
          <BrandingSettingsPanel
            brandLogoInputRef={settings.brandLogoInputRef}
            isUploadingBrand={settings.isUploadingBrand}
            onBack={onBack}
            onBrandLogoFileChange={settings.handleBrandLogoFileChange}
            onRemoveBrandLogo={settings.handleRemoveBrandLogo}
            onSave={settings.handleSave}
            profile={settings.profile}
          />
        ) : activeTab === 'My Link' ? (
          <LinkSettingsPanel
            formData={settings.formData}
            onSave={settings.handleSave}
            onUpdateFormData={settings.updateFormData}
          />
        ) : activeTab === 'Communication settings' ? (
          <CommunicationSettingsPanel
            onToggleNotifications={settings.handleToggleNotifications}
            profile={settings.profile}
          />
        ) : activeTab === 'Security' ? (
          <SecuritySettingsPanel
            events={settings.events}
            eventSearchTerm={settings.eventSearchTerm}
            formData={settings.formData}
            onClearSelectedEvents={() => settings.setSelectedEventIds([])}
            onEventSearchChange={settings.setEventSearchTerm}
            onToggleBulkVerification={settings.handleToggleBulkVerification}
            onToggleSelectedEvent={settings.toggleSelectedEvent}
            profile={settings.profile}
            securitySubTab={securitySubTab}
            selectedEventIds={settings.selectedEventIds}
            setSecuritySubTab={setSecuritySubTab}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
            <p className="text-lg font-medium">{activeTab} coming soon</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
};
