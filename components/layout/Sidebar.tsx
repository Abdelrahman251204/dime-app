import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  GitBranch, 
  Files, 
  PenTool, 
  MonitorPlay, 
  LayoutTemplate,
  PieChart, 
  Settings,
  Zap,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (v: boolean) => void }) => {
  const pathname = usePathname();

  const menuItems = [
    { icon: <Home size={18} />, label: 'Dashboard', href: '/' },
    { icon: <Users size={18} />, label: 'Candidates', href: '/candidates' },
    { icon: <GitBranch size={18} />, label: 'Pipelines', href: '/pipelines' },
    { icon: <LayoutTemplate size={18} />, label: 'Templates', href: '/templates' },
    { icon: <PenTool size={18} />, label: 'Builder', href: '/templates/builder' },
    { icon: <MonitorPlay size={18} />, label: 'Sessions', href: '/sessions' },
    { icon: <Files size={18} />, label: 'Compare', href: '/compare' },
    { icon: <PieChart size={18} />, label: 'Analytics', href: '/analytics' },
    { icon: <Settings size={18} />, label: 'Settings', href: '/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
         <div 
           className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
           onClick={() => setIsOpen?.(false)}
         />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-[#111113] border-r border-slate-200 dark:border-slate-800/60 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Header */}
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md">
               <Zap size={18} fill="currentColor" />
             </div>
             <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
               DIME Hub
             </h1>
          </div>
          <button 
             onClick={() => setIsOpen?.(false)}
             className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800 transition-colors"
          >
             <X size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 mt-2">
          <div className="mb-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu</div>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen?.(false)}
                className={`relative flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'text-black dark:text-white font-semibold' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-lg -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`transition-colors ${isActive ? '' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 mx-4 mb-4 mt-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">John Doe</p>
              <p className="text-xs text-slate-500 font-medium truncate">Admin Workspace</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
