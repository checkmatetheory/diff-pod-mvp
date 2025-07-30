# AI Adapter System Documentation

## Overview

The AI Adapter System provides a flexible, provider-agnostic architecture for video processing and AI clip generation. This system allows you to easily switch between different AI providers (like Vizard, Runway, OpenAI) without changing your application code.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Edge Function  │    │  AI Providers   │
│                 │    │                 │    │                 │
│ SessionContent  │───▶│ AI Adapter      │───▶│ Vizard API      │
│ Components      │    │ Factory         │    │ Runway API      │
│                 │    │                 │    │ OpenAI API      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Types

### Internal Clip Type (Provider-Agnostic)

```typescript
interface Clip {
  // Core Identification
  id: string;
  sessionId: string;
  
  // Video Properties
  title: string;
  duration: number; // seconds (30-180 range)
  aspectRatio: '9:16'; // locked to vertical for reels
  quality: '1080p';
  
  // File URLs
  videoUrl: string;
  thumbnailUrl: string;
  
  // AI Analysis
  viralityScore: number; // 0-100 (only show >66, prioritize >75)
  viralityReasoning: string;
  transcript: string;
  
  // Content Metadata
  eventName: string;
  speakerName: string;
  
  // Publishing
  suggestedCaption: string;
  suggestedHashtags: string[];
  
  // Workflow State
  status: 'processing' | 'ready' | 'published' | 'failed';
  
  // Timestamps
  createdAt: string;
  processedAt?: string;
}
```

### Processing Job

```typescript
interface ProcessingJob {
  id: string;
  sessionId: string;
  videoUrl: string;
  eventName: string;
  speakerName: string;
  language: string; // ISO 639-1 code
  preferredDurations: number[]; // [30, 60, 90]
  maxClips: number;
  minViralityScore: number;
  webhookUrl?: string;
}
```

### AI Provider Interface

```typescript
interface AIProvider {
  name: string;
  version: string;
  
  submitJob(job: ProcessingJob): Promise<{ jobId: string; estimatedCompletionTime?: number }>;
  getJobStatus(jobId: string): Promise<ProcessingResult>;
  getClips(jobId: string): Promise<Clip[]>;
  healthCheck(): Promise<boolean>;
  configure(config: ProviderConfig): void;
}
```

## Current Implementation

### Supported Providers

1. **Vizard AI** ✅ Implemented
   - Video processing with automatic clip generation
   - Supports YouTube, remote files, and major platforms
   - Automatic virality scoring
   - Duration preferences (30s, 60s, 90s, 3min)

2. **Runway ML** 🚧 Planned
3. **OpenAI** 🚧 Planned
4. **Custom** 🚧 Planned

### File Structure

```
src/
├── types/
│   ├── ai-processing.ts     # Core adapter types
│   └── vizard-api.ts        # Vizard-specific types
├── lib/
│   └── ai-adapters/
│       ├── adapter-factory.ts  # Provider management
│       └── vizard-adapter.ts   # Vizard implementation
└── components/
    └── session/
        └── SessionContent.tsx  # Video clips UI

supabase/
├── functions/process-session/
│   └── index.ts             # Enhanced with adapter system
└── migrations/
    └── 20250108200000-add-video-processing-support.sql
```

## Usage

### 1. Frontend Integration

```typescript
// In your SessionContent component
import { Clip } from '@/types/ai-processing';

// Display video clips
const videoClips: Clip[] = session.session_data?.video_clips || [];

{videoClips.length > 0 && (
  <div className="video-clips-section">
    <h3>AI-Generated Clips</h3>
    {videoClips
      .filter(clip => clip.viralityScore >= 66)
      .sort((a, b) => b.viralityScore - a.viralityScore)
      .map(clip => (
        <ClipCard key={clip.id} clip={clip} />
      ))}
  </div>
)}
```

### 2. Backend Processing

```typescript
// In your Edge Function or API
import { AIAdapterFactory } from './ai-adapters/adapter-factory';

// Process video with current provider
const adapter = AIAdapterFactory.getAdapter();
const result = await adapter.submitJob({
  id: `job_${sessionId}`,
  sessionId,
  videoUrl: 'https://example.com/video.mp4',
  eventName: 'Tech Conference 2024',
  speakerName: 'John Doe',
  language: 'en',
  preferredDurations: [30, 60, 90],
  maxClips: 10,
  minViralityScore: 66
});
```

### 3. Switching Providers

```typescript
// Switch to a different provider
const success = await AIAdapterFactory.switchProvider('runway', {
  apiKey: 'runway_api_key',
  baseUrl: 'https://api.runway.com'
});

if (success) {
  console.log('Successfully switched to Runway ML');
}
```

## Environment Variables

### Required

