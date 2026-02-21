import { create } from 'zustand'

interface AuthState {
  sessionToken: string | null
  user: { email: string; member_name?: string; role: string; scope: string } | null
  setSessionToken: (token: string | null) => void
  setUser: (user: { email: string; member_name?: string; role: string; scope: string } | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  sessionToken: null,
  user: null,
  setSessionToken: (token) => set({ sessionToken: token }),
  setUser: (user) => set({ user }),
}))
