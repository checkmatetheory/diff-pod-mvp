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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="space-y-16">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/portfolios">
                <Button variant="ghost" size="lg">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold mb-2">{portfolioData.name}</h1>
                <p className="text-lg text-muted-foreground">Portfolio Analytics Dashboard</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link to={`/portfolio/${portfolioId}/calendar`}>
                <Button variant="outline" size="lg">
                  <Calendar className="h-5 w-5 mr-2" />
                  Calendar
                </Button>
              </Link>
              <Link to={`/portfolio/${portfolioId}/settings`}>
                <Button variant="outline" size="lg">Settings</Button>
              </Link>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="enhanced-stat-card">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Episodes</p>
                    <p className="text-2xl font-bold">{portfolioData.analytics.total_episodes}</p>
                    <div className="flex items-center gap-1 mt-3">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">+15% this month</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-primary/10">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-stat-card">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Views</p>
                    <p className="text-2xl font-bold">{formatNumber(portfolioData.analytics.total_views)}</p>
                    <div className="flex items-center gap-1 mt-3">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">+22% this month</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-accent/10">
                    <Eye className="h-5 w-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-stat-card">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Downloads</p>
                    <p className="text-2xl font-bold">{formatNumber(portfolioData.analytics.total_downloads)}</p>
                    <div className="flex items-center gap-1 mt-3">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">+18% this month</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50">
                    <Download className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="enhanced-stat-card">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Sponsor Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(portfolioData.analytics.total_sponsor_revenue)}
                    </p>
                    <div className="flex items-center gap-1 mt-3">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">+32% this month</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-green-50">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Overview */}
          <Card className="enhanced-card">
            <CardHeader className="pb-8">
              <CardTitle className="flex items-center gap-3 text-xl">
                <BarChart3 className="h-6 w-6" />
                Engagement Overview
              </CardTitle>
              <CardDescription className="text-base">
                Average listener engagement across all episodes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-8">
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Overall Engagement Rate</span>
                  <span className="font-semibold text-lg">{portfolioData.analytics.avg_engagement_rate}%</span>
                </div>
                <Progress value={portfolioData.analytics.avg_engagement_rate} className="h-3" />
                <div className="grid grid-cols-3 gap-8 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 mb-2">85%</p>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 mb-2">4.2</p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600 mb-2">32min</p>
                    <p className="text-sm text-muted-foreground">Avg Listen Time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Episodes Performance */}
          <Card className="enhanced-card">
            <CardHeader className="pb-8">
              <CardTitle className="text-xl">Recent Episodes Performance</CardTitle>
              <CardDescription className="text-base">
                Performance metrics for your latest podcast episodes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-6">
                {recentEpisodes.map((episode) => (
                  <div key={episode.id} className="border-0 rounded-2xl p-6 bg-muted/30 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{episode.title}</h3>
                        <p className="text-muted-foreground mb-6">{episode.date}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Views</span>
                            </div>
                            <p className="text-lg font-semibold">{formatNumber(episode.views)}</p>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Download className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Downloads</span>
                            </div>
                            <p className="text-lg font-semibold">{formatNumber(episode.downloads)}</p>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Revenue</span>
                            </div>
                            <p className="text-lg font-semibold text-green-600">{formatCurrency(episode.revenue)}</p>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <BarChart3 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Engagement</span>
                            </div>
                            <p className="text-lg font-semibold">{episode.engagement}%</p>
                          </div>
                        </div>
                      </div>
                      
                      <Link to={`/session/${episode.id}`}>
                        <Button variant="ghost" size="lg">
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
      </div>
    </div>
  );
};

export default PortfolioAnalytics;