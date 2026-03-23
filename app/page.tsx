"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, MonitorPlay, TrendingUp, Trophy, ArrowRight, Clock, Plus, ChevronRight } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candRes, sesRes, jobsRes] = await Promise.all([
        ApiService.getCandidates(),
        ApiService.getSessions(),
        ApiService.getJobTitles()
      ]);
      setCandidates(candRes.data || []);
      setSessions(sesRes.data || []);
      setJobTitles(jobsRes.data || []);
    } catch (e) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const activeInterviews = sessions.filter(s => s.status === 'In Progress');
  const hires = sessions.filter(s => s.status === 'Completed' && s.recommendation === 'Hire').length;
  
  const recentSessions = [...sessions]
    .filter(s => s.status === 'Completed')
    .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Welcome built for DIME</h1>
            <p className="text-sm text-slate-500 max-w-xl leading-relaxed">Here's what's happening in your hiring pipeline today. Review candidates, launch interviews, and make data-driven decisions.</p>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
             <button 
               onClick={() => router.push('/candidates')}
               className="flex-1 md:flex-none px-6 py-2.5 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
             >
               Add Candidate
             </button>
             <button 
               onClick={() => router.push('/sessions')}
               className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black rounded-xl text-sm font-bold shadow-lg shadow-black/10 dark:shadow-white/10 active:scale-95 transition-all"
             >
               <MonitorPlay size={16} />
               <span>New Interview</span>
             </button>
          </div>
        </header>

        {loading ? (
             <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Syncing dashboard...</div>
        ) : (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               
               {/* Main KPI Column */}
               <div className="lg:col-span-2 space-y-8">
                  {/* Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg border border-indigo-400/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500" />
                        <Users size={20} className="mb-6 opacity-80" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">Total Candidates</h4>
                        <p className="text-4xl font-black tracking-tighter">{candidates.length}</p>
                     </div>

                     <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                        <MonitorPlay size={20} className="mb-6 text-slate-400 group-hover:text-amber-500 transition-colors" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Interviews</h4>
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{activeInterviews.length}</p>
                     </div>

                     <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                        <Trophy size={20} className="mb-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Hired Candidates</h4>
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{hires}</p>
                     </div>
                  </div>

                  {/* Active Sessions Panel */}
                  <div className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h3 className="text-sm font-bold text-slate-900 dark:text-white">Interviews In Progress</h3>
                           <p className="text-xs font-semibold text-slate-500 mt-0.5 uppercase tracking-wide">Resume active scoring sessions</p>
                        </div>
                        <button onClick={() => router.push('/sessions')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1">
                           <span>View All</span>
                           <ArrowRight size={12} />
                        </button>
                     </div>

                     {activeInterviews.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 dark:border-slate-800/80 rounded-xl">
                           <Clock size={24} className="text-slate-300 dark:text-slate-700 mb-3" />
                           <p className="text-sm font-semibold text-slate-400">No active interviews</p>
                           <button onClick={() => router.push('/sessions')} className="mt-4 text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg flex items-center space-x-1 hover:scale-105 transition-transform"><Plus size={14}/><span>Start Session</span></button>
                        </div>
                     ) : (
                        <div className="space-y-3">
                           {activeInterviews.map((session) => {
                              const cand = candidates.find(c => c.id === session.candidate_id);
                              return (
                                 <div key={session.id} onClick={() => router.push(`/sessions/${session.id}`)} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all group">
                                    <div className="flex items-center space-x-4">
                                       <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-bold">
                                         {cand?.name?.charAt(0) || '?'}
                                       </div>
                                       <div>
                                          <h4 className="font-bold text-sm text-slate-900 dark:text-white capitalize">{cand?.name || 'Unknown'}</h4>
                                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center space-x-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            <span>In Progress</span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:border-blue-300 transition-colors shadow-sm">
                                       <ChevronRight size={14} />
                                    </div>
                                 </div>
                              )
                           })}
                        </div>
                     )}
                  </div>
               </div>

               {/* Right Side Column */}
               <div className="space-y-8">
                  {/* Recent Evaluations */}
                  <div className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
                     <div className="flex items-center space-x-2 mb-8">
                        <TrendingUp size={16} className="text-slate-400" />
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Recent Evaluations</h3>
                     </div>
                     
                     {recentSessions.length === 0 ? (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center py-8">No evaluations yet.</p>
                     ) : (
                        <div className="space-y-5">
                           {recentSessions.map((session, i) => {
                             const cand = candidates.find(c => c.id === session.candidate_id);
                             return (
                               <div key={session.id} className="flex justify-between items-center group cursor-pointer" onClick={() => router.push(`/sessions/${session.id}`)}>
                                 <div>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white capitalize group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cand?.name || 'Unknown'}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{new Date(session.created_at).toLocaleDateString()}</p>
                                 </div>
                                 <div className="text-right">
                                    <span className="text-xl font-black text-slate-900 dark:text-white">{session.score_total?.toFixed(1) || '0'}</span>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${
                                       session.recommendation === 'Hire' ? 'text-emerald-500' : 
                                       session.recommendation === 'Reject' ? 'text-red-500' : 'text-slate-500'
                                    }`}>
                                       {session.recommendation}
                                    </p>
                                 </div>
                               </div>
                             )
                           })}
                        </div>
                     )}
                     
                     <button onClick={() => router.push('/compare')} className="w-full mt-8 py-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">
                        Compare Candidates
                     </button>
                  </div>
               </div>
               
             </div>
        )}
      </div>
    </DashboardLayout>
  );
}