```bash
# Vizard AI (current default)
VIZARD_API_KEY=your_vizard_api_key

# Supabase (for database and storage)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Optional (for future providers)

```bash
RUNWAY_API_KEY=your_runway_api_key
OPENAI_API_KEY=your_openai_api_key
CUSTOM_AI_API_KEY=your_custom_api_key
```

## Database Schema

### Video Processing Tables

1. **user_sessions** (enhanced)
   - `video_processing_job_id` - External job ID
   - `video_processing_status` - Job status
   - `video_processing_provider` - Which AI provider

2. **video_clips** (new)
   - Stores generated clips with metadata
   - Links to sessions via foreign key
   - Includes virality scores and publishing data

3. **ai_processing_jobs** (new)
   - Tracks job status across providers
   - Stores configuration and results
   - Enables webhook handling and polling

## Adding New Providers

### 1. Create Provider Types

```typescript
// src/types/new-provider-api.ts
export interface NewProviderRequest {
  // Provider-specific request format
}

export interface NewProviderResponse {
  // Provider-specific response format
}
```

### 2. Implement Adapter

```typescript
// src/lib/ai-adapters/new-provider-adapter.ts
export class NewProviderAdapter implements AIProvider {
  public readonly name = 'newprovider';
  public readonly version = '1.0';
  
  async submitJob(job: ProcessingJob) {
    // Transform internal job → provider format
    // Make API call
    // Transform response → internal format
  }
  
  // Implement other required methods...
}
```

### 3. Register in Factory

```typescript
// src/lib/ai-adapters/adapter-factory.ts
const ADAPTER_REGISTRY = {
  vizard: VizardAdapter,
  newprovider: NewProviderAdapter, // Add here
  // ...
};
```

## Benefits

### ✅ Provider Flexibility
- Switch providers without code changes
- Test multiple providers simultaneously
- Avoid vendor lock-in

### ✅ Consistent Data Model
- All clips use the same internal format
- UI components work with any provider
- Database schema remains stable

### ✅ Type Safety
- Full TypeScript support
- Compile-time error checking
- IntelliSense for all provider methods

### ✅ Scalability
- Easy to add new providers
- Factory pattern manages complexity
- Clean separation of concerns

## Monitoring and Analytics

### Job Status Tracking

```sql
-- Check processing job status
SELECT 
  s.generated_title,
  s.video_processing_status,
  s.video_processing_provider,
  apj.progress_percentage,
  apj.clips_generated
FROM user_sessions s
LEFT JOIN ai_processing_jobs apj ON s.video_processing_job_id = apj.provider_job_id
WHERE s.video_processing_status IS NOT NULL;
```

### Clip Performance

```sql
-- Analyze clip virality scores
SELECT 
  provider_name,
  COUNT(*) as total_clips,
  AVG(virality_score) as avg_virality,
  COUNT(*) FILTER (WHERE virality_score >= 75) as high_viral_clips
FROM video_clips vc
JOIN ai_processing_jobs apj ON vc.provider_job_id = apj.provider_job_id
GROUP BY provider_name;
```

## Best Practices

### 1. Error Handling
```typescript
try {
  const adapter = AIAdapterFactory.getAdapter();
  const result = await adapter.submitJob(job);
} catch (error) {
  // Log provider-specific errors
  console.error(`Video processing failed with ${adapter.name}:`, error);
  
  // Optionally try fallback provider
  await AIAdapterFactory.switchProvider('fallback-provider');
}
```

### 2. Webhook Handling
```typescript
// Set up webhooks for async processing
const job: ProcessingJob = {
  // ... other fields
  webhookUrl: `${SUPABASE_URL}/functions/v1/video-processing-webhook`
};
```

### 3. Cost Optimization
```typescript
// Filter clips by virality score to reduce processing costs
const highQualityClips = await adapter.getClips(jobId);
// Only clips with virality >= 66 are returned automatically
```

## Troubleshooting

### Common Issues

1. **Provider API Key Missing**
   ```
   Error: VIZARD_API_KEY environment variable not set
   ```
   **Solution**: Set the required environment variable

2. **Provider Health Check Failed**
   ```
   Error: Provider vizard health check failed
   ```
   **Solution**: Check API key validity and network connectivity

3. **Video URL Not Supported**
   ```
   Error: Unsupported video source
   ```
   **Solution**: Ensure video URL is publicly accessible and in supported format

### Debug Mode

```typescript
// Enable detailed logging
const adapter = AIAdapterFactory.getAdapter();
console.log('Provider capabilities:', adapter.getCapabilities?.());
```

## Future Enhancements

1. **Real-time Processing** - WebSocket updates for job progress
2. **Batch Processing** - Submit multiple videos at once
3. **Custom Branding** - Provider-specific clip customization
4. **Analytics Dashboard** - Performance metrics across providers
5. **Cost Tracking** - Monitor spending per provider
6. **A/B Testing** - Compare provider performance automatically

---

*This system provides the foundation for scalable, flexible video processing. As AI providers evolve, your application can easily adapt without major refactoring.* 