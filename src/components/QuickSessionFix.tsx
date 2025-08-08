import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * 🚨 QUICK SESSION FIX COMPONENT
 * 
 * This component helps fix JWT expiration issues by providing
 * manual session refresh and debugging tools.
 */

export const QuickSessionFix: React.FC = () => {
  const { user, session, signOut } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string>('Checking...');

  // Check session validity
  const checkSession = () => {
    if (!session) return 'No session';
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const remainingMinutes = Math.floor((expiresAt - now) / 60);
    
    if (remainingMinutes <= 0) return '🚨 EXPIRED';
    if (remainingMinutes < 5) return `⚠️ Expires in ${remainingMinutes} minutes`;
    return `✅ Valid for ${remainingMinutes} minutes`;
  };

  // Manual session refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      console.log('🔄 Manually refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Session refresh failed:', error);
        toast({
          title: "Refresh failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (data.session) {
        console.log('✅ Session refreshed successfully');
        toast({
          title: "Session refreshed!",
          description: "Your login session has been renewed.",
        });
        // Force page reload to clear any cached 401 errors
        window.location.reload();
      }
    } catch (error: any) {
      console.error('💥 Critical session refresh error:', error);
      toast({
        title: "Session expired",
        description: "Please sign in again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Test API access
  const testAPIAccess = async () => {
    setIsTesting(true);
    
    try {
      console.log('🧪 Testing API access...');
      const { data, error } = await supabase
        .from('user_sessions')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ API test failed:', error);
        setSessionStatus(`❌ API Error: ${error.message}`);
        toast({
          title: "API test failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('✅ API test successful');
        setSessionStatus('✅ API access working');
        toast({
          title: "API test successful",
          description: "Your session is working properly.",
        });
      }
    } catch (error: any) {
      console.error('💥 API test error:', error);
      setSessionStatus(`💥 Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Force sign out and back in
  const handleForceReauth = async () => {
    if (confirm('This will sign you out and redirect to login. Continue?')) {
      await signOut();
    }
  };

  React.useEffect(() => {
    setSessionStatus(checkSession());
  }, [session]);

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>🚨 Session Issue</CardTitle>
          <CardDescription>No user session found</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = '/auth'} className="w-full">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Session Diagnostics
        </CardTitle>
        <CardDescription>
          Fix JWT expiration and session issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Session Status */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium">Current Status:</p>
          <p className="text-lg">{sessionStatus}</p>
          <p className="text-xs text-gray-500 mt-1">
            User: {user.email}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="w-full"
            variant="default"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
          </Button>

          <Button 
            onClick={testAPIAccess} 
            disabled={isTesting}
            className="w-full"
            variant="outline"
          >
            <CheckCircle className={`h-4 w-4 mr-2 ${isTesting ? 'animate-pulse' : ''}`} />
            {isTesting ? 'Testing...' : 'Test API Access'}
          </Button>

          <Button 
            onClick={handleForceReauth} 
            className="w-full"
            variant="destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out & Back In
          </Button>
        </div>

        {/* Debug Info */}
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-[10px] overflow-auto">
            {JSON.stringify({
              hasSession: !!session,
              expiresAt: session?.expires_at,
              now: Math.floor(Date.now() / 1000),
              userId: user?.id,
            }, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};