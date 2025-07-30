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
import { UploadAnalytics } from "@/components/ui/UploadAnalytics";
import { uploadFileWithTUS, shouldUseTUS, saveUploadState, getStoredUploads, removeUploadState, clearExpiredUploads } from "@/lib/tusUpload";
import { backgroundUploadService, type UploadEvent } from "@/lib/backgroundUploadService";
import { networkManager } from "@/lib/networkManager";
import { UPLOAD_LIMITS, formatFileSize } from "@/constants/upload";

interface UploadedFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'url' | 'text' | 'document';
  size?: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  tags: string[];
}

interface Event {
  id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
}

const SessionUpload = () => {
  const navigate = useNavigate();
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

  // Add upload recovery state
  const [storedUploads, setStoredUploads] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchEvents();
    initializeUploadServices();
  }, []);

  const initializeUploadServices = async () => {
    try {
      // Initialize background upload service
      await backgroundUploadService.initialize();
      
      // Set up upload event listeners
      const unsubscribeProgress = backgroundUploadService.on('progress', handleUploadProgress);
      const unsubscribeCompleted = backgroundUploadService.on('completed', handleUploadCompleted);
      const unsubscribeFailed = backgroundUploadService.on('failed', handleUploadFailed);
      
      // Load active uploads from background service
      const activeUploads = backgroundUploadService.getActiveUploads();
      if (activeUploads.length > 0) {
        const activeUploadsList = activeUploads.map(upload => ({
          id: upload.id,
          name: upload.fileName,
          type: 'document' as const,
          size: formatFileSize(upload.fileSize),
          progress: upload.progress,
          status: upload.status as 'uploading' | 'processing' | 'complete' | 'error',
          tags: []
        }));
        
        setUploads(prev => [...prev, ...activeUploadsList]);
        toast({
          title: "Resumed uploads",
          description: `Found ${activeUploads.length} uploads in progress.`,
        });
      }

      // Monitor network status
      const unsubscribeNetwork = networkManager.onConnectionChange((status) => {
        if (status.online) {
          toast({
            title: "Connection restored",
            description: "Resuming uploads...",
          });
        } else {
          toast({
            title: "Connection lost",
            description: "Uploads will resume when connection is restored.",
            variant: "destructive",
          });
        }
      });

      // Cleanup on unmount
      return () => {
        unsubscribeProgress();
        unsubscribeCompleted();
        unsubscribeFailed();
        unsubscribeNetwork();
      };
    } catch (error) {
      console.error('Failed to initialize upload services:', error);
    }
  };

  const handleUploadProgress = (event: UploadEvent) => {
    if (event.type === 'progress') {
      setUploads(prev => prev.map(upload => 
        upload.id === event.uploadId 
          ? { ...upload, progress: event.data.percentage }
          : upload
      ));
    }
  };

  const handleUploadCompleted = (event: UploadEvent) => {
    if (event.type === 'completed') {
      setUploads(prev => prev.map(upload => 
        upload.id === event.uploadId 
          ? { ...upload, status: 'complete', progress: 100 }
          : upload
      ));
      
      toast({
        title: "Upload completed",
        description: "Your file has been uploaded successfully.",
      });
    }
  };

  const handleUploadFailed = (event: UploadEvent) => {
    if (event.type === 'failed') {
      setUploads(prev => prev.map(upload => 
        upload.id === event.uploadId 
          ? { ...upload, status: 'error' }
          : upload
      ));
      
      toast({
        title: "Upload failed",
        description: event.data?.error || "Upload failed with unknown error.",
        variant: "destructive",
      });
    }
  };

  // Auto-select event from URL parameter
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId && events.length > 0) {
      const eventExists = events.find(e => e.id === eventId);
      if (eventExists) {
        setSelectedEventId(eventId);
      }
    }
  }, [searchParams, events]);

  const fetchEvents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, subdomain, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } else {
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const canUpload = selectedEventId && events.length > 0;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!canUpload) {
      toast({
        title: "Please select an event first",
        description: "Choose which event this content belongs to before uploading.",
        variant: "destructive",
      });
      return;
    }
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

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
        setUploading(true); // Disable buttons
        // Upload to Supabase Storage
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        
        console.log('🚀 Starting optimized upload:', {
          fileName,
          fileSize: file.size,
          fileSizeMB: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          chunkStrategy: file.size < UPLOAD_LIMITS.MEDIUM_FILE_THRESHOLD ? '2MB chunks' : 'Dynamic chunks'
        });
        
        // Enhanced progress tracking with persistence
        const onProgress = (percentage: number) => {
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, progress: Math.max(upload.progress, percentage) }
              : upload
          ));
        };

        // Set initial progress
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, progress: 10 }
            : upload
        ));

        console.log('📤 Uploading to Supabase Storage...');
        
        const fileSizeMB = file.size / (1024 * 1024);
        let uploadResult;

        // DEBUG: Add comprehensive debugging
        console.log('🔍 DEBUG: File size in MB:', fileSizeMB);
        console.log('🔍 DEBUG: shouldUseTUS function type:', typeof shouldUseTUS);
        console.log('�� DEBUG: uploadFileWithTUS function type:', typeof uploadFileWithTUS);
        
        let shouldUseResumable = false;
        try {
          shouldUseResumable = shouldUseTUS(file);
          console.log('🔍 DEBUG: shouldUseTUS result:', shouldUseResumable);
        } catch (error) {
          console.error('🔍 DEBUG: Error calling shouldUseTUS:', error);
        }

        // Use TUS resumable uploads for files larger than 6MB for better reliability
        if (shouldUseResumable) {
          console.log(`🔄 Using TUS resumable upload for large file (${fileSizeMB.toFixed(1)}MB)...`);
          
          try {
            // Get the current session for authorization
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              throw new Error('No active session found');
            }

            // TUS upload will use the onProgress callback defined above

            console.log('🚀 About to call uploadFileWithTUS...');
                         // Upload using TUS
             const tusResult = await uploadFileWithTUS({
               file,
               fileName,
               userId: user.id,
               projectId: 'qzmpuojqcrrlylmnbgrg',
               accessToken: session.access_token,
               onProgress,
               eventId: selectedEventId // Pass eventId for background service
             });
            
            uploadResult = { data: tusResult, error: null };
            console.log('�� TUS Upload result:', uploadResult);
          } catch (tusError) {
            console.error('❌ TUS Upload failed:', tusError);
            throw tusError;
          }
        } else {
          console.log(`📤 Using standard upload for file (${fileSizeMB.toFixed(1)}MB)...`);
          // Use standard upload for smaller files
          uploadResult = await supabase.storage
            .from('session-uploads')
            .upload(fileName, file, {
              upsert: true,
            });
          
          console.log('📥 Standard upload result:', uploadResult);
        }

        if (uploadResult.error) {
          console.error('❌ Upload error details:', uploadResult.error);
          throw uploadResult.error;
        }

        console.log('✅ File uploaded successfully!');

        // Update progress after upload
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, progress: 90 }
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

        // Update upload status
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, progress: 100, status: 'processing' }
            : upload
        ));

        // Start processing
        const { error: processError } = await supabase.functions.invoke('process-session', {
          body: { 
            sessionId: session.id, 
            filePath: fileName,
            fileMimeType: file.type, // Pass the explicit MIME type
            textContent: textContent
          }
        });

        if (processError) {
          setUploading(false); // Re-enable on error
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
          title: "Upload successful",
          description: `Your session has been uploaded to ${selectedEvent?.name} and is being processed.`,
        });

        // Navigate to session detail after a delay
        setTimeout(() => {
          setUploading(false); // Re-enable after navigation
          navigate(`/session/${session.id}`);
        }, 1000);

      } catch (error: unknown) {
        setUploading(false); // Re-enable on error
        console.error('❌ Upload failed:', error);
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, status: 'error' }
            : upload
        ));
        
        const errorMessage = error instanceof Error ? error.message : "Failed to upload file. Please try again.";
        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !user) return;

    if (!canUpload) {
      toast({
        title: "Please select an event first",
        description: "Choose which event this content belongs to before adding a URL.",
        variant: "destructive",
      });
      return;
    }

    const newUpload: UploadedFile = {
      id: Date.now().toString(),
      name: urlInput,
      type: 'url',
      progress: 0,
      status: 'uploading',
      tags: []
    };
    
    setUploads(prev => [...prev, newUpload]);

    try {
      // Update progress to show uploading
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, progress: 50 }
          : upload
      ));

      // Create session record for URL
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          session_name: `URL Session - ${new URL(urlInput).hostname}`,
          user_id: user.id,
          event_id: selectedEventId,
          processing_status: 'uploaded',
          session_data: { source_url: urlInput }
        })
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      // Update progress after session creation
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, progress: 90, status: 'processing' }
          : upload
      ));

      // Detect if it's a YouTube URL
      const isYouTubeUrl = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(urlInput);
      
      // Start processing with edge function
      const { error: processError } = await supabase.functions.invoke('process-session', {
        body: { 
          sessionId: session.id,
          filePath: null,
          fileMimeType: null,
          textContent: null,
          youtubeUrl: isYouTubeUrl ? urlInput : null
        }
      });

      if (processError) {
        console.error('Processing error:', processError);
        // Don't throw here, still mark as complete for now
      }

      // Update to complete
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, progress: 100, status: 'complete' }
          : upload
      ));

      toast({
        title: "URL added successfully",
        description: `Your URL has been saved to ${selectedEvent?.name} and is being processed.`,
      });

      setTimeout(() => {
        navigate(`/session/${session.id}`);
      }, 1000);

    } catch (error: unknown) {
      console.error('URL submission error:', error);
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, status: 'error' }
          : upload
      ));
      
      const errorMessage = error instanceof Error ? error.message : "Failed to save URL. Please try again.";
      toast({
        title: "Failed to save URL",
        description: errorMessage,
        variant: "destructive",
      });
    }

    setUrlInput("");
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !user) return;

    if (!canUpload) {
      toast({
        title: "Please select an event first",
        description: "Choose which event this content belongs to before adding text content.",
        variant: "destructive",
      });
      return;
    }

    const newUpload: UploadedFile = {
      id: Date.now().toString(),
      name: `Text: ${textInput.slice(0, 50)}...`,
      type: 'text',
      progress: 0,
      status: 'uploading',
      tags: []
    };
    
    setUploads(prev => [...prev, newUpload]);

    try {
      // Update progress to show uploading
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, progress: 50 }
          : upload
      ));

      // Create session record for text content
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          session_name: `Text Session - ${textInput.slice(0, 50)}`, // Limit session name length
          user_id: user.id,
          event_id: selectedEventId,
          processing_status: 'uploaded',
          session_data: { text_content: textInput }
        })
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      // Update progress after session creation
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, progress: 90, status: 'processing' }
          : upload
      ));

      // Start processing with edge function
      const { error: processError } = await supabase.functions.invoke('process-session', {
        body: { 
          sessionId: session.id,
          filePath: null, // No file path for text
          fileType: 'text',
          textContent: textInput
        }
      });

      if (processError) {
        console.error('Processing error:', processError);
        // Don't throw here, still mark as complete for now
      }

      // Update to complete
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, progress: 100, status: 'complete' }
          : upload
      ));

      toast({
        title: "Text added successfully",
        description: `Your text content has been saved to ${selectedEvent?.name} and is being processed.`,
      });

      setTimeout(() => {
        navigate(`/session/${session.id}`);
      }, 1000);

    } catch (error: unknown) {
      console.error('Text submission error:', error);
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, status: 'error' }
          : upload
      ));
      
      const errorMessage = error instanceof Error ? error.message : "Failed to save text content. Please try again.";
      toast({
        title: "Failed to save text content",
        description: errorMessage,
        variant: "destructive",
      });
    }

    setTextInput("");
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Selection */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Select Target Event
          </CardTitle>
          <CardDescription>
            Choose which event this content will be associated with. This determines where it appears on your public event page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active events found. <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/events')}>Create an event first</Button> to start adding content.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="event-select">Target Event</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger id="event-select">
                    <SelectValue placeholder="Choose an event to add content to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{event.name}</span>
                          <span className="text-xs text-muted-foreground">/{event.subdomain}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEvent && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Adding content to: {selectedEvent.name}</h4>
                        <p className="text-sm text-blue-700">
                          Public URL: <code className="bg-blue-100 px-1 rounded text-xs">{window.location.origin}/event/{selectedEvent.subdomain}</code>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          All uploaded content will appear on this event's public page for viral sharing and lead capture.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!selectedEventId && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please select an event before uploading content. This ensures your content appears on the correct event page.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Session Content
          </CardTitle>
          <CardDescription>
            Upload PDFs, video/audio files, text documents, or paste links. Content will be processed and added to speaker microsites.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              canUpload ? "cursor-pointer" : "cursor-not-allowed opacity-50",
              dragActive && canUpload
                ? "border-primary bg-primary/5" 
                : canUpload 
                ? "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                : "border-muted-foreground/25"
            )}
            onDragEnter={canUpload ? handleDrag : undefined}
            onDragLeave={canUpload ? handleDrag : undefined}
            onDragOver={canUpload ? handleDrag : undefined}
            onDrop={canUpload ? handleDrop : undefined}
            onClick={canUpload ? () => document.getElementById('file-input')?.click() : undefined}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  {canUpload ? "Drop files here or click to browse" : "Select an event first"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {canUpload ? "Supports PDF, MP4, MP3, MOV, WAV, TXT, DOC (up to 500MB)" : "Choose a target event above to enable file uploads"}
                </p>
              </div>
              {canUpload && (
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <Badge variant="outline" className="gap-1 border-green-500/20 text-green-600 bg-green-50">
                    <FileText className="h-3 w-3" />
                    PDF → Content
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-primary/20 text-primary bg-primary/5">
                    <FileVideo className="h-3 w-3" />
                    Video
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-accent/20 text-accent bg-accent/5">
                    <FileAudio className="h-3 w-3" />
                    Audio
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-primary/20 text-primary bg-primary/5">
                    <FileText className="h-3 w-3" />
                    Text
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-muted-foreground/20 text-muted-foreground bg-muted/50">
                    <File className="h-3 w-3" />
                    Documents
                  </Badge>
                </div>
              )}
              <input
                id="file-input"
                type="file"
                multiple
                accept="audio/*,video/*,text/*,.txt,.md,.pdf,.doc,.docx"
                className="hidden"
                disabled={!canUpload || uploading}
                onChange={(e) => {
                  if (e.target.files && canUpload) {
                    processFiles(Array.from(e.target.files));
                  }
                }}
              />
            </div>
          </div>

          {/* URL Input */}
          <div className={cn(
            "flex items-center gap-2 p-4 border rounded-lg bg-muted/30",
            !canUpload && "opacity-50"
          )}>
            <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-2">
              <Input
                placeholder={canUpload ? "Paste YouTube, Vimeo, or Zoom link..." : "Select an event first"}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1"
                disabled={!canUpload || uploading}
              />
              <Button type="submit" size="sm" disabled={!urlInput.trim() || !canUpload || uploading}>
                {uploading ? "Processing..." : "Add Link"}
              </Button>
            </form>
          </div>

          {/* Text Content Input */}
          <div className={cn("space-y-3", !canUpload && "opacity-50")}>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Or paste text content directly</span>
            </div>
            <form onSubmit={handleTextSubmit} className="space-y-3">
              <Textarea
                placeholder={canUpload ? "Paste blog post, article, or any text content to add to speaker microsites..." : "Select an event first to enable text input"}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={!canUpload || uploading}
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={!textInput.trim() || !canUpload || uploading}
                variant="default" 
                className="bg-primary hover:bg-primary/90"
              >
                <FileText className="h-4 w-4 mr-2" />
                {!canUpload ? "Select an event first" : uploading ? "Processing..." : "Process Text"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Upload Analytics */}
      {uploads.length > 0 && (
        <UploadAnalytics className="mb-6" />
      )}

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Processing Queue</CardTitle>
            <CardDescription>
              {uploads.filter(u => u.status === 'complete').length} of {uploads.length} complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="p-2 rounded bg-primary/10">
                  {upload.type === 'video' && <FileVideo className="h-4 w-4 text-primary" />}
                  {upload.type === 'audio' && <FileAudio className="h-4 w-4 text-primary" />}
                  {upload.type === 'url' && <Link className="h-4 w-4 text-primary" />}
                  {upload.type === 'text' && <FileText className="h-4 w-4 text-primary" />}
                  {upload.type === 'document' && <File className="h-4 w-4 text-primary" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{upload.name}</p>
                    <div className="flex items-center gap-2">
                      {upload.status === 'complete' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                      {upload.status === 'processing' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Processing
                        </Badge>
                      )}
                      {upload.status === 'error' && (
                        <Badge variant="destructive">Error</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUpload(upload.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {upload.size && (
                      <span className="text-xs text-muted-foreground">{upload.size}</span>
                    )}
                    <div className="flex-1">
                      <Progress value={upload.progress} className="h-1" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(upload.progress)}%
                    </span>
                  </div>
                  {selectedEvent && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Adding to: {selectedEvent.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SessionUpload;