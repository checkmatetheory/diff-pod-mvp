import { supabase } from '@/integrations/supabase/client'

class APIInterceptorClass {
  private installed = false
  private isRefreshing = false
  private refreshPromise: Promise<boolean> | null = null

  install() {
    if (this.installed || typeof window === 'undefined') return
    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const response = await originalFetch(input, init)
      // Only handle 401s against Supabase endpoints
      const isSupabase = typeof input === 'string'
        ? input.includes('.supabase.co')
        : (input as URL).toString().includes('.supabase.co')

      if (isSupabase && response.status === 401) {
        const refreshed = await this.handleTokenRefresh()
        if (refreshed) {
          return originalFetch(input, init)
        }
      }
      return response
    }

    this.installed = true
    console.log('🔐 API interceptor installed')
  }

  private async handleTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) return this.refreshPromise
    this.isRefreshing = true
    this.refreshPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (error) throw error
        return !!data.session
      } catch (e) {
        // Hard reset auth if refresh fails
        try { await supabase.auth.signOut() } catch {}
        localStorage.clear()
        sessionStorage.clear()
        if (typeof window !== 'undefined') window.location.href = '/auth'
        return false
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()
    return this.refreshPromise
  }
}

export const APIInterceptor = new APIInterceptorClass()
APIInterceptor.install()

