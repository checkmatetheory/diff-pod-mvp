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
  Plus,
  Settings
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
  { title: "All Speakers", url: "/speakers", icon: Users },
  { title: "Browse", url: "/browse", icon: Search },
  { title: "Favorites", url: "/favorites", icon: Star },
  { title: "Settings", url: "/settings", icon: Settings },
];

const contentTypeItems = [
  { title: "Conference Production", url: "#", icon: Building2 },
  { title: "Event Consulting", url: "#", icon: TrendingUp },
  { title: "Industry Reports", url: "#", icon: FileText },
];

interface AppSidebarProps {
  onCreateEvent?: () => void;
}

export function AppSidebar({ onCreateEvent }: AppSidebarProps = {}) {
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
          {!isCollapsed ? (
            <img 
              src="/diffused logo white no bg.png" 
              alt="Diffused" 
              className="h-10 w-auto"
            />
          ) : (
            <img 
              src="/diffused logo white no bg.png" 
              alt="Diffused" 
              className="h-8 w-auto"
            />
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
              variant="gradient-accent"
              size="sm" 
              className="w-full transition-all duration-300 font-semibold"
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
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={false}
                  onClick={(e) => {
                    e.preventDefault();
                    onCreateEvent?.();
                  }}
                >
                  <button className="flex items-center gap-3 w-full">
                    <Plus 
                      className="h-4 w-4 flex-shrink-0" 
                      style={{ color: "hsl(var(--accent))" }}
                    />
                    {!isCollapsed && <span className="truncate">Add New Event</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Service Centre */}
        <SidebarGroup>
          <SidebarGroupLabel>Service Centre</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentTypeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton className="flex items-center gap-3 cursor-default">
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-sidebar-border/50">
        {!isCollapsed && (
          <div className="text-xs text-sidebar-foreground/60 text-center">
            <p className="font-medium">Conference Virality Made Easy</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
