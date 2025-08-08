import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * 🔐 SECURE PRESIGNED URL GENERATION FOR MULTIPART UPLOADS
 * 
 * This Edge Function generates presigned URLs for S3 multipart uploads
 * with proper user authentication and security checks.
 * 
 * 🎯 FEATURES:
 * - Session-based authentication
 * - User-scoped uploads via RLS
 * - Configurable part size and concurrency
 * - Performance optimized for 2-3 minute uploads
 */

interface MultipartUploadRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
  sessionId: string;
  partSize?: number; // Optional custom part size
}

interface PresignedUrlResponse {
  uploadId: string;
  partUrls: string[];
  completeUrl: string;
  partSize: number;
  totalParts: number;
  expiresIn: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with request context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: MultipartUploadRequest = await req.json();
    const { fileName, fileSize, contentType, sessionId, partSize } = body;

    // Validate request
    if (!fileName || !fileSize || !contentType || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate optimal part size for performance
    const optimalPartSize = calculateOptimalPartSize(fileSize, partSize);
    const totalParts = Math.ceil(fileSize / optimalPartSize);
    
    console.log(`🚀 Generating presigned URLs for multipart upload:`, {
      fileName,
      fileSize: `${(fileSize / 1024 / 1024).toFixed(1)}MB`,
      optimalPartSize: `${(optimalPartSize / 1024 / 1024).toFixed(1)}MB`,
      totalParts,
      userId: user.id
    });

    // Generate unique upload ID
    const uploadId = `multipart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filePath = `${sessionId}/${uploadId}-${fileName}`;

    // Create Supabase Storage client with session token for secure access
    const { data: session } = await supabaseClient.auth.getSession();
    if (!session.session) {
      throw new Error('No valid session found');
    }

    // Generate presigned URLs for each part
    const partUrls: string[] = [];
    const expiresIn = 7200; // 2 hours

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const partPath = `${filePath}.part.${partNumber}`;
      
      const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
        .from('session-uploads')
        .createSignedUploadUrl(partPath, expiresIn);

      if (signedUrlError || !signedUrlData) {
        throw new Error(`Failed to create presigned URL for part ${partNumber}: ${signedUrlError?.message}`);
      }

      partUrls.push(signedUrlData.signedUrl);
    }

    // Generate completion URL for the final file
    const { data: completeUrlData, error: completeUrlError } = await supabaseClient.storage
      .from('session-uploads')
      .createSignedUploadUrl(filePath, expiresIn);

    if (completeUrlError || !completeUrlData) {
      throw new Error(`Failed to create completion URL: ${completeUrlError?.message}`);
    }

    const response: PresignedUrlResponse = {
      uploadId,
      partUrls,
      completeUrl: completeUrlData.signedUrl,
      partSize: optimalPartSize,
      totalParts,
      expiresIn,
    };

    console.log(`✅ Generated ${totalParts} presigned URLs for multipart upload`);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('❌ Error generating presigned URLs:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

/**
 * Calculate optimal part size for maximum upload performance
 * 
 * 🎯 PERFORMANCE TARGETS:
 * - 2-3 minute uploads for multi-gigabyte files
 * - 6-10 parallel parts for optimal throughput
 * - Minimum 5MB parts (S3 requirement)
 * - Maximum 100MB parts for balance
 */
function calculateOptimalPartSize(fileSize: number, customPartSize?: number): number {
  // If custom part size provided, validate and use it
  if (customPartSize) {
    const minPartSize = 5 * 1024 * 1024; // 5MB minimum
    const maxPartSize = 100 * 1024 * 1024; // 100MB maximum
    return Math.max(minPartSize, Math.min(maxPartSize, customPartSize));
  }

  // Calculate optimal part size based on file size
  const targetPartsCount = 8; // Optimal for most connections
  let optimalPartSize = Math.ceil(fileSize / targetPartsCount);

  // Ensure minimum part size (5MB for S3 compatibility)
  const minPartSize = 5 * 1024 * 1024; // 5MB
  optimalPartSize = Math.max(optimalPartSize, minPartSize);

  // Cap at reasonable maximum for performance
  const maxPartSize = 100 * 1024 * 1024; // 100MB
  optimalPartSize = Math.min(optimalPartSize, maxPartSize);

  // Round to nearest MB for cleaner numbers
  return Math.ceil(optimalPartSize / (1024 * 1024)) * 1024 * 1024;
}