import React from "react";
import { cn } from "../../lib/utils";

interface AdminShellProps {
  sidebar: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  isMobileSidebarOpen?: boolean;
  mainClassName?: string;
  onCloseMobileSidebar?: () => void;
  rightPanel?: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  sidebar,
  header,
  children,
  contentClassName,
  isMobileSidebarOpen = false,
  mainClassName,
  onCloseMobileSidebar,
  rightPanel,
}) => (
  <div className="flex h-screen overflow-hidden bg-white font-sans text-slate-900 relative">
    {isMobileSidebarOpen && (
      <button
        type="button"
        onClick={onCloseMobileSidebar}
        className="md:hidden fixed inset-0 z-[125] bg-slate-950/40"
        aria-label="Close sidebar"
      />
    )}

    <div
      className={cn(
        "fixed inset-y-0 left-0 z-[130] transition-transform duration-300 md:relative md:z-auto md:translate-x-0",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {sidebar}
    </div>

    <div
      className={cn(
        "flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden",
        contentClassName,
      )}
    >
      {header}
      <main className={cn("flex-1 min-h-0 overflow-y-auto", mainClassName)}>
        {children}
      </main>
    </div>

    {rightPanel}
  </div>
);
