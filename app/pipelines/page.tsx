"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings2, Plus, GripVertical, Trash2, X, Briefcase, ChevronRight } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const PipelinesPage = () => {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Pipeline Form State
  const [formData, setFormData] = useState({ title: '', department: '', stages: ['Applied', 'Interview'] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pipeRes, jobsRes] = await Promise.all([
        ApiService.getPipelines(),
        ApiService.getJobTitles()
      ]);
      setPipelines(pipeRes.data || []);
      setJobTitles(jobsRes.data || []);
    } catch (error) {
      toast.error('Failed to load pipelines');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Job Title is required');
      return;
    }

    try {
      // 1. Create Job Title first
      const jobRes = await ApiService.createJobTitle({
        title: formData.title,
        department: formData.department
      });
      const newJobId = jobRes.data[0].id;

      // 2. Create Pipeline associated with Job
      await ApiService.createPipeline({
        job_title_id: newJobId,
        stages: formData.stages
      });

      toast.success(`Pipeline for ${formData.title} created successfully`);
      setIsModalOpen(false);
      setFormData({ title: '', department: '', stages: ['Applied', 'Interview'] });
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create pipeline');
    }
  };

  const addStage = () => {
    setFormData(prev => ({ ...prev, stages: [...prev.stages, 'New Stage'] }));
  };

  const updateStage = (index: number, value: string) => {
    const newStages = [...formData.stages];
    newStages[index] = value;
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const removeStage = (index: number) => {
    if (formData.stages.length <= 1) return toast.error('A pipeline must have at least one stage');
    const newStages = formData.stages.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Job Pipelines</h1>
            <p className="text-sm text-slate-500 mt-1">Configure hiring stages for each job role.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-md active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span>New Pipeline</span>
          </button>
        </header>

        {loading ? (
           <div className="p-12 text-center text-slate-400 text-sm">Loading pipelines...</div>
        ) : pipelines.length === 0 ? (
           <div className="bg-white dark:bg-[#111113] p-16 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                <Briefcase className="text-slate-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No active pipelines</h3>
              <p className="text-slate-500 text-sm mt-1 mb-6 max-w-sm">Create a pipeline to define the hiring stages and start assigning candidates.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                 + Create First Pipeline
              </button>
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pipelines.map((p) => {
              const job = jobTitles.find(j => j.id === p.job_title_id);
              return (
                <div key={p.id} className="bg-white dark:bg-[#111113] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{job?.title || 'Unknown Role'}</h3>
                      {job?.department && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{job.department}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-slate-400 hover:text-black dark:text-slate-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Settings2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {p.stages?.map((stage: string, idx: number) => (
                      <React.Fragment key={idx}>
                        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded flex items-center space-x-2 shadow-sm">
                          <span className="text-[10px] font-black text-slate-400">{idx + 1}</span>
                          <span className="text-xs font-semibold">{stage}</span>
                        </div>
                        {idx < p.stages.length - 1 && (
                          <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Slide-over Drawer for New Pipeline */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#0A0A0B] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                 <h2 className="text-lg font-bold">Create Job Pipeline</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors">
                   <X size={18} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="pipeline-form" onSubmit={handleCreate} className="space-y-6">
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Job Title <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                        placeholder="e.g. Senior Frontend Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Department</label>
                      <input 
                        type="text" 
                        value={formData.department}
                        onChange={e => setFormData({...formData, department: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                        placeholder="e.g. Engineering"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Pipeline Stages</label>
                     <div className="space-y-3">
                        {formData.stages.map((stage, idx) => (
                           <div key={idx} className="flex items-center space-x-2">
                             <div className="w-8 h-8 rounded bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 cursor-grab active:cursor-grabbing text-slate-400">
                               <GripVertical size={14} />
                             </div>
                             <input 
                               type="text" 
                               value={stage}
                               onChange={(e) => updateStage(idx, e.target.value)}
                               className="flex-1 px-3 py-1.5 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                             />
                             <button 
                               type="button" 
                               onClick={() => removeStage(idx)}
                               className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                             >
                                <Trash2 size={16} />
                             </button>
                           </div>
                        ))}
                        <button 
                           type="button"
                           onClick={addStage}
                           className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-500 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all flex items-center justify-center space-x-1"
                        >
                           <Plus size={14} />
                           <span>Add Stage</span>
                        </button>
                     </div>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end space-x-3">
                 <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                  type="submit" 
                  form="pipeline-form"
                  className="bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black px-6 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all"
                 >
                   Create Pipeline
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default PipelinesPage;
