"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiService } from '@/lib/api';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeft, User, Calendar, Briefcase, BarChart2, Flag, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CandidateSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [candidate, setCandidate] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<Record<string, any>>({});
  const [jobTitle, setJobTitle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candRes, sessRes, tplRes, jobsRes] = await Promise.all([
         ApiService.getCandidates(),
         ApiService.getSessions(),
         ApiService.getTemplates(),
         ApiService.getJobTitles()
      ]);

      const currentCandidate = (candRes.data || []).find((c: any) => c.id === id);
      if (!currentCandidate) {
         toast.error('Candidate not found');
         router.push('/candidates');
         return;
      }
      setCandidate(currentCandidate);

      const candSessions = (sessRes.data || []).filter((s: any) => s.candidate_id === id);
      // Sort sessions chronologically (newest first for timeline context)
      candSessions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSessions(candSessions);

      const tplMap: Record<string, any> = {};
      (tplRes.data || []).forEach((t: any) => { tplMap[t.id] = t; });
      setTemplates(tplMap);

      const job = (jobsRes.data || []).find((j: any) => j.id === currentCandidate.job_title_id);
      setJobTitle(job);

    } catch (error) {
       toast.error('Failed to load candidate profile');
    } finally {
       setLoading(false);
    }
  };

  if (loading || !candidate) {
     return (
        <DashboardLayout>
           <div className="flex items-center justify-center p-32 text-slate-400">Loading Candidate Profile...</div>
        </DashboardLayout>
     );
  }

  // Calculate Summary Metrics
  const completedSessions = sessions.filter(s => s.status === 'Completed');
  const personalSessions = completedSessions.filter(s => s.session_type === 'personal');
  const technicalSessions = completedSessions.filter(s => s.session_type === 'technical');
  const latestScore = completedSessions.length > 0 ? completedSessions[0].score_total : null;
  const avgScore = completedSessions.length > 0 ? completedSessions.reduce((acc, s) => acc + (s.score_total || 0), 0) / completedSessions.length : 0;
  const latestRec = completedSessions.length > 0 ? completedSessions[0].recommendation : 'None';
  const totalRedFlags = completedSessions.reduce((acc, s) => acc + (s.red_flag_count || 0), 0);

  // Aggregate Domain Scores across all completed sessions
  const aggregatedDomains: Record<string, { earned: number, max: number }> = {};
  completedSessions.forEach(s => {
      if (s.domain_scores) {
         Object.entries(s.domain_scores).forEach(([domain, score]) => {
            if (!aggregatedDomains[domain]) aggregatedDomains[domain] = { earned: 0, max: 0 };
            // Since domain_scores are stored as /5 scaled values, we add them up out of 5 per session
            aggregatedDomains[domain].earned += Number(score);
            aggregatedDomains[domain].max += 5;
         });
      }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24">
        
        {/* Header Ribbon */}
        <div className="flex items-center space-x-4 mb-2">
           <button 
             onClick={() => router.push('/candidates')}
             className="p-2 -ml-2 text-slate-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
           >
             <ChevronLeft size={20} />
           </button>
           <div className="flex items-center space-x-2 text-sm font-semibold text-slate-500">
              <span className="hover:text-black dark:hover:text-white cursor-pointer" onClick={() => router.push('/candidates')}>Candidates</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-slate-900 dark:text-white">{candidate.name}</span>
           </div>
        </div>

        {/* Candidate Header Profile */}
        <div className="bg-white dark:bg-[#111113] p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
           <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center border-4 border-white dark:border-[#0A0A0B] shadow-md shadow-blue-500/10">
                 <User size={32} />
              </div>
              <div>
                 <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-2 tracking-tight">{candidate.name}</h1>
                 <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center text-sm font-bold text-slate-600 dark:text-slate-300">
                       <Briefcase size={14} className="mr-1.5 opacity-70" /> {jobTitle?.title || 'General Pipeline'}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded capitalize border border-slate-200 dark:border-slate-700">
                       {candidate.status.toLowerCase()}
                    </span>
                    <span className="flex items-center text-sm font-bold text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 pl-3">
                       <Calendar size={14} className="mr-1.5 opacity-70" /> {new Date(candidate.created_at).toLocaleDateString()}
                    </span>
                 </div>
              </div>
           </div>

           <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-1 w-full md:w-auto">
              <div>
                 <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Final Interviewer Rec</span>
                 <span className={`text-lg font-black ${latestRec === 'Hire' ? 'text-emerald-600' : latestRec === 'Reject' ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                    {latestRec || 'Pending'}
                 </span>
              </div>
           </div>
        </div>

        {/* Global Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
              { label: 'Total Sessions', value: sessions.length, sub: `${completedSessions.length} Completed` },
              { label: 'Personal Eval.', value: personalSessions.length, sub: 'Interviews' },
              { label: 'Technical Eval.', value: technicalSessions.length, sub: 'Interviews' },
              { label: 'Average Score', value: avgScore.toFixed(2), sub: 'out of 5.0' },
           ].map((metric, i) => (
              <div key={i} className="bg-white dark:bg-[#111113] p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center justify-center shadow-sm">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{metric.label}</span>
                 <span className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{metric.value}</span>
                 <span className="text-xs font-bold text-slate-400">{metric.sub}</span>
              </div>
           ))}
        </div>

        {/* Domain Analysis & Timeline Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Col: Aggregated Domains (1/3) */}
           <div className="space-y-6 lg:col-span-1">
              <div className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                 <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center space-x-2">
                    <BarChart2 size={14} /> <span>Aggregated Domain Analysis</span>
                 </h2>

                 {Object.keys(aggregatedDomains).length === 0 ? (
                    <div className="py-8 text-center text-sm font-semibold text-slate-400">
                       No domain scores recorded yet.<br/>Complete an interview to see data.
                    </div>
                 ) : (
                    <div className="space-y-5">
                       {Object.entries(aggregatedDomains).map(([domain, data]) => {
                          const averageOutOf5 = data.max > 0 ? (data.earned / data.max) * 5 : 0;
                          return (
                            <div key={domain} className="flex flex-col">
                               <div className="flex justify-between items-end mb-1">
                                 <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{domain.replace(/_/g, ' ')}</span>
                                 <span className="text-xs font-black text-slate-900 dark:text-white">{averageOutOf5.toFixed(1)} <span className="text-slate-400">/ 5</span></span>
                               </div>
                               <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800/80">
                                  <div 
                                    className={`h-full transition-all duration-500 ${averageOutOf5 >= 4 ? 'bg-emerald-500' : averageOutOf5 >= 3 ? 'bg-blue-500' : 'bg-red-500'}`}
                                    style={{ width: `${(averageOutOf5 / 5) * 100}%` }}
                                  />
                               </div>
                            </div>
                          )
                       })}
                    </div>
                 )}

                 {/* Red Flags Panel */}
                 <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center space-x-2">
                       <Flag size={14} /> <span>Identified Red Flags</span>
                    </h2>
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${totalRedFlags > 0 ? 'bg-red-50/50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 text-red-700 dark:text-red-400' : 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}>
                       <span className="text-sm font-bold">{totalRedFlags > 0 ? `${totalRedFlags} Concerns Flagged` : 'No Critical Concerns'}</span>
                       <span className="text-xl font-black">{totalRedFlags}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Col: Timeline (2/3) */}
           <div className="space-y-4 lg:col-span-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white ml-2 flex items-center space-x-2">
                 <FileText size={20} className="text-slate-400" />
                 <span>Interview Session Timeline</span>
              </h2>

              {sessions.length === 0 ? (
                 <div className="bg-white dark:bg-[#111113] p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-slate-400 font-semibold mb-4">No sessions scheduled.</p>
                    <button 
                       onClick={() => router.push(`/pipelines?candidateId=${candidate.id}`)}
                       className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold shadow-sm"
                    >
                       Assign to Pipeline
                    </button>
                 </div>
              ) : (
                 <div className="space-y-4">
                    {sessions.map((session, idx) => {
                       const tpl = templates[session.template_id];
                       return (
                          <div 
                             key={session.id} 
                             onClick={() => router.push(`/sessions/evaluate?id=${session.id}`)}
                             className="bg-white dark:bg-[#111113] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700/50 transition-colors cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                             <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                   <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded border ${
                                      session.session_type === 'technical' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' : 
                                      session.session_type === 'personal' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 
                                      'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                   }`}>
                                      {session.session_type || 'Legacy'}
                                   </span>
                                   <span className="text-xs font-semibold text-slate-400">{new Date(session.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight mb-1">
                                   {tpl?.name || 'Unknown Template'}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{session.status}</p>
                             </div>

                             {session.status === 'Completed' ? (
                                <div className="flex items-center space-x-6 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 w-full sm:w-auto mt-4 sm:mt-0">
                                   <div className="text-center px-4 border-r border-slate-200 dark:border-slate-700">
                                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Score</span>
                                      <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{session.score_total?.toFixed(1) || '0.0'}</span>
                                   </div>
                                   <div className="text-center px-4">
                                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rec</span>
                                      <span className={`text-sm font-black uppercase tracking-wider ${session.recommendation === 'Hire' ? 'text-emerald-500' : session.recommendation === 'Reject' ? 'text-red-500' : 'text-slate-500'}`}>
                                         {session.recommendation || 'N/A'}
                                      </span>
                                   </div>
                                   <div className="text-slate-300 dark:text-slate-700 hidden lg:block pr-2">
                                      <ChevronRight size={20} className="group-hover:text-blue-500 transition-colors" />
                                   </div>
                                </div>
                             ) : (
                                <div className="text-right w-full sm:w-auto flex justify-end">
                                   <span className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold shadow-sm whitespace-nowrap">Resume Session</span>
                                </div>
                             )}
                          </div>
                       )
                    })}
                 </div>
              )}
           </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading Candidate Profile...</div>}>
      <CandidateSummaryPage />
    </Suspense>
  );
}
