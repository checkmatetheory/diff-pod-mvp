import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-18 items-center justify-between px-6">
        {/* Sidebar trigger and Logo */}
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gradient-primary">Diffused</h1>
              <p className="text-xs text-muted-foreground -mt-1 font-medium">AI-Powered Event Recaps</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link to="/settings" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Settings
          </Link>
          <Link to="/analytics" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Analytics
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="hidden sm:flex bg-primary-light text-primary border-primary/20">
            Free Plan
          </Badge>
          <Button variant="ghost" size="sm" className="hover:bg-primary-light">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-primary-light">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-primary-light">
            <User className="h-4 w-4" />
          </Button>
          <Button size="sm" className="bg-gradient-accent hover:shadow-accent transition-all duration-300">
            Upgrade Pro
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;