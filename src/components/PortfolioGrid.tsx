import { PortfolioCard } from "./PortfolioCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
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

interface PortfolioGridProps {
  portfolios: PortfolioData[];
  showCreateCard?: boolean;
}

export const PortfolioGrid = ({ portfolios, showCreateCard = true }: PortfolioGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Create New Portfolio Card */}
      {showCreateCard && (
        <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/30 transition-colors bg-white">
          <Link to="/portfolio/new">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[320px]">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Create New Portfolio</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Add a new conference portfolio with custom branding and automation
              </p>
              <Button variant="outline" size="lg">
                <Building2 className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </CardContent>
          </Link>
        </Card>
      )}

      {/* Portfolio Cards */}
      {portfolios.map((portfolio) => (
        <PortfolioCard key={portfolio.id} portfolio={portfolio} />
      ))}

      {/* Empty State */}
      {portfolios.length === 0 && !showCreateCard && (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">No Portfolios Yet</h3>
          <p className="text-muted-foreground mb-8 max-w-md">
            Create your first conference portfolio to start generating AI-powered podcasts with custom branding and automation.
          </p>
          <Link to="/portfolio/new">
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Portfolio
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};