-- Add analytics tracking tables for portfolios
CREATE TABLE public.portfolio_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.conference_portfolios(id) ON DELETE CASCADE,
  total_episodes INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  total_sponsor_revenue DECIMAL DEFAULT 0.00,
  avg_engagement_rate DECIMAL DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add episode analytics table
CREATE TABLE public.episode_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES public.conference_portfolios(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  engagement_rate DECIMAL DEFAULT 0.00,
  sponsor_revenue DECIMAL DEFAULT 0.00,
  listening_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add website monitoring configuration
CREATE TABLE public.website_monitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.conference_portfolios(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  selector_config JSONB, -- CSS selectors for content extraction
  monitoring_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  last_check TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.portfolio_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_monitors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their portfolio analytics" ON public.portfolio_analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.conference_portfolios WHERE id = portfolio_analytics.portfolio_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage their episode analytics" ON public.episode_analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.conference_portfolios WHERE id = episode_analytics.portfolio_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage their website monitors" ON public.website_monitors FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_episode_analytics_updated_at BEFORE UPDATE ON public.episode_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_website_monitors_updated_at BEFORE UPDATE ON public.website_monitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_portfolio_analytics_portfolio_id ON public.portfolio_analytics(portfolio_id);
CREATE INDEX idx_episode_analytics_session_id ON public.episode_analytics(session_id);
CREATE INDEX idx_episode_analytics_portfolio_id ON public.episode_analytics(portfolio_id);
CREATE INDEX idx_website_monitors_portfolio_id ON public.website_monitors(portfolio_id);
CREATE INDEX idx_website_monitors_user_id ON public.website_monitors(user_id);