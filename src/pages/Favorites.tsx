import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Star, 
  Heart, 
  Play, 
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
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCreateEventModal } from "@/contexts/CreateEventModalContext";

interface FavoriteContent {
  id: string;
  content_item_id: string;
  created_at: string;
  content_items: {
    id: string;
    title: string;
    type: string;
    thumbnail_url: string;
    speaker_name: string;
    event_name: string;
    description?: string;
    duration?: number;
    // Add publishing properties
    viralityScore?: number;
    reasoning?: string;
    transcript?: string;
    suggestedCaption?: string;
    suggestedHashtags?: string[];
  };
}

function FavoritesContent() {
  const [favorites, setFavorites] = useState<FavoriteContent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Publish modal state
  const [selectedClip, setSelectedClip] = useState<FavoriteContent | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Helper functions for publishing
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate consistent virality score based on content ID
  const generateConsistentViralityScore = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 31) + 70;
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
  const handlePublishClip = (favorite: FavoriteContent) => {
    setSelectedClip(favorite);
    setCaption(favorite.content_items?.suggestedCaption || `Check out this amazing content from ${favorite.content_items?.speaker_name} at ${favorite.content_items?.event_name}! 🚀`);
    setIsPublishModalOpen(true);
  };

  const handleDownloadClip = (favorite: FavoriteContent) => {
    toast({
      title: "Download started",
      description: `Downloading "${favorite.content_items?.title}"`,
    });
  };

  const handlePublish = () => {
    toast({
      title: "Published successfully!",
      description: `"${selectedClip?.content_items?.title}" has been published to ${selectedPlatforms.join(', ')}`,
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
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('content_favorites')
        .select(`
          *,
          content_items (
            id,
            title,
            type,
            thumbnail_url,
            speaker_name,
            event_name,
            description,
            duration
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enhance favorites with publishing data
      const enhancedFavorites = (data || []).map(favorite => ({
        ...favorite,
        content_items: favorite.content_items ? {
          ...favorite.content_items,
          viralityScore: favorite.content_items.type === 'reel' ? generateConsistentViralityScore(favorite.content_items.id) : undefined,
          reasoning: favorite.content_items.type === 'reel' ? `This content has strong potential due to its engaging content and timely topic discussion.` : undefined,
          transcript: favorite.content_items.type === 'reel' ? `Sample transcript for ${favorite.content_items.title}...` : undefined,
          suggestedCaption: favorite.content_items.type === 'reel' ? `🚀 Amazing insights from ${favorite.content_items.speaker_name}! #Innovation #${favorite.content_items.event_name.replace(/\s+/g, '')}` : undefined,
          suggestedHashtags: favorite.content_items.type === 'reel' ? ['#Innovation', '#Leadership', '#TechTalk'] : undefined,
        } : null
      }));
      
      setFavorites(enhancedFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Error",
        description: "Failed to load favorites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (contentItemId: string) => {
    try {
      const { error } = await supabase
        .from('content_favorites')
        .delete()
        .eq('user_id', user?.id)
        .eq('content_item_id', contentItemId);

      if (error) throw error;

      setFavorites(favorites.filter(fav => fav.content_item_id !== contentItemId));
      toast({
        title: "Removed from favorites",
        description: "Content removed from your favorites",
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 mb-8">
          <Heart className="h-6 w-6 text-red-500" />
          <h1 className="text-3xl font-bold">My Favorites</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-0">
                <div className="aspect-[4/5] bg-gray-200 rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8">
        <div className="flex items-center gap-2 mb-8">
          <Heart className="h-6 w-6 text-red-500" />
          <h1 className="text-3xl font-bold">My Favorites</h1>
        </div>

        {favorites.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
                <CardContent className="p-0">
                  {/* Content Image/Thumbnail */}
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-blueLight via-accentLight to-accent flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center">
                        <div className="w-5 h-5 bg-white/80 rounded-full"></div>
                      </div>
                    </div>

                    {/* Play button for reels */}
                    {favorite.content_items?.type === 'reel' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border border-white/40">
                          <Play className="h-6 w-6 text-white ml-1" fill="white" />
                        </div>
                      </div>
                    )}

                    {/* Virality Score Badge for reels */}
                    {favorite.content_items?.type === 'reel' && favorite.content_items?.viralityScore && (
                      <div className="absolute top-3 left-3">
                        <Badge className={`${getViralityColor(favorite.content_items.viralityScore)} font-semibold shadow-lg backdrop-blur-sm !bg-opacity-100 hover:!bg-opacity-100`}>
                          {getViralityRank(favorite.content_items.viralityScore)} ({favorite.content_items.viralityScore}/100)
                        </Badge>
                      </div>
                    )}

                    {/* Duration Badge for reels */}
                    {favorite.content_items?.type === 'reel' && favorite.content_items?.duration && (
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="secondary" className="bg-black/70 text-white">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(favorite.content_items.duration)}
                        </Badge>
                      </div>
                    )}

                    {/* Action buttons overlay */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {/* Remove from favorites button */}
                      <button
                        onClick={() => removeFavorite(favorite.content_item_id)}
                        className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border border-white/40 hover:bg-black/70 transition-colors duration-200"
                      >
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                      </button>

                      {/* Publish button for reels */}
                      {favorite.content_items?.type === 'reel' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublishClip(favorite);
                          }}
                          className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border border-white/40 hover:bg-black/70 transition-colors duration-200"
                        >
                          <Share2 className="h-3 w-3 text-white" />
                        </button>
                      )}
                    </div>

                    {/* Content type badge */}
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2 py-1 text-xs font-medium bg-black/50 text-white rounded-full backdrop-blur-md border border-white/40">
                        {favorite.content_items?.type === 'reel' ? 'Reel' : 'Photo'}
                      </span>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-base mb-2 line-clamp-2">
                      {favorite.content_items?.title || 'Untitled'}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <p className="font-medium text-gray-700">
                        {favorite.content_items?.speaker_name}
                      </p>
                      <p className="text-xs text-blue-600">
                        {favorite.content_items?.event_name}
                      </p>
                    </div>

                    {favorite.content_items?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {favorite.content_items.description}
                      </p>
                    )}

                    <div className="text-xs text-gray-400">
                      Added {new Date(favorite.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">No favorites yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Heart content in the Browse section to add them to your favorites for quick access
              </p>
              <Link to="/browse">
                <Button size="lg">
                  <Heart className="h-4 w-4 mr-2" />
                  Browse Content
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* PUBLISH MODAL - Same as Browse page */}
      <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Publish Your Favorite</DialogTitle>
          </DialogHeader>

          {selectedClip && selectedClip.content_items && (
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
                  {selectedClip.content_items.viralityScore && (
                    <div className="absolute top-4 left-4 right-4">
                      <Badge className={`${getViralityColor(selectedClip.content_items.viralityScore)} font-semibold shadow-lg !bg-opacity-100 hover:!bg-opacity-100`}>
                        {getViralityRank(selectedClip.content_items.viralityScore)} Virality score ({selectedClip.content_items.viralityScore}/100)
                      </Badge>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-bold text-lg mb-1">{selectedClip.content_items.title}</h3>
                    <p className="text-sm opacity-80">
                      {selectedClip.content_items.duration ? formatDuration(selectedClip.content_items.duration) + ' • ' : ''}{selectedClip.content_items.event_name}
                    </p>
                  </div>
                </div>

                {/* Virality Reasoning */}
                {selectedClip.content_items.reasoning && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                        Why this clip has viral potential:
                      </h4>
                      <p className="text-sm leading-relaxed">{selectedClip.content_items.reasoning}</p>
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
                {selectedClip.content_items.suggestedHashtags && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Suggested Hashtags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedClip.content_items.suggestedHashtags.map((hashtag: string, index: number) => (
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

export default function Favorites() {
  const { openModal } = useCreateEventModal();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onCreateEvent={openModal} />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1">
            <FavoritesContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}