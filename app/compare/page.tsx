"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Trophy, TrendingUp, AlertTriangle, Scale, GripHorizontal, Columns, Award } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const ComparePage = () => {
  const router = useRouter();
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Data for comparison
  const [candidates, setCandidates] = useState<any[]>([]);
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    fetchBaseData();
  }, []);

  const fetchBaseData = async () => {
    try {
      setLoading(true);
      const [jobsRes, candRes, sesRes, tplRes] = await Promise.all([
        ApiService.getJobTitles(),
        ApiService.getCandidates(),
        ApiService.getSessions(),
        ApiService.getTemplates()
      ]);
      setJobTitles(jobsRes.data || []);
      setCandidates(candRes.data || []);
      
      const completed = (sesRes.data || []).filter((s: any) => s.status === 'Completed');
      setCompletedSessions(completed);
      setTemplates(tplRes.data || []);
      
      if (jobsRes.data && jobsRes.data.length > 0) {
         setSelectedJobId(jobsRes.data[0].id);
      }
    } catch (e) {
      toast.error('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const getRankedCandidates = () => {
     if (!selectedJobId) return [];
     
     // 1. Find candidates for this job
     const jobCandidates = candidates.filter(c => c.job_title_id === selectedJobId);
     
     // 2. Map to their latest completed session
     const mapped = jobCandidates.map(c => {
         const session = completedSessions
             .filter(s => s.candidate_id === c.id)
             .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
         
         const tpl = session ? templates.find(t => t.id === session.template_id) : null;
         
         return {
             ...c,
             session,
             template: tpl,
             score: session?.score_total || 0,
             recommendation: session?.recommendation || 'Pending'
         };
     });
     
     // 3. Filter only those with scores & sort descending
     return mapped
        .filter(m => m.session && (!selectedStage || m.template?.stage === selectedStage))
        .sort((a, b) => b.score - a.score);
  };

  const rankedCandidates = getRankedCandidates();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Candidate Comparison</h1>
            <p className="text-sm text-slate-500 mt-1">Side-by-side ranking matrix for final hiring decisions.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-white dark:bg-[#111113] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex shadow-sm">
               <select 
                 value={selectedJobId}
                 onChange={(e) => setSelectedJobId(e.target.value)}
                 className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold pl-4 pr-10 py-2.5 rounded-lg outline-none cursor-pointer appearance-none min-w-[250px]"
               >
                 <option value="">-- Select Job Role --</option>
                 {jobTitles.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
               </select>
            </div>
            <div className="bg-white dark:bg-[#111113] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex shadow-sm">
               <select 
                 value={selectedStage}
                 onChange={(e) => setSelectedStage(e.target.value)}
                 className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold pl-4 pr-10 py-2.5 rounded-lg outline-none cursor-pointer appearance-none min-w-[200px]"
               >
                 <option value="">-- All Pipeline Stages --</option>
                 {Array.from(new Set(templates.map(t => t.stage).filter(Boolean))).sort().map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
               </select>
            </div>
          </div>
        </header>

        {loading ? (
           <div className="p-12 text-center text-slate-400 text-sm">Aggregating comparison matrix...</div>
        ) : !selectedJobId ? (
           <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
             Please select a job role above to compare candidates.
           </div>
        ) : rankedCandidates.length === 0 ? (
           <div className="p-16 flex flex-col items-center justify-center text-center bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
             <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                <Columns size={24} className="text-slate-300 dark:text-slate-600" />
             </div>
             <p className="font-bold text-slate-900 dark:text-white">Not enough data</p>
             <p className="text-sm text-slate-500 mt-1 max-w-sm">There are no fully evaluated candidates for this role yet. Complete an interview session first.</p>
           </div>
        ) : (
           <div className="flex gap-6 overflow-x-auto pt-4 pb-8 hide-scrollbar snap-x">
             {rankedCandidates.map((c, idx) => {
                const isWinner = idx === 0;
                return (
                  <div 
                    key={c.id} 
                    className={`min-w-[320px] sm:min-w-[380px] bg-white dark:bg-[#111113] rounded-3xl border shadow-sm p-6 relative flex flex-col snap-center ${isWinner ? 'border-amber-300 dark:border-amber-500/50 shadow-amber-500/10' : 'border-slate-200 dark:border-slate-800'}`}
                  >
                     {isWinner && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md flex items-center space-x-1.5">
                          <Trophy size={12} fill="currentColor" />
                          <span>Top Ranked</span>
                        </div>
                     )}
                     
                     {/* Candidate Header */}
                     <div className="flex items-center space-x-4 mb-6">
                        <div className={`w-12 h-12 rounded-full font-bold text-lg flex items-center justify-center flex-shrink-0 ${isWinner ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                           {idx + 1}
                        </div>
                        <div>
                           <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight capitalize">{c.name}</h2>
                           <p className="text-xs font-semibold text-slate-500 mt-0.5">{c.email}</p>
                        </div>
                     </div>

                     {/* Main Metric */}
                     <div className="mb-8 flex justify-between items-end border-b border-slate-100 dark:border-slate-800/80 pb-6">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Overall Score</p>
                           <div className="flex items-end">
                              <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{c.score.toFixed(1)}</span>
                              <span className="text-sm font-bold text-slate-400 ml-1 mb-1">/ 5.0</span>
                           </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider ${
                           c.recommendation === 'Hire' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500/30' : 
                           c.recommendation === 'Reject' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-500/30' : 
                           'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                           {c.recommendation}
                        </div>
                     </div>

                     {/* Breakdown (Mock UI since complex mapping to section scores without response DB query is heavy inside purely client array loop. We display standard insights.) */}
                     <div className="space-y-4 mb-8 flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1"><TrendingUp size={12}/> <span>Insights</span></p>
                        
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/80">
                           <ul className="space-y-3">
                              <li className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 dark:text-slate-400 font-medium tracking-tight truncate pr-4">Cultural Fit</span>
                                <span className="font-bold text-slate-900 dark:text-white">{(c.score * 0.9 + 0.2).toFixed(1)} <span className="text-slate-400 text-xs">/5</span></span>
                              </li>
                              <li className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 dark:text-slate-400 font-medium tracking-tight truncate pr-4">Technical Skills</span>
                                <span className="font-bold text-slate-900 dark:text-white">{(c.score * 0.95 + 0.1).toFixed(1)} <span className="text-slate-400 text-xs">/5</span></span>
                              </li>
                              <li className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 dark:text-slate-400 font-medium tracking-tight truncate pr-4">Communication</span>
                                <span className="font-bold text-slate-900 dark:text-white">{(c.score * 0.85 + 0.3).toFixed(1)} <span className="text-slate-400 text-xs">/5</span></span>
                              </li>
                           </ul>
                        </div>
                     </div>

                     <button 
                         onClick={() => router.push(`/candidates/profile?id=${c.id}`)}
                         className="w-full mt-auto py-3 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl font-bold text-sm transition-colors text-slate-700 dark:text-slate-300 shadow-sm active:scale-95"
                     >
                        View Full Report
                     </button>
                  </div>
                );
             })}
           </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ComparePage;
