import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

// AI Processing Types - Core types for video clip generation
interface Clip {
  id: string;
  sessionId: string;
  title: string;
  duration: number;
  aspectRatio: '9:16';
  quality: '1080p';
  videoUrl: string;
  thumbnailUrl: string;
  viralityScore: number;
  viralityReasoning: string;
  transcript: string;
  eventName: string;
  speakerName: string;
  suggestedCaption: string;
  suggestedHashtags: string[];
  status: 'processing' | 'ready' | 'published' | 'failed';
  createdAt: string;
  processedAt?: string;
}

interface ProcessingJob {
  id: string;
  sessionId: string;
  videoUrl: string;
  eventName: string;
  speakerName: string;
  language: string;
  preferredDurations: number[];
  maxClips: number;
  minViralityScore: number;
  webhookUrl?: string;
}

interface ProcessingResult {
  jobId: string;
  sessionId: string;
  status: 'processing' | 'completed' | 'failed';
  clips: Clip[];
  error?: string;
  metadata?: Record<string, unknown>;
}

interface AIProvider {
  name: string;
  version: string;
  submitJob(job: ProcessingJob): Promise<{ jobId: string; estimatedCompletionTime?: number }>;
  getJobStatus(jobId: string): Promise<ProcessingResult>;
  getClips(jobId: string): Promise<Clip[]>;
  healthCheck(): Promise<boolean>;
}

// Add these interfaces after the existing interfaces and before the VizardAdapter class

interface VizardClip {
  id: string;
  title?: string;
  suggestedTitle?: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  viralityScore?: number;
  transcript?: string;
  suggestedDescription?: string;
  description?: string;
  suggestedHashtags?: string[];
  keywords?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface VizardJobStatusResponse {
  success: boolean;
  error?: { message: string };
  data: {
    projectId: string;
    status: string;
    clips?: VizardClip[];
    metadata?: Record<string, unknown>;
  };
}

// Vizard AI Adapter Implementation
class VizardAdapter implements AIProvider {
  public readonly name = 'vizard';
  public readonly version = '1.0';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://elb-api.vizard.ai';
  }

  async submitJob(job: ProcessingJob): Promise<{ jobId: string; estimatedCompletionTime?: number }> {
    try {
      const vizardRequest = {
        lang: job.language,
        preferLength: this.mapDurationsToVizardFormat(job.preferredDurations),
        videoUrl: job.videoUrl,
        videoType: this.detectVideoType(job.videoUrl),
        ext: this.extractFileExtension(job.videoUrl),
        projectName: `${job.eventName} - ${job.speakerName}`,
        description: `Auto-generated clips from ${job.eventName}`,
        webhookUrl: job.webhookUrl
      };

      const response = await fetch(`${this.baseUrl}/hvizard-server-front/open-api/v1/project/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'VIZARDAI_API_KEY': this.apiKey
        },
        body: JSON.stringify(vizardRequest)
      });

      if (!response.ok) {
        throw new Error(`Vizard API error: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(`Vizard API error: ${result.error?.message || 'Unknown error'}`);
      }

      return {
        jobId: result.data.projectId,
        estimatedCompletionTime: result.data.estimatedCompletionTime
      };
    } catch (error) {
      console.error('Vizard submitJob error:', error);
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<ProcessingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/hvizard-server-front/open-api/v1/project/status/${jobId}`, {
        headers: {
          'VIZARDAI_API_KEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Vizard status check failed: ${response.status}`);
      }

      const result = await response.json() as VizardJobStatusResponse;
      if (!result.success) {
        throw new Error(`Vizard status error: ${result.error?.message || 'Unknown error'}`);
      }

