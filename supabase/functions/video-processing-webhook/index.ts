import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

/**
 * 🎬 VIDEO PROCESSING WEBHOOK
 * 
 * This Edge Function handles callbacks from Vizard AI when video processing
 * completes. It updates the session status and stores the generated clips.
 */

interface VizardWebhookPayload {
  projectId: string;
  status: 'completed' | 'failed';
  clips?: Array<{
    id: string;
    title: string;
    duration: number;
    videoUrl: string;
    thumbnailUrl: string;
    viralityScore: number;
    transcript: string;
    suggestedCaption: string;
    suggestedHashtags: string[];
  }>;
  error?: string;
  metadata?: Record<string, unknown>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: VizardWebhookPayload = await req.json();
    console.log('🎬 Received Vizard webhook:', payload);

    // Find the session by video processing job ID
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('video_processing_job_id', payload.projectId)
      .single();

    if (sessionError || !session) {
      console.error('❌ Session not found for project ID:', payload.projectId);
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Found session:', session.id);

    if (payload.status === 'completed' && payload.clips) {
      console.log(`🎉 Video processing completed with ${payload.clips.length} clips`);
      
      // Update session with completed status and clips
      const updateData = {
        video_processing_status: 'completed',
        processing_status: 'complete',
        session_data: {
          ...session.session_data,
          video_clips: payload.clips,
          video_processing_completed_at: new Date().toISOString(),
          video_processing_metadata: payload.metadata
        }
      };

      const { error: updateError } = await supabase
        .from('user_sessions')
        .update(updateData)
        .eq('id', session.id);

      if (updateError) {
        console.error('❌ Failed to update session:', updateError);
        throw new Error(`Failed to update session: ${updateError.message}`);
      }

      console.log('✅ Session updated with video clips');

      // Store clips in a dedicated clips table if you have one
      // This is optional - clips are also stored in session_data
      for (const clip of payload.clips) {
        const clipData = {
          session_id: session.id,
          clip_id: clip.id,
          title: clip.title,
          duration: clip.duration,
          video_url: clip.videoUrl,
          thumbnail_url: clip.thumbnailUrl,
          virality_score: clip.viralityScore,
          transcript: clip.transcript,
          suggested_caption: clip.suggestedCaption,
          suggested_hashtags: clip.suggestedHashtags,
          status: 'ready',
          created_at: new Date().toISOString()
        };

        // Try to insert clip (table may not exist yet)
        await supabase
          .from('video_clips')
          .insert(clipData)
          .catch((error) => {
            console.log('ℹ️ Clips table not available, storing in session_data only:', error.message);
          });
      }

    } else if (payload.status === 'failed') {
      console.error('❌ Video processing failed:', payload.error);
      
      const updateData = {
        video_processing_status: 'failed',
        processing_status: 'error',
        session_data: {
          ...session.session_data,
          video_processing_error: payload.error,
          video_processing_failed_at: new Date().toISOString()
        }
      };

      const { error: updateError } = await supabase
        .from('user_sessions')
        .update(updateData)
        .eq('id', session.id);

      if (updateError) {
        console.error('❌ Failed to update session with error:', updateError);
        throw new Error(`Failed to update session: ${updateError.message}`);
      }

      console.log('✅ Session updated with failure status');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Webhook processed for session ${session.id}`,
        status: payload.status,
        clipsCount: payload.clips?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});