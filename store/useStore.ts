import { create } from 'zustand';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Interviewer' | 'Hiring Manager';
}

interface AppState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  // Add other states as needed later
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
