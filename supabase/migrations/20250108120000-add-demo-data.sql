-- Migration: Add Demo Data for Testing
-- Created: 2025-01-08
-- Description: Populate the system with comprehensive sample data for testing all features

-- Note: This migration creates demo data for testing purposes
-- In production, you may want to remove or modify this data

-- Insert demo events
INSERT INTO public.events (id, name, subdomain, description, next_event_date, is_active, branding_config, user_id) VALUES
-- Assuming we have a demo user, we'll use a placeholder user_id that should be replaced with actual test user
('550e8400-e29b-41d4-a716-446655440001', 
 'Tech Summit 2024', 
 'tech-summit-2024', 
 'The premier technology conference featuring industry leaders sharing insights on AI, blockchain, and the future of tech.', 
 '2024-12-15 09:00:00+00',
 true,
 '{"primary_color": "#5B9BD5", "secondary_color": "#4A8BC2", "logo_url": null, "cta_text": "Register for Tech Summit 2025", "cta_url": "https://techsummit.example.com/register"}',
 'auth.uid()'),

('550e8400-e29b-41d4-a716-446655440002',
 'AI Revolution Conference',
 'ai-revolution-2024',
 'Exploring the transformative power of artificial intelligence across industries with top AI researchers and practitioners.',
 '2025-03-20 10:00:00+00',
 true,
 '{"primary_color": "#10b981", "secondary_color": "#047857", "logo_url": null, "cta_text": "Join AI Revolution 2025", "cta_url": "https://airevolution.example.com/tickets"}',
 'auth.uid()'),

('550e8400-e29b-41d4-a716-446655440003',
 'Startup Accelerator Demo Day',
 'startup-demo-day-2024',
 'Watch the next generation of startups pitch their revolutionary ideas to investors and industry experts.',
 '2024-11-30 14:00:00+00',
 true,
 '{"primary_color": "#f97316", "secondary_color": "#ea580c", "logo_url": null, "cta_text": "Apply for Next Cohort", "cta_url": "https://startupaccelerator.example.com/apply"}',
 'auth.uid()');

-- Insert demo speakers
INSERT INTO public.speakers (id, full_name, email, bio, headshot_url, company, job_title, linkedin_url, twitter_handle, slug) VALUES
('550e8400-e29b-41d4-a716-446655440101',
 'Sarah Chen',
 'sarah.chen@example.com',
 'Sarah is the Chief Technology Officer at CloudScale Technologies, where she leads innovation in distributed systems and AI infrastructure. With over 15 years of experience, she has built systems that serve millions of users worldwide.',
 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
 'CloudScale Technologies',
 'Chief Technology Officer',
 'https://linkedin.com/in/sarahchen-cto',
 '@sarahchen_tech',
 'sarah-chen'),

('550e8400-e29b-41d4-a716-446655440102',
 'Marcus Rodriguez',
 'marcus.rodriguez@example.com',
 'Marcus is a serial entrepreneur and AI researcher who has founded three successful startups in the machine learning space. He currently serves as CEO of Neural Dynamics, a company building the next generation of autonomous AI systems.',
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
 'Neural Dynamics',
 'CEO & Founder',
 'https://linkedin.com/in/marcusrodriguez-ai',
 '@marcusrodriguez',
 'marcus-rodriguez'),

('550e8400-e29b-41d4-a716-446655440103',
 'Dr. Priya Sharma',
 'priya.sharma@example.com',
 'Dr. Sharma is a renowned computer science researcher specializing in quantum computing and cryptography. She leads the Quantum Computing Lab at MIT and has published over 50 papers in top-tier journals.',
 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
 'MIT Quantum Computing Lab',
 'Professor & Lab Director',
 'https://linkedin.com/in/priyasharma-quantum',
 '@priyasharma_quantum',
 'priya-sharma'),

