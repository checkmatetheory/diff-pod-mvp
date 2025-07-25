import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Play, 
  ArrowRight, 
  Heart, 
  Share2, 
  Download, 
  Clock, 
  Pause,
  Calendar,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Edit3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCreateEventModal } from "@/contexts/CreateEventModalContext";

interface ContentItem {
  id: string;
  type: 'photo' | 'reel';
  thumbnail_url: string;
  content_url?: string;
  title: string;
  speaker_name: string;
  event_name: string;
  description?: string;
  duration?: number;
  is_favorited?: boolean;
  // Add properties for publishing
  viralityScore?: number;
  reasoning?: string;
  transcript?: string;
  suggestedCaption?: string;
  suggestedHashtags?: string[];
}

function BrowseContent() {
  const [activeTab, setActiveTab] = useState<'photos' | 'reels'>('photos');
  const [searchTerm, setSearchTerm] = useState('');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  
  // Publish modal state
  const [selectedClip, setSelectedClip] = useState<ContentItem | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Helper functions for viral clips (from SessionDetail)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getViralityColor = (score: number) => {
    if (score >= 90) return 'bg-green-600 text-white border-2 border-green-200 hover:bg-green-600';
    if (score >= 80) return 'bg-[#4A8BC2] text-white border-2 border-blue-200 hover:bg-[#4A8BC2]';
    if (score >= 70) return 'bg-yellow-600 text-white border-2 border-yellow-200 hover:bg-yellow-600';
    return 'bg-gray-600 text-white border-2 border-gray-200 hover:bg-gray-600';
  };

  const getViralityRank = (score: number) => {
    if (score >= 90) return '#1';
    if (score >= 80) return '#2';
    if (score >= 70) return '#3';
    return `#${Math.floor(score / 10)}`;
  };

  // Publish handlers
  const handlePublishClip = (clip: ContentItem) => {
    setSelectedClip(clip);
    setCaption(clip.suggestedCaption || `Check out this amazing content from ${clip.speaker_name} at ${clip.event_name}! 🚀`);
    setIsPublishModalOpen(true);
  };

  const handleDownloadClip = (clip: ContentItem) => {
    toast({
      title: "Download started",
      description: `Downloading "${clip.title}"`,
    });
  };

  const handlePublish = () => {
    toast({
      title: "Published successfully!",
      description: `"${selectedClip?.title}" has been published to ${selectedPlatforms.join(', ')}`,
    });
    setIsPublishModalOpen(false);
  };

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-black' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  ];

  useEffect(() => {
    fetchContent();
    if (user) {
      fetchUserFavorites();
    }
  }, [user]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add mock viral data for reels and fix type casting
      const enrichedContent = (data || []).map(item => ({
        ...item,
        type: (item.type === 'photo' || item.type === 'reel') ? item.type : 'photo' as 'photo' | 'reel',
        viralityScore: item.type === 'reel' ? Math.floor(Math.random() * 30) + 70 : undefined,
        reasoning: item.type === 'reel' ? `This ${item.type} has strong potential due to its engaging content and timely topic discussion.` : undefined,
        transcript: item.type === 'reel' ? `Sample transcript for ${item.title}...` : undefined,
        suggestedCaption: item.type === 'reel' ? `🚀 Amazing insights from ${item.speaker_name}! #Innovation #${item.event_name.replace(/\s+/g, '')}` : undefined,
        suggestedHashtags: item.type === 'reel' ? ['#Innovation', '#Leadership', '#TechTalk'] : undefined,
      }));
      
      setContent(enrichedContent);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content_favorites')
        .select('content_item_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const favoriteSet = new Set(data?.map(fav => fav.content_item_id) || []);
      setFavoriteIds(favoriteSet);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (contentId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return;
    }

    const isFavorited = favoriteIds.has(contentId);

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('content_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('content_item_id', contentId);

        if (error) throw error;

        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(contentId);
          return newSet;
        });

        toast({
          title: "Removed from favorites",
          description: "Content removed from your favorites",
        });
      } else {
        const { error } = await supabase
          .from('content_favorites')
          .insert({
            user_id: user.id,
            content_item_id: contentId
          });

        if (error) throw error;

        setFavoriteIds(prev => new Set(prev).add(contentId));

        toast({
          title: "Added to favorites",
          description: "Content saved to your favorites",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  const filteredContent = content.filter(item => {
    const matchesTab = activeTab === 'photos' ? item.type === 'photo' : item.type === 'reel';
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.speaker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.event_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-start justify-between mb-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-text mb-4">Browse All Content</h1>
            <p className="text-lg text-textSecondary leading-relaxed">
              Easily access all your content across various speaker moments and effortlessly
              share key highlights using the search feature.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] rounded-lg bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-text mb-4">Browse All Content</h1>
            <p className="text-lg text-textSecondary leading-relaxed">
              Easily access all your content across various speaker moments and effortlessly
              share key highlights using the search feature.
            </p>
          </div>
          <Button className="bg-primary hover:bg-primaryDark text-white px-6 py-2 text-base font-semibold shadow-button hover:shadow-button-hover transition-all duration-200">
            View Gallery
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Content Type Tabs */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setActiveTab('photos')}
            className={`px-8 py-3 text-base font-semibold rounded-full transition-all duration-200 ${
              activeTab === 'photos' 
                ? 'bg-primary hover:bg-primaryDark text-white shadow-button-hover' 
                : 'bg-white text-primary border-2 border-accent hover:border-primary hover:bg-accentLight'
            }`}
          >
            Photos
          </Button>
          <Button
            onClick={() => setActiveTab('reels')}
            className={`px-8 py-3 text-base font-semibold rounded-full transition-all duration-200 ${
              activeTab === 'reels' 
                ? 'bg-primary hover:bg-primaryDark text-white shadow-button-hover' 
                : 'bg-white text-primary border-2 border-accent hover:border-primary hover:bg-accentLight'
            }`}
          >
            Reels
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-lg mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-textSecondary" />
          <Input
            placeholder="Search by speaker, event, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 py-3 text-base border-accent bg-white shadow-sm rounded-full focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Visual Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
                {/* Placeholder image with enhanced gradient background */}
                <div className="w-full h-full bg-gradient-to-br from-blueLight via-accentLight to-accent flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 bg-white/80 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Play button overlay for reels */}
                {item.type === 'reel' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border-2 border-white/40 group-hover:scale-110 transition-transform duration-300">
                      <Play className="h-8 w-8 text-white ml-1" fill="white" />
                    </div>
                  </div>
                )}

                                 {/* Virality Score Badge for reels */}
                 {item.type === 'reel' && item.viralityScore && (
                   <div className="absolute top-3 left-3">
                     <Badge className={`${getViralityColor(item.viralityScore)} font-semibold shadow-lg backdrop-blur-sm !bg-opacity-100 hover:!bg-opacity-100`}>
                       {getViralityRank(item.viralityScore)} ({item.viralityScore}/100)
                     </Badge>
                   </div>
                 )}

                {/* Duration Badge for reels */}
                {item.type === 'reel' && item.duration && (
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-black/70 text-white">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(item.duration)}
                    </Badge>
                  </div>
                )}

                {/* Action buttons overlay */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {/* Heart/Like button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border border-white/40 hover:bg-black/70 transition-colors duration-200"
                  >
                    <Heart 
                      className={`h-5 w-5 transition-colors duration-200 ${
                        favoriteIds.has(item.id) 
                          ? 'text-red-500 fill-red-500' 
                          : 'text-white hover:text-red-300'
                      }`}
                    />
                  </button>

                  {/* Publish button for reels */}
                  {item.type === 'reel' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublishClip(item);
                      }}
                      className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border border-white/40 hover:bg-black/70 transition-colors duration-200"
                    >
                      <Share2 className="h-4 w-4 text-white" />
                    </button>
                  )}
                </div>

                {/* Content info overlay on hover */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white font-semibold text-base mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-white/90 text-sm font-medium">{item.speaker_name}</p>
                  <p className="text-white/70 text-xs">{item.event_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Empty State */}
        {filteredContent.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-lg bg-accentLight flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-text mb-3">No {activeTab} found</h3>
            <p className="text-lg text-textSecondary max-w-md mx-auto">
              Try adjusting your search terms to find the content you're looking for
            </p>
          </div>
        )}
      </div>

      {/* PUBLISH MODAL - Same as SessionDetail */}
      <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Publish Your Video</DialogTitle>
          </DialogHeader>

          {selectedClip && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Preview */}
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-w-sm mx-auto">
                  <div className="w-full h-full bg-gradient-to-br from-blueLight via-accentLight to-accent flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center">
                        <div className="w-5 h-5 bg-white/80 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Play/Pause Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="bg-black/50 hover:bg-black/70 text-white rounded-full w-16 h-16"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                  </div>

                                     {/* Video Info Overlay */}
                   {selectedClip.viralityScore && (
                     <div className="absolute top-4 left-4 right-4">
                       <Badge className={`${getViralityColor(selectedClip.viralityScore)} font-semibold shadow-lg !bg-opacity-100 hover:!bg-opacity-100`}>
                         {getViralityRank(selectedClip.viralityScore)} Virality score ({selectedClip.viralityScore}/100)
                       </Badge>
                     </div>
                   )}

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-bold text-lg mb-1">{selectedClip.title}</h3>
                    <p className="text-sm opacity-80">
                      {selectedClip.duration ? formatDuration(selectedClip.duration) + ' • ' : ''}{selectedClip.event_name}
                    </p>
                  </div>
                </div>

                {/* Virality Reasoning */}
                {selectedClip.reasoning && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                        Why this clip has viral potential:
                      </h4>
                      <p className="text-sm leading-relaxed">{selectedClip.reasoning}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Publishing Form */}
              <div className="space-y-6">
                {/* Platform Selection */}
                <div>
                  <h3 className="font-semibold mb-3">Select Platforms</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {platforms.map((platform) => {
                      const Icon = platform.icon;
                      const isSelected = selectedPlatforms.includes(platform.id);
                      
                      return (
                        <Button
                          key={platform.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`h-12 ${isSelected ? platform.color : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPlatforms(prev => prev.filter(p => p !== platform.id));
                            } else {
                              setSelectedPlatforms(prev => [...prev, platform.id]);
                            }
                          }}
                        >
                          <Icon className="h-5 w-5 mr-2" />
                          {platform.name}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Will post to 1 account per platform
                  </p>
                </div>

                {/* Caption Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Caption</h3>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your caption..."
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>AI-optimized for engagement</span>
                    <span>{caption.length} characters</span>
                  </div>
                </div>

                {/* Hashtags */}
                {selectedClip.suggestedHashtags && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Suggested Hashtags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedClip.suggestedHashtags.map((hashtag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t">
                  <Button 
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    onClick={handlePublish}
                    disabled={selectedPlatforms.length === 0}
                  >
                    Publish now
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => toast({ title: "Scheduled!", description: "Your video will be published at the optimal time" })}
                      disabled={selectedPlatforms.length === 0}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    <Button variant="outline" onClick={() => handleDownloadClip(selectedClip)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Browse() {
  const { openModal } = useCreateEventModal();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onCreateEvent={openModal} />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1 p-6">
            <BrowseContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}