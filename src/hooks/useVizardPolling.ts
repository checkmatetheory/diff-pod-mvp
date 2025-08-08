import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseVizardPollingProps {
  sessionId: string | undefined;
  jobId: string | undefined;
  isActive: boolean;
  onComplete: () => void;
}

export const useVizardPolling = ({ sessionId, jobId, isActive, onComplete }: UseVizardPollingProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive || !sessionId || !jobId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log(`🔄 Starting Vizard polling for session ${sessionId}, job ${jobId}`);

    const pollVizard = async () => {
      try {
        console.log('🔍 Polling Vizard status...');
        
        const { data, error } = await supabase.functions.invoke('vizard-poll', {
          body: { sessionId, jobId }
        });

        if (error) {
          console.error('❌ Vizard poll error:', error);
          // Don't stop polling on error, retry next cycle
          return;
        }

        console.log('📊 Vizard poll result:', data);

        if (data.status === 'completed') {
          // Stop polling on successful completion
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          console.log(`✅ Vizard processing completed with ${data.clipsCount || 0} clips. Refreshing session...`);
          
          // Trigger session refresh
          onComplete();
        } else if (data.status === 'failed') {
          // Stop polling on failure
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          console.log(`❌ Vizard processing failed: ${data.error || 'Unknown error'}`);
          
          // Still refresh to show updated status
          onComplete();
        } else {
          console.log(`⏳ Vizard still processing... (${data.message || 'waiting'})`);
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
        // Continue polling even on fetch errors
      }
    };

    // Poll immediately, then every 10 seconds
    pollVizard();
    intervalRef.current = setInterval(pollVizard, 10000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, jobId, isActive, onComplete]);

  return null;
};