import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { 
  FileVideo, 
  FileText, 
  Share2, 
  Download, 
  Eye, 
  Clock, 
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Building2,
  DollarSign,
  Mic,
  ArrowUpRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
// Using new diffused media hero image
import { toast } from "@/hooks/use-toast";

interface SessionData {
  id: string;
  title: string;
  date: string;
  duration: string;
  speakers: number;
  status: 'complete' | 'processing' | 'pending';
  content: {
    summary: boolean;
    blog: boolean;
    social: boolean;
    transcript: boolean;
  };
  views: number;
  exports: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  
  const handleUploadClick = () => {
    toast({
      title: "Upload feature coming soon!",
      description: "We're working on the upload functionality. Check back soon!",
    });
  };
  
  // Mock portfolio data
  const portfolios = [
    {
      id: '1',
      name: 'FinTech Innovation Summit',
      description: 'Premier financial technology conference series',
      brand_logo_url: null,
      category: 'Financial Technology',
      analytics: {
        total_episodes: 24,
        total_views: 12500,
        total_downloads: 8900,
        total_sponsor_revenue: 45000,
        avg_engagement_rate: 78.5,
        episode_trend: 'up' as const,
      },
      website_monitor: {
        website_url: 'https://fintechsummit.com',
        is_active: true,
        last_check: '2024-01-15T10:30:00Z'
      }
    }
  ];

  const sessions: SessionData[] = [
    {
      id: '1',
      title: 'AI in Fintech: Future Trends Panel',
      date: '2024-01-15',
      duration: '47 min',
      speakers: 3,
      status: 'complete',
      content: {
        summary: true,
        blog: true,
        social: true,
        transcript: true
      },
      views: 234,
      exports: 12
    },
    {
      id: '2',
      title: 'Quarterly Investment Review',
      date: '2024-01-10',
      duration: '32 min',
      speakers: 2,
      status: 'processing',
      content: {
        summary: true,
        blog: false,
        social: false,
        transcript: true
      },
      views: 89,
      exports: 3
    }
  ];

  const stats = [
    {
      title: 'Total Portfolios',
      value: '3',
      change: '+1 this month',
      icon: Building2,
      color: 'text-primary'
    },
    {
      title: 'Total Episodes',
      value: '57',
      change: '+12 this week',
      icon: Mic,
      color: 'text-accent'
    },
    {
      title: 'Total Views',
      value: '29.4K',
      change: '+18% this month',
      icon: Eye,
      color: 'text-blue'
    },
    {
      title: 'Sponsor Revenue',
      value: '$105K',
      change: '+$24K this month',
      icon: DollarSign,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-12 shadow-lg">
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-4xl font-bold text-white mb-4">
                Welcome to <span className="text-accent-light">Diffused</span>
              </h1>
              <p className="text-xl text-white/95 mb-8 leading-relaxed">
                Manage your conference portfolios, monitor automated content generation, 
                and track revenue across all your podcast brands.
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-white text-primary hover:bg-white/95 font-semibold shadow-md" onClick={() => navigate('/portfolios')}>
                  <Building2 className="h-5 w-5 mr-2" />
                  Manage Portfolios
                </Button>
                <Button variant="outline" size="lg" className="border-white/80 text-white hover:bg-white/15 font-semibold" onClick={handleUploadClick}>
                  Upload Content
                </Button>
              </div>
            </div>
            <div className="absolute inset-0 opacity-30">
              <img 
                src="/diff media hero.png" 
                alt="Diffused Media" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-8">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.title} className="enhanced-stat-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold mb-1">{stat.value}</p>
                      <p className="text-sm text-green-600">{stat.change}</p>
                    </div>
                    <div className={`p-4 rounded-2xl bg-primary/10`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Your Portfolios</h2>
              <p className="text-muted-foreground">AI-powered podcast generation with enterprise analytics</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/portfolios')}>
              View All
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <PortfolioGrid portfolios={portfolios} showCreateCard={false} />
        </div>

        {/* Recent Activity */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-8">Recent Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((session) => (
              <Card key={session.id} className="enhanced-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">{session.date} • {session.duration}</p>
                    </div>
                    <Badge 
                      variant={session.status === 'complete' ? 'default' : 'secondary'}
                      className={
                        session.status === 'complete' 
                          ? 'bg-black text-white border-2 border-gray-400 hover:border-gray-600' 
                          : session.status === 'processing' 
                          ? 'bg-orange-100 text-orange-800 border-2 border-orange-300 hover:bg-orange-200'
                          : 'border-2 border-gray-300'
                      }
                    >
                      {session.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {session.speakers} speakers
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {session.views} views
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-8">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="enhanced-card cursor-pointer" onClick={() => navigate('/portfolios')}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Portfolio Management</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage conference portfolios with automated podcast generation
                </p>
              </CardContent>
            </Card>

            <Card className="enhanced-card cursor-pointer" onClick={() => navigate('/analytics')}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Enterprise Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track performance, revenue, and engagement across all portfolios
                </p>
              </CardContent>
            </Card>

            <Card className="enhanced-card cursor-pointer">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Revenue Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  Maximize sponsor revenue with automated ad placement and analytics
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;