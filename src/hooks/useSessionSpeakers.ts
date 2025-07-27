import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSessionSpeakersReturn {
  speakers: any[];
  speaker: any;
  event: any;
  fetchAllSpeakers: () => Promise<void>;
  setSpeakers: React.Dispatch<React.SetStateAction<any[]>>;
}

export const useSessionSpeakers = (session: any, sessionId: string | undefined): UseSessionSpeakersReturn => {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [speaker, setSpeaker] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);

  const fetchSpeaker = async (speakerId: string) => {
    if (!speakerId) {
      setSpeaker(null);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("speakers")
        .select("id, full_name, email, company, job_title, bio, headshot_url, slug")
        .eq("id", speakerId)
        .single();
      
      if (error) {
        console.error('Error fetching speaker:', error);
        setSpeaker(null);
        return;
      }
      
      setSpeaker(data);
    } catch (error) {
      console.error('Error fetching speaker:', error);
      setSpeaker(null);
    }
  };

  const fetchEvent = async (eventId: string) => {
    if (!eventId) {
      setEvent(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("events")
        .select("subdomain")
        .eq("id", eventId)
        .single();

      if (error) {
        console.error('Error fetching event subdomain:', error);
        setEvent(null);
        return;
      }

      setEvent(data);
    } catch (error) {
      console.error('Error fetching event subdomain:', error);
      setEvent(null);
    }
  };

  const fetchAllSpeakers = async () => {
    if (!session?.event_id || !sessionId) return;
    
    try {
      // APPROACH 1: Try junction table method first (most accurate)
      console.log('Attempting junction table query for session:', sessionId);
      
      const { data: sessionLinks, error: linkError } = await (supabase as any)
        .from('speaker_microsite_sessions')
        .select('microsite_id')
        .eq('session_id', sessionId);

      if (!linkError && sessionLinks && sessionLinks.length > 0) {
        console.log('Found session links:', sessionLinks);
        const micrositeIds = sessionLinks.map(link => link.microsite_id);

        const { data: microsites, error: micrositeError } = await (supabase as any)
          .from('speaker_microsites')
          .select(`
            *,
            speakers (
              id, full_name, email, company, job_title, bio, headshot_url, slug
            ),
            events (
              id, name, subdomain
            )
          `)
          .in('id', micrositeIds);

        if (!micrositeError && microsites && microsites.length > 0) {
          console.log('✅ Successfully fetched speakers from junction table:', microsites);
          setSpeakers(microsites);
          return;
        }
      }

      // APPROACH 2: If no links found, this session has no speakers assigned yet
      console.log('No speaker links found for this session - this is correct for a new session');
      setSpeakers([]);
      
    } catch (error) {
      console.error('❌ fetchAllSpeakers failed completely:', error);
      setSpeakers([]);
    }
  };

  // Fetch speaker data when session loads
  useEffect(() => {
    if (session?.session_data?.speaker_id) {
      fetchSpeaker(session.session_data.speaker_id);
    }
    // Also fetch all speakers for the event
    if (session?.event_id) {
      fetchAllSpeakers();
      fetchEvent(session.event_id);
    }
  }, [session, sessionId]);

  return {
    speakers,
    speaker,
    event,
    fetchAllSpeakers,
    setSpeakers
  };
}; 