"use client";

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileUp, Search, Plus, Trash2, Edit2, Play, CheckCircle2, FileJson, AlertCircle } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { toast } from 'sonner';
import { z } from 'zod';

// Relaxed schema to accommodate the user's detailed DIME templates
const QuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string().optional(), // some templates use text
  prompt: z.string().optional(), // some use prompt
  type: z.string().optional(), // 'long_text', 'rating', 'yes_no', 'single_select', etc.
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  score_enabled: z.boolean().optional(),
  max_score: z.number().optional(),
  red_flag: z.boolean().optional()
}).catchall(z.any());

const SectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  weight: z.number().optional(),
  scored: z.boolean().optional(),
  questions: z.array(QuestionSchema).optional().default([]),
}).catchall(z.any());

const TemplateSchema = z.object({
  template_name: z.string().optional(),
  name: z.string().optional(), // fallback
  template_type: z.enum(['personal', 'technical']),
  job_titles: z.array(z.string()).optional(),
  stage: z.string().optional(),
  sections: z.array(SectionSchema).optional().default([])
}).catchall(z.any());

const TemplatesPage = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getTemplates();
      setTemplates(res.data || []);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = JSON.parse(event.target?.result as string);
        
        // Zod validation
        const parsed = TemplateSchema.safeParse(rawJson);
        if (!parsed.success) {
           console.error("Validation errors:", parsed.error.issues);
           toast.error('Invalid JSON structure. Missing required fields.');
           return;
        }

        const validTemplate = parsed.data;

        // Persist to DB
        await ApiService.createTemplate({
           name: validTemplate.template_name || validTemplate.name || 'Untitled Template',
           template_type: validTemplate.template_type,
           stage: validTemplate.stage || 'General',
           domains: (validTemplate.scoring_model?.weights) ? Object.keys(validTemplate.scoring_model.weights) : [],
           schema_json: validTemplate
        });
        
        toast.success(`Template "${validTemplate.template_name}" imported successfully`);
        fetchTemplates();
      } catch (err) {
        toast.error('Could not parse JSON. Check file formatting.');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await ApiService.deleteTemplate(id);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const loadPlaybookTemplates = async () => {
    try {
      const files = ['/playbook_25m_interview.json', '/playbook_1h_deep_interview.json'];
      let loaded = 0;
      for (const file of files) {
        const res = await fetch(file);
        if (res.ok) {
           const json = await res.json();
           
           // Extra guard to prevent duplicating if it already exists
           const exists = templates.find(t => t.schema_json?.template_id === json.template_id);
           if (!exists) {
             const payload = {
              name: json.template_name,
              template_type: json.template_type,
              job_title_id: null,
              stage: json.stage,
              domains: ['Belief', 'Ownership', 'Thinking', 'Behavior', 'Skills'],
              schema_json: json
             };
             await ApiService.createTemplate(payload);
             loaded++;
           }
        }
      }
      if (loaded > 0) {
         toast.success(`Successfully loaded ${loaded} base DIME templates!`);
         fetchTemplates();
      } else {
         toast.info('Playbook templates are already loaded');
      }
    } catch (err) {
      toast.error('Failed to load playbook templates');
    }
  };

  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Interview Templates</h1>
            <p className="text-sm text-slate-500 mt-1">Manage structured interview schemas and import JSON structures.</p>
          </div>
          <div className="flex space-x-3">
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button 
              onClick={loadPlaybookTemplates}
              className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all shadow-sm active:scale-95"
            >
              <FileUp size={16} />
              <span className="hidden sm:inline">Load DIME Playbook</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm active:scale-95"
            >
              <FileUp size={16} />
              <span className="hidden sm:inline">Import JSON</span>
            </button>
            <button 
              onClick={() => window.location.href = '/templates/builder'}
              className="bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 shadow-md active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Template Builder</span>
            </button>
          </div>
        </header>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search templates..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#111113] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all text-sm"
          />
        </div>

        {loading ? (
           <div className="p-12 text-center text-slate-400 text-sm">Loading templates...</div>
        ) : templates.length === 0 ? (
           <div className="bg-white dark:bg-[#111113] p-16 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800 text-slate-400">
                <FileJson size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No templates found</h3>
              <p className="text-slate-500 text-sm mt-1 mb-6 max-w-sm">Create a template using the builder, or import a valid JSON schema to get started.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((t) => {
              const questionsCount = t.schema_json?.sections?.reduce((acc: number, sec: any) => acc + (sec.questions?.length || 0), 0) || 0;
              
              return (
                <div key={t.id} className="bg-white dark:bg-[#111113] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex space-x-2 items-center">
                       <div className={`p-2.5 rounded-lg text-white ${t.template_type === 'technical' ? 'bg-indigo-600' : t.template_type === 'personal' ? 'bg-blue-600' : 'bg-slate-800'}`}>
                         <LayoutTemplate size={18} fill="currentColor" className="opacity-80" />
                       </div>
                       <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded border ${
                         t.template_type === 'technical' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' : 
                         t.template_type === 'personal' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 
                         'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                       }`}>
                         {t.template_type || 'Legacy'}
                       </span>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={() => window.location.href = `/templates/builder?id=${t.id}`}
                         className="p-1.5 text-slate-400 hover:text-black dark:hover:text-white rounded transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteTemplate(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-1">{t.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{t.stage || 'General Assessment'}</p>
                  
                  {/* Domains */}
                  <div className="mb-4">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Evaluated Domains</p>
                     <div className="flex flex-wrap gap-1.5">
                       {(t.domains && t.domains.length > 0) ? (
                         t.domains.map((d: string) => (
                           <span key={d} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs border border-slate-200 dark:border-slate-700 capitalize">
                             {d.replace(/_/g, ' ')}
                           </span>
                         ))
                       ) : (
                         <span className="text-xs text-slate-400 italic">No specific domains</span>
                       )}
                     </div>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>{questionsCount} Questions</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// Polyfill for icon
const LayoutTemplate = ({ size, fill, className }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="7" x="3" y="3" rx="1"/>
    <rect width="9" height="7" x="3" y="14" rx="1"/>
    <rect width="5" height="7" x="16" y="14" rx="1"/>
  </svg>
);

export default TemplatesPage;
