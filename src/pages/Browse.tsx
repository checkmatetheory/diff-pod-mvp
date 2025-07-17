import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Play, ArrowRight, Heart } from "lucide-react";
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
}

function BrowseContent() {
  const [activeTab, setActiveTab] = useState<'photos' | 'reels'>('photos');
  const [searchTerm, setSearchTerm] = useState('');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

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
      setContent(data || []);
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
        // Remove from favorites
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
        // Add to favorites
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

              {/* Heart/Like button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item.id);
                }}
                className="absolute top-3 right-3 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border border-white/40 hover:bg-black/70 transition-colors duration-200"
              >
                <Heart 
                  className={`h-5 w-5 transition-colors duration-200 ${
                    favoriteIds.has(item.id) 
                      ? 'text-red-500 fill-red-500' 
                      : 'text-white hover:text-red-300'
                  }`}
                />
              </button>

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
  );
}

export default function Browse() {
  const { openModal } = useCreateEventModal();

  return (
    <>
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


    </>
  );
}