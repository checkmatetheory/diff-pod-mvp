import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Grid, List } from "lucide-react";
import { SessionCard } from "@/components/SessionCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Session {
  id: string;
  session_name: string;
  description: string | null;
  speaker_names: string[] | null;
  duration_seconds: number | null;
  created_at: string;
  processing_status: string | null;
  thumbnail_url: string | null;
  category: string | null;
}

export default function Browse() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Transform sessions to match SessionCard interface
  const transformedSessions = sessions.map(session => ({
    id: session.id,
    title: session.session_name,
    description: session.description,
    speakers: session.speaker_names || [],
    duration: session.duration_seconds ? `${Math.floor(session.duration_seconds / 60)}:${String(session.duration_seconds % 60).padStart(2, '0')}` : '0:00',
    uploadDate: session.created_at,
    status: (session.processing_status === 'complete' ? 'complete' : 
             session.processing_status === 'processing' ? 'processing' : 
             session.processing_status === 'generating' ? 'generating' : 'complete') as 'complete' | 'generating' | 'processing' | 'failed',
    thumbnail: session.thumbnail_url,
    category: session.category,
  }));

  const categories = ["All", "Conference", "Earnings Call", "Board Meeting", "Investor Update"];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Browse All Sessions</h1>
            <p className="text-lg text-muted-foreground">
              Discover and explore your complete library of conference content
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search sessions, speakers, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-3 text-base border-0 bg-white shadow-sm"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-2"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Sessions Grid */}
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
          : "space-y-6"
        }>
          {transformedSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>

        {/* Empty State */}
        {transformedSessions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No sessions found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search terms or filters to find the content you're looking for
            </p>
          </div>
        )}
      </div>
    </div>
  );
}