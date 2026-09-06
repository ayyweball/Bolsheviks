import { create } from 'zustand';

interface UserState {
  user: {
    id: string;
    phone: string;
    name: string;
    language: string;
    state: string;
    district: string;
  } | null;
  selectedBusinessId: string | null;
  setUser: (user: any) => void;
  setSelectedBusinessId: (id: string | null) => void;
  logout: () => void;
}

export const useAppStore = create<UserState>((set) => ({
  user: null,
  selectedBusinessId: null,
  setUser: (user) => set({ user }),
  setSelectedBusinessId: (id) => set({ selectedBusinessId: id }),
  logout: () => set({ user: null, selectedBusinessId: null }),
}));