('550e8400-e29b-41d4-a716-446655440104',
 'James Thompson',
 'james.thompson@example.com',
 'James is the VP of Engineering at DataFlow Inc., where he oversees the development of real-time analytics platforms. His expertise spans from distributed systems to user experience design.',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
 'DataFlow Inc.',
 'VP of Engineering',
 'https://linkedin.com/in/jamesthompson-eng',
 '@jamesthompson_dev',
 'james-thompson'),

('550e8400-e29b-41d4-a716-446655440105',
 'Lisa Wang',
 'lisa.wang@example.com',
 'Lisa is a fintech innovator and the founder of PayTech Solutions. She has revolutionized digital payments across emerging markets and speaks frequently about financial inclusion.',
 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
 'PayTech Solutions',
 'Founder & CEO',
 'https://linkedin.com/in/lisawang-fintech',
 '@lisawang_fintech',
 'lisa-wang');

-- Insert demo speaker microsites
INSERT INTO public.speaker_microsites (id, event_id, speaker_id, microsite_url, custom_cta_text, custom_cta_url, brand_colors, custom_logo_url, approval_status, is_live, total_views, total_shares, approved_by, approved_at, published_at) VALUES
('550e8400-e29b-41d4-a716-446655440201',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440101',
 'sarah-chen-tech-summit',
 'Register for Tech Summit 2025',
 'https://techsummit.example.com/register',
 '{"primary": "#5B9BD5", "accent": "#4A8BC2"}',
 null,
 'approved',
 true,
 1247,
 89,
 'auth.uid()',
 now() - interval '2 days',
 now() - interval '2 days'),

('550e8400-e29b-41d4-a716-446655440202',
 '550e8400-e29b-41d4-a716-446655440002',
 '550e8400-e29b-41d4-a716-446655440102',
 'marcus-rodriguez-ai-revolution',
 'Join AI Revolution 2025',
 'https://airevolution.example.com/tickets',
 '{"primary": "#10b981", "accent": "#047857"}',
 null,
 'approved',
 true,
 856,
 67,
 'auth.uid()',
 now() - interval '1 day',
 now() - interval '1 day'),

('550e8400-e29b-41d4-a716-446655440203',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440103',
 'priya-sharma-tech-summit',
 'Learn About Quantum Computing',
 'https://quantumcomputing.example.com/course',
 '{"primary": "#5B9BD5", "accent": "#4A8BC2"}',
 null,
 'approved',
 true,
 2156,
 134,
 'auth.uid()',
 now() - interval '3 days',
 now() - interval '3 days'),

('550e8400-e29b-41d4-a716-446655440204',
 '550e8400-e29b-41d4-a716-446655440003',
 '550e8400-e29b-41d4-a716-446655440104',
 'james-thompson-startup-demo',
 'Apply for Next Cohort',
 'https://startupaccelerator.example.com/apply',
 '{"primary": "#f97316", "accent": "#ea580c"}',
 null,
 'pending',
 false,
 0,
 0,
 null,
 null,
 null),

('550e8400-e29b-41d4-a716-446655440205',
 '550e8400-e29b-41d4-a716-446655440002',
 '550e8400-e29b-41d4-a716-446655440105',
 'lisa-wang-ai-revolution',
 'Explore AI in Fintech',
 'https://fintech-ai.example.com/summit',
 '{"primary": "#10b981", "accent": "#047857"}',
 null,
 'approved',
 true,
 692,
 43,
 'auth.uid()',
 now() - interval '12 hours',
 now() - interval '12 hours');

