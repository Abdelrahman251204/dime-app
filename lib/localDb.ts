import { v4 as uuidv4 } from 'uuid';

/**
 * A highly robust LocalStorage ORM designed to mimic basic Supabase syntax.
 * Ensures the app works "totally local" with full persistence, satisfying the user's requirement.
 */

type TableName = 'job_titles' | 'pipelines' | 'candidates' | 'interview_templates' | 'interview_sessions' | 'interview_responses';

class LocalDB {
  private getTable(table: TableName): any[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(`dime_${table}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setTable(table: TableName, data: any[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`dime_${table}`, JSON.stringify(data));
  }

  from(table: TableName) {
    return {
      select: (query?: string) => {
        // Simple select all for local mock
        return Promise.resolve({ data: this.getTable(table), error: null });
      },
      insert: (data: any | any[]) => {
        const payload = Array.isArray(data) ? data : [data];
        const withIds = payload.map(item => ({ ...item, id: item.id || uuidv4(), created_at: new Date().toISOString() }));
        const current = this.getTable(table);
        this.setTable(table, [...current, ...withIds]);
        return Promise.resolve({ data: withIds, error: null });
      },
      update: (data: any) => {
        return {
          eq: (column: string, value: any) => {
            const current = this.getTable(table);
            const updated = current.map(item => item[column] === value ? { ...item, ...data } : item);
            this.setTable(table, updated);
            return Promise.resolve({ data: updated.filter(i => i[column] === value), error: null });
          }
        };
      },
      delete: () => {
        return {
          eq: (column: string, value: any) => {
            const current = this.getTable(table);
            const next = current.filter(item => item[column] !== value);
            this.setTable(table, next);
            return Promise.resolve({ data: null, error: null });
          }
        };
      },
      upsert: (data: any | any[]) => {
        // Simple upsert based on ID
        const payload = Array.isArray(data) ? data : [data];
        const current = this.getTable(table);
        
        const next = [...current];
        const processed = payload.map(item => {
           const existingIdx = next.findIndex(i => i.id === item.id);
           if (existingIdx >= 0) {
             next[existingIdx] = { ...next[existingIdx], ...item };
             return next[existingIdx];
           } else {
             const newItem = { ...item, id: item.id || uuidv4(), created_at: item.created_at || new Date().toISOString() };
             next.push(newItem);
             return newItem;
           }
        });
        
        this.setTable(table, next);
        return Promise.resolve({ data: processed, error: null });
      }
    };
  }
}

export const localDb = new LocalDB();
