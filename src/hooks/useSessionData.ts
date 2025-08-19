import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SessionWithData, UseSessionDataReturn } from '@/types/session-types';

export const useSessionData = (sessionId: string | undefined): UseSessionDataReturn => {
  const [session, setSession] = useState<SessionWithData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Clear stale cache on hook initialization
  useEffect(() => {
    const clearStaleCache = () => {
      try {
        // Clear any session-related cache that might be corrupted
        const cacheKeys = Object.keys(localStorage).filter(key => 
          key.includes('session') || 
          key.includes('clip') || 
          key.includes('video')
        );
        
        cacheKeys.forEach(key => {
          try {
            const cached = JSON.parse(localStorage.getItem(key) || '{}');
            const cacheAge = Date.now() - (cached.timestamp || 0);
            
            // Clear cache older than 1 hour or invalid structure
            if (cacheAge > 60 * 60 * 1000 || !cached.timestamp) {
              localStorage.removeItem(key);
              console.log(`🧹 Cleared stale cache: ${key}`);
            }
          } catch {
            // Remove invalid cache entries
            localStorage.removeItem(key);
            console.log(`🧹 Cleared invalid cache: ${key}`);
          }
        });
        
        // Also clear sessionStorage to prevent state conflicts
        const sessionKeys = Object.keys(sessionStorage).filter(key =>
          key.includes('session') || key.includes('clip')
        );
        sessionKeys.forEach(key => sessionStorage.removeItem(key));
        
      } catch (error) {
        console.warn('Cache clearing failed:', error);
      }
    };
    
    clearStaleCache();
  }, []);

  // Validate session data integrity
  const validateSessionData = (sessionData: SessionWithData): boolean => {
    if (!sessionData) return false;
    
    // Check if video_clips data is corrupted
    const clips = sessionData.session_data?.video_clips as any[] || [];
    if (clips.length > 0) {
      const invalidClips = clips.filter(clip => 
        !clip || 
        typeof clip !== 'object' || 
        Object.keys(clip).length === 0 || 
        !clip.id
      );
      
      if (invalidClips.length > 0) {
        console.warn(`🔧 Found ${invalidClips.length} corrupted clips out of ${clips.length}`);
        return false;
      }
    }
    
    return true;
  };

  const refreshSession = async (forceFresh = false): Promise<void> => {
    if (!sessionId) return;
    
    setRefreshing(true);
    try {
      console.log(`🔄 Refreshing session ${sessionId}${forceFresh ? ' (force fresh)' : ''}`);
      
      // Add cache busting for force refresh
      const query = supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId);
        
      // Add timestamp to prevent aggressive caching
      if (forceFresh) {
        console.log('🚫 Force refresh - bypassing any caches');
      }
      
      const { data, error } = await query.single();

      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }

      const sessionData = data as SessionWithData;
      
      // Validate data integrity before setting
      if (!validateSessionData(sessionData)) {
        console.warn('🔧 Session data validation failed, attempting recovery...');
        
        // Try to recover clip data if session exists but clips are corrupted
        if (sessionData.video_processing_job_id) {
          try {
            const { data: recoveryData, error: recoveryError } = await supabase.functions.invoke('vizard-poll', {
              body: { 
                sessionId: sessionId, 
                jobId: sessionData.video_processing_job_id 
              }
            });
            
            if (!recoveryError && recoveryData?.status === 'completed') {
              console.log('✅ Clip recovery successful, refreshing again...');
              // Recursive call to get updated data
              setTimeout(() => refreshSession(true), 1500);
              return;
            }
          } catch (recoveryError) {
            console.error('❌ Clip recovery failed:', recoveryError);
          }
        }
      }

      setSession(sessionData);
      console.log('✅ Session refreshed successfully');
      
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSession = async (id: string): Promise<void> => {
    try {
      console.log(`📡 Fetching session ${id}`);
      
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const sessionData = data as SessionWithData;
      
      // Validate data on initial fetch
      if (!validateSessionData(sessionData)) {
        console.warn('🔧 Initial session data validation failed');
        
        // For initial load, we'll still set the session but mark it for recovery
        setSession(sessionData);
        
        // Attempt recovery in background if there's a job ID
        if (sessionData.video_processing_job_id) {
          console.log('🔄 Attempting background clip recovery...');
          setTimeout(() => refreshSession(true), 2000);
        }
      } else {
        setSession(sessionData);
        console.log('✅ Session fetched and validated successfully');
      }
      
    } catch (error) {
      console.error('Error fetching session:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  // Return proper typed values, with defaults for null session
  return {
    session,
    loading,
    refreshing,
    refreshSession: () => refreshSession(true) // Always force fresh on manual refresh
  };
};