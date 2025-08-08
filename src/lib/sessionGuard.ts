/**
 * 🔐 SESSION GUARD - Automatic JWT handling and refresh
 * 
 * This utility provides automatic session validation and refresh
 * for API calls that might encounter JWT expiration.
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SessionGuardOptions {
  retryOnFailure?: boolean;
  showToastOnRefresh?: boolean;
  maxRetries?: number;
}

export class SessionGuard {
  private static retryCount = 0;
  private static maxRetries = 2;

  /**
   * Executes a function with automatic session validation and refresh
   */
  static async withValidSession<T>(
    fn: () => Promise<T>,
    options: SessionGuardOptions = {}
  ): Promise<T> {
    const { 
      retryOnFailure = true, 
      showToastOnRefresh = false, 
      maxRetries = this.maxRetries 
    } = options;

    try {
      // Check if session is valid before executing
      await this.ensureValidSession();
      
      // Execute the function
      const result = await fn();
      this.retryCount = 0; // Reset retry count on success
      return result;
      
    } catch (error: any) {
      console.error('🚨 Session guard caught error:', error);
      
      // Check if it's a JWT/auth error
      const isAuthError = this.isAuthenticationError(error);
      
      if (isAuthError && retryOnFailure && this.retryCount < maxRetries) {
        console.log(`🔄 Auth error detected, retrying... (${this.retryCount + 1}/${maxRetries})`);
        this.retryCount++;
        
        // Attempt to refresh session
        const refreshed = await this.forceRefreshSession(showToastOnRefresh);
        
        if (refreshed) {
          // Retry the function with refreshed session
          return this.withValidSession(fn, { ...options, retryOnFailure: false });
        }
      }
      
      // If we get here, either it's not an auth error or we failed to refresh
      this.retryCount = 0;
      throw error;
    }
  }

  /**
   * Ensures the current session is valid, refreshing if necessary
   */
  private static async ensureValidSession(): Promise<void> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
      throw error;
    }
    
    if (!session) {
      throw new Error('No active session');
    }
    
    // Check if session is close to expiry (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const bufferTime = 300; // 5 minutes
    
    if (expiresAt <= (now + bufferTime)) {
      console.log('⏰ Session expires soon, refreshing proactively...');
      await this.forceRefreshSession();
    }
  }

  /**
   * Forces a session refresh
   */
  private static async forceRefreshSession(showToast = false): Promise<boolean> {
    try {
      console.log('🔄 Forcing session refresh...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Session refresh failed:', error);
        
        if (error.message?.includes('refresh_token_not_found') || 
            error.message?.includes('invalid_grant')) {
          console.log('🚪 Refresh token invalid, redirecting to auth...');
          this.redirectToAuth();
          return false;
        }
        
        throw error;
      }
      
      if (data.session) {
        console.log('✅ Session refreshed successfully');
        
        if (showToast) {
          toast({
            title: "Session renewed",
            description: "Your login session has been refreshed.",
          });
        }
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('💥 Critical session refresh error:', error);
      
      toast({
        title: "Session expired",
        description: "Please sign in again to continue.",
        variant: "destructive",
      });
      
      this.redirectToAuth();
      return false;
    }
  }

  /**
   * Checks if an error is related to authentication/JWT expiration
   */
  private static isAuthenticationError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || error.status;
    
    // Check for common JWT/auth error patterns
    const authErrors = [
      'jwt',
      'expired',
      'unauthorized',
      'token',
      'authentication',
      'session',
      'invalid_grant',
      'refresh_token_not_found'
    ];
    
    const isMessageMatch = authErrors.some(term => errorMessage.includes(term));
    const isStatusMatch = errorCode === 401 || errorCode === 403;
    
    return isMessageMatch || isStatusMatch;
  }

  /**
   * Redirects to authentication page
   */
  private static redirectToAuth(): void {
    // Clear any stored session data
    localStorage.removeItem('supabase.auth.token');
    
    // Redirect to auth page
    window.location.href = '/auth';
  }

  /**
   * Wraps Supabase queries with automatic session handling
   */
  static async query<T>(queryFn: () => Promise<T>): Promise<T> {
    return this.withValidSession(queryFn, {
      retryOnFailure: true,
      showToastOnRefresh: false,
      maxRetries: 2
    });
  }

  /**
   * Wraps Supabase mutations with automatic session handling
   */
  static async mutate<T>(mutateFn: () => Promise<T>): Promise<T> {
    return this.withValidSession(mutateFn, {
      retryOnFailure: true,
      showToastOnRefresh: true,
      maxRetries: 1
    });
  }
}

/**
 * Hook for using session guard in React components
 */
export const useSessionGuard = () => {
  return {
    withValidSession: SessionGuard.withValidSession.bind(SessionGuard),
    query: SessionGuard.query.bind(SessionGuard),
    mutate: SessionGuard.mutate.bind(SessionGuard),
  };
};