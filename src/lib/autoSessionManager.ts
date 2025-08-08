import { supabase } from '@/integrations/supabase/client'

export class AutoSessionManager {
  private static monitorId: number | null = null

  static initialize() {
    if (typeof window === 'undefined') return
    
    this.startBackgroundMonitor()
    this.setupVisibilityTriggers()
    
    // Prime session on boot
    supabase.auth.getSession().then(({ data }) => {
      const exp = data.session?.expires_at ?? 0
      const now = Math.floor(Date.now() / 1000)
      if (exp && exp <= now) {
        this.forceRefresh()
      }
    })
    console.log('🤖 AutoSessionManager initialized')
  }

  private static setupVisibilityTriggers() {
    // Refresh when tab becomes visible (user returns from being idle)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Tab became visible, checking session...')
        this.checkAndRefreshIfNeeded()
      }
    })

    // Refresh when browser comes back online
    window.addEventListener('online', () => {
      console.log('🌐 Browser came online, checking session...')
      this.checkAndRefreshIfNeeded()
    })

    // Refresh when window regains focus
    window.addEventListener('focus', () => {
      console.log('👁️ Window focused, checking session...')
      this.checkAndRefreshIfNeeded()
    })
  }

  private static async checkAndRefreshIfNeeded() {
    const { data } = await supabase.auth.getSession()
    const exp = data.session?.expires_at ?? 0
    const now = Math.floor(Date.now() / 1000)
    
    // Refresh if expired or expiring within 2 minutes
    if (exp && exp - now < 120) {
      console.log('⚡ Session expired/expiring, forcing refresh...')
      await this.forceRefresh()
    }
  }

  static async forceRefresh() {
    try {
      const { error } = await supabase.auth.refreshSession()
      if (error) throw error
    } catch {
      await this.clearExpiredSession()
    }
  }

  static async clearExpiredSession() {
    try { await supabase.auth.signOut() } catch {}
    localStorage.clear()
    sessionStorage.clear()
    if (typeof window !== 'undefined') window.location.href = '/auth'
  }

  private static startBackgroundMonitor() {
    if (this.monitorId) return
    this.monitorId = window.setInterval(async () => {
      const { data } = await supabase.auth.getSession()
      const exp = data.session?.expires_at ?? 0
      const now = Math.floor(Date.now() / 1000)
      // Refresh 5 minutes before expiry
      if (exp && exp - now < 300) {
        await this.forceRefresh()
      }
    }, 60_000)
  }
}

