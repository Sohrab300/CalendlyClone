import React from "react";
import { AdminShell } from "./AdminShell";
import { Header } from "./Header";
import { SettingsSidebar } from "./settings/SettingsSidebar";
import { ProfileSettingsPanel } from "./settings/ProfileSettingsPanel";
import { BrandingSettingsPanel } from "./settings/BrandingSettingsPanel";
import { LinkSettingsPanel } from "./settings/LinkSettingsPanel";
import { CommunicationSettingsPanel } from "./settings/CommunicationSettingsPanel";
import { SecuritySettingsPanel } from "./settings/SecuritySettingsPanel";
import { useSettings } from "../hooks/useSettings";

export const SettingsView: React.FC<{
  onBack: () => void;
  onProfileUpdate?: (profile: any) => void;
  initialTab?: string;
}> = ({ onBack, onProfileUpdate, initialTab = "Profile" }) => {
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [securitySubTab, setSecuritySubTab] = React.useState("Booking");
  const settings = useSettings(onProfileUpdate);
  const contentWidthClass =
    activeTab === "Security" ? "max-w-[1280px]" : "max-w-[670px]";

  if (settings.isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <AdminShell
      sidebar={
        <SettingsSidebar
          activeTab={activeTab}
          onBack={onBack}
          onTabChange={setActiveTab}
        />
      }
      header={
        <Header
          variant="settings"
          profile={settings.profile}
          onNavigateToSettings={(tab = "Profile") => setActiveTab(tab)}
        />
      }
      mainClassName="bg-white animate-in fade-in duration-500"
    >
      <div className="w-full">
        <div className="px-11 pt-0 pb-7">
          <p className="text-[14px] font-bold leading-none text-[#536b8c] mb-7">
            Account details
          </p>
          <h1 className="text-[28px] font-bold leading-none text-[#0b1f3a]">
            {activeTab}
          </h1>
        </div>

        <div className="h-[1px] bg-[#d8e1ec] w-full" />

        <div className={`px-11 pt-11 ${contentWidthClass}`}>
          {activeTab === "Profile" ? (
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
          ) : activeTab === "Branding" ? (
            <BrandingSettingsPanel
              brandLogoInputRef={settings.brandLogoInputRef}
              isUploadingBrand={settings.isUploadingBrand}
              onBack={onBack}
              onBrandLogoFileChange={settings.handleBrandLogoFileChange}
              onRemoveBrandLogo={settings.handleRemoveBrandLogo}
              onSave={settings.handleSave}
              profile={settings.profile}
            />
          ) : activeTab === "My Link" ? (
            <LinkSettingsPanel
              formData={settings.formData}
              onSave={settings.handleSave}
              onUpdateFormData={settings.updateFormData}
            />
          ) : activeTab === "Communication settings" ? (
            <CommunicationSettingsPanel
              onToggleNotifications={settings.handleToggleNotifications}
              profile={settings.profile}
            />
          ) : activeTab === "Security" ? (
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
      </div>
    </AdminShell>
  );
};
