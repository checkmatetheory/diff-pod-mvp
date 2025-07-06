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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Browse All Sessions</h1>
        <p className="text-muted-foreground">
          Discover and explore your complete library of conference content
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions, speakers, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge
            key={category}
            variant="secondary"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {category}
          </Badge>
        ))}
      </div>

      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
        : "space-y-4"
      }>
        {transformedSessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      {/* Empty State */}
      {transformedSessions.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No sessions found</CardTitle>
            <CardDescription>
              Try adjusting your search terms or filters
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}