import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CachedAvatar from '@/components/ui/cached-avatar';
import { Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserMenu = () => {
  const { user, profile, signOut } = useAuth();

  if (!user) return null;

  const initials = user.email?.charAt(0).toUpperCase() || 'U';
  
  // Use profile avatar first, fall back to Google auth avatar
  const avatarUrl = profile?.avatar_url || 
                   user.user_metadata?.avatar_url || 
                   user.user_metadata?.picture;
  
  const fullName = profile?.display_name || 
                  user.user_metadata?.full_name || 
                  user.user_metadata?.name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <CachedAvatar 
            src={avatarUrl}
            alt={fullName || user.email || 'User'}
            fallback={initials}
            size="md"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {fullName || 'Account'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
