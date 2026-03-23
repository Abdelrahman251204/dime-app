import { supabase } from './supabase';
import { localDb } from './localDb';

// If SUPABASE_URL is not set or is the placeholder, we use Local Storage to ensure the app is 100% functional locally.
const useLocal = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_SUPABASE_URL');

export const dbData = useLocal ? localDb : supabase;

// Centralized API Services
export const ApiService = {
  // Job Titles
  getJobTitles: async () => await dbData.from('job_titles').select('*'),
  createJobTitle: async (data: any) => await dbData.from('job_titles').insert(data),
  
  // Pipelines
  getPipelines: async () => await dbData.from('pipelines').select('*'),
  createPipeline: async (data: any) => await dbData.from('pipelines').insert(data),
  updatePipeline: async (id: string, data: any) => await dbData.from('pipelines').update(data).eq('id', id),
  
  // Candidates
  getCandidates: async () => await dbData.from('candidates').select('*'),
  createCandidate: async (data: any) => await dbData.from('candidates').insert({...data, status: 'Active'}),
  updateCandidate: async (id: string, data: any) => await dbData.from('candidates').update(data).eq('id', id),
  deleteCandidate: async (id: string) => await dbData.from('candidates').delete().eq('id', id),
  
  // Templates
  getTemplates: async () => await dbData.from('interview_templates').select('*'),
  createTemplate: async (data: any) => await dbData.from('interview_templates').insert(data),
  updateTemplate: async (id: string, data: any) => await dbData.from('interview_templates').update(data).eq('id', id),
  deleteTemplate: async (id: string) => await dbData.from('interview_templates').delete().eq('id', id),
  
  // Sessions
  getSessions: async () => await dbData.from('interview_sessions').select('*'),
  createSession: async (data: any) => await dbData.from('interview_sessions').insert(data),
  updateSession: async (id: string, data: any) => await dbData.from('interview_sessions').update(data).eq('id', id),
  deleteSession: async (id: string) => await dbData.from('interview_sessions').delete().eq('id', id),
  
  // Responses
  getResponses: async (sessionId: string) => {
     if (useLocal) { // LocalDb simple filter workaround
        const res: any = await localDb.from('interview_responses').select('*');
        return { data: res.data.filter((r: any) => r.session_id === sessionId), error: null };
     } else {
        return await supabase.from('interview_responses').select('*').eq('session_id', sessionId);
     }
  },
  upsertResponses: async (data: any[]) => await dbData.from('interview_responses').upsert(data)
};
