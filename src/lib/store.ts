import { create } from 'zustand'

interface AuthState {
  sessionToken: string | null
  setSessionToken: (token: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  sessionToken: null,
  setSessionToken: (token) => set({ sessionToken: token }),
}))
