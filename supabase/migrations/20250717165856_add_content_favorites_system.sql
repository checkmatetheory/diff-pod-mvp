-- Migration: Add Content Favorites System for Photos and Reels
-- Created: 2025-01-08
-- Description: Add tables for content items (photos/reels) and update favorites system

-- Create content items table for photos and reels
CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('photo', 'reel')),
  thumbnail_url TEXT NOT NULL,
  content_url TEXT,
  speaker_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  description TEXT,
  duration INTEGER, -- for reels (in seconds)
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create content favorites table (separate from session favorites)
CREATE TABLE public.content_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_item_id)
);

-- Enable RLS
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for content_items (public read, authenticated users can create)
CREATE POLICY "Anyone can view content items" 
ON public.content_items 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create content items" 
ON public.content_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own content items" 
ON public.content_items 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Create RLS policies for content_favorites
CREATE POLICY "Users can view their own content favorites" 
ON public.content_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content favorites" 
ON public.content_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content favorites" 
ON public.content_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_content_items_type ON public.content_items(type);
CREATE INDEX idx_content_items_speaker ON public.content_items(speaker_name);
CREATE INDEX idx_content_items_event ON public.content_items(event_name);
CREATE INDEX idx_content_items_created_at ON public.content_items(created_at DESC);

CREATE INDEX idx_content_favorites_user_content ON public.content_favorites(user_id, content_item_id);
CREATE INDEX idx_content_favorites_user_id ON public.content_favorites(user_id);
CREATE INDEX idx_content_favorites_created_at ON public.content_favorites(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_content_items_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo content items matching the Browse page data
INSERT INTO public.content_items (title, type, thumbnail_url, speaker_name, event_name, description) VALUES
('AI Innovation Discussion', 'reel', '/api/placeholder/400/600', 'Dr. Alex Chen', 'Tech Summit 2024', 'Groundbreaking discussion on AI innovation and its impact on technology'),
('Future of Work Panel', 'reel', '/api/placeholder/400/600', 'Sarah Johnson', 'Innovation Conference', 'Panel discussion about remote work and digital transformation'),
('Leadership Workshop', 'photo', '/api/placeholder/400/600', 'Mike Rodriguez', 'Business Summit', 'Interactive workshop on modern leadership principles'),
('Startup Pitch Session', 'reel', '/api/placeholder/400/600', 'Emma Davis', 'Entrepreneur Expo', 'Exciting startup pitches from emerging companies'),
('Panel Discussion', 'photo', '/api/placeholder/400/600', 'Dr. James Wilson', 'Innovation Summit', 'Expert panel on industry trends and insights'),
('Keynote Presentation', 'photo', '/api/placeholder/400/600', 'Lisa Chang', 'Tech Conference', 'Inspiring keynote on technology and innovation'),
('Product Demo', 'reel', '/api/placeholder/400/600', 'David Park', 'Product Summit', 'Live demonstration of cutting-edge products'),
('Networking Session', 'photo', '/api/placeholder/400/600', 'Maria Garcia', 'Business Forum', 'Professional networking and relationship building'),
('Investment Strategy', 'reel', '/api/placeholder/400/600', 'Robert Kim', 'Finance Summit', 'Strategic insights on modern investment approaches'),
('Team Building', 'photo', '/api/placeholder/400/600', 'Jennifer Lopez', 'Leadership Retreat', 'Team building exercises and collaboration techniques'),
('Marketing Insights', 'reel', '/api/placeholder/400/600', 'Kevin Zhang', 'Digital Marketing Expo', 'Latest trends in digital marketing and customer engagement'),
('Innovation Workshop', 'photo', '/api/placeholder/400/600', 'Amanda Taylor', 'Creative Conference', 'Hands-on workshop on innovation and creative thinking'); 