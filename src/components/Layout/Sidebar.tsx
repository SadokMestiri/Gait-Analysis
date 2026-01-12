import React, { ReactNode } from 'react';

interface SidebarProps {
  children?: ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
      {children}
    </div>
  );
};