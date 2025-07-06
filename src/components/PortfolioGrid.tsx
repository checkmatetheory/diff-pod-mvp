import { PortfolioCard } from "./PortfolioCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Create New Portfolio Card */}
      {showCreateCard && (
        <Card className="shadow-card hover:shadow-glow transition-all duration-300 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer">
          <Link to="/portfolio/new">
            <CardContent className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center">
              <div className="p-6 rounded-full bg-primary-subtle mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl mb-2">Create New Portfolio</CardTitle>
              <CardDescription>
                Add a new conference portfolio with custom branding and automation
              </CardDescription>
              <Button className="mt-4" variant="outline">
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
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <div className="p-6 rounded-full bg-muted mb-4">
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Portfolios Yet</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Create your first conference portfolio to start generating AI-powered podcasts with custom branding and automation.
          </p>
          <Link to="/portfolio/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Portfolio
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};