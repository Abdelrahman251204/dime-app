"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Play, CheckCircle2, Search, FileSymlink, ChevronRight, User, Trash2 } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const SessionsPage = () => {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New session modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSession, setNewSession] = useState({ candidate_id: '', template_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sesRes, candRes, tplRes] = await Promise.all([
        ApiService.getSessions(),
        ApiService.getCandidates(),
        ApiService.getTemplates()
      ]);
      setSessions(sesRes.data || []);
      setCandidates(candRes.data || []);
      setTemplates(tplRes.data || []);
    } catch (error) {
      toast.error('Failed to load sessions data');
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    if (!newSession.candidate_id || !newSession.template_id) {
       return toast.error("Please select both a candidate and a template.");
    }
    try {
      const res = await ApiService.createSession({
         candidate_id: newSession.candidate_id,
         template_id: newSession.template_id,
         interviewer_id: 'admin_user', // Mock user
         status: 'In Progress',
         score_total: 0
      });
      const sessionId = res.data?.[0]?.id;
      if (!sessionId) throw new Error("Failed to get session ID");
      toast.success("Interview Session Created");
      router.push(`/sessions/evaluate?id=${sessionId}`);
    } catch (err) {
      toast.error('Failed to create session');
    }
  };

  const clearAllSessions = async () => {
    if (!sessions.length) return toast.error('No sessions to clear');
    if (!confirm('Are you absolutely sure you want to clear ALL interview sessions? This cannot be undone.')) return;
    try {
      setLoading(true);
      await Promise.all(sessions.map(s => ApiService.deleteSession(s.id)));
      toast.success('All sessions cleared');
      fetchData();
    } catch (err) {
      toast.error('Failed to clear some sessions');
      fetchData();
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;
    try {
      await ApiService.deleteSession(id);
      toast.success('Session deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete session');
    }
  };

  const activeSessions = sessions.filter(s => s.status === 'In Progress');
  const completedSessions = sessions.filter(s => s.status === 'Completed');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Interview Sessions</h1>
            <p className="text-sm text-slate-500 mt-1">Manage active interviews and review past evaluations.</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={clearAllSessions}
              className="bg-white hover:bg-red-50 dark:bg-[#111113] dark:hover:bg-red-900/20 text-red-500 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Clear All Logs</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 shadow-xl shadow-black/10 dark:shadow-white/10 active:scale-95 transition-all"
            >
              <Play size={16} fill="currentColor" />
              <span>Start New Interview</span>
            </button>
          </div>
        </header>

        {loading ? (
           <div className="p-12 text-center text-slate-400 text-sm">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Active Sessions */}
            <div className="xl:col-span-2 space-y-4">
               <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                 <span>Active / In Progress ({activeSessions.length})</span>
               </h2>
               
               {activeSessions.length === 0 ? (
                 <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/20">
                    <User className="text-slate-300 dark:text-slate-700 mb-3" size={32} />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No active sessions</p>
                    <p className="text-xs text-slate-500 mt-1">Ready to interview? Click 'Start New Interview'.</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {activeSessions.map(session => {
                      const cand = candidates.find(c => c.id === session.candidate_id);
                      const tpl = templates.find(t => t.id === session.template_id);
                      return (
                        <div key={session.id} className="bg-white dark:bg-[#111113] border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 overflow-hidden relative" onClick={() => router.push(`/sessions/evaluate?id=${session.id}`)}>
                           {/* Decorative accent */}
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                           
                           <div className="flex items-center space-x-4 ml-3">
                             <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center flex-shrink-0">
                                {cand?.name?.charAt(0) || '?'}
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-900 dark:text-white capitalize">{cand?.name || 'Unknown Candidate'}</h4>
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{tpl?.name || 'Unknown Template'}</p>
                             </div>
                           </div>
                           
                           <div className="flex items-center space-x-3">
                             <div className="hidden sm:block text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <span className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">In Progress</span>
                             </div>
                             <div className="flex items-center space-x-1">
                               <button onClick={(e) => deleteSession(e, session.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg shrink-0 transition-colors">
                                 <Trash2 size={16} />
                               </button>
                               <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <ChevronRight size={18} />
                               </div>
                             </div>
                           </div>
                        </div>
                      )
                   })}
                 </div>
               )}
            </div>

            {/* Completed Sessions */}
            <div className="space-y-4">
               <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                 <CheckCircle2 size={12} className="text-emerald-500" />
                 <span>Recent Evaluations ({completedSessions.length})</span>
               </h2>
               
               <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm h-full max-h-[600px] overflow-y-auto">
                 {completedSessions.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No completed evaluations yet.</p>
                 ) : (
                    <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                      {completedSessions.slice(0, 5).map(session => {
                        const cand = candidates.find(c => c.id === session.candidate_id);
                        return (
                          <div key={session.id} className="pt-4 first:pt-0 flex items-center justify-between group cursor-pointer" onClick={() => router.push(`/sessions/evaluate?id=${session.id}`)}>
                             <div>
                               <p className="font-bold text-sm text-slate-900 dark:text-white capitalize">{cand?.name}</p>
                               <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">{new Date(session.created_at).toLocaleDateString()}</p>
                             </div>
                             <div className="text-right flex items-center space-x-2">
                               <div>
                                 <p className="font-black text-lg text-slate-900 dark:text-white">{session.score_total?.toFixed(1) || '0'}</p>
                                 <p className={`text-[10px] font-bold uppercase tracking-wider ${
                                   session.recommendation === 'Hire' ? 'text-emerald-500' :
                                   session.recommendation === 'Reject' ? 'text-red-500' : 'text-slate-400'
                                 }`}>{session.recommendation || 'Unrated'}</p>
                               </div>
                               <button onClick={(e) => deleteSession(e, session.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shrink-0 transition-colors opacity-0 group-hover:opacity-100">
                                 <Trash2 size={16} />
                               </button>
                             </div>
                          </div>
                        )
                      })}
                    </div>
                 )}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0A0A0B] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
             <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold">Start New Interview</h3>
                <p className="text-xs text-slate-500 mt-1">Select a candidate and assessment template to begin.</p>
             </div>
             
             <div className="p-6 space-y-5">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Candidate Selection</label>
                  <select 
                    value={newSession.candidate_id} 
                    onChange={e => setNewSession({...newSession, candidate_id: e.target.value})}
                    className="w-full bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none appearance-none font-semibold"
                  >
                     <option value="">-- Choose Candidate --</option>
                     {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Evaluation Template</label>
                  <select 
                    value={newSession.template_id} 
                    onChange={e => setNewSession({...newSession, template_id: e.target.value})}
                    className="w-full bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none appearance-none font-semibold"
                  >
                     <option value="">-- Choose Template --</option>
                     {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
               </div>
             </div>
             
             <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
               <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">Cancel</button>
               <button onClick={startNewSession} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-md active:scale-95 transition-all">Launch Workspace</button>
             </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SessionsPage;
