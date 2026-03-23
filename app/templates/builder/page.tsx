"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Plus, Trash2, Save, MoveVertical, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const TemplateBuilder = () => {
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('personal');
  const [stage, setStage] = useState('General');
  const [jobTitleId, setJobTitleId] = useState('');
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [domains, setDomains] = useState<string[]>(['Belief', 'Ownership', 'Thinking', 'Communication', 'Role Baseline', 'Technical Depth', 'Problem Solving']);
  const [sections, setSections] = useState([
    {
      id: '1',
      title: 'New Section',
      weight: 100,
      questions: [
        { id: '1-1', text: 'Explain your experience with React.', type: 'scale', weight: 100, dimension_key: 'Technical Depth' },
      ]
    }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    ApiService.getJobTitles().then(res => setJobTitles(res.data || []));

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
       setEditId(id);
       ApiService.getTemplates().then(res => {
          const t = (res.data || []).find((tpl: any) => tpl.id === id);
          if (t) {
             setTemplateName(t.name || t.template_name || '');
             if (t.template_type) setTemplateType(t.template_type);
             setJobTitleId(t.job_title_id || '');
             setStage(t.stage || 'General');
             if (t.domains && t.domains.length > 0) setDomains(t.domains);
             if (t.schema_json?.sections) {
                const loadedSections = t.schema_json.sections.map((s: any, sIdx: number) => ({
                   id: Date.now().toString() + sIdx,
                   title: s.title || 'Section',
                   weight: s.weight || 100,
                   questions: (s.questions || []).map((q: any, qIdx: number) => ({
                      id: Date.now().toString() + sIdx + qIdx,
                      text: q.text || q.prompt || '',
                      type: q.type === 'linear_scale' ? 'scale' : q.type || 'long_text',
                      weight: q.weight || 100,
                      dimension_key: q.dimension_key || q.score_domain || ''
                   }))
                }));
                if (loadedSections.length > 0) setSections(loadedSections);
             }
          }
       });
    }
  }, []);

  const addSection = () => {
    setSections([...sections, {
      id: Date.now().toString(),
      title: 'New Section',
      weight: 0,
      questions: []
    }]);
  };

  const addQuestion = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, questions: [...s.questions, { id: Date.now().toString(), text: '', type: 'scale', weight: 0, dimension_key: domains[0] }] }
        : s
    ));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const removeQuestion = (sectionId: string, questionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, questions: s.questions.filter(q => q.id !== questionId) } : s
    ));
  };

  const handleSave = async () => {
    if (!templateName) {
      return toast.error('Template name is required');
    }
    if (!templateType) {
      return toast.error('Template type is required');
    }
    
    const payload = {
      name: templateName,
      template_type: templateType,
      job_title_id: jobTitleId || null,
      stage: stage,
      domains: domains, // Store defined domains
      schema_json: {
        template_name: templateName,
        template_type: templateType,
        job_titles: jobTitleId ? [jobTitleId] : [],
        stage: stage,
        sections: sections.map(s => ({
          title: s.title,
          weight: s.weight,
          questions: s.questions.map(q => ({
            text: q.text,
            type: q.type,
            weight: q.weight,
            dimension_key: q.type === 'scale' ? q.dimension_key : undefined
          }))
        }))
      }
    };

    setIsSaving(true);
    try {
      if (editId) {
        await ApiService.updateTemplate(editId, payload);
        toast.success('Template updated successfully');
      } else {
        await ApiService.createTemplate(payload);
        toast.success('Template saved successfully');
      }
      setTimeout(() => {
        window.location.href = '/templates';
      }, 1000);
    } catch (err) {
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 bg-slate-50/80 dark:bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 -mx-8 px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full flex items-center space-x-4">
             <input 
              type="text" 
              placeholder="Untitled Template" 
              className="text-2xl font-bold bg-transparent outline-none border-b-2 border-transparent focus:border-black dark:focus:border-white transition-colors w-full max-w-lg placeholder-slate-300 dark:placeholder-slate-700"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button 
              onClick={() => window.location.href = '/templates'}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex-1 sm:flex-none text-center"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 shadow-md flex-1 sm:flex-none active:scale-95 transition-all disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
            </button>
          </div>
        </header>

        {/* Settings Bar */}
        <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center">
            <div className="flex flex-col space-y-1 w-full sm:w-auto flex-1 min-w-[150px]">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Template Type <span className="text-red-500">*</span></label>
               <select 
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 appearance-none bg-blue-50/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
               >
                 <option value="personal">Personal Interview</option>
                 <option value="technical">Technical Interview</option>
               </select>
            </div>
            
            <div className="flex flex-col space-y-1 w-full sm:w-auto flex-1 min-w-[200px]">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Target Job Role</label>
               <select 
                  value={jobTitleId}
                  onChange={(e) => setJobTitleId(e.target.value)}
                  className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none"
               >
                 <option value="">Any Role (General)</option>
                 {jobTitles.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
               </select>
            </div>
            
            <div className="flex flex-col space-y-1 w-full sm:w-auto flex-1 min-w-[200px]">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Target Stage</label>
               <input 
                  type="text"
                  placeholder="e.g. Technical Screen"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
               />
            </div>
        </div>

        {/* Builder Canvas */}
        <div className="space-y-6 max-w-4xl mx-auto mt-8">
          <AnimatePresence>
            {sections.map((section, sIdx) => (
              <motion.div 
                key={section.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-[#111113] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group/section"
              >
                {/* Section Header */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="cursor-grab text-slate-300 dark:text-slate-600 hover:text-black dark:hover:text-white transition-colors">
                      <MoveVertical size={16} />
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Section {sIdx + 1}</span>
                        <input 
                          type="text" 
                          placeholder="Section Title"
                          className="bg-transparent font-bold text-lg outline-none border-b border-transparent focus:border-black dark:focus:border-white w-full"
                          value={section.title}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sIdx].title = e.target.value;
                            setSections(newSections);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 bg-white dark:bg-[#111113] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Weighting</span>
                        <input 
                          type="number" 
                          className="w-12 bg-transparent outline-none text-center font-black text-black dark:text-white"
                          value={section.weight}
                          onChange={(e) => {
                            const newSections = [...sections];
                            newSections[sIdx].weight = parseInt(e.target.value) || 0;
                            setSections(newSections);
                          }}
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="p-2 ml-4 text-slate-400 hover:text-red-500 rounded-lg opacity-0 group-hover/section:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => removeSection(section.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Questions List */}
                <div className="p-2 sm:p-6 space-y-3">
                  <AnimatePresence>
                    {section.questions.map((q, qIdx) => (
                      <motion.div 
                        key={q.id} 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#111113] transition-all group/question"
                      >
                        <div className="mt-2 text-slate-300 dark:text-slate-600 hidden sm:block">
                          <ChevronRight size={16} />
                        </div>
                        <div className="flex-1 space-y-3 w-full">
                          <textarea 
                            placeholder="Type question or prompt here..."
                            className="w-full bg-transparent outline-none text-sm font-medium resize-none overflow-hidden min-h-[44px] placeholder-slate-400 dark:placeholder-slate-600 focus:text-blue-600 dark:focus:text-blue-400 transition-colors"
                            value={q.text}
                            onChange={(e) => {
                              const newSections = [...sections];
                              newSections[sIdx].questions[qIdx].text = e.target.value;
                              setSections(newSections);
                            }}
                          />
                          <div className="flex flex-wrap items-center gap-3">
                            <select 
                              className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1.5 outline-none hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer appearance-none"
                              value={q.type}
                              onChange={(e) => {
                                const newSections = [...sections];
                                newSections[sIdx].questions[qIdx].type = e.target.value;
                                setSections(newSections);
                              }}
                            >
                              <option value="scale">Linear Scale (1-5)</option>
                              <option value="boolean">Yes / No</option>
                              <option value="text">Notes Only</option>
                            </select>
                            
                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                            
                            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Weight</span>
                              <input 
                                type="number" 
                                className="w-8 bg-transparent outline-none text-center font-bold text-slate-700 dark:text-slate-300 text-xs"
                                value={q.weight}
                                onChange={(e) => {
                                  const newSections = [...sections];
                                  newSections[sIdx].questions[qIdx].weight = parseInt(e.target.value) || 0;
                                  setSections(newSections);
                                }}
                              />
                            </div>
                            
                            {q.type === 'scale' && (
                               <select
                                 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-md px-2 py-1.5 outline-none hover:border-indigo-300 transition-colors cursor-pointer appearance-none"
                                 value={q.dimension_key || ''}
                                 onChange={(e) => {
                                    const newSections = [...sections];
                                    newSections[sIdx].questions[qIdx].dimension_key = e.target.value;
                                    setSections(newSections);
                                 }}
                               >
                                 <option value="" disabled>Select Domain</option>
                                 {domains.map(d => <option key={d} value={d}>{d}</option>)}
                               </select>
                            )}
                          </div>
                        </div>
                        <button 
                         onClick={() => removeQuestion(section.id, q.id)}
                         className="sm:opacity-0 group-hover/question:opacity-100 text-slate-300 hover:text-red-500 transition-all self-end sm:self-auto p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  <button 
                    className="w-full py-3 mt-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-black dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all flex items-center justify-center space-x-2 group/btn"
                    onClick={() => addQuestion(section.id)}
                  >
                    <Plus size={16} className="group-hover/btn:scale-125 transition-transform" />
                    <span className="text-xs font-bold tracking-wide">Add Question</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button 
            className="w-full py-6 mt-8 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl text-slate-500 hover:text-black dark:text-slate-500 dark:hover:text-white font-bold border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-center space-x-3 group"
            onClick={addSection}
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black flex items-center justify-center transition-colors">
              <Plus size={20} />
            </div>
            <span>New Section</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TemplateBuilder;
