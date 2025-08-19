/**
 * Video Recovery Service
 * Handles automatic detection and recovery of video clip issues
 */

import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from './cacheManager';

export interface RecoveryResult {
  success: boolean;
  message: string;
  clipsRecovered?: number;
  error?: string;
}

export class VideoRecoveryService {
  private static instance: VideoRecoveryService;
  
  static getInstance(): VideoRecoveryService {
    if (!VideoRecoveryService.instance) {
      VideoRecoveryService.instance = new VideoRecoveryService();
    }
    return VideoRecoveryService.instance;
  }

  /**
   * Detect if video clips need recovery
   */
  needsRecovery(session: any): boolean {
    const clips = session?.session_data?.video_clips || [];
    
    // No clips but has video processing job ID
    if (clips.length === 0 && session?.video_processing_job_id) {
      console.log('🔍 No clips found but video processing job exists');
      return true;
    }
    
    // Has clips but they're empty objects
    if (clips.length > 0) {
      const emptyClips = clips.filter((clip: any) => 
        !clip || 
        typeof clip !== 'object' || 
        Object.keys(clip).length === 0
      );
      
      if (emptyClips.length > 0) {
        console.log(`🔍 Found ${emptyClips.length} empty clip objects`);
        return true;
      }
      
      // Has clips but no video URLs
      const clipsWithoutUrls = clips.filter((clip: any) => 
        clip && !clip.videoUrl && !clip.url && !clip.downloadUrl
      );
      
      if (clipsWithoutUrls.length === clips.length) {
        console.log('🔍 All clips missing video URLs');
        return true;
      }
    }
    
    return false;
  }

  /**
   * Attempt automatic recovery of video clips
   */
  async attemptRecovery(sessionId: string, jobId?: string): Promise<RecoveryResult> {
    try {
      console.log(`🔄 Attempting video recovery for session ${sessionId}`);
      
      // Clear any corrupted cache first
      cacheManager.clearVideoCache();
      
      // Method 1: Try vizard-poll if we have a job ID
      if (jobId) {
        console.log(`🎯 Trying Vizard poll for job ${jobId}`);
        
        const { data, error } = await supabase.functions.invoke('vizard-poll', {
          body: { sessionId, jobId }
        });
        
        if (!error && data?.status === 'completed') {
          return {
            success: true,
            message: `Successfully recovered ${data.clipsCount || 0} clips via polling`,
            clipsRecovered: data.clipsCount || 0
          };
        }
      }
      
      // Method 2: Try manual clip fix (for known projects)
      console.log('🔧 Trying manual clip fix...');
      
      const { data: fixData, error: fixError } = await supabase.functions.invoke('manual-clip-fix', {
        body: {}
      });
      
      if (!fixError && fixData?.success) {
        return {
          success: true,
          message: `Successfully recovered ${fixData.clips?.length || 0} clips via manual fix`,
          clipsRecovered: fixData.clips?.length || 0
        };
      }
      
      // Method 3: Try retry processing
      console.log('🔄 Trying retry processing...');
      
      const { data: retryData, error: retryError } = await supabase.functions.invoke('retry-video-processing', {
        body: { sessionId }
      });
      
      if (!retryError && retryData?.success) {
        return {
          success: true,
          message: `Successfully recovered ${retryData.clipsCount || 0} clips via retry`,
          clipsRecovered: retryData.clipsCount || 0
        };
      }
      
      return {
        success: false,
        message: 'All recovery methods failed',
        error: 'No recovery method succeeded'
      };
      
    } catch (error) {
      console.error('❌ Recovery attempt failed:', error);
      return {
        success: false,
        message: 'Recovery attempt failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Show user-friendly recovery notification
   */
  showRecoveryNotification(result: RecoveryResult): void {
    if (result.success) {
      // Success notification
      const message = `✅ ${result.message}. Page will refresh to show your clips.`;
      
      if (window.alert) {
        alert(message);
      } else {
        console.log(message);
      }
      
      // Refresh page after short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } else {
      // Error notification with helpful guidance
      const message = `⚠️ Clip recovery failed: ${result.message}. Your videos are safe in our database. Try refreshing the page or contact support if the issue persists.`;
      
      if (window.alert) {
        alert(message);
      } else {
        console.error(message);
      }
    }
  }

  /**
   * Automatic recovery with user notification
   */
  async autoRecover(sessionId: string, jobId?: string): Promise<void> {
    try {
      console.log('🤖 Starting automatic recovery...');
      
      const result = await this.attemptRecovery(sessionId, jobId);
      
      if (result.success) {
        console.log('✅ Automatic recovery successful');
        // Don't show alert for automatic recovery, just refresh
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        console.warn('⚠️ Automatic recovery failed, user intervention may be needed');
        // Don't alert automatically, let user trigger manual recovery
      }
      
    } catch (error) {
      console.error('❌ Automatic recovery failed:', error);
    }
  }

  /**
   * Manual recovery with user feedback
   */
  async manualRecover(sessionId: string, jobId?: string): Promise<void> {
    try {
      console.log('👤 Starting manual recovery...');
      
      const result = await this.attemptRecovery(sessionId, jobId);
      this.showRecoveryNotification(result);
      
    } catch (error) {
      console.error('❌ Manual recovery failed:', error);
      this.showRecoveryNotification({
        success: false,
        message: 'Recovery failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Health check for video clips
   */
  healthCheck(session: any): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check if session exists
    if (!session) {
      issues.push('Session not found');
      return { healthy: false, issues };
    }
    
    // Check video processing status
    if (session.video_processing_status === 'failed') {
      issues.push('Video processing failed');
    }
    
    // Check clip data
    const clips = session.session_data?.video_clips || [];
    const validation = cacheManager.validateClipData(clips);
    
    if (!validation.isValid) {
      issues.push(...validation.issues);
    }
    
    // Check for video URLs
    if (clips.length > 0) {
      const clipsWithUrls = clips.filter((clip: any) => 
        clip && (clip.videoUrl || clip.url || clip.downloadUrl)
      );
      
      if (clipsWithUrls.length === 0) {
        issues.push('No clips have video URLs');
      } else if (clipsWithUrls.length < clips.length) {
        issues.push(`${clips.length - clipsWithUrls.length} clips missing video URLs`);
      }
    }
    
    const healthy = issues.length === 0;
    
    console.log(`🏥 Health check result: ${healthy ? 'HEALTHY' : 'NEEDS_ATTENTION'}`, {
      healthy,
      issues,
      clipsCount: clips.length
    });
    
    return { healthy, issues };
  }

  /**
   * Initialize recovery service for a session
   */
  initialize(sessionId: string): void {
    console.log(`🚀 Initializing video recovery service for session ${sessionId}`);
    
    // Initialize cache management
    cacheManager.initializeSessionCache(sessionId);
    
    // Set up periodic health checks
    const healthCheckInterval = setInterval(() => {
      // Periodic health checks can be added here if needed
      // For now, we rely on component-level detection
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(healthCheckInterval);
    });
  }
}

// Export singleton instance
export const videoRecoveryService = VideoRecoveryService.getInstance();