-- Insert demo speaker content
INSERT INTO public.speaker_content (id, microsite_id, generated_summary, key_quotes, key_takeaways, video_clips, highlight_reel_url, processing_status) VALUES
('550e8400-e29b-41d4-a716-446655440301',
 '550e8400-e29b-41d4-a716-446655440201',
 'Sarah Chen delivered an insightful presentation on the evolution of cloud infrastructure and its impact on modern software development. She discussed how distributed systems have transformed from simple client-server architectures to complex microservices ecosystems that can scale to serve billions of users. Her talk covered key architectural patterns, real-world case studies from CloudScale Technologies, and predictions for the future of cloud computing including edge computing, serverless architectures, and AI-driven infrastructure optimization.',
 '["The future of infrastructure is not just about scale, but about intelligent adaptation to user needs.", "We are moving from reactive systems to predictive infrastructure that anticipates demand.", "The biggest challenge in distributed systems is not the technology, but managing complexity at scale.", "Every startup should think about global scale from day one, even if they are serving just local customers."]',
 '["Microservices architecture enables teams to move faster but requires strong DevOps practices", "Edge computing will become critical for low-latency applications", "AI-driven infrastructure optimization can reduce costs by 30-40%", "Container orchestration is essential for modern cloud deployments", "Observability must be built into systems from the beginning"]',
 '[{"url": "https://example.com/video/sarah-chen-1.mp4", "title": "The Evolution of Cloud Architecture", "duration": 120, "timestamp": 300}, {"url": "https://example.com/video/sarah-chen-2.mp4", "title": "Scaling to Billions of Users", "duration": 180, "timestamp": 1200}, {"url": "https://example.com/video/sarah-chen-3.mp4", "title": "Future of Infrastructure", "duration": 150, "timestamp": 2100}]',
 'https://example.com/video/sarah-chen-highlights.mp4',
 'complete'),

('550e8400-e29b-41d4-a716-446655440302',
 '550e8400-e29b-41d4-a716-446655440202',
 'Marcus Rodriguez presented a compelling vision for the future of autonomous AI systems and their potential to revolutionize industries. His talk explored the current state of AI research, breakthrough developments in neural architecture, and the practical challenges of deploying AI systems in production environments. He shared insights from building Neural Dynamics and discussed the ethical considerations that must guide AI development as these systems become more capable and autonomous.',
 '["AI is not about replacing humans, but about amplifying human capabilities in ways we never imagined.", "The next breakthrough in AI will come from systems that can learn continuously and adapt to new environments.", "We need to build AI systems with ethics and transparency as core architectural principles.", "The companies that win in AI will be those that solve real problems, not just impressive demos."]',
 '["Continuous learning systems outperform static models in dynamic environments", "Ethical AI requires diverse teams and inclusive design processes", "Production AI systems need robust monitoring and explainability", "The AI talent shortage requires creative approaches to team building", "Open source AI tools are democratizing innovation"]',
 '[{"url": "https://example.com/video/marcus-rodriguez-1.mp4", "title": "The Future of Autonomous AI", "duration": 200, "timestamp": 180}, {"url": "https://example.com/video/marcus-rodriguez-2.mp4", "title": "Building Neural Dynamics", "duration": 160, "timestamp": 1500}, {"url": "https://example.com/video/marcus-rodriguez-3.mp4", "title": "Ethics in AI Development", "duration": 140, "timestamp": 2200}]',
 'https://example.com/video/marcus-rodriguez-highlights.mp4',
 'complete'),

('550e8400-e29b-41d4-a716-446655440303',
 '550e8400-e29b-41d4-a716-446655440203',
 'Dr. Priya Sharma provided a fascinating deep dive into quantum computing and its potential to solve previously intractable problems. She explained quantum principles in accessible terms, demonstrated current quantum algorithms, and discussed the timeline for quantum advantage in various domains including cryptography, optimization, and drug discovery. Her presentation also addressed the challenges of quantum error correction and the race to build fault-tolerant quantum computers.',
 '["Quantum computing is not just faster computing, it is fundamentally different computing.", "We are still in the early days of quantum - think of where classical computers were in the 1940s.", "The quantum advantage will first appear in very specific problem domains, not general computing.", "Every organization should start thinking about quantum-safe cryptography today."]',
 '["Quantum computers excel at optimization and simulation problems", "Quantum cryptography will revolutionize information security", "Current quantum computers are noisy and limited but rapidly improving", "Quantum algorithms require entirely different programming paradigms", "The quantum workforce needs interdisciplinary skills combining physics and computer science"]',
 '[{"url": "https://example.com/video/priya-sharma-1.mp4", "title": "Quantum Computing Fundamentals", "duration": 190, "timestamp": 240}, {"url": "https://example.com/video/priya-sharma-2.mp4", "title": "Quantum Algorithms in Practice", "duration": 170, "timestamp": 1300}, {"url": "https://example.com/video/priya-sharma-3.mp4", "title": "The Future of Quantum", "duration": 160, "timestamp": 2000}]',
 'https://example.com/video/priya-sharma-highlights.mp4',
 'complete'),

