import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Mic
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-diffused.jpg";
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
      color: 'text-green-600'
    },
    {
      title: 'Sponsor Revenue',
      value: '$105K',
      change: '+$24K this month',
      icon: DollarSign,
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-8 lg:p-12">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Welcome to <span className="text-gradient-primary">Enterprise Dashboard</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Manage your conference portfolios, monitor automated content generation, 
            and track revenue across all your podcast brands.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="bg-accent hover:bg-accent-hover" onClick={() => navigate('/portfolios')}>
              <Building2 className="h-5 w-5 mr-2" />
              Manage Portfolios
            </Button>
            <Button variant="outline" size="lg" onClick={handleUploadClick}>
              Upload New Content
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 opacity-30">
          <img 
            src={heroImage} 
            alt="Enterprise Dashboard" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full bg-primary-subtle ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Portfolio Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Your Conference Portfolios</CardTitle>
              <CardDescription>
                AI-powered podcast generation with enterprise analytics
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/portfolios')}>View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <PortfolioGrid portfolios={portfolios} showCreateCard={false} />
        </CardContent>
      </Card>

      {/* Enterprise Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card hover:shadow-glow transition-shadow cursor-pointer" onClick={() => navigate('/portfolios')}>
          <CardContent className="p-6 text-center">
            <div className="p-3 rounded-full bg-primary-subtle w-fit mx-auto mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Portfolio Management</h3>
            <p className="text-sm text-muted-foreground">
              Create and manage conference portfolios with automated podcast generation
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-glow transition-shadow cursor-pointer" onClick={() => navigate('/analytics')}>
          <CardContent className="p-6 text-center">
            <div className="p-3 rounded-full bg-accent-subtle w-fit mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Enterprise Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track performance, revenue, and engagement across all portfolios
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-glow transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="p-3 rounded-full bg-green-100 w-fit mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Revenue Optimization</h3>
            <p className="text-sm text-muted-foreground">
              Maximize sponsor revenue with automated ad placement and analytics
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;