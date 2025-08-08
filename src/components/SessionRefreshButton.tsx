import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

/**
 * 🔄 SESSION REFRESH BUTTON
 * 
 * A component that allows users to manually refresh their session
 * when they encounter JWT expiration issues.
 */

interface SessionRefreshButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
  className?: string;
}

export const SessionRefreshButton: React.FC<SessionRefreshButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  showText = true,
  className = ''
}) => {
  const { refreshSession, isSessionValid, session } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      await refreshSession();
      toast({
        title: "Session refreshed",
        description: "Your login session has been renewed successfully.",
      });
    } catch (error) {
      console.error('Manual refresh failed:', error);
      toast({
        title: "Refresh failed",
        description: "Could not refresh session. You may need to sign in again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show session status for debugging
  const getSessionStatus = () => {
    if (!session) return 'No session';
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const remainingMinutes = Math.floor((expiresAt - now) / 60);
    
    if (remainingMinutes <= 0) return 'Expired';
    if (remainingMinutes < 5) return `Expires in ${remainingMinutes}m`;
    return 'Valid';
  };

  const sessionStatus = getSessionStatus();
  const needsRefresh = !isSessionValid() || sessionStatus === 'Expired';

  return (
    <Button
      variant={needsRefresh ? 'default' : variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`${className} ${needsRefresh ? 'animate-pulse' : ''}`}
      title={`Session status: ${sessionStatus}. Click to refresh.`}
    >
      <RefreshCw 
        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} ${showText ? 'mr-2' : ''}`} 
      />
      {showText && (
        <span>
          {isRefreshing ? 'Refreshing...' : needsRefresh ? 'Refresh Session' : 'Refresh'}
        </span>
      )}
    </Button>
  );
};