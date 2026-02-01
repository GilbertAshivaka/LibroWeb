import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { portalAPI } from '../api'

const usePortalStore = create(
  persist(
    (set, get) => ({
      // Auth state
      token: null,
      customer: null,
      organization: null,
      license: null,
      isAuthenticated: false,
      
      // Actions
      login: async (email, password) => {
        try {
          const response = await portalAPI.login(email, password)
          set({
            token: response.data.access_token,
            isAuthenticated: true
          })
          // Fetch customer data after login
          await get().fetchCustomerData()
          return { success: true }
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.detail || 'Login failed'
          }
        }
      },
      
      logout: () => {
        set({
          token: null,
          customer: null,
          organization: null,
          license: null,
          isAuthenticated: false
        })
      },
      
      fetchCustomerData: async () => {
        try {
          const response = await portalAPI.getMe()
          set({
            customer: response.data.customer,
            organization: response.data.organization,
            license: response.data.license
          })
        } catch (error) {
          console.error('Failed to fetch customer data:', error)
          if (error.response?.status === 401) {
            get().logout()
          }
        }
      },
      
      setToken: (token) => set({ token, isAuthenticated: !!token })
    }),
    {
      name: 'libro-portal-auth',
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export default usePortalStore
