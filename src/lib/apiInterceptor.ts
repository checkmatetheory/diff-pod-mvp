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
        : (input as URL | Request).toString().includes('.supabase.co')

      if (!isSupabase || response.status !== 401) return response

      const refreshed = await this.handleTokenRefresh()
      if (!refreshed) return response

      // Get fresh token after refresh
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token

      // Rebuild request with updated Authorization header
      return this.retryWithFreshToken(input, init, token, originalFetch)
    }

    this.installed = true
    console.log('🔐 API interceptor installed')
  }

  private async retryWithFreshToken(
    input: RequestInfo | URL, 
    init: RequestInit | undefined, 
    token: string | undefined,
    originalFetch: typeof fetch
  ): Promise<Response> {
    if (typeof input === 'string' || input instanceof URL) {
      // Simple URL/string input - rebuild headers
      const headers = new Headers((init && init.headers) || {})
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return originalFetch(input, { ...init, headers })
    } else {
      // Request object - clone with fresh headers
      const oldReq = input as Request
      const headers = new Headers(oldReq.headers)
      if (token) headers.set('Authorization', `Bearer ${token}`)
      
      const clonedReq = new Request(oldReq.url, {
        method: oldReq.method,
        headers,
        body: oldReq.method !== 'GET' && oldReq.method !== 'HEAD' ? await oldReq.clone().blob() : undefined,
        mode: oldReq.mode,
        credentials: oldReq.credentials,
        cache: oldReq.cache,
        redirect: oldReq.redirect,
        referrer: oldReq.referrer,
        referrerPolicy: oldReq.referrerPolicy,
        integrity: oldReq.integrity,
        keepalive: oldReq.keepalive,
        signal: oldReq.signal,
      })
      return originalFetch(clonedReq)
    }
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

