import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Download, 
  DollarSign, 
  Mic, 
  BarChart3,
  Settings,
  Calendar,
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";

interface PortfolioData {
  id: string;
  name: string;
  description: string;
  brand_logo_url?: string;
  category: string;
  analytics: {
    total_episodes: number;
    total_views: number;
    total_downloads: number;
    total_sponsor_revenue: number;
    avg_engagement_rate: number;
    episode_trend: 'up' | 'down' | 'stable';
  };
  website_monitor?: {
    website_url: string;
    is_active: boolean;
    last_check?: string;
  };
}

interface PortfolioCardProps {
  portfolio: PortfolioData;
}

export const PortfolioCard = ({ portfolio }: PortfolioCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  return (
    <Card className="shadow-card hover:shadow-glow transition-all duration-300 border-0 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {portfolio.brand_logo_url ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <img 
                  src={portfolio.brand_logo_url} 
                  alt={`${portfolio.name} logo`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary-subtle flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            )}
            
            <div className="flex-1">
              <CardTitle className="text-xl mb-1">{portfolio.name}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {portfolio.description || "Professional podcast portfolio"}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {portfolio.category}
                </Badge>
                {portfolio.website_monitor?.is_active && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    <Globe className="h-3 w-3 mr-1" />
                    Auto-Monitor
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to={`/portfolio/${portfolio.id}/settings`}>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Episode Count with Trend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{portfolio.analytics.total_episodes}</span>
            <span className="text-muted-foreground">episodes</span>
            {getTrendIcon(portfolio.analytics.episode_trend)}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Views</span>
            </div>
            <p className="text-lg font-semibold">{formatNumber(portfolio.analytics.total_views)}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Downloads</span>
            </div>
            <p className="text-lg font-semibold">{formatNumber(portfolio.analytics.total_downloads)}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(portfolio.analytics.total_sponsor_revenue)}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Engagement</span>
            </div>
            <p className="text-lg font-semibold">{portfolio.analytics.avg_engagement_rate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Engagement Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Engagement Rate</span>
            <span className="font-medium">{portfolio.analytics.avg_engagement_rate.toFixed(1)}%</span>
          </div>
          <Progress 
            value={portfolio.analytics.avg_engagement_rate} 
            className="h-2"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Link to={`/portfolio/${portfolio.id}/analytics`} className="flex-1">
            <Button variant="outline" className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Link to={`/portfolio/${portfolio.id}/calendar`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};