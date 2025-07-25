import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

// Hidden component that preloads all user avatars
export const AvatarPreloader = () => {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) return;

    const avatarsToPreload = [
      profile?.avatar_url,
      user.user_metadata?.avatar_url,
      user.user_metadata?.picture,
    ].filter(Boolean);

    // Preload all potential avatar URLs
    avatarsToPreload.forEach(url => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [user, profile]);

  return null; // This component renders nothing
}; 