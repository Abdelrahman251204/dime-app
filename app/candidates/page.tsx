"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Plus, Search, Filter, ExternalLink, X, Mail, Phone, Briefcase, Users, Pen, Trash2 } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const CandidatesPage = () => {
  const router = useRouter();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', job_title_id: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candRes, jobsRes] = await Promise.all([
        ApiService.getCandidates(),
        ApiService.getJobTitles()
      ]);
      setCandidates(candRes.data || []);
      setJobTitles(jobsRes.data || []);
    } catch (error) {
      toast.error('Failed to load candidate data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.job_title_id) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        job_title_id: formData.job_title_id,
      };

      if (isEditMode && editingId) {
        await ApiService.updateCandidate(editingId, payload);
        toast.success(`Candidate updated successfully`);
      } else {
        await ApiService.createCandidate({...payload, status: 'Active', stage: 'Applied'});
        toast.success(`${formData.name} added successfully`);
      }
      
      setIsDrawerOpen(false);
      setFormData({ name: '', email: '', phone: '', job_title_id: '' });
      setIsEditMode(false);
      setEditingId(null);
      fetchData(); // Refresh list
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update candidate' : 'Failed to create candidate');
    }
  };

  const handleEdit = (candidate: any) => {
    setFormData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      job_title_id: candidate.job_title_id
    });
    setIsEditMode(true);
    setEditingId(candidate.id);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      await ApiService.deleteCandidate(id);
      toast.success(`${name} deleted successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete candidate');
    }
  };

  const openCreateDrawer = () => {
    setFormData({ name: '', email: '', phone: '', job_title_id: '' });
    setIsEditMode(false);
    setEditingId(null);
    setIsDrawerOpen(true);
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Candidates</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track your active applicant pipeline.</p>
          </div>
          <button 
            onClick={openCreateDrawer}
            className="bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all shadow-md active:scale-95"
          >
            <Plus size={16} />
            <span>Add Candidate</span>
          </button>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all text-sm"
            />
          </div>
          <button className="px-4 py-2 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-lg flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-sm font-medium">
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-[#111113] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
             <div className="p-12 text-center text-slate-400 text-sm">Loading candidates...</div>
          ) : candidates.length === 0 ? (
             <div className="p-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                  <Users className="text-slate-400" size={24} />
                </div>
                <h3 className="text-lg font-bold">No candidates yet</h3>
                <p className="text-slate-500 text-sm mt-1 mb-6 max-w-sm">Get started by manually adding a candidate to one of your open job pipelines.</p>
                <button 
                  onClick={() => setIsDrawerOpen(true)}
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                   + Add First Candidate
                </button>
             </div>
          ) : (
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-200 dark:border-slate-800">
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Candidate</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                 {filteredCandidates.map((c) => {
                   const job = jobTitles.find(j => j.id === c.job_title_id);
                   return (
                     <tr 
                       key={c.id} 
                       onClick={() => router.push(`/candidates/${c.id}`)}
                       className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                     >
                       <td className="px-6 py-4">
                         <div className="flex items-center space-x-3">
                           <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm shadow-sm border border-white/20">
                             {c.name.charAt(0)}
                           </div>
                           <div>
                             <p className="font-semibold text-sm text-slate-900 dark:text-white capitalize">{c.name}</p>
                             <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                               <Mail size={10} />
                               <span>{c.email}</span>
                             </p>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-sm font-medium">{job?.title || 'Unassigned'}</span>
                           <span className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">{c.stage}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <span className={`px-2.5 py-1 rounded w-fit text-[11px] font-bold uppercase tracking-wide border ${
                           c.status === 'Hired' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                           c.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                           'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                         }`}>
                           {c.status}
                         </span>
                       </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEdit(c); }}
                              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Pen size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.name); }}
                              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
          )}
        </div>
      </div>

      {/* Slide-over Drawer for "Add Candidate" */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
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
                 <h2 className="text-lg font-bold">{isEditMode ? 'Edit Candidate' : 'Add Candidate'}</h2>
                 <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                   <X size={18} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="candidate-form" onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                        placeholder="e.g. Jane Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address <span className="text-red-500">*</span></label>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                        placeholder="jane@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assign Role <span className="text-red-500">*</span></label>
                     <select
                        required
                        value={formData.job_title_id}
                        onChange={e => setFormData({...formData, job_title_id: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all appearance-none"
                     >
                       <option value="">Select a job role...</option>
                       {jobTitles.map(j => (
                         <option key={j.id} value={j.id}>{j.title}</option>
                       ))}
                     </select>
                     {jobTitles.length === 0 && (
                        <p className="text-xs text-amber-500 mt-2 flex items-center space-x-1">
                          <Briefcase size={12} />
                          <span>No job roles found. Please create one in Pipelines first.</span>
                        </p>
                     )}
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end space-x-3">
                 <button 
                  type="button" 
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                  type="submit" 
                  form="candidate-form"
                  className="bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black px-6 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all"
                 >
                   {isEditMode ? 'Save Changes' : 'Save Candidate'}
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default CandidatesPage;
