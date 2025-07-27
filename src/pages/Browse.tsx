import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Edit3,
  FileVideo,
  Upload,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCreateEventModal } from "@/contexts/CreateEventModalContext";
import { PublishModal } from "@/components/ui/PublishModal";
import { BaseContentItem } from "@/types/publish";

interface ContentItem extends BaseContentItem {
  content_url?: string;
  is_favorited?: boolean;
}

function BrowseContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  
  // Publish modal state
  const [selectedClip, setSelectedClip] = useState<ContentItem | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { openModal } = useCreateEventModal();

  // Check if this is the demo user
  const isDemoUser = user?.email === 'testlast@pod.com';

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
    setIsPublishModalOpen(true);
  };

  const handleDownloadClip = (content: ContentItem) => {
    toast({
      title: "Download started",
      description: `Downloading "${content.title}"`,
    });
  };

  const handlePublish = async (platforms: string[], caption: string) => {
    toast({
      title: "Published successfully!",
      description: `"${selectedClip?.title}" has been published to ${platforms.join(', ')}`,
    });
  };

  useEffect(() => {
    fetchContent();
    if (user) {
      fetchUserFavorites();
    }
  }, [user]);

  const fetchContent = async () => {
    try {
      // Helper function to generate deterministic virality score based on item ID
      const generateViralityScore = (id: string): number => {
        // Simple hash function to convert UUID to number
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
          const char = id.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        // Convert to range 70-100
        return Math.abs(hash % 31) + 70;
      };

      let enrichedContent: ContentItem[] = [];
      
      if (isDemoUser) {
        // Mock data for demo user
        const mockData = [
          {
            id: '1',
            title: 'AI Revolution in FinTech',
            speaker_name: 'Sarah Chen',
            event_name: 'FinTech Summit 2024',
            type: 'reel' as const,
            duration: 45,
            thumbnail_url: '/placeholder.svg',
            content_url: '/placeholder-video.mp4',
          },
          {
            id: '2',
            title: 'The Future of Web3',
            speaker_name: 'Marcus Rodriguez',
            event_name: 'Tech Innovation Expo',
            type: 'reel' as const,
            duration: 62,
            thumbnail_url: '/placeholder.svg',
            content_url: '/placeholder-video.mp4',
          },
          {
            id: '3',
            title: 'Sustainable Energy Solutions',
            speaker_name: 'Dr. Emily Watson',
            event_name: 'Climate Tech Summit',
            type: 'reel' as const,
            duration: 38,
            thumbnail_url: '/placeholder.svg',
            content_url: '/placeholder-video.mp4',
          },
          {
            id: '4',
            title: 'Quantum Computing Breakthroughs',
            speaker_name: 'James Park',
            event_name: 'Quantum Innovation Day',
            type: 'reel' as const,
            duration: 55,
            thumbnail_url: '/placeholder.svg',
            content_url: '/placeholder-video.mp4',
          },
          {
            id: '5',
            title: 'Healthcare AI Ethics',
            speaker_name: 'Dr. Lisa Zhang',
            event_name: 'HealthTech Conference',
            type: 'reel' as const,
            duration: 41,
            thumbnail_url: '/placeholder.svg',
            content_url: '/placeholder-video.mp4',
          },
          {
            id: '6',
            title: 'Blockchain in Supply Chain',
            speaker_name: 'Alex Thompson',
            event_name: 'Supply Chain Innovation',
            type: 'reel' as const,
            duration: 48,
            thumbnail_url: '/placeholder.svg',
            content_url: '/placeholder-video.mp4',
          }
        ];
        
        // Add virality data to mock content
        enrichedContent = mockData.map(item => ({
          ...item,
          viralityScore: generateViralityScore(item.id),
          reasoning: `This video has strong potential due to its engaging content and timely topic discussion.`,
          transcript: `Sample transcript for ${item.title}...`,
          suggestedCaption: `🚀 Amazing insights from ${item.speaker_name}! #Innovation #${item.event_name.replace(/\s+/g, '')}`,
          suggestedHashtags: ['#Innovation', '#Leadership', '#TechTalk'],
        }));
      } else {
        // Real data for real users - query user-specific content
        const { data, error } = await supabase
          .from('content_items')
          .select('*')
          .eq('user_id', user?.id) // Only get this user's content
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Process real user data (will be empty for new users)
        enrichedContent = (data || [])
          .filter(item => item.type === 'reel')
          .map(item => ({
            ...item,
            type: 'reel' as 'reel',
            viralityScore: generateViralityScore(item.id),
            reasoning: `This video has strong potential due to its engaging content and timely topic discussion.`,
            transcript: `Sample transcript for ${item.title}...`,
            suggestedCaption: `🚀 Amazing insights from ${item.speaker_name}! #Innovation #${item.event_name.replace(/\s+/g, '')}`,
            suggestedHashtags: ['#Innovation', '#Leadership', '#TechTalk'],
          }));
      }
      
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
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.speaker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.event_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
        <div className="mb-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-text mb-4">Browse All Content</h1>
            <p className="text-lg text-textSecondary leading-relaxed">
              Easily access all your content across various speaker moments and effortlessly
              share key highlights using the search feature.
            </p>
          </div>
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
              <div 
                className="relative aspect-[4/5] rounded-lg overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                onClick={() => item.type === 'reel' && handlePublishClip(item)}
              >
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

                {/* Action buttons overlay - Only Heart button now */}
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

        {/* Get Started Empty State */}
        {filteredContent.length === 0 && !loading && (
          <div className="text-center py-20">
            <Card className="max-w-lg mx-auto border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
              <CardContent className="p-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-8">
                  <FileVideo className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Content Library is Empty</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  Start by creating an event or uploading a session recording. We'll automatically generate shareable video clips for you.
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => openModal()} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Event
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/upload')}
                    className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Session Recording
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* PUBLISH MODAL */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        content={selectedClip}
        onPublish={handlePublish}
        onDownload={handleDownloadClip}
        title="Publish Your Video"
      />
    </>
  );
}

export default function Browse() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
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