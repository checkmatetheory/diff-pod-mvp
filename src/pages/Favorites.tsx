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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500" />
            My Favorites
          </h1>
          <p className="text-muted-foreground">
            Sessions you've marked as favorites for quick access
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4" />
          <span>{favorites.length} favorites</span>
        </div>
      </div>

      {/* Content */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Heart className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="mb-2">No favorites yet</CardTitle>
            <CardDescription className="mb-6">
              Star sessions to add them to your favorites for quick access
            </CardDescription>
            <Link to="/browse">
              <Button>
                <Star className="h-4 w-4 mr-2" />
                Browse Sessions
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {favorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">{favorites.length}</div>
              <p className="text-sm text-muted-foreground">Favorite Sessions</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-accent mb-2">
                {Math.floor(favorites.reduce((acc, session) => {
                  const [mins] = session.duration.split(':').map(Number);
                  return acc + mins;
                }, 0) / 60)}h
              </div>
              <p className="text-sm text-muted-foreground">Total Duration</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {favorites.reduce((acc, session) => acc + (session.views || 0), 0).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}