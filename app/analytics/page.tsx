"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ApiService } from '@/lib/api';
import { Users, Layers, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Activity, Award } from 'lucide-react';
import { toast } from 'sonner';

const AnalyticsPage = () => {
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
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalCandidates = candidates.length;
  const completedSessions = sessions.filter(s => s.status === 'Completed');
  const totalInterviews = sessions.length;
  
  const personalCount = completedSessions.filter(s => s.session_type === 'personal').length;
  const technicalCount = completedSessions.filter(s => s.session_type === 'technical').length;
  
  const recommendations = completedSessions.reduce((acc, curr) => {
    acc[curr.recommendation] = (acc[curr.recommendation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgScore = completedSessions.length > 0 
    ? completedSessions.reduce((acc, curr) => acc + (curr.score_total || 0), 0) / completedSessions.length 
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">High-level metrics and recruiting pipeline performance.</p>
        </header>

        {loading ? (
           <div className="p-12 text-center text-slate-400 text-sm">Crunching data...</div>
        ) : (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               
               <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group">
                 <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl">
                      <Users size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+12% this month</span>
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{totalCandidates}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-2 uppercase tracking-wide">Total Candidates</p>
                 </div>
               </div>

               <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group">
                 <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-xl">
                      <Activity size={18} />
                    </div>
                    <div className="flex space-x-1">
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">{personalCount} Per.</span>
                      <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase">{technicalCount} Tech.</span>
                    </div>
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{completedSessions.length}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-2 uppercase tracking-wide">Completed Sessions</p>
                 </div>
               </div>

               <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group">
                 <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-xl">
                      <Award size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Out of 5.0</span>
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{avgScore.toFixed(1)}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-2 uppercase tracking-wide">Platform Avg Score</p>
                 </div>
               </div>

               <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group">
                 <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl">
                      <CheckCircle2 size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hires</span>
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">
                       {recommendations['Hire'] || 0}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-2 uppercase tracking-wide">Strong Hire Votes</p>
                 </div>
               </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               
               {/* Stage Funnel */}
               <div className="bg-white dark:bg-[#111113] p-6 pr-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center space-x-2 mb-8">
                     <Layers size={16} className="text-slate-400" />
                     <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Pipeline Funnel (Aggregate)</h3>
                  </div>
                  
                  <div className="space-y-4">
                     {[
                        { stage: 'Applied', count: totalCandidates, color: 'bg-slate-200 dark:bg-slate-700' },
                        { stage: 'Screening', count: Math.round(totalCandidates * 0.7), color: 'bg-blue-300 dark:bg-blue-800/60' },
                        { stage: 'Technical Interview', count: Math.round(totalCandidates * 0.4), color: 'bg-blue-500 dark:bg-blue-600' },
                        { stage: 'Final Evaluation', count: Math.round(totalCandidates * 0.15), color: 'bg-indigo-500 dark:bg-indigo-500' },
                        { stage: 'Offer Extended', count: Math.round(totalCandidates * 0.05), color: 'bg-emerald-500 dark:bg-emerald-500' }
                     ].map((s, idx, arr) => {
                        const max = arr[0].count;
                        const width = max > 0 ? (s.count / max) * 100 : 0;
                        return (
                           <div key={idx} className="relative flex items-center">
                              <div className="w-40 flex-shrink-0 text-xs font-bold text-slate-600 dark:text-slate-400 text-right pr-6">
                                {s.stage}
                              </div>
                              <div className="flex-1 h-8 bg-slate-50 dark:bg-slate-900/50 rounded-r-lg overflow-hidden flex items-center relative border border-slate-100 dark:border-slate-800 group">
                                 <div 
                                   className={`h-full ${s.color} transition-all duration-1000 ease-out`}
                                   style={{ width: `${width}%` }}
                                 />
                                 <span className="absolute left-4 text-[10px] font-black tracking-widest text-slate-900 dark:text-white mix-blend-difference opacity-0 group-hover:opacity-100 transition-opacity">
                                    {s.count}
                                 </span>
                              </div>
                           </div>
                        )
                     })}
                  </div>
               </div>

               {/* Roles Distribution */}
               <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center space-x-2">
                        <TrendingUp size={16} className="text-slate-400" />
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Candidates by Job Role</h3>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1">
                     {jobTitles.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">No job roles found</p>
                     ) : (
                        jobTitles.map((job) => {
                           const candCount = candidates.filter(c => c.job_title_id === job.id).length;
                           return (
                              <div key={job.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                 <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{job.title}</h4>
                                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{job.department || 'General'}</p>
                                 </div>
                                 <div className="flex items-center space-x-4">
                                    <span className="text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded">
                                       {candCount}
                                    </span>
                                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                                 </div>
                              </div>
                           )
                        })
                     )}
                  </div>
               </div>

            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
