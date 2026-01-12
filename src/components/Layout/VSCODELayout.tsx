import React, { ReactNode } from 'react';

interface VSCODELayoutProps {
  sidebar: ReactNode;
  sensorSidebar: ReactNode;
  statusBar: ReactNode;
  children: ReactNode;
}

export const VSCODELayout: React.FC<VSCODELayoutProps> = ({
  sidebar,
  sensorSidebar,
  statusBar,
  children,
}) => {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-gray-700 overflow-y-auto">
          {sidebar}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Right Sidebar (Sensor) */}
        <div className="w-80 border-l border-gray-700 overflow-y-auto">
          {sensorSidebar}
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-700">
        {statusBar}
      </div>
    </div>
  );
};