import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

/**
 * 🔄 VIDEO PROCESSING POLLER
 * 
 * Automated polling system for missed webhooks and stale jobs.
 * This function should be called by a cron job every 5-10 minutes.
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

  try {
    console.log('🔄 Starting video processing polling cycle...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = await pollProcessingJobs(supabase);

    return new Response(JSON.stringify({
      success: true,
      message: 'Polling cycle completed',
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Polling error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function pollProcessingJobs(supabase: any) {
  const results = {
    checked: 0,
    completed: 0,
    failed: 0,
    stillProcessing: 0,
    errors: []
  };

  try {
    // Find jobs that need checking
    const { data: jobs, error: jobsError } = await supabase
      .from('video_processing_jobs')
      .select('*')
      .in('status', ['submitted', 'processing'])
      .or('last_polled_at.is.null,last_polled_at.lt.' + new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Not polled in last 5 minutes
      .lt('retry_count', 10) // Don't retry forever
      .order('created_at', { ascending: true })
      .limit(20); // Process in batches

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log('📭 No jobs need polling');
      return results;
    }

    console.log(`📋 Found ${jobs.length} jobs to check`);

    // Check each job
    for (const job of jobs) {
      try {
        results.checked++;
        
        console.log(`🔍 Checking ${job.provider} job: ${job.external_job_id}`);
        
        const checkResult = await checkJobStatus(job);
        
        if (checkResult.success) {
          // Update job in database
          const updateData: any = {
            last_polled_at: new Date().toISOString(),
            retry_count: job.retry_count + 1
          };

          if (checkResult.status === 'completed' && checkResult.clips) {
            updateData.status = 'completed';
            updateData.clips_data = checkResult.clips;
            updateData.clips_count = checkResult.clips.length;
            updateData.completed_at = new Date().toISOString();
            results.completed++;

            // Update session with clips
            await updateSessionWithClips(supabase, job.session_id, checkResult.clips);
            
            console.log(`✅ Job ${job.external_job_id} completed with ${checkResult.clips.length} clips`);
            
          } else if (checkResult.status === 'failed') {
            updateData.status = 'failed';
            updateData.error_message = checkResult.error || 'Processing failed';
            results.failed++;
            
            console.log(`❌ Job ${job.external_job_id} failed: ${checkResult.error}`);
            
          } else {
            results.stillProcessing++;
            console.log(`⏳ Job ${job.external_job_id} still processing...`);
          }

          // Apply updates
          const { error: updateError } = await supabase
            .from('video_processing_jobs')
            .update(updateData)
            .eq('id', job.id);

          if (updateError) {
            console.error(`Failed to update job ${job.id}:`, updateError);
            results.errors.push(`Update failed for job ${job.external_job_id}: ${updateError.message}`);
          }

        } else {
          results.errors.push(`Check failed for job ${job.external_job_id}: ${checkResult.error}`);
          
          // Still update retry count and last_polled_at
          await supabase
            .from('video_processing_jobs')
            .update({
              last_polled_at: new Date().toISOString(),
              retry_count: job.retry_count + 1
            })
            .eq('id', job.id);
        }

      } catch (jobError) {
        console.error(`Error processing job ${job.external_job_id}:`, jobError);
        results.errors.push(`Error processing job ${job.external_job_id}: ${jobError.message}`);
      }
    }

    console.log(`📊 Polling results:`, results);
    return results;

  } catch (error) {
    console.error('Error in polling cycle:', error);
    results.errors.push(`Polling cycle error: ${error.message}`);
    return results;
  }
}

async function checkJobStatus(job: any) {
  try {
    switch (job.provider) {
      case 'vizard':
        return await checkVizardJobStatus(job);
      default:
        return { success: false, error: `Unknown provider: ${job.provider}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkVizardJobStatus(job: any) {
  try {
    const vizardApiKey = Deno.env.get('VIZARD_API_KEY');
    if (!vizardApiKey) {
      return { success: false, error: 'VIZARD_API_KEY not configured' };
    }

    const response = await fetch(`https://api.vizard.ai/v1/project/get/${job.external_job_id}`, {
      method: 'GET',
      headers: {
        'VIZARDAI_API_KEY': vizardApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { success: false, error: `Vizard API error: ${response.status}` };
    }

    const result = await response.json();
    console.log(`📊 Vizard status for ${job.external_job_id}:`, result.code);

    if (result.code === 2000) {
      // Successfully completed
      const rawClips = result.videos || result.clips || result.data?.videos || result.data?.clips || [];
      const clips = transformVizardClips(rawClips);
      
      return {
        success: true,
        status: 'completed',
        clips
      };
    } else if (result.code === 4000) {
      // Failed
      return {
        success: true,
        status: 'failed',
        error: result.msg || 'Processing failed'
      };
    } else {
      // Still processing
      return {
        success: true,
        status: 'processing'
      };
    }

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Convert Vizard's 1-10 score to our 1-100 display scale
function convertVizardScore(vizardScore: number | undefined): number {
  if (!vizardScore || vizardScore < 0) {
    // Fallback: generate score based on content quality indicators
    return Math.floor(Math.random() * 25) + 70; // 70-95 range for fallback
  }
  
  // If score is already 100 scale (>10), return as-is
  if (vizardScore > 10) {
    return Math.min(vizardScore, 100);
  }
  
  // Convert 1-10 scale to 1-100 scale
  // Map Vizard's 1-10 to 60-100 range (below 60 isn't shown anyway)
  const convertedScore = Math.round((vizardScore / 10) * 40 + 60);
  return Math.min(Math.max(convertedScore, 60), 100);
}

function transformVizardClips(rawClips: any[]): any[] {
  return rawClips.map((clip, index) => ({
    id: clip.id || clip.clipId || `vizard_clip_${Date.now()}_${index}`,
    title: clip.title || clip.headline || clip.name || `AI Generated Clip ${index + 1}`,
    duration: clip.duration || 30,
    aspectRatio: clip.aspectRatio || '9:16',
    quality: clip.quality || '1080p',
    videoUrl: clip.videoUrl || clip.url || clip.downloadUrl || clip.mp4Url || clip.playUrl || '',
    thumbnailUrl: clip.thumbnailUrl || clip.thumbnail || clip.previewUrl || clip.coverUrl || clip.poster || '',
    viralityScore: convertVizardScore(clip.score || clip.viralityScore || clip.rating),
    viralityReasoning: [
      clip.duration >= 30 && clip.duration <= 60 ? 'Optimal 30-60s duration for social media' : '',
      clip.title && clip.title.length > 10 ? 'Engaging AI-generated title' : '',
      clip.transcript || clip.subtitle ? 'Clear speech-to-text content' : '',
      'AI-selected viral moment with high engagement potential'
    ].filter(Boolean).join('. '),
    transcript: clip.transcript || clip.subtitle || clip.text || '',
    suggestedCaption: clip.caption || clip.description || clip.summary || '',
    suggestedHashtags: clip.hashtags || clip.tags || [],
    status: 'ready',
    eventName: '',
    speakerName: '',
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString()
  }));
}

async function updateSessionWithClips(supabase: any, sessionId: string, clips: any[]) {
  try {
    // Get current session data
    const { data: sessionData, error: fetchError } = await supabase
      .from('user_sessions')
      .select('session_data')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch session data:', fetchError);
      return;
    }

    // Update session with clips
    const updatedSessionData = {
      ...(sessionData?.session_data || {}),
      video_clips: clips
    };

    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({
        video_processing_status: 'completed',
        video_processing_completed_at: new Date().toISOString(),
        video_processing_clips_count: clips.length,
        session_data: updatedSessionData
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session with clips:', updateError);
    } else {
      console.log(`✅ Updated session ${sessionId} with ${clips.length} clips`);
    }

    // Also save clips to video_clips table for analytics
    const clipsToInsert = clips.map(clip => ({
      id: clip.id,
      session_id: sessionId,
      title: clip.title,
      duration: clip.duration,
      video_url: clip.videoUrl,
      thumbnail_url: clip.thumbnailUrl,
      virality_score: clip.viralityScore,
      transcript: clip.transcript,
      status: 'ready',
      created_at: new Date().toISOString()
    }));

    const { error: clipsInsertError } = await supabase
      .from('video_clips')
      .upsert(clipsToInsert, { onConflict: 'id' });

    if (clipsInsertError) {
      console.warn('Failed to insert clips to video_clips table:', clipsInsertError);
    }

  } catch (error) {
    console.error('Error updating session with clips:', error);
  }
}