import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      login: async (username, password) => {
        try {
          const response = await authAPI.login(username, password)
          const { access_token, user } = response.data
          
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          })
          
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return {
            success: false,
            error: error.response?.data?.detail || 'Login failed',
          }
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },
      
      checkAuth: async () => {
        const token = get().token
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }
        
        try {
          const response = await authAPI.me()
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'libro-auth',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.checkAuth()
        }
      },
    }
  )
)

export { useAuthStore }
export default useAuthStore
