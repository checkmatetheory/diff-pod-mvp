import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Plus, 
  TrendingUp, 
  Eye, 
  DollarSign,
  Mic,
  Filter,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

const Portfolios = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Replace with real Supabase query
  const { data: portfolios = [], isLoading } = useQuery({
    queryKey: ['conference_portfolios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conference_portfolios')
        .select(`
          *,
          portfolio_analytics (
            total_episodes,
            total_views,
            total_downloads,
            total_sponsor_revenue,
            avg_engagement_rate
          ),
          website_monitors (
            website_url,
            is_active,
            last_check
          )
        `);
      
      if (error) throw error;
      
      return data?.map(portfolio => ({
        ...portfolio,
        analytics: {
          total_episodes: portfolio.portfolio_analytics?.[0]?.total_episodes || 0,
          total_views: portfolio.portfolio_analytics?.[0]?.total_views || 0,
          total_downloads: portfolio.portfolio_analytics?.[0]?.total_downloads || 0,
          total_sponsor_revenue: portfolio.portfolio_analytics?.[0]?.total_sponsor_revenue || 0,
          avg_engagement_rate: portfolio.portfolio_analytics?.[0]?.avg_engagement_rate || 0,
          episode_trend: 'stable' as const,
        },
        website_monitor: portfolio.website_monitors?.[0] || null,
        category: 'Conference' // Default category
      })) || [];
    }
  });

  // Fallback mock data for demo
  const mockPortfolios = [
    {
      id: '1',
      name: 'FinTech Innovation Summit',
      description: 'Premier financial technology conference series with cutting-edge insights from industry leaders and innovators.',
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
    },
    {
      id: '2',
      name: 'Healthcare Digital Transformation',
      description: 'Exploring the future of healthcare through digital innovation and AI-powered solutions.',
      brand_logo_url: null,
      category: 'Healthcare Technology',
      analytics: {
        total_episodes: 18,
        total_views: 9200,
        total_downloads: 6800,
        total_sponsor_revenue: 32000,
        avg_engagement_rate: 82.1,
        episode_trend: 'up' as const,
      },
      website_monitor: {
        website_url: 'https://healthtechconf.com',
        is_active: true,
        last_check: '2024-01-15T09:15:00Z'
      }
    },
    {
      id: '3',
      name: 'Sustainable Energy Forum',
      description: 'Leading discussions on renewable energy, climate technology, and sustainable business practices.',
      brand_logo_url: null,
      category: 'Clean Technology',
      analytics: {
        total_episodes: 15,
        total_views: 7800,
        total_downloads: 5200,
        total_sponsor_revenue: 28000,
        avg_engagement_rate: 75.3,
        episode_trend: 'stable' as const,
      },
      website_monitor: {
        website_url: 'https://sustainableenergyforum.com',
        is_active: false,
        last_check: '2024-01-10T14:20:00Z'
      }
    }
  ];

  // Use real data when available, fallback to mock for demo
  const displayPortfolios = portfolios.length > 0 ? portfolios : mockPortfolios;

  const filteredPortfolios = displayPortfolios.filter(portfolio =>
    portfolio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    portfolio.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStats = displayPortfolios.reduce((acc, portfolio) => ({
    episodes: acc.episodes + portfolio.analytics.total_episodes,
    views: acc.views + portfolio.analytics.total_views,
    downloads: acc.downloads + portfolio.analytics.total_downloads,
    revenue: acc.revenue + portfolio.analytics.total_sponsor_revenue,
  }), { episodes: 0, views: 0, downloads: 0, revenue: 0 });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading portfolios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conference Portfolios</h1>
          <p className="text-muted-foreground">
            Manage your enterprise podcast portfolios with automated content generation and analytics
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Create Portfolio
        </Button>
      </div>

      {/* Overall Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Episodes</p>
                <p className="text-2xl font-bold">{totalStats.episodes}</p>
              </div>
              <div className="p-3 rounded-full bg-primary-subtle">
                <Mic className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{formatNumber(totalStats.views)}</p>
              </div>
              <div className="p-3 rounded-full bg-accent-subtle">
                <Eye className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.revenue)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Portfolios</p>
                <p className="text-2xl font-bold">{displayPortfolios.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search portfolios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Portfolio Grid */}
      <PortfolioGrid portfolios={filteredPortfolios} showCreateCard={true} />

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Streamline your portfolio management with these enterprise tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <div className="font-semibold">Bulk Episode Generation</div>
                <div className="text-sm text-muted-foreground">Process multiple conference recordings at once</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <div className="font-semibold">Website Monitoring Setup</div>
                <div className="text-sm text-muted-foreground">Configure automated content detection</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <div className="font-semibold">Analytics Export</div>
                <div className="text-sm text-muted-foreground">Generate comprehensive performance reports</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolios;