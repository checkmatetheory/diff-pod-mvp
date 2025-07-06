import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown,
  Eye, 
  Download, 
  DollarSign, 
  Users,
  Clock,
  BarChart3,
  Calendar,
  Mic
} from "lucide-react";
import { Link } from "react-router-dom";

const PortfolioAnalytics = () => {
  const { portfolioId } = useParams();

  // Mock data - in real app, fetch from Supabase
  const portfolioData = {
    id: portfolioId,
    name: "FinTech Innovation Summit",
    description: "Premier financial technology conference series",
    brand_logo_url: null,
    category: "Financial Technology",
    analytics: {
      total_episodes: 24,
      total_views: 12500,
      total_downloads: 8900,
      total_sponsor_revenue: 45000,
      avg_engagement_rate: 78.5,
      episode_trend: 'up' as const,
    }
  };

  const recentEpisodes = [
    {
      id: '1',
      title: 'AI in Banking: The Future is Now',
      date: '2024-01-15',
      views: 1200,
      downloads: 850,
      revenue: 2500,
      engagement: 82.3
    },
    {
      id: '2', 
      title: 'Crypto Regulations: What\'s Next?',
      date: '2024-01-10',
      views: 980,
      downloads: 720,
      revenue: 1800,
      engagement: 75.1
    },
    {
      id: '3',
      title: 'Digital Payments Revolution',
      date: '2024-01-05',
      views: 1450,
      downloads: 1100,
      revenue: 3200,
      engagement: 89.2
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/portfolios">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{portfolioData.name}</h1>
            <p className="text-muted-foreground">Portfolio Analytics Dashboard</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/portfolio/${portfolioId}/calendar`}>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
          </Link>
          <Link to={`/portfolio/${portfolioId}/settings`}>
            <Button variant="outline">Settings</Button>
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Episodes</p>
                <p className="text-3xl font-bold">{portfolioData.analytics.total_episodes}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+15% this month</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-primary-subtle">
                <Mic className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-3xl font-bold">{formatNumber(portfolioData.analytics.total_views)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+22% this month</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-accent-subtle">
                <Eye className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-3xl font-bold">{formatNumber(portfolioData.analytics.total_downloads)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+18% this month</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sponsor Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(portfolioData.analytics.total_sponsor_revenue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+32% this month</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Engagement Overview
          </CardTitle>
          <CardDescription>
            Average listener engagement across all episodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Engagement Rate</span>
              <span className="font-semibold">{portfolioData.analytics.avg_engagement_rate}%</span>
            </div>
            <Progress value={portfolioData.analytics.avg_engagement_rate} className="h-3" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">85%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">4.2</p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">32min</p>
                <p className="text-sm text-muted-foreground">Avg Listen Time</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Episodes Performance */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Episodes Performance</CardTitle>
          <CardDescription>
            Performance metrics for your latest podcast episodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEpisodes.map((episode) => (
              <div key={episode.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{episode.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{episode.date}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Views</span>
                        </div>
                        <p className="font-semibold">{formatNumber(episode.views)}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Downloads</span>
                        </div>
                        <p className="font-semibold">{formatNumber(episode.downloads)}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Revenue</span>
                        </div>
                        <p className="font-semibold text-green-600">{formatCurrency(episode.revenue)}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Engagement</span>
                        </div>
                        <p className="font-semibold">{episode.engagement}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link to={`/session/${episode.id}`}>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioAnalytics;