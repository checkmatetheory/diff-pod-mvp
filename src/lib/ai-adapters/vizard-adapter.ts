// Vizard AI Adapter Implementation
import { 
  AIProvider, 
  ProcessingJob, 
  ProcessingResult, 
  Clip, 
  ProviderConfig,
  ProviderCapabilities 
} from '@/types/ai-processing';
import {
  VizardCreateProjectRequest,
  VizardCreateProjectResponse,
  VizardProjectStatusResponse,
  VizardClip,
  VizardVideoType,
  VizardClipLength,
  VizardConfig,
  VizardError,
  VIZARD_ENDPOINTS
} from '@/types/vizard-api';

export class VizardAdapter implements AIProvider {
  public readonly name = 'vizard';
  public readonly version = '1.0';
  
  private config: VizardConfig;
  
  constructor(config: ProviderConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://elb-api.vizard.ai',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      
      // Vizard-specific defaults
      defaultLanguage: 'en',
      defaultClipLengths: [2, 3], // 30s-90s clips
      maxVideoLength: 600, // minutes
      maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
      supportedFormats: ['mp4', 'mov', 'avi', '3gp'],
      
      ...config.customSettings
    };
  }
  
  async submitJob(job: ProcessingJob): Promise<{ jobId: string; estimatedCompletionTime?: number }> {
    try {
      // Validate job requirements
      this.validateJob(job);
      
      // Transform our internal job format to Vizard's API format
      const vizardRequest: VizardCreateProjectRequest = {
        lang: job.language,
        preferLength: this.mapDurationsToVizardFormat(job.preferredDurations),
        videoUrl: job.videoUrl,
        videoType: this.detectVideoType(job.videoUrl),
        ext: this.extractFileExtension(job.videoUrl),
        projectName: `${job.eventName} - ${job.speakerName}`,
        description: `Auto-generated clips from ${job.eventName}`,
        webhookUrl: job.webhookUrl
      };
      
      // Make API request to Vizard
      const response = await this.makeRequest<VizardCreateProjectResponse>(
        'POST',
        VIZARD_ENDPOINTS.CREATE_PROJECT,
        vizardRequest
      );
      
      if (!response.success) {
        throw new Error(`Vizard API error: ${response.error?.message || 'Unknown error'}`);
      }
      
      return {
        jobId: response.data.projectId,
        estimatedCompletionTime: response.data.estimatedCompletionTime
      };
      
    } catch (error) {
      console.error('Vizard submitJob error:', error);
      throw new Error(`Failed to submit job to Vizard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getJobStatus(jobId: string): Promise<ProcessingResult> {
    try {
      const response = await this.makeRequest<VizardProjectStatusResponse>(
        'GET',
        `${VIZARD_ENDPOINTS.GET_PROJECT_STATUS}/${jobId}`
      );
      
      if (!response.success) {
        throw new Error(`Vizard API error: ${response.error?.message || 'Unknown error'}`);
      }
      
      const { data } = response;
      
      // Transform Vizard response to our internal format
      return {
        jobId: data.projectId,
        sessionId: '', // We'll need to track this mapping separately
        status: this.mapVizardStatusToInternal(data.status),
        clips: data.clips ? data.clips.map(clip => this.transformVizardClipToInternal(clip)) : [],
        processingTimeMs: undefined, // Vizard doesn't provide this
        metadata: data.metadata ? {
          totalDuration: data.metadata.originalVideoLength,
          clipsGenerated: data.metadata.totalClips,
          averageViralityScore: this.calculateAverageViralityScore(data.clips || [])
        } : undefined
      };
      
    } catch (error) {
      console.error('Vizard getJobStatus error:', error);
      throw new Error(`Failed to get job status from Vizard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getClips(jobId: string): Promise<Clip[]> {
    try {
      const response = await this.makeRequest<VizardProjectStatusResponse>(
        'GET',
        `${VIZARD_ENDPOINTS.GET_PROJECT_CLIPS}/${jobId}`
      );
      
      if (!response.success || !response.data.clips) {
        return [];
      }
      
      return response.data.clips
        .map(clip => this.transformVizardClipToInternal(clip))
        .filter(clip => clip.viralityScore >= 66); // Only return high-quality clips
      
    } catch (error) {
      console.error('Vizard getClips error:', error);
      return [];
    }
  }
  
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ success: boolean }>(
        'POST',
        `${VIZARD_ENDPOINTS.CANCEL_PROJECT}/${jobId}`
      );
      
      return response.success;
      
    } catch (error) {
      console.error('Vizard cancelJob error:', error);
      return false;
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - try to make a request with invalid data to test API availability
      await this.makeRequest('GET', '/health', {}, false);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  configure(config: ProviderConfig): void {
    this.config = { ...this.config, ...config };
  }
  
  getCapabilities(): ProviderCapabilities {
    return {
      maxVideoLength: 600, // minutes
      maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
      supportedFormats: ['mp4', 'mov', 'avi', '3gp'],
      supportedLanguages: ['en', 'es', 'pt', 'fr', 'de', 'ru'], // From Vizard docs
      supportedAspectRatios: ['9:16', '16:9', '1:1'],
      maxClipsPerJob: 50,
      averageProcessingTime: 5, // minutes per hour of video
      features: {
        realTimeProcessing: false,
        batchProcessing: true,
        webhookSupport: true,
        customBranding: false,
        advancedAnalytics: true
      }
    };
  }
  
  // Private helper methods
  
  private validateJob(job: ProcessingJob): void {
    if (!job.videoUrl) {
      throw new Error('Video URL is required');
    }
    
    if (!job.language) {
      throw new Error('Language is required');
    }
    
    if (!this.getCapabilities().supportedLanguages.includes(job.language)) {
      throw new Error(`Language ${job.language} is not supported by Vizard`);
    }
  }
  
  private mapDurationsToVizardFormat(durations: number[]): number[] {
    // Map our duration preferences to Vizard's enum values
    const vizardLengths: number[] = [];
    
    for (const duration of durations) {
      if (duration <= 30) vizardLengths.push(VizardClipLength.UNDER_30_SECONDS);
      else if (duration <= 60) vizardLengths.push(VizardClipLength.THIRTY_TO_60_SECONDS);
      else if (duration <= 90) vizardLengths.push(VizardClipLength.SIXTY_TO_90_SECONDS);
      else vizardLengths.push(VizardClipLength.NINETY_SECONDS_TO_3_MINUTES);
    }
    
    return Array.from(new Set(vizardLengths)); // Remove duplicates
  }
  
  private detectVideoType(videoUrl: string): VizardVideoType {
    const url = videoUrl.toLowerCase();
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return VizardVideoType.YOUTUBE;
    }
    if (url.includes('drive.google.com')) {
      return VizardVideoType.GOOGLE_DRIVE;
    }
    if (url.includes('vimeo.com')) {
      return VizardVideoType.VIMEO;
    }
    if (url.includes('streamyard.com')) {
      return VizardVideoType.STREAMYARD;
    }
    if (url.includes('tiktok.com')) {
      return VizardVideoType.TIKTOK;
    }
    if (url.includes('twitter.com') || url.includes('x.com')) {
      return VizardVideoType.TWITTER;
    }
    
    // Default to remote file
    return VizardVideoType.REMOTE_FILE;
  }
  
  private extractFileExtension(videoUrl: string): string | undefined {
    if (this.detectVideoType(videoUrl) !== VizardVideoType.REMOTE_FILE) {
      return undefined;
    }
    
    const match = videoUrl.match(/\.([^.?#]+)(?:\?|#|$)/);
    return match ? match[1] : 'mp4'; // Default to mp4
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
      id: vizardClip.id,
      sessionId: '', // We'll need to map this from job tracking
      
      // Video Properties
      title: vizardClip.title || vizardClip.suggestedTitle || 'Untitled Clip',
      duration: vizardClip.duration,
      aspectRatio: '9:16', // Force vertical for our use case
      quality: '1080p',
      
      // File URLs
      videoUrl: vizardClip.videoUrl,
      thumbnailUrl: vizardClip.thumbnailUrl,
      
      // AI Analysis
      viralityScore: vizardClip.viralityScore || this.estimateViralityScore(vizardClip),
      viralityReasoning: this.generateViralityReasoning(vizardClip),
      transcript: vizardClip.transcript,
      
      // Content Metadata (we'll need to inject these from job context)
      eventName: '',
      speakerName: '',
      
      // Publishing
      suggestedCaption: vizardClip.suggestedDescription || vizardClip.description || '',
      suggestedHashtags: vizardClip.suggestedHashtags || vizardClip.keywords || [],
      
      // Workflow State
      status: 'ready',
      
      // Timestamps
      createdAt: vizardClip.createdAt,
      processedAt: vizardClip.updatedAt
    };
  }
  
  private estimateViralityScore(clip: VizardClip): number {
    // Simple heuristic based on clip properties
    let score = 50; // Base score
    
    // Duration scoring (30-60s is optimal)
    if (clip.duration >= 30 && clip.duration <= 60) score += 20;
    else if (clip.duration >= 15 && clip.duration <= 90) score += 10;
    
    // Keyword density
    if (clip.keywords && clip.keywords.length > 3) score += 15;
    
    // Transcript quality
    if (clip.transcript && clip.transcript.length > 100) score += 15;
    
    return Math.min(score, 100);
  }
  
  private generateViralityReasoning(clip: VizardClip): string {
    const reasons: string[] = [];
    
    if (clip.duration >= 30 && clip.duration <= 60) {
      reasons.push('Optimal duration for social media engagement');
    }
    
    if (clip.keywords && clip.keywords.length > 0) {
      reasons.push(`Contains trending keywords: ${clip.keywords.slice(0, 3).join(', ')}`);
    }
    
    if (clip.highlights && clip.highlights.length > 0) {
      reasons.push(`Key moments: ${clip.highlights[0]}`);
    }
    
    return reasons.length > 0 ? reasons.join('. ') : 'AI-detected viral potential based on content analysis';
  }
  
  private calculateAverageViralityScore(clips: VizardClip[]): number {
    if (clips.length === 0) return 0;
    
    const scores = clips.map(clip => clip.viralityScore || this.estimateViralityScore(clip));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
  
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    requireAuth: boolean = true
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (requireAuth) {
      headers['VIZARDAI_API_KEY'] = this.config.apiKey;
    }
    
    const requestConfig: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.timeout)
    };
    
    if (data && method !== 'GET') {
      requestConfig.body = JSON.stringify(data);
    }
    
    let lastError: Error;
    
    // Retry logic
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, requestConfig);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return await response.json();
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === this.config.retries) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw lastError!;
  }
} 