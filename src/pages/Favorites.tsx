import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Heart, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import CreateEventModal from "@/components/ui/CreateEventModal";

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
  };
}

function FavoritesContent() {
  const [favorites, setFavorites] = useState<FavoriteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

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
      setFavorites(data || []);
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

                  {/* Remove from favorites button */}
                  <button
                    onClick={() => removeFavorite(favorite.content_item_id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border border-white/40 hover:bg-black/70 transition-colors duration-200"
                  >
                    <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                  </button>

                  {/* Content type badge */}
                  <div className="absolute top-3 left-3">
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

                  {/* Duration for reels */}
                  {favorite.content_items?.type === 'reel' && favorite.content_items?.duration && (
                    <p className="text-xs text-gray-500 mb-3">
                      Duration: {Math.floor(favorite.content_items.duration / 60)}:{(favorite.content_items.duration % 60).toString().padStart(2, '0')}
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
  );
}

export default function Favorites() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onCreateEvent={() => setCreateModalOpen(true)} />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1">
            <FavoritesContent />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>

    <CreateEventModal 
      open={createModalOpen} 
      onOpenChange={setCreateModalOpen}
      onEventCreated={() => {
        setCreateModalOpen(false);
      }}
    />
    </>
  );
}