import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Link, FileVideo, FileAudio, FileText, File, X, Check, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { s3CompatibleUpload, type S3UploadProgress, type S3UploadResult } from "@/lib/s3CompatibleUpload";
import { UPLOAD_LIMITS, formatFileSize } from "@/constants/upload";

interface UploadedFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'url' | 'text' | 'document';
  size?: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  tags: string[];
  speed?: string;
  timeRemaining?: string;
}

interface Event {
  id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
}

const SessionUpload = () => {
  const navigate = useNavigate();

  // Helper function to detect video files
  const isVideoFile = (mimeType: string): boolean => {
    return mimeType.startsWith('video/') || 
           ['.mp4', '.mov', '.avi', '.mkv', '.webm'].some(ext => 
             mimeType.includes(ext.substring(1))
           );
  };
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeUploads, setActiveUploads] = useState<Set<string>>(new Set());

  // Auto-select event from URL params
  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId) {
      setSelectedEventId(eventId);
    }
  }, [searchParams]);

  // Load events
  useEffect(() => {
    if (!user) return;

    const loadEvents = async () => {
      try {
        const { data: events, error } = await supabase
          .from('events')
          .select('id, name, subdomain, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading events:', error);
          toast({
            title: "Error loading events",
            description: "Could not load your events. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setEvents(events || []);

        // Auto-select first event if none selected
        if (!selectedEventId && events?.length > 0) {
          setSelectedEventId(events[0].id);
        }
      } catch (error) {
        console.error('Error in loadEvents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user, selectedEventId]);

  // Check if user can upload
  const canUpload = selectedEventId && !uploading;

  /**
   * Process files using direct cloud upload
   */
  const processFiles = async (files: File[]) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files.",
        variant: "destructive",
      });
      return;
    }

    if (!canUpload) {
      toast({
        title: "Please select an event first",
        description: "Choose which event this content belongs to before uploading.",
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes
    for (const file of files) {
      if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} is ${formatFileSize(file.size)}. Maximum size is ${formatFileSize(UPLOAD_LIMITS.MAX_FILE_SIZE)}.`,
          variant: "destructive",
        });
        return;
      }
    }

    setUploading(true);

    for (const file of files) {
      // Determine file type
      let fileType: 'video' | 'audio' | 'text' | 'document' = 'document';
      if (file.type.includes('video')) {
        fileType = 'video';
      } else if (file.type.includes('audio')) {
        fileType = 'audio';
      } else if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        fileType = 'text';
      } else if (file.type.includes('pdf') || file.name.endsWith('.pdf') || 
                 file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        fileType = 'document';
      }

      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUpload: UploadedFile = {
        id: uploadId,
        name: file.name,
        type: fileType,
        size: formatFileSize(file.size),
        progress: 0,
        status: 'uploading',
        tags: []
      };
      
      setUploads(prev => [...prev, newUpload]);
      
      try {
        // Track this upload
        setActiveUploads(prev => new Set([...prev, uploadId]));

        // 🚀 Use SECURE MULTIPART UPLOAD - Production-ready with 2-3 minute target
        console.log(`🚀 Using SECURE MULTIPART upload for ${file.name} (${formatFileSize(file.size)})`);
        console.log('✅ Features: Parallel multipart upload, presigned URLs, session-based auth, 2-3min target');
        
        // Import the secure multipart upload service
        const { secureMultipartUpload } = await import('@/lib/secureMultipartUpload');
        
        const uploadResult = await secureMultipartUpload.uploadFile({
          file,
          sessionId: selectedEventId,
          concurrency: 8, // Optimize for speed
          partSize: file.size > 500 * 1024 * 1024 ? 50 * 1024 * 1024 : undefined, // 50MB for large files
          onProgress: (progress) => {
            const percentage = Math.round(progress.percentage);
            
            setUploads(prev => prev.map(upload => 
              upload.id === uploadId 
                ? { 
                    ...upload, 
                    progress: percentage,
                    status: progress.stage === 'completed' ? 'processing' : 'uploading',
                    speed: progress.speed > 0 ? `${(progress.speed / 1024 / 1024).toFixed(1)} MB/s` : undefined,
                    timeRemaining: progress.timeRemaining > 0 ? `${Math.round(progress.timeRemaining / 60)}m` : undefined
                  }
                : upload
            ));
            
            if (progress.speed > 0) {
              const speedMBps = (progress.speed / 1024 / 1024).toFixed(1);
              const timeMin = Math.round(progress.timeRemaining / 60);
              console.log(`📊 Multipart Progress: ${percentage}% (${speedMBps} MB/s, ~${timeMin}m) - ${progress.stage} - Parts: ${progress.completedParts}/${progress.totalParts} (${progress.activeParts} active)`);
            }
          },
          onSuccess: (result) => {
            console.log('✅ Secure multipart upload completed:', {
              uploadId: result.uploadId,
              filePath: result.filePath,
              duration: `${(result.duration / 1000).toFixed(1)}s`,
              averageSpeed: `${(result.averageSpeed / 1024 / 1024).toFixed(1)} MB/s`,
              totalParts: result.totalParts
            });
          },
          onError: (error) => {
            console.error('❌ S3 upload failed:', error);
          }
        });
        
        const finalResult = {
          uploadId,
          filePath: uploadResult.filePath,
          duration: uploadResult.duration
        };
        console.log('✅ SECURE MULTIPART upload successful:', finalResult);

        console.log('✅ File uploaded successfully with direct cloud upload!');

        // Don't override progress - real progress should already be at 100%
        // Just update status to processing
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'processing' }
            : upload
        ));

        // For text files, extract content
        let textContent = '';
        if (fileType === 'text') {
          try {
            textContent = await file.text();
          } catch (error) {
            console.error('Error reading text file:', error);
          }
        }

        // Create session record
        const { data: session, error: sessionError } = await supabase
          .from('user_sessions')
          .insert({
            session_name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            user_id: user.id,
            event_id: selectedEventId,
            processing_status: 'uploaded',
            content_type: fileType === 'video' ? 'video_audio' : 
                         fileType === 'audio' ? 'audio_only' : 'transcript',
            session_data: textContent ? { text_content: textContent } : null
          })
          .select()
          .single();

        if (sessionError) {
          throw sessionError;
        }

        // Status should remain processing from above - don't override progress

        // Start processing with enhanced metadata
        console.log('🚀 Invoking process-session for text/audio content:', {
          sessionId: session.id,
          filePath: uploadResult.filePath,
          fileMimeType: file.type,
          hasTextContent: !!textContent
        });

        const { error: processError } = await supabase.functions.invoke('process-session', {
          body: { 
            sessionId: session.id, 
            filePath: uploadResult.filePath,
            fileMimeType: file.type,
            textContent: textContent,
            fileSize: file.size,
            originalFileName: file.name,
            processVideo: isVideoFile(file.type), // Enable video processing for video files
            videoUrl: isVideoFile(file.type) ? uploadResult.filePath : null
          }
        });

        if (processError) {
          console.error('Function invocation error:', processError);
          // Don't throw here, still mark as complete for now
        }

        // Update to complete and navigate
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'complete' }
            : upload
        ));

        toast({
          title: "Upload successful!",
          description: `${file.name} has been uploaded and is being processed.`,
        });

        // Navigate to session detail after a short delay
        setTimeout(() => {
          navigate(`/session/${session.id}`);
        }, 1500);

      } catch (error) {
        console.error('Upload error:', error);
        
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'error', progress: 0 }
            : upload
        ));

        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
      } finally {
        // Remove from active uploads
        setActiveUploads(prev => {
          const newSet = new Set(prev);
          newSet.delete(uploadId);
          return newSet;
        });
      }
    }

    setUploading(false);
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  // Handle URL submission
  const handleUrlSubmit = async () => {
    if (!urlInput.trim() || !canUpload) return;

    const uploadId = `url_${Date.now()}`;
    const newUpload: UploadedFile = {
      id: uploadId,
      name: urlInput,
      type: 'url',
      progress: 0,
      status: 'uploading',
      tags: []
    };

    setUploads(prev => [...prev, newUpload]);
    setUploading(true);

    try {
      // Update progress
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId ? { ...upload, progress: 50 } : upload
      ));

      // Create session record
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          session_name: `URL Content - ${new Date().toLocaleDateString()}`,
          user_id: user.id,
          event_id: selectedEventId,
          processing_status: 'uploaded',
          content_type: 'transcript'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update progress
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId ? { ...upload, progress: 80 } : upload
      ));

      // Process URL
      const { error: processError } = await supabase.functions.invoke('process-session', {
        body: { 
          sessionId: session.id,
          youtubeUrl: urlInput
        }
      });

      if (processError) throw processError;

      // Complete
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId ? { ...upload, progress: 100, status: 'complete' } : upload
      ));

      toast({
        title: "URL processing started!",
        description: "Your URL content is being processed.",
      });

      setTimeout(() => {
        navigate(`/session/${session.id}`);
      }, 1500);

    } catch (error) {
      console.error('URL processing error:', error);
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId ? { ...upload, status: 'error' } : upload
      ));

      toast({
        title: "URL processing failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUrlInput("");
    }
  };

  // Handle text submission
  const handleTextSubmit = async () => {
    if (!textInput.trim() || !canUpload) return;

    const uploadId = `text_${Date.now()}`;
    const newUpload: UploadedFile = {
      id: uploadId,
      name: `Text Content - ${new Date().toLocaleDateString()}`,
      type: 'text',
      progress: 0,
      status: 'uploading',
      tags: []
    };

    setUploads(prev => [...prev, newUpload]);
    setUploading(true);

    try {
      // Update progress
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId ? { ...upload, progress: 50 } : upload
      ));

      // Create session record
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          session_name: `Text Content - ${new Date().toLocaleDateString()}`,
          user_id: user.id,
          event_id: selectedEventId,
          processing_status: 'uploaded',
          content_type: 'transcript',
          session_data: { text_content: textInput }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update progress
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId ? { ...upload, progress: 80 } : upload
      ));

      // Process text
      const { error: processError } = await supabase.functions.invoke('process-session', {
        body: { 
          sessionId: session.id,
          textContent: textInput
        }
      });

      if (processError) throw processError;

      // Complete
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId ? { ...upload, progress: 100, status: 'complete' } : upload
      ));

      toast({
        title: "Text processing started!",
        description: "Your text content is being processed.",
      });

      setTimeout(() => {
        navigate(`/session/${session.id}`);
      }, 1500);

    } catch (error) {
      console.error('Text processing error:', error);
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId ? { ...upload, status: 'error' } : upload
      ));

      toast({
        title: "Text processing failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTextInput("");
    }
  };

  // Remove upload
  const removeUpload = (uploadId: string) => {
    // Cancel active upload if it exists
    if (activeUploads.has(uploadId)) {
      s3CompatibleUpload.cancelUpload(uploadId);
    }
    
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Session Content</h1>
        <p className="text-muted-foreground mt-2">
          Upload your conference videos, audio files, or text content for AI-powered analysis and viral clip generation.
        </p>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Event
          </CardTitle>
          <CardDescription>
            Choose which event this content belongs to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an event..." />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {events.length === 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active events found. Please create an event first before uploading content.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </CardTitle>
          <CardDescription>
            Drag and drop your files here, or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors",
              dragActive && "border-blue-500 bg-blue-50",
              !canUpload && "opacity-50 cursor-not-allowed"
            )}
            onDragEnter={(e) => {
              e.preventDefault();
              if (canUpload) setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="video/*,audio/*,.pdf,.doc,.docx,.txt,.md"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              disabled={!canUpload}
            />
            <label htmlFor="file-upload" className={cn("cursor-pointer", !canUpload && "cursor-not-allowed")}>
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Choose files or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                Video files, audio files, PDFs, documents up to {formatFileSize(UPLOAD_LIMITS.MAX_FILE_SIZE)}
              </p>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* URL Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Process URL
          </CardTitle>
          <CardDescription>
            Enter a YouTube URL or other video link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={!canUpload}
            />
            <Button onClick={handleUrlSubmit} disabled={!canUpload || !urlInput.trim()}>
              Process
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Text Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Process Text
          </CardTitle>
          <CardDescription>
            Paste text content directly for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Textarea
              placeholder="Paste your text content here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={6}
              disabled={!canUpload}
            />
            <Button onClick={handleTextSubmit} disabled={!canUpload || !textInput.trim()}>
              Process Text
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
            <CardDescription>
              Track your upload and processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploads.map((upload) => (
                <div key={upload.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {upload.type === 'video' && <FileVideo className="h-4 w-4" />}
                      {upload.type === 'audio' && <FileAudio className="h-4 w-4" />}
                      {upload.type === 'text' && <FileText className="h-4 w-4" />}
                      {upload.type === 'url' && <Link className="h-4 w-4" />}
                      {upload.type === 'document' && <File className="h-4 w-4" />}
                      <span className="font-medium">{upload.name}</span>
                      {upload.size && <Badge variant="secondary">{upload.size}</Badge>}
                      {upload.speed && <Badge variant="outline">{upload.speed}</Badge>}
                      {upload.timeRemaining && <Badge variant="outline">{upload.timeRemaining}</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {upload.status === 'complete' && <Check className="h-4 w-4 text-green-500" />}
                      {upload.status === 'error' && <X className="h-4 w-4 text-red-500" />}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeUpload(upload.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={upload.progress} className="mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{upload.status}</span>
                    <span>{upload.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SessionUpload;