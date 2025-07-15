import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  TrendingUp, 
  Eye, 
  DollarSign, 
  Mic, 
  BarChart3,
  ArrowUpRight
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

  return (
    <Card className="enhanced-portfolio-card group">
      <CardHeader className="pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">
                {portfolio.name}
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-medium">
                {portfolio.category}
              </Badge>
            </div>
          </div>
          <Link to={`/portfolio/${portfolio.id}/analytics`}>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-muted-foreground mb-8 line-clamp-2">
          {portfolio.description || "Professional podcast portfolio"}
        </p>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Episodes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{portfolio.analytics.total_episodes}</span>
              {portfolio.analytics.episode_trend === 'up' && (
                <TrendingUp className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Views</span>
            </div>
            <span className="text-2xl font-bold">{formatNumber(portfolio.analytics.total_views)}</span>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(portfolio.analytics.total_sponsor_revenue)}
            </span>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Engagement</span>
            </div>
            <span className="text-2xl font-bold">{portfolio.analytics.avg_engagement_rate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Action Button */}
        <Link to={`/portfolio/${portfolio.id}/analytics`} className="block">
          <Button variant="outline" className="w-full">
            View Analytics
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};