import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

/**
 * 🔧 FIX SESSION CLIPS
 * 
 * This function manually connects a session to an existing Vizard project
 * and retrieves the clips. Use this when the automatic flow didn't work.
 */

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
    const { sessionId, vizardProjectId } = await req.json();
    
    if (!sessionId || !vizardProjectId) {
      throw new Error('sessionId and vizardProjectId are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vizardApiKey = Deno.env.get('VIZARD_API_KEY')!;

    if (!vizardApiKey) {
      throw new Error('VIZARD_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🔧 Fixing session ${sessionId} with Vizard project ${vizardProjectId}`);

    // First, update the session with the correct job ID
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({
        video_processing_job_id: vizardProjectId,
        video_processing_status: 'submitted'
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('❌ Failed to update session:', updateError);
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    console.log('✅ Updated session with Vizard project ID');

    // Now check Vizard for clips
    console.log(`🔍 Checking Vizard project: ${vizardProjectId}`);
    const response = await fetch(`https://elb-api.vizard.ai/hvizard-server-front/open-api/v1/project/query/${vizardProjectId}`, {
      headers: {
        'VIZARDAI_API_KEY': vizardApiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Vizard API failed ${response.status}:`, errorText);
      throw new Error(`Vizard API failed ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('📊 Vizard response:', JSON.stringify(result, null, 2));

    if (result.code === 2000) {
      // Successfully got clips
      const videos = result.videos || result.clips || result.data?.videos || result.data?.clips || [];
      console.log(`🎬 Found ${videos.length} videos in Vizard`);

      const clips = videos.map((video: any) => ({
        id: video.id || video.clipId || `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: video.title || video.headline || video.name || 'AI Generated Clip',
        duration: video.duration || 30,
        aspectRatio: '9:16',
        quality: '1080p',
        videoUrl: video.videoUrl || video.url || video.downloadUrl || video.mp4Url || video.playUrl || '',
        thumbnailUrl: video.thumbnailUrl || video.thumbnail || video.previewUrl || video.coverUrl || video.poster || '',
        viralityScore: video.score || video.viralityScore || Math.min(70 + ((video.duration || 30) >= 30 && (video.duration || 30) <= 60 ? 15 : 5), 100),
        viralityReasoning: [
          (video.duration || 30) >= 30 && (video.duration || 30) <= 60 ? 'Optimal 30-60s duration for social media' : '',
          video.title && video.title.length > 10 ? 'Engaging AI-generated title' : '',
          video.transcript || video.subtitle ? 'Clear speech-to-text content' : '',
          'AI-selected viral moment'
        ].filter(Boolean).join('. '),
        transcript: video.transcript || video.subtitle || video.text || '',
        eventName: '',
        speakerName: '',
        suggestedCaption: video.caption || video.description || video.summary || '',
        suggestedHashtags: video.hashtags || video.tags || [],
        status: 'ready',
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      }));

      // Get current session data
      const { data: sessionData } = await supabase
        .from('user_sessions')
        .select('session_data')
        .eq('id', sessionId)
        .single();

      // Update session with clips
      const updatedSessionData = {
        ...(sessionData?.session_data || {}),
        video_clips: clips
      };

      const { error: clipsUpdateError } = await supabase
        .from('user_sessions')
        .update({
          video_processing_status: 'completed',
          session_data: updatedSessionData
        })
        .eq('id', sessionId);

      if (clipsUpdateError) {
        console.error('❌ Failed to save clips:', clipsUpdateError);
        throw new Error(`Failed to save clips: ${clipsUpdateError.message}`);
      }

      // Also try to save to video_clips table
      for (const clip of clips) {
        const clipData = {
          session_id: sessionId,
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

        await supabase
          .from('video_clips')
          .upsert(clipData, { onConflict: 'clip_id' })
          .catch((error) => {
            console.log('ℹ️ Video_clips table insert failed (table may not exist):', error.message);
          });
      }

      console.log(`✅ Successfully saved ${clips.length} clips to session ${sessionId}`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Successfully connected session to Vizard project and saved ${clips.length} clips`,
        clipsCount: clips.length,
        clips: clips.map(c => ({ id: c.id, title: c.title, videoUrl: c.videoUrl }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (result.code === 1000) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Vizard project is still processing',
        status: 'processing'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      throw new Error(`Vizard project error: ${result.msg || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Fix session clips error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});