('550e8400-e29b-41d4-a716-446655440304',
 '550e8400-e29b-41d4-a716-446655440205',
 'Lisa Wang shared her journey of building PayTech Solutions and how AI is transforming financial services, particularly in emerging markets. She discussed the challenges of financial inclusion, the role of mobile payments in developing economies, and how machine learning is enabling new forms of credit scoring and fraud detection. Her presentation highlighted successful fintech innovations and provided a roadmap for entrepreneurs looking to enter the fintech space.',
 '["Financial inclusion is not just a social good, it is a massive business opportunity.", "AI in fintech is most powerful when it serves the underserved.", "The future of payments is invisible, instant, and intelligent.", "Regulatory compliance is a feature, not a bug, in fintech innovation."]',
 '["Mobile-first design is essential for emerging market fintech", "Alternative data sources enable credit scoring for the unbanked", "Regulatory partnerships accelerate fintech adoption", "AI-powered fraud detection is table stakes for digital payments", "Cross-border payments remain a major opportunity for innovation"]',
 '[{"url": "https://example.com/video/lisa-wang-1.mp4", "title": "Building PayTech Solutions", "duration": 180, "timestamp": 200}, {"url": "https://example.com/video/lisa-wang-2.mp4", "title": "AI in Financial Services", "duration": 155, "timestamp": 1400}, {"url": "https://example.com/video/lisa-wang-3.mp4", "title": "The Future of Fintech", "duration": 145, "timestamp": 1900}]',
 'https://example.com/video/lisa-wang-highlights.mp4',
 'complete');

-- Insert demo attribution tracking data
INSERT INTO public.attribution_tracking (id, microsite_id, event_id, speaker_id, event_type, utm_source, utm_medium, utm_campaign, utm_content, referral_code, visitor_ip, user_agent, referrer_url, session_id, conversion_value, metadata, created_at) VALUES
-- Views for Sarah Chen's microsite
('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'view', 'linkedin', 'social', 'tech-summit-speaker-share', 'sarah-chen-post', 'SPK-550E8400-550E8400-T1234ABC', '203.0.113.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'https://linkedin.com', 'sess-001', null, '{"device": "desktop", "location": "San Francisco"}', now() - interval '2 days'),

('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'view', 'twitter', 'social', 'tech-summit-speaker-share', 'sarah-chen-tweet', 'SPK-550E8400-550E8400-T5678DEF', '203.0.113.2', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', 'https://twitter.com', 'sess-002', null, '{"device": "mobile", "location": "New York"}', now() - interval '2 days'),

