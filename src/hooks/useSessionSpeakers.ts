import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SessionWithData, SpeakerMicrosite, Speaker, Event, UseSessionSpeakersReturn } from '@/types/session-types';

export const useSessionSpeakers = (session: SessionWithData | null, sessionId: string | undefined): UseSessionSpeakersReturn => {
  const [speakers, setSpeakers] = useState<SpeakerMicrosite[]>([]);
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [event, setEvent] = useState<Event | null>(null);

  const fetchSpeaker = useCallback(async (speakerId: string): Promise<void> => {
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
      
      setSpeaker(data as Speaker);
    } catch (error) {
      console.error('Error fetching speaker:', error);
      setSpeaker(null);
    }
  }, []);

  const fetchEvent = useCallback(async (eventId: string): Promise<void> => {
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

      setEvent(data as Event);
    } catch (error) {
      console.error('Error fetching event subdomain:', error);
      setEvent(null);
    }
  }, []);

  const fetchAllSpeakers = useCallback(async (): Promise<void> => {
    if (!session?.event_id || !sessionId) return;
    
    try {
      // APPROACH 1: Try junction table method first (most accurate)
      console.log('Attempting junction table query for session:', sessionId);
      
      const { data: sessionLinks, error: linkError } = await supabase
        .from('speaker_microsite_sessions')
        .select('microsite_id')
        .eq('session_id', sessionId);

      if (!linkError && sessionLinks && sessionLinks.length > 0) {
        console.log('Found session links:', sessionLinks);
        const micrositeIds = sessionLinks.map(link => link.microsite_id);

        const { data: microsites, error: micrositeError } = await supabase
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
          setSpeakers(microsites as SpeakerMicrosite[]);
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
  }, [session?.event_id, sessionId]);

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
  }, [session, sessionId, fetchSpeaker, fetchEvent, fetchAllSpeakers]);

  return {
    speakers,
    speaker,
    event,
    fetchAllSpeakers,
    setSpeakers
  };
}; 