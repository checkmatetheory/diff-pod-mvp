import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/95 shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Sidebar trigger and Logo */}
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
          <Link to="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="/diffused logo deep blue no bg (1).png" 
              alt="Diffused" 
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-foreground transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link to="/analytics" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Analytics
          </Link>
          <Link to="/events" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Events
          </Link>
          <Link to="/portfolios" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Portfolios
          </Link>
          <Link to="/settings" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Settings
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="hidden sm:flex bg-secondary text-secondary-foreground font-medium">
            Free Plan
          </Badge>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-secondary">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-secondary">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-secondary">
            <User className="h-4 w-4" />
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200">
            Upgrade Pro
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
