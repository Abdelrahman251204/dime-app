"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ApiService } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronLeft, Flag, CheckCircle2, ChevronRight, Calculator, Check, AlertCircle } from 'lucide-react';

export default function InterviewSessionWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [session, setSession] = useState<any>(null);
  const [candidate, setCandidate] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [recommendation, setRecommendation] = useState<string>('');

  // Refs for scrollspy
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    fetchSessionData();
  }, [id]);

  const fetchSessionData = async () => {
    try {
      // 1. Get Session
       const sesRes = await ApiService.getSessions();
       const currentSession = (sesRes.data || []).find((s: any) => s.id === id);
       if (!currentSession) return toast.error('Session not found');
       setSession(currentSession);
       setRecommendation(currentSession.recommendation || '');

       // 2. Get dependencies
       const [candRes, tplRes, respsRes] = await Promise.all([
          ApiService.getCandidates(),
          ApiService.getTemplates(),
          ApiService.getResponses(currentSession.id)
       ]);
       
       setCandidate((candRes.data || []).find((c:any) => c.id === currentSession.candidate_id));
       const currentTemplate = (tplRes.data || []).find((t:any) => t.id === currentSession.template_id);
       setTemplate(currentTemplate);

       // 3. Load Responses
       const responsesMap: Record<string, any> = {};
       (respsRes.data || []).forEach((r: any) => {
          responsesMap[r.question_id] = r;
       });
       setResponses(responsesMap);
    } catch (e) {
      toast.error('Failed to load session');
    }
  };

  const handleResponseChange = (questionId: string, updates: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
         ...prev[questionId],
         ...updates,
         session_id: session.id,
         question_id: questionId
      }
    }));
  };

  const calculateScores = () => {
     if (!template) return { total: 0, max: 0, sections: {}, domains: {} as Record<string, number> };
     
     let totalScore = 0;
     let totalMax = 0;
     const sectionScores: Record<string, number> = {};
     const domainScores: Record<string, { earned: number, max: number }> = {};

     template.schema_json.sections.forEach((sec: any) => {
        let secScore = 0;
        let secMax = 0;
        sec.questions.forEach((q: any) => {
           if (q.type === 'scale' || q.type === 'linear_scale') {
              const resp = responses[q.text]; // Using q.text as question_id fallback since id might not clearly exist in old templates
              const score = resp?.score || 0;
              const weight = q.weight || 0;
              const earnedScore = Number(score) * Number(weight);
              const maxPossible = 5 * Number(weight);
              
              secScore += earnedScore;
              secMax += maxPossible;
              
              // Aggregate by domain if mapping exists
              if (q.dimension_key) {
                 if (!domainScores[q.dimension_key]) domainScores[q.dimension_key] = { earned: 0, max: 0 };
                 domainScores[q.dimension_key].earned += earnedScore;
                 domainScores[q.dimension_key].max += maxPossible;
              }
           }
        });
        sectionScores[sec.title] = secMax > 0 ? (secScore / secMax) * 100 : 0;
        
        // Add to total applying section weight
        const sWeight = sec.weight || 100;
        totalScore += secScore * (sWeight/100);
        totalMax += secMax * (sWeight/100);
     });

     const finalPercentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
     const finalOutof5 = (finalPercentage / 100) * 5;
     
     // Finalize domain scores to /5 scale
     const finalDomains: Record<string, number> = {};
     Object.keys(domainScores).forEach(domain => {
       const ds = domainScores[domain];
       finalDomains[domain] = ds.max > 0 ? ((ds.earned / ds.max) * 5) : 0;
     });
     
     return {
        total: finalOutof5,
        percentage: finalPercentage,
        max: 5,
        sections: sectionScores,
        domains: finalDomains
     };
  };

  const saveDraft = async () => {
     setIsSaving(true);
     try {
       const respArray = Object.values(responses);
       if (respArray.length > 0) {
          await ApiService.upsertResponses(respArray);
       }
       toast.success('Draft saved');
     } catch (e) {
       toast.error('Failed to save draft');
     } finally {
       setIsSaving(false);
     }
  };

  const submitEvaluation = async () => {
     if (!recommendation) {
        return toast.error("Please provide a final recommendation before submitting.");
     }
     setIsSaving(true);
     try {
       // Save responses
       const respArray = Object.values(responses);
       if (respArray.length > 0) {
          await ApiService.upsertResponses(respArray);
       }
       
       // Update session
       const scores = calculateScores();
       const redFlagsCount = Object.values(responses).filter((r: any) => r.red_flag).length;
       
       await ApiService.updateSession(session.id, {
          status: 'Completed',
          score_total: scores.total,
          recommendation: recommendation,
          session_type: template.template_type || 'personal',
          domain_scores: scores.domains,
          red_flag_count: redFlagsCount
       });
       
       // Update candidate status based on recommendation
       const newCandStatus = recommendation === 'Reject' ? 'Rejected' : 'Processed';
       await ApiService.updateCandidate(candidate.id, {
          status: newCandStatus,
          updated_at: new Date().toISOString()
       });
       
       toast.success('Evaluation submitted successfully');
       router.push('/sessions');
     } catch (e) {
       toast.error('Failed to submit evaluation');
       setIsSaving(false);
     }
  };

  const scrollToSection = (title: string) => {
     const el = sectionRefs.current[title];
     if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
     }
  };

  if (!session || !template || !candidate) return <div className="p-12 text-center">Loading Interview Workspace...</div>;

  const currentScores = calculateScores();
  const isCompleted = session.status === 'Completed';

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0A0A0B] overflow-hidden">
      {/* Top Navbar */}
      <header className="h-16 flex-shrink-0 bg-white dark:bg-[#111113] border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-10 shadow-sm relative">
         <div className="flex items-center space-x-6">
            <button 
              onClick={() => router.push('/sessions')}
              className="p-2 -ml-2 text-slate-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center space-x-4">
               <div>
                  <h1 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Interviewing</h1>
                  <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">{candidate.name}</p>
               </div>
               <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline-block">
                 {template.name}
               </span>
            </div>
         </div>
         <div className="flex items-center space-x-3">
            {!isCompleted && (
              <button 
                 onClick={saveDraft}
                 disabled={isSaving}
                 className="px-4 py-2 font-bold text-xs text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50"
              >
                 {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
            )}
            <button 
               onClick={() => setIsReviewing(true)}
               disabled={isCompleted}
               className="bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black px-6 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center space-x-2"
            >
               <CheckCircle2 size={16} />
               <span>{isCompleted ? 'Evaluation Completed' : 'Review & Submit'}</span>
            </button>
         </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
         {/* Left Sidebar: Score & Navigation */}
         <aside className="w-80 flex-shrink-0 bg-white dark:bg-[#111113] border-r border-slate-200 dark:border-slate-800 flex flex-col relative z-0 hide-scrollbar overflow-y-auto hidden md:flex">
            {/* Live Score Sticky Panel */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
               <div className="flex items-center justify-between space-x-2 mb-3">
                 <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center space-x-1.5 object-right">
                    <Calculator size={12} />
                    <span>Live Score</span>
                 </h3>
                 <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">Auto-calc</span>
               </div>
               <div className="flex items-end space-x-2">
                 <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                   {currentScores.total.toFixed(1)}
                 </span>
                 <span className="text-lg font-bold text-slate-400 leading-8">/ 5.0</span>
               </div>
               
               {/* Progress bar */}
               <div className="mt-4 flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${currentScores.percentage}%` }}
                  />
               </div>
            </div>

            {/* Section Nav */}
            <div className="p-6 flex-1 space-y-4">
               <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Interview Sections</h3>
               <div className="space-y-1">
                 {template.schema_json?.sections?.map((sec: any, idx: number) => {
                    const secScore = currentScores.sections[sec.title as string] || 0;
                    return (
                      <button 
                        key={idx}
                        onClick={() => scrollToSection(sec.title)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                      >
                         <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-1">{sec.title}</span>
                           <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Weight: {sec.weight}%</span>
                         </div>
                         <div className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {secScore.toFixed(0)}%
                         </div>
                      </button>
                    )
                 })}
               </div>
            </div>

             {/* Domains Summary */}
             {Object.keys(currentScores.domains).length > 0 && (
                <div className="p-6 flex-1 space-y-4 border-t border-slate-100 dark:border-slate-800/80 bg-blue-50/30 dark:bg-blue-900/10 mb-4">
                   <h3 className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-400 tracking-widest mb-4">Domain Analysis</h3>
                   <div className="space-y-3">
                     {Object.entries(currentScores.domains).map(([domain, score]) => (
                        <div key={domain} className="flex flex-col">
                           <div className="flex justify-between items-end mb-1">
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{domain.replace(/_/g, ' ')}</span>
                             <span className="text-[10px] font-black text-slate-500">{score.toFixed(1)} / 5</span>
                           </div>
                           <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                              <div 
                                className="h-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-500"
                                style={{ width: `${(score / 5) * 100}%` }}
                              />
                           </div>
                        </div>
                     ))}
                   </div>
                </div>
             )}
          </aside>

          {/* Right Main Area: Questions */}
         <main className="flex-1 overflow-y-auto scroll-smooth bg-slate-50/50 dark:bg-[#0A0A0B]">
            <div className="max-w-3xl mx-auto p-6 lg:p-12 space-y-12 pb-32">
               {template.schema_json?.sections?.map((sec: any, sIdx: number) => (
                  <section 
                    key={sIdx} 
                    ref={el => { sectionRefs.current[sec.title] = el; }}
                    className="scroll-mt-8"
                  >
                     <div className="mb-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest">Section {sIdx + 1}</span>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{sec.title}</h2>
                     </div>

                     <div className="space-y-6">
                        {sec.questions.map((q: any, qIdx: number) => {
                           const respIdentifier = q.text; // Unique identifier fallback
                           const resp = responses[respIdentifier] || {};
                           
                           return (
                             <div key={qIdx} className={`p-6 rounded-2xl border transition-all ${resp.red_flag ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-white border-slate-200 dark:bg-[#111113] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'}`}>
                                
                                {/* Question Header */}
                                <div className="flex items-start justify-between mb-6">
                                   <div className="flex space-x-4">
                                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 mt-0.5">
                                        {qIdx + 1}
                                      </div>
                                      <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-relaxed">{q.text}</h3>
                                   </div>
                                   <button 
                                      onClick={() => !isCompleted && handleResponseChange(respIdentifier, { red_flag: !resp.red_flag })}
                                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${resp.red_flag ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-slate-300 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800'} ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                   >
                                      <Flag size={18} fill={resp.red_flag ? "currentColor" : "none"} />
                                   </button>
                                </div>

                                {/* Scoring Controls */}
                                {(q.type === 'scale' || q.type === 'linear_scale') && (
                                   <div className="mb-6 flex flex-wrap gap-2">
                                     {[1, 2, 3, 4, 5].map(score => {
                                        const isSelected = resp.score === score;
                                        return (
                                           <button
                                             key={score}
                                             disabled={isCompleted}
                                             onClick={() => handleResponseChange(respIdentifier, { score })}
                                             className={`w-12 h-12 rounded-xl text-lg font-bold border transition-all ${
                                                isSelected 
                                                 ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white scale-110 shadow-lg' 
                                                 : 'bg-white text-slate-600 border-slate-200 hover:border-black dark:bg-[#111113] dark:text-slate-400 dark:border-slate-800 dark:hover:border-white disabled:opacity-50 disabled:hover:border-slate-200'
                                             }`}
                                           >
                                              {score}
                                           </button>
                                        )
                                     })}
                                     <div className="ml-4 flex flex-col justify-center text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                       <span className="flex items-center space-x-1"><Check size={10} /> <span>1 = Poor</span></span>
                                       <span className="flex items-center space-x-1"><Check size={10} /> <span>5 = Excellent</span></span>
                                     </div>
                                   </div>
                                )}

                                {/* Notes Input */}
                                <div>
                                   <textarea 
                                      placeholder="Add interviewer notes here..."
                                      disabled={isCompleted}
                                      className={`w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all resize-y min-h-[100px] ${resp.red_flag ? 'focus:ring-red-500' : ''} ${isCompleted ? 'opacity-70 cursor-not-allowed' : ''}`}
                                      value={resp.notes || ''}
                                      onChange={(e) => handleResponseChange(respIdentifier, { notes: e.target.value })}
                                   />
                                </div>

                             </div>
                           );
                        })}
                     </div>
                  </section>
               ))}
            </div>
         </main>
      </div>

      {/* Review & Submit Modal */}
      {isReviewing && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#0A0A0B] rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in slide-in-from-bottom-4">
               
               <div className="px-8 py-6 text-center border-b border-slate-100 dark:border-slate-800 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-2xl font-bold dark:text-white mb-1">Final Evaluation</h2>
                  <p className="text-sm text-slate-500">Review your final assessment for {candidate?.name}.</p>
               </div>

               <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-900/20">
                  <div className="flex justify-between items-end mb-6">
                     <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Final Calculated Score</p>
                        <p className="text-xs text-slate-500">Weighted automatically by schema</p>
                     </div>
                     <div className="text-right">
                        <span className="text-4xl font-black text-slate-900 dark:text-white">{currentScores.total.toFixed(2)}</span>
                        <span className="text-sm font-bold text-slate-400 ml-1">/ 5.0</span>
                     </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                     <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-3 text-center">Final Recommendation <span className="text-red-500">*</span></label>
                     <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setRecommendation('Hire')}
                          className={`p-4 rounded-xl border-2 transition-all font-bold ${recommendation === 'Hire' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 dark:bg-[#111113] dark:border-slate-800 dark:text-slate-400'}`}
                        >
                           Strong Hire
                        </button>
                        <button 
                          onClick={() => setRecommendation('Reject')}
                          className={`p-4 rounded-xl border-2 transition-all font-bold ${recommendation === 'Reject' ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-white border-slate-200 text-slate-600 hover:border-red-300 dark:bg-[#111113] dark:border-slate-800 dark:text-slate-400'}`}
                        >
                           Reject
                        </button>
                     </div>
                  </div>
               </div>

               <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex space-x-3">
                  <button 
                    onClick={() => setIsReviewing(false)} 
                    className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Back to Interview
                  </button>
                  <button 
                    onClick={submitEvaluation} 
                    disabled={isSaving || !recommendation}
                    className="flex-1 py-3 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    {isSaving ? 'Submitting...' : 'Submit Evaluation'}
                  </button>
               </div>

            </div>
         </div>
      )}
    </div>
  );
}
