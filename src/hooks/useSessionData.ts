import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseSessionDataReturn {
  session: any;
  loading: boolean;
  refreshing: boolean;
  refreshSession: () => Promise<void>;
}

export const useSessionData = (sessionId: string | undefined): UseSessionDataReturn => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const refreshSession = async () => {
    if (!sessionId) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      
      setSession(data);
      
      if (data?.processing_status === 'complete') {
        toast({
          title: "Processing complete!",
          description: "Your content has been processed and is ready to view.",
        });
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial session fetch
  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();
        
        if (error) {
          console.error('Error fetching session:', error);
          return;
        }
        
        setSession(data);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  // Auto-refresh when processing
  useEffect(() => {
    if (!session || session.processing_status === 'complete' || session.processing_status === 'error') {
      return;
    }

    const interval = setInterval(() => {
      refreshSession();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [session?.processing_status, sessionId]);

  return {
    session,
    loading,
    refreshing,
    refreshSession
  };
}; 