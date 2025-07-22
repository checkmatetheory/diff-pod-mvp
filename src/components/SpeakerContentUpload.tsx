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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Upload, 
  Link, 
  FileVideo, 
  X, 
  Check, 
  Calendar,
  AlertCircle,
  Users,
  TrendingUp,
  ExternalLink,
  Sparkles,
  ArrowRight,
  DollarSign,
  Share2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Play,
  Scissors,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Event {
  id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
}

interface Speaker {
  id: string;
  full_name: string;
  email: string;
  company: string;
  job_title: string;
  slug: string;
  headshot_url?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'video' | 'url';
  size?: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

const SpeakerContentUpload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [events, setEvents] = useState<Event[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  
  // New speaker form
  const [newSpeaker, setNewSpeaker] = useState({
    full_name: "",
    email: "",
    company: "",
    job_title: "",
    linkedin_url: "",
    bio: "",
    headshot_url: ""
  });
  const [isCreatingSpeaker, setIsCreatingSpeaker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Content inputs
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchSpeakers();
    }
  }, [selectedEventId]);

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

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpeakers = async () => {
    if (!selectedEventId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('id, full_name, email, company, job_title, slug, headshot_url')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      setSpeakers([]);
    }
  };

  const createSpeaker = async () => {
    if (!user || !newSpeaker.full_name) return;

    setIsCreatingSpeaker(true);
    try {
      // Generate slug from name
      const slug = newSpeaker.full_name.toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-');

      const { data, error } = await supabase
        .from('speakers')
        .insert({
          ...newSpeaker,
          slug,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setSpeakers(prev => [data, ...prev]);
      setSelectedSpeakerId(data.id);
      setNewSpeaker({
        full_name: "",
        email: "",
        company: "",
        job_title: "",
        linkedin_url: "",
        bio: "",
        headshot_url: ""
      });
      
      toast({
        title: "Speaker created successfully!",
        description: `${data.full_name} has been added to your speaker network.`,
      });

    } catch (error: any) {
      console.error('Error creating speaker:', error);
      toast({
        title: "Failed to create speaker",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSpeaker(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileName = `speaker-headshots/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);

      setNewSpeaker(prev => ({ ...prev, headshot_url: publicUrl }));

      toast({
        title: "Image uploaded successfully",
        description: "Speaker headshot has been added.",
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setNewSpeaker(prev => ({ ...prev, headshot_url: "" }));
  };

  // Sanitize filename for storage upload
  const sanitizeFilename = (filename: string): string => {
    // Get file extension
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
    
    // Remove or replace problematic characters
    const sanitizedName = name
      .replace(/[^\w\s-]/g, '') // Remove special chars except word chars, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .toLowerCase() // Convert to lowercase
      .trim('-'); // Remove leading/trailing hyphens
    
    return `${sanitizedName}${extension}`;
  };

  const processFiles = async (files: File[]) => {
    if (!user || !selectedEventId || !selectedSpeakerId) {
      toast({
        title: "Setup incomplete",
        description: "Please select an event and speaker first.",
        variant: "destructive",
      });
      return;
    }

    // Filter for video files only
    const videoFiles = files.filter(file => file.type.includes('video'));
    
    if (videoFiles.length === 0) {
      toast({
        title: "Video files only",
        description: "Please upload video files to create viral clips.",
        variant: "destructive",
      });
      return;
    }

    for (const file of videoFiles) {
      const newUpload: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: 'video',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        progress: 0,
        status: 'uploading'
      };
      
      setUploads(prev => [...prev, newUpload]);
      
      try {
        setUploading(true);
        
        // Upload to Supabase Storage with sanitized filename
        const sanitizedFilename = sanitizeFilename(file.name);
        const fileName = `${user.id}/${Date.now()}-${sanitizedFilename}`;
        
        setUploads(prev => prev.map(upload => 
          upload.id === newUpload.id ? { ...upload, progress: 50 } : upload
        ));

        const { error: uploadError } = await supabase.storage
          .from('session-uploads')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        setUploads(prev => prev.map(upload => 
          upload.id === newUpload.id ? { ...upload, progress: 90 } : upload
        ));

        // Create session record
        const { data: session, error: sessionError } = await supabase
          .from('user_sessions')
          .insert({
            session_name: file.name.replace(/\.[^/.]+$/, ""),
            user_id: user.id,
            event_id: selectedEventId,
            processing_status: 'uploaded',
            content_type: 'video_audio',
            session_data: { 
              speaker_id: selectedSpeakerId,
              speaker_name: speakers.find(s => s.id === selectedSpeakerId)?.full_name || ''
            }
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        setUploads(prev => prev.map(upload => 
          upload.id === newUpload.id ? { ...upload, progress: 100, status: 'processing' } : upload
        ));

        // Start processing
        const { error: processError } = await supabase.functions.invoke('process-session', {
          body: { 
            sessionId: session.id, 
            filePath: fileName,
            fileMimeType: file.type,
            textContent: null
          }
        });

        if (processError) {
          console.error('Function invocation error:', processError);
        }

        setUploads(prev => prev.map(upload => 
          upload.id === newUpload.id ? { ...upload, status: 'complete' } : upload
        ));

        // Generate speaker microsite
        await generateSpeakerMicrosite(session.id);

      } catch (error: any) {
        setUploading(false);
        console.error('Upload error:', error);
        setUploads(prev => prev.map(upload => 
          upload.id === newUpload.id ? { ...upload, status: 'error' } : upload
        ));
        
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const generateSpeakerMicrosite = async (sessionId: string) => {
    if (!selectedEventId || !selectedSpeakerId) return;

    try {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      const selectedSpeaker = speakers.find(s => s.id === selectedSpeakerId);
      
      if (!selectedEvent || !selectedSpeaker) return;

      const micrositeUrl = `studio.diffused.app/event/${selectedEvent.subdomain}/speaker/${selectedSpeaker.slug}`;

              // Create speaker microsite
        const { data: microsite, error: micrositeError } = await supabase
          .from('speaker_microsites')
          .insert({
            event_id: selectedEventId,
            speaker_id: selectedSpeakerId,
            session_id: sessionId,
            microsite_url: micrositeUrl,
            custom_cta_text: `Get Early Access to ${selectedEvent.name} ${new Date().getFullYear() + 1}`,
            approval_status: 'approved', // Auto-approve for now
            is_live: true,
            created_by: user!.id
          })
        .select()
        .single();

      if (micrositeError) throw micrositeError;

      // Create speaker content record
      const { error: contentError } = await supabase
        .from('speaker_content')
        .insert({
          microsite_id: microsite.id,
          processing_status: 'pending',
          generated_summary: 'Content is being processed...',
          key_quotes: [],
          key_takeaways: [],
          social_captions: {},
          video_clips: [],
          prompt_version: 'v1.0',
          ai_model_used: 'gpt-4o'
        });

      if (contentError) {
        console.error('Speaker content creation error:', contentError);
        // Don't throw here - microsite was created successfully
      }

      toast({
        title: "🎬 Viral clips are being generated!",
        description: `AI is analyzing ${selectedSpeaker.full_name}'s video to create the most engaging clips.`,
      });

      setTimeout(() => {
        setUploading(false);
        navigate(`/session/${sessionId}`);
      }, 1500);

    } catch (error: any) {
      console.error('Error creating microsite:', error);
      toast({
        title: "Processing started",
        description: "Video uploaded successfully and processing has begun.",
        variant: "destructive",
      });
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !user || !selectedEventId || !selectedSpeakerId) return;

    // Validate video URL
    const isVideoUrl = /(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|zoom\.us\/rec\/|teams\.microsoft\.com\/|meet\.google\.com\/)/.test(urlInput);
    
    if (!isVideoUrl) {
      toast({
        title: "Video URL required",
        description: "Please enter a YouTube, Vimeo, Zoom, or other video platform URL.",
        variant: "destructive",
      });
      return;
    }

    const newUpload: UploadedFile = {
      id: Date.now().toString(),
      name: urlInput,
      type: 'url',
      progress: 0,
      status: 'uploading'
    };
    
    setUploads(prev => [...prev, newUpload]);

    try {
      setUploading(true);
      
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id ? { ...upload, progress: 50 } : upload
      ));

      // Create session record for URL
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          session_name: `Video Session - ${new URL(urlInput).hostname}`,
          user_id: user.id,
          event_id: selectedEventId,
          processing_status: 'uploaded',
          content_type: 'video_audio',
          session_data: { 
            source_url: urlInput,
            speaker_id: selectedSpeakerId,
            speaker_name: speakers.find(s => s.id === selectedSpeakerId)?.full_name || ''
          }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id ? { ...upload, progress: 90, status: 'processing' } : upload
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
      }

      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id ? { ...upload, progress: 100, status: 'complete' } : upload
      ));

      // Generate speaker microsite
      await generateSpeakerMicrosite(session.id);

      toast({
        title: "🎬 Video URL processed!",
        description: `AI is creating viral clips from ${speakers.find(s => s.id === selectedSpeakerId)?.full_name}'s video.`,
      });

    } catch (error: any) {
      setUploading(false);
      console.error('URL submission error:', error);
      setUploads(prev => prev.map(upload => 
        upload.id === newUpload.id ? { ...upload, status: 'error' } : upload
      ));
      
      toast({
        title: "Failed to process video URL",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }

    setUrlInput("");
  };

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
    
    if (currentStep !== 3) {
      toast({
        title: "Complete setup first",
        description: "Please select an event and speaker before uploading video content.",
        variant: "destructive",
      });
      return;
    }
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedSpeaker = speakers.find(s => s.id === selectedSpeakerId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const canProceedToStep2 = selectedEventId && events.length > 0;
  const canProceedToStep3 = canProceedToStep2 && (selectedSpeakerId || newSpeaker.full_name);

  return (
    <div className="space-y-8">
      {/* Progress Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
              currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            )}>
              1
            </div>
            <div className="ml-2 text-sm font-medium">Event</div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
              currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            )}>
              2
            </div>
            <div className="ml-2 text-sm font-medium">Speaker</div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
              currentStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            )}>
              3
            </div>
            <div className="ml-2 text-sm font-medium">Video Upload</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎬 AI Finds Your Most Viral Moments in Seconds
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your conference videos and our AI will automatically extract the most engaging clips optimized for maximum social media reach and virality.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="outline" className="gap-2 border-blue-500/20 text-blue-600 bg-blue-50">
              <Scissors className="h-4 w-4" />
              Auto Clip Generation
            </Badge>
            <Badge variant="outline" className="gap-2 border-green-500/20 text-green-600 bg-green-50">
              <Zap className="h-4 w-4" />
              Virality Scoring
            </Badge>
            <Badge variant="outline" className="gap-2 border-purple-500/20 text-purple-600 bg-purple-50">
              <Share2 className="h-4 w-4" />
              One-Click Publishing
            </Badge>
          </div>
        </div>
      </div>

      {/* Step 1: Event Selection */}
      {currentStep === 1 && (
        <Card className="backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Select Your Event
            </CardTitle>
            <CardDescription>
              Choose which event this speaker attribution will be connected to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {events.length === 0 ? (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  No active events found. <Button variant="link" className="p-0 h-auto text-amber-800" onClick={() => navigate('/events')}>Create an event first</Button> to start building your speaker network.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose an event for viral clip generation..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id} className="cursor-pointer">
                        <div className="flex flex-col py-1">
                          <span className="font-medium">{event.name}</span>
                          <span className="text-xs text-muted-foreground">/{event.subdomain}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedEvent && (
                  <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 mb-1">Building Speaker Network for: {selectedEvent.name}</h4>
                          <p className="text-sm text-green-700 mb-2">
                            Speaker microsites will be created at: <code className="bg-green-100 px-1 rounded text-xs">studio.diffused.app/event/{selectedEvent.subdomain}/speaker/[name]</code>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Revenue Attribution
                            </Badge>
                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                              <Share2 className="h-3 w-3 mr-1" />
                              Viral Sharing
                            </Badge>
                            <Badge variant="outline" className="text-purple-600 border-purple-300">
                              <Eye className="h-3 w-3 mr-1" />
                              Performance Tracking
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2}
                    className="px-8"
                  >
                    Continue to Speaker Selection
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Speaker Selection */}
      {currentStep === 2 && canProceedToStep2 && (
        <Card className="backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Select or Add Speaker
            </CardTitle>
            <CardDescription>
              Choose an existing speaker or add a new one to your attribution network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Speakers */}
            {speakers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Existing Speaker</Label>
                <Select value={selectedSpeakerId} onValueChange={setSelectedSpeakerId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose from your speaker network..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {speakers.map((speaker) => (
                      <SelectItem key={speaker.id} value={speaker.id} className="cursor-pointer">
                        <div className="flex items-center gap-3 py-1">
                          <Avatar className="h-8 w-8">
                            {speaker.headshot_url ? (
                              <AvatarImage src={speaker.headshot_url} alt={speaker.full_name} />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {speaker.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{speaker.full_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {speaker.job_title} at {speaker.company}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {speakers.length > 0 && <div className="text-center text-sm text-gray-500">— OR —</div>}

            {/* Add New Speaker */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Add New Speaker</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={newSpeaker.full_name}
                    onChange={(e) => setNewSpeaker(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Sarah Chen"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSpeaker.email}
                    onChange={(e) => setNewSpeaker(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="sarah@company.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={newSpeaker.company}
                    onChange={(e) => setNewSpeaker(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="TechCorp Inc"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={newSpeaker.job_title}
                    onChange={(e) => setNewSpeaker(prev => ({ ...prev, job_title: e.target.value }))}
                    placeholder="VP of Engineering"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Speaker Image Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Speaker Headshot</Label>
                <div className="flex items-start gap-4">
                  {newSpeaker.headshot_url ? (
                    <div className="relative">
                      <img
                        src={newSpeaker.headshot_url}
                        alt="Speaker headshot"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('headshot-input')?.click()}
                      disabled={uploadingImage}
                      className="mb-2"
                    >
                      {uploadingImage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {newSpeaker.headshot_url ? 'Change Photo' : 'Upload Photo'}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">
                      JPG, PNG up to 5MB. Recommended: Square image, 400x400px
                    </p>
                    <input
                      id="headshot-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              
              {newSpeaker.full_name && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Microsite Preview</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          This speaker's attribution microsite will be created at:
                        </p>
                        <code className="bg-blue-100 px-2 py-1 rounded text-xs mt-2 block">
                          studio.diffused.app/event/{selectedEvent?.subdomain}/speaker/{newSpeaker.full_name.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')}
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {newSpeaker.full_name && (
                <Button 
                  onClick={createSpeaker}
                  disabled={isCreatingSpeaker}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isCreatingSpeaker ? "Creating Speaker..." : "Create Speaker Profile"}
                  <Users className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Button>
              
              <Button 
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3}
                className="px-8"
              >
                Continue to Content Upload
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Content Upload */}
      {currentStep === 3 && canProceedToStep3 && (
        <div className="space-y-6">
          {/* Video Processing Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Scissors className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">🎬 Ready to Generate Viral Clips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Event:</span> {selectedEvent?.name}
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Speaker:</span> {selectedSpeaker?.full_name}
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Company:</span> {selectedSpeaker?.company}
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-blue-700 font-medium">AI Processing:</span> 
                      <span className="text-xs ml-1">Auto-extract viral moments • Generate captions • Optimize for platforms</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                      <Scissors className="h-3 w-3 mr-1" />
                      Auto Clip Creation
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                      <Zap className="h-3 w-3 mr-1" />
                      Virality Scoring
                    </Badge>
                    <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">
                      <Share2 className="h-3 w-3 mr-1" />
                      One-Click Publishing
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

                        {/* Upload Area */}
              <Card className="backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-blue-600" />
                    Upload Video for Viral Clip Generation
                  </CardTitle>
                  <CardDescription>
                    Upload your conference video and our AI will automatically extract the most engaging moments optimized for social media virality.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Drag & Drop Area */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                      dragActive 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-blue-100">
                        <FileVideo className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">
                          🎬 Drop your conference video here or click to browse
                        </p>
                        <p className="text-sm text-gray-600">
                          AI will find the most viral moments and create clips optimized for each platform
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        <Badge variant="outline" className="gap-1 border-blue-500/20 text-blue-600 bg-blue-50">
                          <Play className="h-3 w-3" />
                          MP4, MOV, AVI
                        </Badge>
                        <Badge variant="outline" className="gap-1 border-green-500/20 text-green-600 bg-green-50">
                          <Zap className="h-3 w-3" />
                          Up to 2GB
                        </Badge>
                        <Badge variant="outline" className="gap-1 border-purple-500/20 text-purple-600 bg-purple-50">
                          <Scissors className="h-3 w-3" />
                          Auto Clips
                        </Badge>
                      </div>
                      <input
                        id="file-input"
                        type="file"
                        multiple
                        accept="video/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          if (e.target.files) {
                            processFiles(Array.from(e.target.files));
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* URL Input */}
                  <div className="flex items-center gap-2 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                    <Link className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-2">
                      <Input
                        placeholder="🔗 Paste YouTube, Vimeo, Zoom recording, or any video URL..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 border-blue-200 focus:border-blue-400"
                        disabled={uploading}
                      />
                      <Button type="submit" size="sm" disabled={!urlInput.trim() || uploading} className="bg-blue-600 hover:bg-blue-700">
                        <Scissors className="h-4 w-4 mr-1" />
                        Create Clips
                      </Button>
                    </form>
                  </div>

              <div className="flex justify-start">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Speaker
                </Button>
              </div>
            </CardContent>
          </Card>

                    {/* Upload Queue */}
          {uploads.length > 0 && (
            <Card className="backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-blue-600" />
                  🎬 Creating Viral Clips
                </CardTitle>
                <CardDescription>
                  AI is analyzing video content and generating optimized clips for maximum engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {uploads.map((upload) => (
                  <div key={upload.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                    <div className="p-2 rounded bg-blue-100">
                      {upload.type === 'video' && <FileVideo className="h-4 w-4 text-blue-600" />}
                      {upload.type === 'url' && <Link className="h-4 w-4 text-blue-600" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{upload.name}</p>
                        <div className="flex items-center gap-2">
                          {upload.status === 'complete' && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              🎬 Clips Ready
                            </Badge>
                          )}
                          {upload.status === 'processing' && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              <Scissors className="h-3 w-3 mr-1" />
                              Creating Clips
                            </Badge>
                          )}
                          {upload.status === 'uploading' && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              <Upload className="h-3 w-3 mr-1" />
                              Uploading
                            </Badge>
                          )}
                          {upload.status === 'error' && (
                            <Badge variant="destructive">Error</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploads(prev => prev.filter(u => u.id !== upload.id))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        {upload.size && (
                          <span className="text-xs text-gray-500">{upload.size}</span>
                        )}
                        <div className="flex-1">
                          <Progress value={upload.progress} className="h-1" />
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(upload.progress)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span>🎯 Speaker: {selectedSpeaker?.full_name}</span>
                        {upload.status === 'processing' && (
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Finding viral moments...
                          </span>
                        )}
                        {upload.status === 'complete' && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="h-3 w-3" />
                            Ready for social publishing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {uploads.some(u => u.status === 'complete') && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <Sparkles className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900">🎬 Viral clips are ready!</h4>
                        <p className="text-sm text-green-700 mt-1">
                          AI has extracted the most engaging moments. Click below to view, edit, and publish your viral clips.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeakerContentUpload; 