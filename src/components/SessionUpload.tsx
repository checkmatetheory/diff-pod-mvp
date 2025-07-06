import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Link, FileVideo, FileAudio, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'url';
  size?: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  tags: string[];
}

const SessionUpload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [urlInput, setUrlInput] = useState("");

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

    for (const file of files) {
      const newUpload: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type.includes('video') ? 'video' : 'audio',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        progress: 0,
        status: 'uploading',
        tags: []
      };
      
      setUploads(prev => [...prev, newUpload]);
      
      try {
        // Upload to Supabase Storage
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        
        // Set progress to uploading
        setUploads(prev => prev.map(upload => 
          upload.id === newUpload.id 
            ? { ...upload, progress: 50 }
            : upload
        ));

        const { error: uploadError } = await supabase.storage
          .from('session-uploads')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        // Update progress after upload
        setUploads(prev => prev.map(upload => 
          upload.id === newUpload.id 
            ? { ...upload, progress: 90 }
            : upload
        ));

        // Create session record
        const { data: session, error: sessionError } = await supabase
          .from('user_sessions')
          .insert({
            session_name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            user_id: user.id,
            processing_status: 'uploaded'
          })
          .select()
          .single();

        if (sessionError) {
          throw sessionError;
        }

        // Update upload status
        setUploads(prev => prev.map(upload => 
          upload.id === newUpload.id 
            ? { ...upload, progress: 100, status: 'processing' }
            : upload
        ));

        // Start processing
        const { error: processError } = await supabase.functions.invoke('process-session', {
          body: { 
            sessionId: session.id, 
            filePath: fileName 
          }
        });

        if (processError) {
          throw processError;
        }

        // Update to complete and navigate
        setUploads(prev => prev.map(upload => 
          upload.id === newUpload.id 
            ? { ...upload, status: 'complete' }
            : upload
        ));

        toast({
          title: "Upload successful",
          description: "Your session has been uploaded and is being processed.",
        });

        // Navigate to session detail after a delay
        setTimeout(() => {
          navigate(`/session/${session.id}`);
        }, 1000);

      } catch (error) {
        console.error('Upload error:', error);
        setUploads(prev => prev.map(upload => 
          upload.id === newUpload.id 
            ? { ...upload, status: 'error' }
            : upload
        ));
        
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Remove the simulateProgress function - now handled in processFiles

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !user) return;

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
      // Create session record for URL
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          session_name: `URL Session - ${new URL(urlInput).hostname}`,
          user_id: user.id,
          processing_status: 'uploaded',
          session_data: { source_url: urlInput }
        })
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, progress: 100, status: 'complete' }
          : upload
      ));

      toast({
        title: "URL added successfully",
        description: "Your URL has been saved and will be processed.",
      });

      setTimeout(() => {
        navigate(`/session/${session.id}`);
      }, 1000);

    } catch (error) {
      console.error('URL submission error:', error);
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id 
          ? { ...upload, status: 'error' }
          : upload
      ));
      
      toast({
        title: "Failed to save URL",
        description: "Please try again.",
        variant: "destructive",
      });
    }

    setUrlInput("");
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Session
          </CardTitle>
          <CardDescription>
            Upload video/audio files or paste links from YouTube, Vimeo, or Zoom
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive 
                ? "border-primary bg-primary-subtle" 
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-primary-subtle">
                <FileVideo className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  Supports MP4, MP3, MOV, WAV (up to 500MB)
                </p>
              </div>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                Select Files
              </Button>
              <input
                id="file-input"
                type="file"
                multiple
                accept="audio/*,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    processFiles(Array.from(e.target.files));
                  }
                }}
              />
            </div>
          </div>

          {/* URL Input */}
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
            <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-2">
              <Input
                placeholder="Paste YouTube, Vimeo, or Zoom link..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={!urlInput.trim()}>
                Add Link
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

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
                <div className="p-2 rounded bg-primary-subtle">
                  {upload.type === 'video' && <FileVideo className="h-4 w-4 text-primary" />}
                  {upload.type === 'audio' && <FileAudio className="h-4 w-4 text-primary" />}
                  {upload.type === 'url' && <Link className="h-4 w-4 text-primary" />}
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