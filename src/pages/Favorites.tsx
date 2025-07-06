import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Heart, Clock } from "lucide-react";
import { SessionCard } from "@/components/SessionCard";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Favorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
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
        .from('user_favorites')
        .select(`
          *,
          user_sessions (
            id,
            session_name,
            description,
            speaker_names,
            duration_seconds,
            created_at,
            processing_status,
            thumbnail_url,
            category
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform to match SessionCard interface
      const transformedFavorites = data?.map(fav => ({
        id: fav.user_sessions?.id || '',
        title: fav.user_sessions?.session_name || '',
        description: fav.user_sessions?.description,
        speakers: fav.user_sessions?.speaker_names || [],
        duration: fav.user_sessions?.duration_seconds ? 
          `${Math.floor(fav.user_sessions.duration_seconds / 60)}:${String(fav.user_sessions.duration_seconds % 60).padStart(2, '0')}` : '0:00',
        uploadDate: fav.user_sessions?.created_at || '',
        status: (fav.user_sessions?.processing_status === 'complete' ? 'complete' : 'processing') as 'complete' | 'processing',
        thumbnail: fav.user_sessions?.thumbnail_url,
        category: fav.user_sessions?.category,
      })).filter(fav => fav.id) || [];
      
      setFavorites(transformedFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load favorites',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-4 mb-2">
                <Heart className="h-10 w-10 text-red-500" />
                My Favorites
              </h1>
              <p className="text-lg text-muted-foreground">
                Sessions you've marked as favorites for quick access
              </p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="h-5 w-5" />
              <span className="text-lg font-medium">{favorites.length} favorites</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {favorites.length > 0 ? (
          <>
            {/* Sessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {favorites.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-8 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{favorites.length}</div>
                  <p className="text-muted-foreground">Favorite Sessions</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-8 text-center">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {Math.floor(favorites.reduce((acc, session) => {
                      const [mins] = session.duration.split(':').map(Number);
                      return acc + mins;
                    }, 0) / 60)}h
                  </div>
                  <p className="text-muted-foreground">Total Duration</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-8 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {favorites.reduce((acc, session) => acc + (session.views || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-muted-foreground">Total Views</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No favorites yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Star sessions to add them to your favorites for quick access
            </p>
            <Link to="/browse">
              <Button size="lg">
                <Star className="h-4 w-4 mr-2" />
                Browse Sessions
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}