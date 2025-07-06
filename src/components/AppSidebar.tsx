import { useState } from "react";
import { 
  Home, 
  Calendar, 
  Building2, 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  Star, 
  History,
  PlayCircle,
  Headphones,
  Video,
  Archive,
  Search,
  Plus
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Portfolios", url: "/portfolios", icon: Archive },
  { title: "Browse", url: "/browse", icon: Search },
  { title: "Favorites", url: "/favorites", icon: Star },
  { title: "Settings", url: "/settings", icon: Users },
];

const eventPortfolioItems = [
  { title: "Add New Event", url: "/events/new", icon: Plus, color: "hsl(var(--accent))" },
  { title: "New Portfolio", url: "/portfolio/new", icon: Plus, color: "hsl(var(--primary))" },
];

const contentTypeItems = [
  { title: "Video + Audio", url: "/content/video_audio", icon: Video },
  { title: "Audio Only", url: "/content/audio_only", icon: Headphones },
  { title: "Transcripts", url: "/content/transcript", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item, showColor = false }: { item: any; showColor?: boolean }) => (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive(item.url)}>
        <NavLink to={item.url} className="flex items-center gap-3">
          <item.icon 
            className="h-4 w-4 flex-shrink-0" 
            style={showColor && item.color ? { color: item.color } : {}}
          />
          {!isCollapsed && <span className="truncate">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-primary">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="font-display font-bold text-xl text-gradient-primary truncate">Diffused</h2>
              <p className="text-xs text-sidebar-foreground/70 truncate font-medium">AI Event Recaps</p>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <div className="mt-6 space-y-3">
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 bg-sidebar-accent/10 border-sidebar-border/50 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
            />
            <Button 
              size="sm" 
              className="w-full bg-gradient-accent hover:shadow-accent transition-all duration-300 text-white hover:text-white"
              onClick={() => navigate('/upload')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Session
            </Button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <NavItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Event Management */}
        <SidebarGroup>
          <SidebarGroupLabel>Event Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {eventPortfolioItems.map((item) => (
                <NavItem key={item.title} item={item} showColor={true} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Browse by Content Type */}
        <SidebarGroup>
          <SidebarGroupLabel>Content Type</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentTypeItems.map((item) => (
                <NavItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-sidebar-border/50">
        {!isCollapsed && (
          <div className="text-xs text-sidebar-foreground/60 text-center">
            <p className="font-medium">Organize your portfolio</p>
            <p>conference content</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}