import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * 🧪 TEST VIZARD CONNECTION
 * 
 * Simple test function to debug Vizard API connection and retrieve clips.
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
    console.log('🧪 Testing Vizard connection...');
    
    const vizardApiKey = Deno.env.get('VIZARD_API_KEY');
    console.log('🔑 API Key available:', vizardApiKey ? 'YES' : 'NO');
    
    if (!vizardApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'VIZARD_API_KEY not found in environment',
        debug: {
          availableEnvVars: Object.keys(Deno.env.toObject()).filter(key => key.includes('VIZARD'))
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test with the known project ID from your Vizard
    const projectId = '22680049';
    console.log(`🎯 Testing project: ${projectId}`);

    const response = await fetch(`https://api.vizard.ai/v1/project/get/${projectId}`, {
      method: 'GET',
      headers: {
        'VIZARDAI_API_KEY': vizardApiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Vizard API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Vizard API error: ${response.status} - ${errorText}`);
      
      return new Response(JSON.stringify({
        success: false,
        error: `Vizard API error: ${response.status}`,
        details: errorText,
        debug: {
          apiKeyLength: vizardApiKey.length,
          projectId: projectId,
          requestUrl: `https://api.vizard.ai/v1/project/get/${projectId}`
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await response.json();
    console.log('📊 Vizard response:', JSON.stringify(result, null, 2));

    // Extract clips from the response
    const rawClips = result.videos || result.clips || result.data?.videos || result.data?.clips || [];
    console.log(`🎬 Found ${rawClips.length} clips`);

    const transformedClips = rawClips.map((clip: any, index: number) => ({
      id: clip.id || clip.clipId || `vizard_clip_${Date.now()}_${index}`,
      title: clip.title || clip.headline || clip.name || `AI Generated Clip ${index + 1}`,
      duration: clip.duration || 30,
      aspectRatio: clip.aspectRatio || '9:16',
      quality: clip.quality || '1080p',
      videoUrl: clip.videoUrl || clip.url || clip.downloadUrl || clip.mp4Url || clip.playUrl || '',
      thumbnailUrl: clip.thumbnailUrl || clip.thumbnail || clip.previewUrl || clip.coverUrl || clip.poster || '',
      viralityScore: clip.score || clip.viralityScore || Math.min(70 + (clip.duration >= 30 && clip.duration <= 60 ? 15 : 5), 100),
      transcript: clip.transcript || clip.subtitle || clip.text || '',
      status: 'ready'
    }));

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully connected to Vizard and found ${rawClips.length} clips`,
      debug: {
        vizardResponse: result,
        rawClipsCount: rawClips.length,
        transformedClips: transformedClips
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Test error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});