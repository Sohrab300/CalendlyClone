import React from 'react';
import { cn } from '../../lib/utils';

interface AdminShellProps {
  sidebar: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  mainClassName?: string;
  rightPanel?: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  sidebar,
  header,
  children,
  contentClassName,
  mainClassName,
  rightPanel,
}) => (
  <div className="flex h-screen overflow-hidden bg-white font-sans text-slate-900 relative">
    {sidebar}

    <div className={cn('flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden', contentClassName)}>
      {header}
      <main className={cn('flex-1 min-h-0 overflow-y-auto', mainClassName)}>
        {children}
      </main>
    </div>

    {rightPanel}
  </div>
);
