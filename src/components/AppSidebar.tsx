import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Home,
  Settings,
  Upload,
  BarChart3,
  Star,
  Users,
  Search,
  Plus
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";

// Define proper interface for navigation items
interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
}

// Define navigation items
const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "All Speakers", url: "/speakers", icon: Users },
  { title: "Browse", url: "/browse", icon: Search },
  { title: "Favorites", url: "/favorites", icon: Star },
  { title: "Settings", url: "/settings", icon: Settings },
];

const contentTypeItems: NavItem[] = [
  { title: "Upload Session", url: "/upload", icon: Upload },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item, showColor = false }: { item: NavItem; showColor?: boolean }) => (
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
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/50 bg-sidebar/95 backdrop-blur-sm p-4">
        <div className="flex items-center">
          {!isCollapsed && (
            <img 
              src="/diffused logo white no bg.png" 
              alt="Diffused" 
              className="h-10 w-auto transition-all duration-200"
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
              variant="default"
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

      <SidebarContent className="bg-sidebar/95 backdrop-blur-sm">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-medium tracking-wider">
            NAVIGATION
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-medium tracking-wider">
            QUICK ACTIONS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {contentTypeItems.map((item) => (
                <NavItem key={item.url} item={item} showColor />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 bg-sidebar/95 backdrop-blur-sm p-4">
        {!isCollapsed && (
          <div className="text-xs text-sidebar-foreground/60 text-center">
            <p className="font-medium">Conference Virality Made Easy</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}