-- Shares from Sarah Chen's microsite
('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'share', 'linkedin', 'social', 'tech-summit-speaker-share', 'sarah-chen-insights', 'SPK-550E8400-550E8400-T9012GHI', '203.0.113.3', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '', 'sess-003', null, '{"shared_content": "cloud_architecture"}', now() - interval '1 day'),

('550e8400-e29b-41d4-a716-446655440404', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'click', 'microsite', 'cta', 'tech-summit-speaker-share', 'register-button', 'SPK-550E8400-550E8400-T3456JKL', '203.0.113.4', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '', 'sess-004', 150, '{"cta_type": "registration"}', now() - interval '1 day'),

-- Conversions
('550e8400-e29b-41d4-a716-446655440405', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', 'ticket_purchase', 'microsite', 'cta', 'tech-summit-speaker-share', 'register-button', 'SPK-550E8400-550E8400-T3456JKL', '203.0.113.4', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '', 'sess-004', 299, '{"ticket_type": "early_bird", "email": "john@example.com"}', now() - interval '6 hours'),

('550e8400-e29b-41d4-a716-446655440406', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440102', 'email_capture', 'linkedin', 'social', 'ai-revolution-speaker-share', 'marcus-rodriguez-post', 'SPK-550E8400-550E8400-T7890MNO', '203.0.113.5', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'https://linkedin.com', 'sess-005', 50, '{"email": "sarah@startup.com", "lead_source": "ai_content"}', now() - interval '3 hours'),

('550e8400-e29b-41d4-a716-446655440407', '550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440103', 'registration', 'twitter', 'social', 'tech-summit-speaker-share', 'quantum-computing-tweet', 'SPK-550E8400-550E8400-T1357PQR', '203.0.113.6', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', 'https://twitter.com', 'sess-006', 199, '{"course_type": "quantum_fundamentals", "email": "engineer@tech.com"}', now() - interval '1 hour');

-- Insert demo conversion celebrations
INSERT INTO public.conversion_celebrations (id, event_id, speaker_id, microsite_id, conversion_type, conversion_value, referral_code, attribution_data, celebrated_at, notification_sent) VALUES
('550e8400-e29b-41d4-a716-446655440501',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440101',
 '550e8400-e29b-41d4-a716-446655440201',
 'ticket_purchase',
 299,
 'SPK-550E8400-550E8400-T3456JKL',
 '{"utm_source": "microsite", "utm_medium": "cta", "conversion_path": ["view", "click", "purchase"]}',
 now() - interval '6 hours',
 true),

('550e8400-e29b-41d4-a716-446655440502',
 '550e8400-e29b-41d4-a716-446655440002',
 '550e8400-e29b-41d4-a716-446655440102',
 '550e8400-e29b-41d4-a716-446655440202',
 'email_capture',
 50,
 'SPK-550E8400-550E8400-T7890MNO',
 '{"utm_source": "linkedin", "utm_medium": "social", "conversion_path": ["view", "email_capture"]}',
 now() - interval '3 hours',
 true),

('550e8400-e29b-41d4-a716-446655440503',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440103',
 '550e8400-e29b-41d4-a716-446655440203',
 'registration',
 199,
 'SPK-550E8400-550E8400-T1357PQR',
 '{"utm_source": "twitter", "utm_medium": "social", "conversion_path": ["view", "share", "registration"]}',
 now() - interval '1 hour',
 false);

-- Insert demo referral codes
INSERT INTO public.referral_codes (id, code, speaker_id, event_id, microsite_id, code_type, is_active, usage_count, max_uses, expires_at) VALUES
('550e8400-e29b-41d4-a716-446655440601',
 'SPK-550E8400-550E8400-T3456JKL',
 '550e8400-e29b-41d4-a716-446655440101',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440201',
 'speaker_share',
 true,
 5,
 null,
 now() + interval '30 days'),

('550e8400-e29b-41d4-a716-446655440602',
 'SPK-550E8400-550E8400-T7890MNO',
 '550e8400-e29b-41d4-a716-446655440102',
 '550e8400-e29b-41d4-a716-446655440002',
 '550e8400-e29b-41d4-a716-446655440202',
 'speaker_share',
 true,
 3,
 100,
 now() + interval '60 days'),

('550e8400-e29b-41d4-a716-446655440603',
 'SPK-550E8400-550E8400-T1357PQR',
 '550e8400-e29b-41d4-a716-446655440103',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440203',
 'speaker_share',
 true,
 2,
 50,
 now() + interval '45 days');

-- Insert demo diffusion analytics (for backward compatibility)
INSERT INTO public.diffusion_analytics (id, event_id, session_id, metric_type, metric_value, recorded_at) VALUES
('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440001', null, 'recap_view', 1247, now() - interval '2 days'),
('550e8400-e29b-41d4-a716-446655440702', '550e8400-e29b-41d4-a716-446655440001', null, 'share', 89, now() - interval '1 day'),
('550e8400-e29b-41d4-a716-446655440703', '550e8400-e29b-41d4-a716-446655440001', null, 'email_capture', 23, now() - interval '6 hours'),
('550e8400-e29b-41d4-a716-446655440704', '550e8400-e29b-41d4-a716-446655440002', null, 'recap_view', 856, now() - interval '1 day'),
('550e8400-e29b-41d4-a716-446655440705', '550e8400-e29b-41d4-a716-446655440002', null, 'share', 67, now() - interval '12 hours'),
('550e8400-e29b-41d4-a716-446655440706', '550e8400-e29b-41d4-a716-446655440002', null, 'email_capture', 18, now() - interval '3 hours'),
('550e8400-e29b-41d4-a716-446655440707', '550e8400-e29b-41d4-a716-446655440003', null, 'recap_view', 234, now() - interval '6 hours'),
('550e8400-e29b-41d4-a716-446655440708', '550e8400-e29b-41d4-a716-446655440003', null, 'share', 12, now() - interval '2 hours');

-- Insert demo microsite approval history
INSERT INTO public.microsite_approval_history (id, microsite_id, previous_status, new_status, changed_by, change_reason, changed_at) VALUES
('550e8400-e29b-41d4-a716-446655440801',
 '550e8400-e29b-41d4-a716-446655440201',
 'pending',
 'approved',
 'auth.uid()',
 'Content looks great, approved for publication',
 now() - interval '2 days'),

('550e8400-e29b-41d4-a716-446655440802',
 '550e8400-e29b-41d4-a716-446655440202',
 'pending',
 'approved',
 'auth.uid()',
 'Excellent AI insights, ready to go live',
 now() - interval '1 day'),

('550e8400-e29b-41d4-a716-446655440803',
 '550e8400-e29b-41d4-a716-446655440203',
 'pending',
 'needs_revision',
 'auth.uid()',
 'Please add more technical details about quantum algorithms',
 now() - interval '4 days'),

('550e8400-e29b-41d4-a716-446655440804',
 '550e8400-e29b-41d4-a716-446655440203',
 'needs_revision',
 'approved',
 'auth.uid()',
 'Revisions look perfect, quantum content is now comprehensive',
 now() - interval '3 days');

-- Update event branding to use proper field name
UPDATE public.events SET branding_config = branding_config WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
);

-- Create demo user sessions (if the table exists)
-- Note: This assumes the user_sessions table structure from the existing migrations
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
    INSERT INTO public.user_sessions (id, event_id, session_name, audio_url, processing_status, generated_summary, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440901',
     '550e8400-e29b-41d4-a716-446655440001',
     'The Future of Cloud Infrastructure',
     'https://example.com/audio/sarah-chen-session.mp3',
     'complete',
     'Sarah Chen discussed the evolution of cloud infrastructure...',
     now() - interval '2 days'),
    
    ('550e8400-e29b-41d4-a716-446655440902',
     '550e8400-e29b-41d4-a716-446655440002',
     'Building Autonomous AI Systems',
     'https://example.com/audio/marcus-rodriguez-session.mp3',
     'complete',
     'Marcus Rodriguez presented insights on autonomous AI...',
     now() - interval '1 day'),
    
    ('550e8400-e29b-41d4-a716-446655440903',
     '550e8400-e29b-41d4-a716-446655440001',
     'Quantum Computing Frontiers',
     'https://example.com/audio/priya-sharma-session.mp3',
     'complete',
     'Dr. Priya Sharma explored quantum computing advances...',
     now() - interval '3 days');
  END IF;
END
$$; 