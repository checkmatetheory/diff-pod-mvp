import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SessionWithData, UseSessionDataReturn } from '@/types/session-types';

export const useSessionData = (sessionId: string | undefined): UseSessionDataReturn => {
  const [session, setSession] = useState<SessionWithData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshSession = async (): Promise<void> => {
    if (!sessionId) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }

      setSession(data as SessionWithData);
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSession = async (id: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSession(data as SessionWithData);
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
    session: session || {
      id: '',
      user_id: '',
      created_at: null,
      updated_at: null,
      session_name: null,
      processing_status: null,
      generated_summary: null,
      generated_title: null,
      transcript_summary: null,
      session_data: null,
      podcast_url: null,
      audio_duration: null,
      content_type: null,
      event_id: null
    },
    loading,
    refreshing,
    refreshSession
  };
}; 