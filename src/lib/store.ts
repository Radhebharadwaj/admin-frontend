import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface AuthState {
  sessionToken: string | null
  user: { email: string; member_name?: string; role: string; scope: string } | null
  setSessionToken: (token: string | null) => void
  setUser: (user: { email: string; member_name?: string; role: string; scope: string } | null) => void
  
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  sessionToken: null,
  user: null,
  setSessionToken: (token) => set({ sessionToken: token }),
  setUser: (user) => set({ user }),

  toasts: [],
  addToast: (type, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
