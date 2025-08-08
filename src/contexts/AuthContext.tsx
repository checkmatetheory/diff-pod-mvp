import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: UserProfile) => void;
  refreshSession: () => Promise<void>;
  isSessionValid: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Calculate overall loading state - loading until BOTH auth and profile are done
  const loading = authLoading || profileLoading;

  // Load profile data when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const loadProfile = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', { event, hasSession: !!session, exp: session?.expires_at });
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setProfile(null);
        } else if (event === 'SESSION_EXPIRED') {
          console.log('⚠️ Session expired, attempting refresh...');
          await refreshSession();
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting session:', error);
        if (error.message?.includes('JWT') || error.message?.includes('expired')) {
          console.log('🔄 JWT expired, clearing session...');
          setSession(null);
          setUser(null);
        }
      } else {
        console.log('✅ Session loaded:', { hasSession: !!session, exp: session?.expires_at });
        setSession(session);
        setUser(session?.user ?? null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Function to update profile data from Settings
  const updateProfile = (profileData: UserProfile) => {
    setProfile(profileData);
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    // Force session refresh
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to Diffused!",
        description: "Your account has been created successfully.",
      });
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    // Force session refresh
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) {
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null); // Clear profile on sign out
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
    window.location.href = "/auth";
  };

  // Manual session refresh function
  const refreshSession = async () => {
    try {
      console.log('🔄 Manually refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Session refresh failed:', error);
        if (error.message?.includes('refresh_token_not_found') || 
            error.message?.includes('invalid_grant')) {
          console.log('🚪 Refresh token invalid, signing out...');
          await signOut();
          return;
        }
        throw error;
      }
      
      if (data.session) {
        console.log('✅ Session refreshed successfully');
        setSession(data.session);
        setUser(data.session.user);
        toast({
          title: "Session refreshed",
          description: "Your session has been renewed.",
        });
      }
    } catch (error) {
      console.error('💥 Critical session refresh error:', error);
      toast({
        title: "Session expired",
        description: "Please sign in again.",
        variant: "destructive",
      });
      await signOut();
    }
  };

  // Check if current session is valid
  const isSessionValid = () => {
    if (!session) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const bufferTime = 300; // 5 minutes buffer
    
    const isValid = expiresAt > (now + bufferTime);
    console.log('🔍 Session validity check:', { 
      isValid, 
      expiresAt, 
      now, 
      remainingMinutes: Math.floor((expiresAt - now) / 60) 
    });
    
    return isValid;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshSession,
    isSessionValid,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
