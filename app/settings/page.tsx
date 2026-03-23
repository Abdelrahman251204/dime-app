"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings, Shield, Bell, Key, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const saveFakeSettings = () => {
    toast.success('Settings updated successfully');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto pb-12">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your team preferences and security settings.</p>
        </header>

        <div className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 pb-0 flex space-x-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto hide-scrollbar">
             <button className="pb-4 font-bold text-sm text-black dark:text-white border-b-2 border-black dark:border-white whitespace-nowrap">General</button>
             <button className="pb-4 font-bold text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border-b-2 border-transparent transition-colors whitespace-nowrap">Team & Roles</button>
             <button className="pb-4 font-bold text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border-b-2 border-transparent transition-colors whitespace-nowrap">Integrations</button>
          </div>

          <div className="p-8 space-y-12">
            
            <section>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center space-x-2 mb-6">
                 <Settings size={16} className="text-slate-400" />
                 <span>Workspace Profile</span>
               </h3>
               
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Workspace Name</label>
                        <input type="text" defaultValue="DIME Recruiting" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Company Domain</label>
                        <input type="text" defaultValue="dime.co" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all" />
                     </div>
                  </div>
               </div>
            </section>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <section>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center space-x-2 mb-6">
                 <Shield size={16} className="text-slate-400" />
                 <span>Security & Access</span>
               </h3>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                     <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Require Two-Factor Authentication</p>
                        <p className="text-xs text-slate-500 mt-1">Force 2FA for all interviewers and admins.</p>
                     </div>
                     <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer relative">
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-500/10 rounded-xl">
                     <div className="flex space-x-4">
                        <Key size={20} className="text-blue-500 mt-1" />
                        <div>
                           <p className="font-bold text-sm text-slate-900 dark:text-white">Local Offline Database Strategy</p>
                           <p className="text-xs text-slate-500 mt-1 max-w-sm">The platform is running in 100% local persistence mode per user directives. Data is saved to the local host.</p>
                        </div>
                     </div>
                  </div>
               </div>
            </section>
            
            <div className="pt-6 flex justify-end">
               <button onClick={saveFakeSettings} className="bg-black text-white dark:bg-white dark:text-black font-bold px-6 py-2.5 rounded-xl text-sm shadow-md active:scale-95 transition-all">
                  Save Changes
               </button>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
