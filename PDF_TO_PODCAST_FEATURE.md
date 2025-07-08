# PDF to Podcast Feature

## Overview

The PDF to Podcast feature automatically converts uploaded PDF documents into AI-generated podcast episodes using ElevenLabs text-to-speech technology. Each generated podcast is approximately 2 minutes long and includes a professional script created from the PDF content.

## How It Works

### 1. PDF Upload
- Users can upload PDF files through the Session Upload page
- PDFs are stored in Supabase Storage
- The system automatically detects PDF files and processes them for transcription

### 2. Content Processing
- PDF text is extracted and cleaned
- AI creates a structured podcast script (300-400 words)
- The script includes:
  - Introduction with title
  - Key points from the content
  - Conclusion and call-to-action

### 3. Audio Generation
- ElevenLabs API converts the script to speech
- Uses professional voice settings for natural sound
- Generated audio is uploaded to Supabase Storage
- Audio duration is approximately 2 minutes

### 4. Playback
- Users can play the generated podcast directly in the app
- Audio player includes:
  - Play/pause controls
  - Progress bar with seek functionality
  - Volume control with mute toggle
  - Time display

## Technical Implementation

### Backend (Supabase Edge Function)
- **File**: `supabase/functions/process-session/index.ts`
- **Key Features**:
  - PDF text extraction
  - AI script generation
  - ElevenLabs integration
  - Audio file storage

### Frontend Components
- **Audio Player**: `src/components/ui/audio-player.tsx`
- **Session Detail**: `src/pages/SessionDetail.tsx` (new Podcast tab)
- **Upload Interface**: `src/components/SessionUpload.tsx`

### Database Schema
- `user_sessions` table includes:
  - `podcast_url`: URL to generated audio file
  - `session_data.podcast_script`: Generated script text
  - `duration_seconds`: Audio duration (120 seconds)

## Usage

### For Users
1. Navigate to Upload Session page
2. Upload a PDF file (or drag & drop)
3. Wait for processing (typically 30-60 seconds)
4. View the session detail page
5. Click the "Podcast" tab to listen to the generated audio

### For Developers
1. Set up ElevenLabs API key in Supabase environment variables
2. Deploy the Edge Function: `npx supabase functions deploy process-session`
3. Test with the audio player: `/test-audio` route

## Configuration

### Environment Variables
```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Voice Settings
- **Voice ID**: `pNczCjzI2devNBz1zQrb` (Professional male voice)
- **Model**: `eleven_monolingual_v1`
- **Stability**: 0.7
- **Similarity Boost**: 0.7
- **Style**: 0.3
- **Speaker Boost**: Enabled

## Features

### Audio Player
- ✅ Play/pause functionality
- ✅ Progress bar with click-to-seek
- ✅ Volume control with mute toggle
- ✅ Time display (current/total)
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design

### Script Generation
- ✅ Automatic content extraction
- ✅ Structured podcast format
- ✅ Appropriate length (2 minutes)
- ✅ Professional introduction/conclusion
- ✅ Key points highlighting

### File Management
- ✅ Secure file storage
- ✅ Public URL generation
- ✅ Error handling
- ✅ Processing status updates

## Testing

### Audio Player Test
Visit `/test-audio` to test the audio player component with a sample audio file.

### PDF Processing Test
1. Upload a PDF file
2. Check the processing status
3. Verify the generated podcast in the Session Detail page
4. Test audio playback functionality

## Future Enhancements

- [ ] Multiple voice options
- [ ] Custom script editing
- [ ] Background music integration
- [ ] Podcast episode metadata
- [ ] RSS feed generation
- [ ] Social sharing integration
- [ ] Analytics tracking
- [ ] Batch processing for multiple PDFs 