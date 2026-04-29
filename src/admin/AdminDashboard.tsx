import React from 'react';
import { AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CreateEventSidebar } from './components/CreateEventSidebar';
import { AvailabilityView } from './components/AvailabilityView';
import { MeetingsView } from './components/MeetingsView';
import { ContactsView } from './components/ContactsView';
import { SettingsView } from './components/SettingsView';
import { SchedulingView } from './components/SchedulingView';
import { SelectedEventsToolbar } from './components/SelectedEventsToolbar';
import { AdminShell } from './components/AdminShell';
import { useAdminDashboard } from './hooks/useAdminDashboard';

export default function AdminDashboard() {
  const dashboard = useAdminDashboard();

  if (dashboard.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (dashboard.sidebarTab === 'Settings') {
    return (
      <SettingsView
        onBack={() => dashboard.setSidebarTab('Scheduling')}
        onProfileUpdate={dashboard.setProfile}
        initialTab={dashboard.settingsTab}
      />
    );
  }

  return (
    <AdminShell
      sidebar={(
        <Sidebar
          activeTab={dashboard.sidebarTab}
          onTabChange={dashboard.setSidebarTab}
          onCreateClick={dashboard.handleOpenCreate}
        />
      )}
      header={(
        <Header
          profile={dashboard.profile}
          onNavigateToSettings={dashboard.navigateToSettings}
        />
      )}
      mainClassName="p-8"
      rightPanel={(
        <AnimatePresence>
          {dashboard.isSidebarOpen && (
            <CreateEventSidebar
              isOpen={dashboard.isSidebarOpen}
              onClose={() => dashboard.setIsSidebarOpen(false)}
              eventName={dashboard.newEventName}
              setEventName={dashboard.setNewEventName}
              eventColor={dashboard.newEventColor}
              setEventColor={dashboard.setNewEventColor}
              onCreate={dashboard.handleCreateEvent}
              schedules={dashboard.schedules}
              editingEvent={dashboard.editingEvent}
              profile={dashboard.profile}
              onNavigateToAvailability={dashboard.navigateToAvailability}
            />
          )}
        </AnimatePresence>
      )}
    >
      {dashboard.sidebarTab === 'Scheduling' ? (
        <SchedulingView
          activeTab={dashboard.activeTab}
          events={dashboard.events}
          isSidebarOpen={dashboard.isSidebarOpen}
          newEventColor={dashboard.newEventColor}
          newEventName={dashboard.newEventName}
          profile={dashboard.profile}
          selectedIds={dashboard.selectedIds}
          onCopyLink={dashboard.handleCopyLink}
          onCreateClick={() => dashboard.setIsSidebarOpen(true)}
          onEditEvent={dashboard.handleEditEvent}
          onTabChange={dashboard.setActiveTab}
          onToggleSelection={dashboard.toggleSelection}
          onViewLandingPage={dashboard.handleViewLandingPage}
        />
      ) : dashboard.sidebarTab === 'Meetings' ? (
        <MeetingsView />
      ) : dashboard.sidebarTab === 'Availability' ? (
        <AvailabilityView initialScheduleId={dashboard.targetScheduleId} />
      ) : dashboard.sidebarTab === 'Contacts' ? (
        <ContactsView />
      ) : (
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-slate-400">
          <p className="text-lg font-medium">{dashboard.sidebarTab} content coming soon</p>
        </div>
      )}

      <SelectedEventsToolbar
        selectedCount={dashboard.selectedIds.size}
        onClear={() => dashboard.setSelectedIds(new Set())}
        onDelete={dashboard.handleDelete}
      />

    </AdminShell>
  );
}
