import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Zap } from 'lucide-react';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0A0A0B]">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#111113] border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-4">
         <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md">
              <Zap size={16} fill="currentColor" />
            </div>
            <span className="font-bold tracking-tight text-slate-900 dark:text-white">DIME Hub</span>
         </div>
         <button 
           onClick={() => setIsMobileMenuOpen(true)}
           className="p-2 -mr-2 text-slate-500 hover:text-black dark:hover:text-white"
         >
           <Menu size={24} />
         </button>
      </div>

      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      {/* 
        Main content wrapper with polished scrollbar and layout.
        The md:ml-64 matches the fixed sidebar width on desktop.
      */}
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden pt-16 md:pt-0">
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-8 scroll-smooth">
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
