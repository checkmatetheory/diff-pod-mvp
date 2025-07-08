import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { sessionId, filePath, fileMimeType, textContent, youtubeUrl } = await req.json();

    console.log('==== SMART PIPELINE PROCESSING START ====');
    console.log({ sessionId, filePath, fileMimeType, hasTextContent: !!textContent, youtubeUrl });

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Update session status to processing
    await supabase
      .from('user_sessions')
      .update({ processing_status: 'processing' })
      .eq('id', sessionId);

    let extractedText = '';
    let processingMethod = 'unknown';
    let contentType = 'text';

    // SMART PIPELINE: Detect content type and use optimal extraction method
    if (textContent) {
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
      
      // Download file from Supabase storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('session-uploads')
        .download(filePath);
      
      if (downloadError) {
        console.error('File download error:', downloadError);
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

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
      throw new Error('No content, file, or YouTube URL provided for processing');
    }

    console.log(`✅ Text extraction complete: ${extractedText.length} characters`);
    console.log('Preview:', extractedText.slice(0, 200));

    // Validate extracted content
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error('Could not extract meaningful content. Please ensure the file contains readable text or audio.');
    }

    // Process with OpenAI for content generation
    console.log('🤖 Generating content with OpenAI...');
    const enhancedContent = await generateContentWithOpenAI(extractedText);

    // Generate podcast audio with ElevenLabs if available
    let podcastUrl = null;
    if (elevenlabsApiKey && enhancedContent.podcastScript) {
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
    const sessionData = {
      extracted_text: extractedText,
      content_length: extractedText.length,
      processing_method: processingMethod,
      content_type: contentType,
      processed_at: new Date().toISOString(),
      blog_content: enhancedContent.blogContent,
      social_posts: enhancedContent.socialPosts,
      key_quotes: enhancedContent.keyQuotes,
      ai_title: enhancedContent.title,
      ai_summary: enhancedContent.summary,
      podcast_script: enhancedContent.podcastScript,
      podcast_url: podcastUrl
    };

    // Update session with processed data
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({
        processing_status: 'complete',
        session_data: sessionData,
        generated_summary: enhancedContent.summary,
        generated_title: enhancedContent.title,
        podcast_url: podcastUrl
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    console.log('✅ Session processing complete');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Session processed successfully with smart pipeline',
        sessionId: sessionId,
        extractedLength: extractedText.length,
        hasEnhancedContent: true,
        title: enhancedContent.title,
        processingMethod: processingMethod,
        hasPodcastAudio: !!podcastUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Session processing error:', error);
    
    // Update session status to error
    const body = await req.clone().json().catch(() => ({}));
    if (body.sessionId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from('user_sessions')
        .update({ 
          processing_status: 'error',
          session_data: {
            processing_error: error.message,
            error_timestamp: new Date().toISOString()
          }
        })
        .eq('id', body.sessionId);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Smart pipeline processing failed'
      }),
      { 
        status: 500,
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
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
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
    // Convert PDF to images using PDF-lib or similar
    const images = await convertPDFToImages(pdfBuffer);
    
    let extractedText = '';
    
    // Process each page image with OpenAI Vision
    for (let i = 0; i < images.length; i++) {
      console.log(`Processing page ${i + 1}/${images.length}`);
      const pageText = await extractTextFromImageWithVision(images[i]);
      extractedText += pageText + '\n\n';
    }
    
    return extractedText.trim();
    
  } catch (error) {
    console.error('PDF Vision processing failed:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
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

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`PDF processing failed: ${result.details}`);
    }

    console.log(`✅ PDF successfully converted to ${result.totalPages} page images`);
    
    // Extract base64 images from each page
    const pageImages = result.pages.map((page: any) => page.base64);
    
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
  try {
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
            content: 'You are an expert OCR system. Extract all text content from the provided image accurately. Return only the extracted text, maintaining the original structure and formatting as much as possible.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all text from this image. Return only the text content, no additional commentary.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Vision API failed: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content.trim();
    
  } catch (error) {
    console.error('Vision OCR failed:', error);
    throw new Error(`Text extraction from image failed: ${error.message}`);
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
async function generatePodcastAudio(podcastScript: string, sessionId: string, supabase: any): Promise<string | null> {
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