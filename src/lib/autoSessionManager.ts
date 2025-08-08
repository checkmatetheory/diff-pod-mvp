import { supabase } from '@/integrations/supabase/client'

export class AutoSessionManager {
  private static monitorId: number | null = null

  static initialize() {
    if (typeof window === 'undefined') return
    this.startBackgroundMonitor()
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

