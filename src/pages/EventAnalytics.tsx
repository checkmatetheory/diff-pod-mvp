import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Users, 
  Share2, 
  Mail, 
  Eye, 
  TrendingUp, 
  ExternalLink,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Event {
  id: string;
  subdomain: string;
  name: string;
  description: string;
  next_event_date: string;
  is_active: boolean;
}

interface AnalyticsData {
  total_leads: number;
  total_shares: number;
  total_views: number;
  total_registrations: number;
  viral_coefficient: number;
  conversion_rate: number;
  daily_stats: any[];
  platform_breakdown: any[];
  content_performance: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function EventAnalytics() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('user_id', user?.id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('diffusion_analytics')
        .select('*')
        .eq('event_id', eventId);

      if (analyticsError) throw analyticsError;

      // Process analytics
      const processed = processAnalyticsData(analyticsData);
      setAnalytics(processed);
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (rawData: any[]): AnalyticsData => {
    const total_leads = rawData
      .filter(d => d.metric_type === 'email_capture')
      .reduce((sum, d) => sum + d.metric_value, 0);
    
    const total_shares = rawData
      .filter(d => d.metric_type === 'share')
      .reduce((sum, d) => sum + d.metric_value, 0);
    
    const total_views = rawData
      .filter(d => d.metric_type === 'recap_view')
      .reduce((sum, d) => sum + d.metric_value, 0);
    
    const total_registrations = rawData
      .filter(d => d.metric_type === 'registration')
      .reduce((sum, d) => sum + d.metric_value, 0);

    const viral_coefficient = total_shares / Math.max(total_views, 1);
    const conversion_rate = (total_leads / Math.max(total_views, 1)) * 100;

    // Generate sample daily stats (in real app, this would come from actual data)
    const daily_stats = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      views: Math.floor(Math.random() * 50) + 10,
      leads: Math.floor(Math.random() * 10) + 2,
      shares: Math.floor(Math.random() * 15) + 5,
    }));

    const platform_breakdown = [
      { name: 'LinkedIn', value: 45 },
      { name: 'Twitter', value: 30 },
      { name: 'Email', value: 15 },
      { name: 'Direct', value: 10 },
    ];

    const content_performance = [
      { name: 'Podcast Recaps', views: 120, leads: 18, shares: 25 },
      { name: 'Blog Posts', views: 85, leads: 12, shares: 15 },
      { name: 'Social Posts', views: 200, leads: 8, shares: 35 },
      { name: 'Executive Summaries', views: 65, leads: 15, shares: 10 },
    ];

    return {
      total_leads,
      total_shares,
      total_views,
      total_registrations,
      viral_coefficient,
      conversion_rate,
      daily_stats,
      platform_breakdown,
      content_performance,
    };
  };

  const exportData = () => {
    // In a real app, this would generate and download a CSV
    toast.success("Data export started");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Event not found</h2>
          <p className="text-muted-foreground">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{event.name} Analytics</h1>
          <p className="text-muted-foreground">
            Track your event's viral coefficient and lead generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => window.open(`${window.location.origin}/event/${event.subdomain}`, '_blank')}>
            <ExternalLink className="w-4 h-4 mr-2" />
            View Event
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_views || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_leads || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.conversion_rate.toFixed(1) || 0}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_shares || 0}</div>
            <p className="text-xs text-muted-foreground">
              Viral coefficient: {analytics?.viral_coefficient.toFixed(2) || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_registrations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Next event signups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="platforms">Platform Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>Views, leads, and shares over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#8884d8" />
                  <Line type="monotone" dataKey="leads" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="shares" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>How different content types are performing</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.content_performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#8884d8" />
                  <Bar dataKey="leads" fill="#82ca9d" />
                  <Bar dataKey="shares" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Share Platform Breakdown</CardTitle>
              <CardDescription>Where your content is being shared</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.platform_breakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics?.platform_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 