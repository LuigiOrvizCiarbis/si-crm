import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface User {
  id: number
  name: string
  email: string
  email_verified_at?: string | null
  tenant_id?: number
  role?: string
  created_at?: string
  updated_at?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  emailVerified: boolean
  isLoading: boolean
  rememberMe: boolean
  _hasHydrated: boolean
  
  // Actions
  setAuth: (user: User, token: string, rememberMe?: boolean, emailVerified?: boolean) => void
  setEmailVerified: (verified: boolean) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  checkAuth: () => boolean
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      emailVerified: false,
      isLoading: false,
      rememberMe: false,
      _hasHydrated: false,

      setAuth: (user, token, rememberMe = false, emailVerified = false) => {
        set({
          user,
          token,
          isAuthenticated: true,
          emailVerified: emailVerified || !!user.email_verified_at,
          rememberMe,
        })
      },

      setEmailVerified: (verified) => {
        set({ emailVerified: verified })
      },

      updateUser: (userData) => {
        const current = get().user
        if (current) {
          set({ 
            user: { ...current, ...userData },
            emailVerified: userData.email_verified_at ? true : get().emailVerified,
          })
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          emailVerified: false,
          rememberMe: false,
        })
      },

      setLoading: (loading) => set({ isLoading: loading }),

      checkAuth: () => {
        const state = get()
        return state.isAuthenticated && !!state.token
      },

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        emailVerified: state.emailVerified,
        rememberMe: state.rememberMe,
      }),
    }
  )
)
