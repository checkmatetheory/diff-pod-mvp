/**
 * Cache Management Utility
 * Prevents video clip cache corruption issues and provides recovery mechanisms
 */

interface CacheItem {
  data: any;
  timestamp: number;
  version: string;
}

const CACHE_VERSION = '1.0';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

export class CacheManager {
  private static instance: CacheManager;
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Clear all video/session related cache
   */
  clearVideoCache(): void {
    try {
      console.log('🧹 Clearing video-related cache...');
      
      // Clear localStorage
      const localKeys = Object.keys(localStorage).filter(key => 
        key.includes('session') || 
        key.includes('clip') || 
        key.includes('video') ||
        key.includes('vizard')
      );
      
      localKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed localStorage: ${key}`);
      });
      
      // Clear sessionStorage
      const sessionKeys = Object.keys(sessionStorage).filter(key =>
        key.includes('session') || 
        key.includes('clip') || 
        key.includes('video')
      );
      
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removed sessionStorage: ${key}`);
      });
      
      console.log('✅ Video cache cleared successfully');
    } catch (error) {
      console.error('❌ Cache clearing failed:', error);
    }
  }

  /**
   * Clear stale cache entries
   */
  clearStaleCache(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      
      // Check localStorage for stale entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Remove if expired or wrong version
          if (
            !item.timestamp || 
            now - item.timestamp > CACHE_EXPIRY ||
            item.version !== CACHE_VERSION
          ) {
            keysToRemove.push(key);
          }
        } catch {
          // Remove invalid JSON
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 Removed stale cache: ${key}`);
      });
      
      if (keysToRemove.length > 0) {
        console.log(`✅ Cleared ${keysToRemove.length} stale cache entries`);
      }
    } catch (error) {
      console.error('❌ Stale cache clearing failed:', error);
    }
  }

  /**
   * Validate clip data structure
   */
  validateClipData(clips: any[]): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!Array.isArray(clips)) {
      issues.push('Clips data is not an array');
      return { isValid: false, issues };
    }
    
    if (clips.length === 0) {
      return { isValid: true, issues }; // Empty array is valid
    }
    
    clips.forEach((clip, index) => {
      if (!clip || typeof clip !== 'object') {
        issues.push(`Clip ${index}: Not an object`);
        return;
      }
      
      if (Object.keys(clip).length === 0) {
        issues.push(`Clip ${index}: Empty object`);
        return;
      }
      
      if (!clip.id) {
        issues.push(`Clip ${index}: Missing ID`);
      }
      
      if (!clip.title) {
        issues.push(`Clip ${index}: Missing title`);
      }
      
      if (!clip.videoUrl && !clip.url && !clip.downloadUrl) {
        issues.push(`Clip ${index}: Missing video URL`);
      }
    });
    
    const isValid = issues.length === 0;
    
    if (!isValid) {
      console.warn('🔍 Clip validation issues:', issues);
    }
    
    return { isValid, issues };
  }

  /**
   * Safe cache set with versioning
   */
  setCache(key: string, data: any): void {
    try {
      const cacheItem: CacheItem = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn(`Failed to set cache for ${key}:`, error);
    }
  }

  /**
   * Safe cache get with validation
   */
  getCache(key: string): any | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const cacheItem: CacheItem = JSON.parse(cached);
      
      // Check expiry and version
      if (
        Date.now() - cacheItem.timestamp > CACHE_EXPIRY ||
        cacheItem.version !== CACHE_VERSION
      ) {
        localStorage.removeItem(key);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.warn(`Failed to get cache for ${key}:`, error);
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Initialize cache management for a session
   */
  initializeSessionCache(sessionId: string): void {
    console.log(`🔧 Initializing cache management for session ${sessionId}`);
    
    // Clear any stale cache
    this.clearStaleCache();
    
    // Set up periodic cache cleaning
    const cleanup = () => {
      this.clearStaleCache();
    };
    
    // Clean up every 10 minutes
    const intervalId = setInterval(cleanup, 10 * 60 * 1000);
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(intervalId);
    });
  }

  /**
   * Emergency recovery - clear everything and force refresh
   */
  emergencyRecovery(): void {
    console.log('🚨 Emergency cache recovery initiated');
    
    // Clear all caches
    this.clearVideoCache();
    
    // Clear React Query cache if present
    if (window.queryClient) {
      window.queryClient.clear();
    }
    
    // Force page reload as last resort
    setTimeout(() => {
      console.log('🔄 Forcing page reload for complete recovery');
      window.location.reload();
    }, 1000);
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Auto-initialize cache management
if (typeof window !== 'undefined') {
  // Clear stale cache on app load
  cacheManager.clearStaleCache();
  
  // Set up global error handler for cache-related issues
  window.addEventListener('error', (event) => {
    if (
      event.message.includes('video') || 
      event.message.includes('clip') ||
      event.message.includes('session')
    ) {
      console.warn('🔧 Potential cache-related error detected:', event.message);
      cacheManager.clearStaleCache();
    }
  });
}