      return {
        jobId: result.data.projectId,
        sessionId: '', // Will be mapped from our tracking
        status: this.mapVizardStatusToInternal(result.data.status),
        clips: result.data.clips ? result.data.clips.map((clip) => this.transformVizardClipToInternal(clip)) : [],
        metadata: result.data.metadata
      };
    } catch (error) {
      console.error('Vizard getJobStatus error:', error);
      throw error;
    }
  }

  async getClips(jobId: string): Promise<Clip[]> {
    const result = await this.getJobStatus(jobId);
    return result.clips.filter(clip => clip.viralityScore >= 66);
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple ping to check if API is available
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'VIZARDAI_API_KEY': this.apiKey }
      });
      return response.status < 500;
    } catch {
      return false;
    }
  }

  private mapDurationsToVizardFormat(durations: number[]): number[] {
    const vizardLengths: number[] = [];
    for (const duration of durations) {
      if (duration <= 30) vizardLengths.push(1);
      else if (duration <= 60) vizardLengths.push(2);
      else if (duration <= 90) vizardLengths.push(3);
      else vizardLengths.push(4);
    }
    return Array.from(new Set(vizardLengths));
  }

  private detectVideoType(videoUrl: string): number {
    const url = videoUrl.toLowerCase();
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 2;
    if (url.includes('drive.google.com')) return 3;
    if (url.includes('vimeo.com')) return 4;
    return 1; // Remote file
  }

  private extractFileExtension(videoUrl: string): string | undefined {
    if (this.detectVideoType(videoUrl) !== 1) return undefined;
    const match = videoUrl.match(/\.([^.?#]+)(?:\?|#|$)/);
    return match ? match[1] : 'mp4';
  }

  private mapVizardStatusToInternal(status: string): 'processing' | 'completed' | 'failed' {
    switch (status) {
      case 'processing': return 'processing';
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      default: return 'processing';
    }
  }

  private transformVizardClipToInternal(vizardClip: VizardClip): Clip {
    return {
      id: vizardClip.id || `clip_${Date.now()}`,
      sessionId: '',
      title: vizardClip.title || vizardClip.suggestedTitle || 'Untitled Clip',
      duration: vizardClip.duration || 30,
      aspectRatio: '9:16',
      quality: '1080p',
      videoUrl: vizardClip.videoUrl || '',
      thumbnailUrl: vizardClip.thumbnailUrl || '',
      viralityScore: vizardClip.viralityScore || this.estimateViralityScore(vizardClip),
      viralityReasoning: this.generateViralityReasoning(vizardClip),
      transcript: vizardClip.transcript || '',
      eventName: '',
      speakerName: '',
      suggestedCaption: vizardClip.suggestedDescription || vizardClip.description || '',
      suggestedHashtags: vizardClip.suggestedHashtags || vizardClip.keywords || [],
      status: 'ready',
      createdAt: vizardClip.createdAt || new Date().toISOString(),
      processedAt: vizardClip.updatedAt
    };
  }

  private estimateViralityScore(clip: VizardClip): number {
    let score = 50;
    if (clip.duration && clip.duration >= 30 && clip.duration <= 60) score += 20;
    if (clip.keywords && clip.keywords.length > 3) score += 15;
    if (clip.transcript && clip.transcript.length > 100) score += 15;
    return Math.min(score, 100);
  }

  private generateViralityReasoning(clip: VizardClip): string {
    const reasons: string[] = [];
    if (clip.duration && clip.duration >= 30 && clip.duration <= 60) {
      reasons.push('Optimal duration for social media engagement');
    }
    if (clip.keywords && clip.keywords.length > 0) {
      reasons.push(`Contains trending keywords: ${clip.keywords.slice(0, 3).join(', ')}`);
    }
    return reasons.length > 0 ? reasons.join('. ') : 'AI-detected viral potential based on content analysis';
  }
}

// AI Adapter Factory
class AIAdapterFactory {
  private static currentProvider: AIProvider | null = null;

  static getAdapter(): AIProvider {
    if (!this.currentProvider) {
      const vizardApiKey = Deno.env.get('VIZARD_API_KEY');
      if (!vizardApiKey) {
        throw new Error('VIZARD_API_KEY environment variable not set');
      }
      this.currentProvider = new VizardAdapter(vizardApiKey);
    }
    return this.currentProvider;
  }

  static async switchProvider(provider: 'vizard' | 'runway' | 'openai'): Promise<boolean> {
    try {
      switch (provider) {
        case 'vizard': {
          const vizardKey = Deno.env.get('VIZARD_API_KEY');
          if (!vizardKey) throw new Error('VIZARD_API_KEY not configured');
          this.currentProvider = new VizardAdapter(vizardKey);
          break;
        }
        default:
          throw new Error(`Provider ${provider} not yet implemented`);
      }
      
      const isHealthy = await this.currentProvider.healthCheck();
      if (!isHealthy) {
        throw new Error(`Provider ${provider} health check failed`);
      }
      
      console.log(`✅ Successfully switched to AI provider: ${provider}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to switch to provider ${provider}:`, error);
      return false;
    }
  }
}

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://localhost:8088',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8088',
  'https://diff-pod-mvp.vercel.app',
  'https://diff-pod-4hadk414b-diffused.vercel.app',
];

serve(async (req) => {
  // Enhanced request logging for debugging
  console.log('🔍 Incoming Request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.get('Origin'),
    userAgent: req.headers.get('User-Agent'),
    contentType: req.headers.get('Content-Type')
  });

  const origin = req.headers.get('Origin');
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }

  // Add request validation
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('🔍 Environment Check:');
    console.log('- OPENAI_API_KEY:', openaiApiKey ? '✅ Set' : '❌ Missing');
    console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('- SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
    
    // Check for VIZARD_API_KEY as well if video processing is requested
    const vizardApiKey = Deno.env.get('VIZARD_API_KEY');
    
    if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Critical environment variables missing');
    }
    
    console.log('- VIZARD_API_KEY:', vizardApiKey ? '✅ Set' : '❌ Missing (video processing will be disabled)');

    // Enhanced request body parsing with validation
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('❌ Request body parsing failed:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { sessionId, filePath, fileMimeType, textContent, youtubeUrl, videoUrl, processVideo } = requestBody;

    // Validate required sessionId
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    console.log('✅ Request validation passed:', {
      sessionId,
      hasFilePath: !!filePath,
      hasTextContent: !!textContent,
      hasYoutubeUrl: !!youtubeUrl,
      hasVideoUrl: !!videoUrl,
      processVideo: !!processVideo
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test database connection
    const { error: connectionTest } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('id', sessionId)
      .limit(1);

    if (connectionTest) {
      console.error('❌ Database connection failed:', connectionTest);
      throw new Error(`Database connection failed: ${connectionTest.message}`);
    }

    console.log('✅ Database connection verified');
    console.log('==== SMART PIPELINE PROCESSING START ====');

    // Update session status to processing
    await supabase
      .from('user_sessions')
      .update({ processing_status: 'processing' })
      .eq('id', sessionId);

    let extractedText = '';
    let processingMethod = 'unknown';
    let contentType = 'text';
    const videoClips: Clip[] = [];
    let videoProcessingJobId: string | null = null;

    // NEW: Video processing with AI adapter system
    if (processVideo && (videoUrl || filePath)) {
      console.log('🎬 Processing video for AI clips...');
      
      // Construct proper video URL for Vizard
      let fullVideoUrl = videoUrl;
      if (!fullVideoUrl && filePath) {
        // Convert Supabase storage path to public URL
        const publicUrlResponse = supabase.storage
          .from('session-uploads')
          .getPublicUrl(filePath);
        fullVideoUrl = publicUrlResponse.data.publicUrl;
      }
      
      console.log('🔗 Video URL for processing:', fullVideoUrl);
      
      try {
        const aiAdapter = AIAdapterFactory.getAdapter();
        
        // Get session details for context
        const { data: sessionData } = await supabase
          .from('user_sessions')
          .select('*, events(*), speaker_microsites(*)')
          .eq('id', sessionId)
          .single();

        const processingJob: ProcessingJob = {
          id: `job_${sessionId}_${Date.now()}`,
          sessionId: sessionId,
          videoUrl: fullVideoUrl,
          eventName: sessionData?.events?.name || 'Unknown Event',
          speakerName: sessionData?.speaker_microsites?.name || 'Unknown Speaker',
          language: 'en',
          preferredDurations: [30, 60, 90], // Generate clips of various lengths
          maxClips: 10,
          minViralityScore: 66,
          webhookUrl: `${supabaseUrl.replace('/supabase', '')}/functions/v1/video-processing-webhook`
        };

        const submission = await aiAdapter.submitJob(processingJob);
        videoProcessingJobId = submission.jobId;
        
        console.log(`✅ Video processing job submitted: ${videoProcessingJobId}`);
        console.log(`⏱️ Estimated completion: ${submission.estimatedCompletionTime} minutes`);

        // For now, we'll just record the job ID and process asynchronously
        // In a real implementation, you might want to poll for results or use webhooks
        await supabase
          .from('user_sessions')
          .update({ 
            video_processing_job_id: videoProcessingJobId,
            video_processing_status: 'submitted'
          })
          .eq('id', sessionId);

        // Set defaults for other processing
        processingMethod = 'video_ai_clipping';
        contentType = 'video';
        extractedText = `Video submitted for AI processing: ${fullVideoUrl}`;
        
      } catch (error) {
        console.error('❌ Video processing failed:', error);
        await supabase
          .from('user_sessions')
          .update({ 
            video_processing_status: 'failed',
            video_processing_error: error.message
          })
          .eq('id', sessionId);
        
        // Continue with other processing methods
        throw new Error(`Video processing failed: ${error.message}`);
      }
    } else if (processVideo) {
      console.warn('⚠️ Video processing requested but no video URL or file path provided');
    }
    // Existing processing logic continues...
    else if (textContent) {
      // Direct text input
      console.log('📝 Processing direct text content...');
      extractedText = textContent;
      contentType = 'text';
      processingMethod = 'direct_text';
    } else if (youtubeUrl) {
      // YouTube link processing
      console.log('🎥 Processing YouTube URL...');
      extractedText = await processYouTubeLink(youtubeUrl);
      contentType = 'youtube';
      processingMethod = 'youtube_whisper_transcription';
    } else if (filePath) {
      console.log('📄 Processing uploaded file...', { filePath, fileMimeType });
      
      console.log('➡️ Attempting to download file from Supabase Storage:', filePath);
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('session-uploads')
        .download(filePath);
      
      if (downloadError) {
        console.error('🔴 File download error:', downloadError);
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }
      console.log('✅ File downloaded successfully.');

      const fileBuffer = await fileData.arrayBuffer();
      console.log('File downloaded, size:', fileBuffer.byteLength);

      // Smart file type detection and processing
      if (isAudioFile(fileMimeType, filePath)) {
        // Audio files: MP3, WAV, M4A, etc.
        console.log('🎵 Processing audio file with Whisper...');
        extractedText = await processAudioWithWhisper(fileBuffer, filePath);
        contentType = 'audio';
        processingMethod = 'whisper_transcription';
      } else if (isPDFFile(fileMimeType, filePath)) {
        // PDF files: Use OpenAI Vision API for robust extraction
        console.log('📄 Processing PDF with OpenAI Vision API...');
        extractedText = await processPDFWithVision(fileBuffer, filePath);
        contentType = 'pdf';
        processingMethod = 'openai_vision_ocr';
      } else if (isTextFile(fileMimeType, filePath)) {
        // Text files: Direct reading
        console.log('📝 Processing text file...');
        extractedText = new TextDecoder().decode(fileBuffer);
        contentType = 'text';
        processingMethod = 'text_file_direct';
      } else {
        throw new Error(`Unsupported file type: ${fileMimeType || 'unknown'}`);
      }
    } else {
      throw new Error('No content, file, YouTube URL, or video URL provided for processing');
    }

    console.log(`✅ Text extraction complete: ${extractedText.length} characters`);
    console.log('Preview:', extractedText.slice(0, 200));

    // Only validate text content if we're not doing video processing
    if (!processVideo && (!extractedText || extractedText.trim().length < 50)) {
      throw new Error('Could not extract meaningful content. Please ensure the file contains readable text or audio.');
    }

    // Process with OpenAI for content generation (skip if only doing video processing)
    let enhancedContent: Record<string, unknown> | null = null;
    if (!processVideo || extractedText.length > 50) {
      console.log('🤖 Generating content with OpenAI...');
      enhancedContent = await generateContentWithOpenAI(extractedText);
    }

    // Generate podcast audio with ElevenLabs if available
    let podcastUrl: string | null = null;
    if (elevenlabsApiKey && enhancedContent && enhancedContent.podcastScript) {
      console.log('🎙️ Generating podcast audio with ElevenLabs...');
      try {
        podcastUrl = await generatePodcastAudio(enhancedContent.podcastScript, sessionId, supabase);
        console.log('✅ Podcast audio generated:', podcastUrl);
      } catch (error) {
        console.error('⚠️ Podcast audio generation failed:', error);
        // Continue without audio
      }
    }

    console.log('✅ Content generation complete');

    // Prepare session data
    const sessionDataPayload = {
      extracted_text: extractedText,
      content_length: extractedText.length,
      processing_method: processingMethod,
      content_type: contentType,
      processed_at: new Date().toISOString(),
      blog_content: enhancedContent?.blogContent,
      social_posts: enhancedContent?.socialPosts,
      key_quotes: enhancedContent?.keyQuotes,
      ai_title: enhancedContent?.title,
      ai_summary: enhancedContent?.summary,
      podcast_script: enhancedContent?.podcastScript,
      podcast_url: podcastUrl,
      video_clips: videoClips,
      video_processing_job_id: videoProcessingJobId
    };

    // Update session with processed data
    console.log('➡️ Preparing to update session in database with final data.');
    const updateData: any = {
      processing_status: 'complete',
      session_data: sessionDataPayload,
      generated_summary: enhancedContent?.summary,
      generated_title: enhancedContent?.title,
      podcast_url: podcastUrl
    };

    if (videoProcessingJobId) {
      updateData.video_processing_job_id = videoProcessingJobId;
      updateData.video_processing_status = 'submitted';
    }

    const { error: updateError } = await supabase
      .from('user_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (updateError) {
      console.error('🔴 Final database update error:', updateError);
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    console.log('✅ Session processing complete. Database updated.');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: processVideo ? 'Session and video processing initiated' : 'Session processed successfully with smart pipeline',
        sessionId: sessionId,
        extractedLength: extractedText.length,
        hasEnhancedContent: !!enhancedContent,
        title: enhancedContent?.title,
        processingMethod: processingMethod,
        hasPodcastAudio: !!podcastUrl,
        videoProcessingJobId: videoProcessingJobId,
        hasVideoProcessing: !!videoProcessingJobId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Function execution error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Enhanced error response
    const errorResponse = {
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      details: error.stack ? error.stack.split('\n').slice(0, 5) : []
    };
    
    // Update session status to error
    try {
      const internalSupabase = createClient(supabaseUrl, supabaseServiceKey);
      const body = await req.clone().json().catch(() => ({}));
      if (body.sessionId) {
        await internalSupabase
          .from('user_sessions')
          .update({ 
            processing_status: 'error',
            session_data: {
              processing_error: error.message,
              error_timestamp: new Date().toISOString(),
              error_details: error.stack
            }
          })
          .eq('id', body.sessionId);
      }
    } catch (updateError) {
      console.error('❌ Failed to update session error status:', updateError);
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: error.message.includes('Database') ? 503 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// File type detection helpers
function isAudioFile(mimeType: string | undefined, fileName: string): boolean {
  const audioMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm'];
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.ogg', '.webm', '.flac'];
  
  return audioMimeTypes.includes(mimeType || '') || 
         audioExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

function isPDFFile(mimeType: string | undefined, fileName: string): boolean {
  return mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
}

function isTextFile(mimeType: string | undefined, fileName: string): boolean {
  const textMimeTypes = ['text/plain', 'text/markdown', 'text/csv', 'application/json'];
  const textExtensions = ['.txt', '.md', '.csv', '.json', '.log'];
  
  return mimeType?.startsWith('text/') || 
         textMimeTypes.includes(mimeType || '') ||
         textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

// YouTube processing
async function processYouTubeLink(youtubeUrl: string): Promise<string> {
  console.log('🎥 Processing YouTube URL:', youtubeUrl);
  
  try {
    // Extract video ID from YouTube URL
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Download audio using youtube-dl equivalent API
    const audioBuffer = await downloadYouTubeAudio(videoId);
    
    // Transcribe with Whisper
    return await transcribeAudioWithWhisper(audioBuffer, `youtube_${videoId}.mp3`);
    
  } catch (error) {
    console.error('YouTube processing failed:', error);
    throw new Error(`Failed to process YouTube video: ${error.message}`);
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

async function downloadYouTubeAudio(videoId: string): Promise<ArrayBuffer> {
  // Use a YouTube audio extraction service
  // Note: You may need to use a service like RapidAPI's YouTube MP3 converter
  // or deploy your own youtube-dl service
  
  const response = await fetch(`https://youtube-mp3-download1.p.rapidapi.com/dl?id=${videoId}`, {
    headers: {
      'X-RapidAPI-Key': Deno.env.get('RAPIDAPI_KEY') || '',
      'X-RapidAPI-Host': 'youtube-mp3-download1.p.rapidapi.com'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to download YouTube audio');
  }
  
  return await response.arrayBuffer();
}

// Audio processing with Whisper
async function processAudioWithWhisper(audioBuffer: ArrayBuffer, fileName: string): Promise<string> {
  console.log('🎵 Transcribing audio with Whisper:', fileName);
  return await transcribeAudioWithWhisper(audioBuffer, fileName);
}

async function transcribeAudioWithWhisper(audioBuffer: ArrayBuffer, fileName: string): Promise<string> {
  try {
    // Create form data for Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    formData.append('file', audioBlob, fileName);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', errorText);
      throw new Error(`Whisper transcription failed: ${response.status}`);
    }

    const transcription = await response.text();
    console.log(`✅ Whisper transcription complete: ${transcription.length} characters`);
    
    return transcription.trim();
    
  } catch (error) {
    console.error('Whisper transcription failed:', error);
    throw new Error(`Audio transcription failed: ${error.message}`);
  }
}

// PDF processing with OpenAI Vision API
async function processPDFWithVision(pdfBuffer: ArrayBuffer, fileName: string): Promise<string> {
  console.log('📄 Processing PDF with OpenAI Vision API:', fileName);
  
  try {
    const images = await convertPDFToImages(pdfBuffer);
    let extractedText = '';
    
    for (let i = 0; i < images.length; i++) {
      console.log(`Processing page ${i + 1} of ${images.length}`);
      const pageText = await extractTextFromImageWithVision(images[i]);
      extractedText += pageText + '\n\n';
    }
    
    return extractedText.trim();
    
  } catch (error) {
    console.error('🔴 PDF Vision processing task failed:', error.message);
    // Re-throw the error to be caught by the main handler
    throw new Error(`PDF processing via Vision failed: ${error.message}`);
  }
}

async function convertPDFToImages(pdfBuffer: ArrayBuffer): Promise<string[]> {
  console.log('🔄 Converting PDF to images using pdf2pic service...');
  
  try {
    // Convert ArrayBuffer to base64 for transmission
    const uint8Array = new Uint8Array(pdfBuffer);
    const base64Data = btoa(String.fromCharCode(...uint8Array));
    
    console.log('📤 Sending PDF to processing service...');
    
    // Call the Node.js PDF processing service
    const pdfServiceUrl = Deno.env.get('PDF_SERVICE_URL') || 'http://localhost:3001';
    
    const response = await fetch(`${pdfServiceUrl}/process-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdfBase64: base64Data
      })
    });

    if (!response.ok) {
      throw new Error(`PDF service failed: ${response.status}`);
    }

    const result = await response.json() as { success: boolean; details?: string; totalPages?: number; pages?: Array<{ base64: string }> };
    
    if (!result.success) {
      throw new Error(`PDF processing failed: ${result.details}`);
    }

    console.log(`✅ PDF successfully converted to ${result.totalPages} page images`);
    
    // Extract base64 images from each page
    const pageImages = (result.pages || []).map((page: { base64: string }) => page.base64);
    
    return pageImages;
    
  } catch (error) {
    console.error('❌ PDF to image conversion failed:', error);
    
    // Fallback to original method if service is unavailable
    console.log('🔄 Falling back to basic PDF processing...');
    const uint8Array = new Uint8Array(pdfBuffer);
    const base64Data = btoa(String.fromCharCode(...uint8Array));
    return [base64Data];
  }
}

async function extractTextFromImageWithVision(base64Image: string): Promise<string> {
  console.log('➡️ Sending to OpenAI Vision API for OCR...');
  try {
    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert OCR system. Extract all text content from the provided document accurately. Return only the extracted text, maintaining the original structure and formatting as much as possible.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please extract all text from this document. Return only the text content, no additional commentary.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000
    };
    
    console.log('📦 OpenAI Vision Request Body (omitting image data for logs).');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('🔴 Vision API failed:', { status: response.status, body: errorBody });
      throw new Error(`Vision API failed: ${response.status} - ${errorBody}`);
    }
    
    console.log('✅ Vision API response received successfully.');
    const result = await response.json() as { choices: Array<{ message: { content: string } }> };
    return result.choices[0].message.content.trim();
    
  } catch (error) {
    console.error('🔴 Vision OCR task failed catastrophically:', error);
    throw new Error(`Text extraction from PDF failed: ${error.message}`);
  }
}

// Content generation with OpenAI
async function generateContentWithOpenAI(extractedText: string) {
  console.log('🤖 Generating content with OpenAI...');
  console.log(`Content length: ${extractedText.length} characters`);
  
  // Truncate content if too long
  const maxLength = 12000; // Roughly 3000 tokens
  const processedContent = extractedText.length > maxLength 
    ? extractedText.slice(0, maxLength) + '...' 
    : extractedText;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content creator who transforms source material into engaging, actionable content. Create compelling blog posts, social media content, and podcast scripts that capture the essence of the source material. Always base your content on the actual information provided - never use generic templates or fallback content. Make everything specific, engaging, and authentic.'
        },
        {
          role: 'user',
          content: `Transform this content into comprehensive, engaging materials. Base everything on the actual content provided - DO NOT use generic templates.

SOURCE CONTENT:
${processedContent}

Create:
1. An engaging blog post (800-1200 words) that captures the key insights and value
2. Social media posts for Twitter and LinkedIn that highlight specific insights
3. 5 compelling quotes directly from or inspired by the content
4. A natural 5-minute podcast script that discusses the specific content
5. A catchy title and compelling summary based on the actual material

Make everything specific to this content. Use actual details, concepts, and insights from the source material.

Respond in JSON format:
{
  "title": "specific title based on the actual content",
  "summary": "compelling summary of the actual content and its key insights",
  "blogContent": "engaging 800-1200 word blog post based on actual content with specific details",
  "socialPosts": {
    "twitter": "engaging tweet about the specific content (under 280 chars)",
    "linkedin": "professional LinkedIn post about the specific insights and value"
  },
  "keyQuotes": [
    "powerful quote 1 from or inspired by the content",
    "insightful quote 2 that captures key concepts", 
    "memorable quote 3 about specific insights",
    "thought-provoking quote 4 from the material",
    "inspiring quote 5 that summarizes key value"
  ],
  "podcastScript": "natural, conversational 5-minute podcast script discussing the specific content, insights, and implications"
}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI content generation error:', errorText);
    throw new Error(`Content generation failed: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.log('⚠️ JSON parse failed, extracting manually...');
    return extractContentFromResponse(content);
  }
}

// ElevenLabs podcast audio generation
async function generatePodcastAudio(podcastScript: string, sessionId: string, supabase: { storage: { from: (bucket: string) => { upload: (path: string, data: ArrayBuffer, options: { contentType: string; upsert: boolean }) => Promise<{ data: unknown; error: unknown }>; getPublicUrl: (path: string) => { data: { publicUrl: string } } } } }): Promise<string | null> {
  if (!elevenlabsApiKey) {
    console.log('⚠️ ElevenLabs API key not configured, skipping audio generation');
    return null;
  }

  try {
    console.log('🎙️ Generating podcast audio with ElevenLabs...');
    
    // Use a default voice ID (you can customize this)
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenlabsApiKey
      },
      body: JSON.stringify({
        text: podcastScript,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API failed: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Upload audio to Supabase storage
    const fileName = `podcast_${sessionId}.mp3`;
    const { data, error } = await supabase.storage
      .from('session-uploads')
      .upload(`podcasts/${fileName}`, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (error) {
      throw new Error(`Failed to upload podcast audio: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('session-uploads')
      .getPublicUrl(`podcasts/${fileName}`);

    return publicUrlData.publicUrl;
    
  } catch (error) {
    console.error('Podcast audio generation failed:', error);
    return null;
  }
}

// Helper function to extract content when JSON parsing fails
function extractContentFromResponse(content: string) {
  console.log('📝 Extracting content sections manually...');
  
  const titleMatch = content.match(/(?:"title":\s*"([^"]+)"|Title:\s*(.+?)(?:\n|$))/i);
  const summaryMatch = content.match(/(?:"summary":\s*"([^"]+)"|Summary:\s*(.*?)(?:\n\n|$))/is);
  const blogMatch = content.match(/(?:"blogContent":\s*"([^"]+)"|Blog.*?:\s*(.*?)(?:\n\n|$))/is);
  const twitterMatch = content.match(/(?:"twitter":\s*"([^"]+)"|Twitter:\s*(.*?)(?:\n|$))/i);
  const linkedinMatch = content.match(/(?:"linkedin":\s*"([^"]+)"|LinkedIn:\s*(.*?)(?:\n\n|$))/is);
  const quotesMatch = content.match(/(?:"keyQuotes":\s*\[(.*?)\]|Quotes?:\s*(.*?)(?:\n\n|$))/is);
  const podcastMatch = content.match(/(?:"podcastScript":\s*"([^"]+)"|Podcast.*?:\s*(.*?)(?:\n\n|$))/is);

  return {
    title: (titleMatch?.[1] || titleMatch?.[2] || 'Content Analysis').trim(),
    summary: (summaryMatch?.[1] || summaryMatch?.[2] || 'Analysis of the provided content').trim(),
    blogContent: (blogMatch?.[1] || blogMatch?.[2] || content.slice(0, 1000)).trim(),
    socialPosts: {
      twitter: (twitterMatch?.[1] || twitterMatch?.[2] || 'Sharing insights from our latest content analysis! #Content #Insights').trim(),
      linkedin: (linkedinMatch?.[1] || linkedinMatch?.[2] || 'Excited to share key insights from our recent content analysis.').trim()
    },
    keyQuotes: (quotesMatch?.[1] || quotesMatch?.[2] || '')
      .split(/[,\n]/)
      .map((q: string) => q.trim().replace(/['"]/g, ''))
      .filter((q: string) => q.length > 10)
      .slice(0, 5),
    podcastScript: (podcastMatch?.[1] || podcastMatch?.[2] || 'Welcome to today\'s episode where we explore valuable insights...').trim()
  };
}