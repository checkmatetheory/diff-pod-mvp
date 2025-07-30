/**
 * Mock Data Management for Demo Users
 * Handles creation and management of demo content in the database
 */

import { supabase } from "@/integrations/supabase/client";

export interface MockContentItem {
  id: string;
  title: string;
  speaker_name: string;
  event_name: string;
  type: 'reel';
  duration: number;
  thumbnail_url: string;
  content_url: string;
  description?: string;
  viralityScore?: number;
  reasoning?: string;
  transcript?: string;
  suggestedCaption?: string;
  suggestedHashtags?: string[];
}

const MOCK_CONTENT_DATA: Omit<MockContentItem, 'id' | 'viralityScore' | 'reasoning' | 'transcript' | 'suggestedCaption' | 'suggestedHashtags'>[] = [
  {
    title: 'AI Revolution in FinTech',
    speaker_name: 'Sarah Chen',
    event_name: 'FinTech Summit 2024',
    type: 'reel',
    duration: 45,
    thumbnail_url: '/placeholder.svg',
    content_url: '/placeholder-video.mp4',
    description: 'Exploring how artificial intelligence is transforming financial technology and creating new opportunities for innovation.'
  },
  {
    title: 'The Future of Web3',
    speaker_name: 'Marcus Rodriguez',
    event_name: 'Tech Innovation Expo',
    type: 'reel',
    duration: 62,
    thumbnail_url: '/placeholder.svg',
    content_url: '/placeholder-video.mp4',
    description: 'Deep dive into Web3 technologies and their potential to reshape digital interactions and decentralized systems.'
  },
  {
    title: 'Sustainable Energy Solutions',
    speaker_name: 'Dr. Emily Watson',
    event_name: 'Climate Tech Summit',
    type: 'reel',
    duration: 38,
    thumbnail_url: '/placeholder.svg',
    content_url: '/placeholder-video.mp4',
    description: 'Innovative approaches to sustainable energy and their role in combating climate change.'
  },
  {
    title: 'Quantum Computing Breakthroughs',
    speaker_name: 'James Park',
    event_name: 'Quantum Innovation Day',
    type: 'reel',
    duration: 55,
    thumbnail_url: '/placeholder.svg',
    content_url: '/placeholder-video.mp4',
    description: 'Latest developments in quantum computing and their practical applications across industries.'
  },
  {
    title: 'Healthcare AI Ethics',
    speaker_name: 'Dr. Lisa Zhang',
    event_name: 'HealthTech Conference',
    type: 'reel',
    duration: 41,
    thumbnail_url: '/placeholder.svg',
    content_url: '/placeholder-video.mp4',
    description: 'Examining the ethical considerations and challenges of implementing AI in healthcare systems.'
  },
  {
    title: 'Blockchain in Supply Chain',
    speaker_name: 'Alex Thompson',
    event_name: 'Supply Chain Innovation',
    type: 'reel',
    duration: 48,
    thumbnail_url: '/placeholder.svg',
    content_url: '/placeholder-video.mp4',
    description: 'How blockchain technology is revolutionizing supply chain transparency and efficiency.'
  }
];

// Generate deterministic virality score based on item title
const generateViralityScore = (title: string): number => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 31) + 70;
};

export const ensureMockDataExists = async (userId: string): Promise<MockContentItem[]> => {
  try {
    // Check if mock data already exists for this user
    const { data: existingContent, error: fetchError } = await supabase
      .from('content_items')
      .select('*')
      .eq('created_by', userId);

    if (fetchError) {
      console.error('Error checking existing content:', fetchError);
      throw fetchError;
    }

    // If content already exists, return it with virality data
    if (existingContent && existingContent.length > 0) {
      return existingContent.map(item => ({
        ...item,
        viralityScore: generateViralityScore(item.title),
        reasoning: `This video has strong potential due to its engaging content and timely topic discussion.`,
        transcript: `Sample transcript for ${item.title}...`,
        suggestedCaption: `🚀 Amazing insights from ${item.speaker_name}! #Innovation #${item.event_name.replace(/\s+/g, '')}`,
        suggestedHashtags: ['#Innovation', '#Leadership', '#TechTalk'],
      }));
    }

    // Create mock content in database
    const { data: insertedContent, error: insertError } = await supabase
      .from('content_items')
      .insert(
        MOCK_CONTENT_DATA.map(item => ({
          ...item,
          created_by: userId
        }))
      )
      .select();

    if (insertError) {
      console.error('Error inserting mock content:', insertError);
      throw insertError;
    }

    // Return enriched content with virality data
    return (insertedContent || []).map(item => ({
      ...item,
      viralityScore: generateViralityScore(item.title),
      reasoning: `This video has strong potential due to its engaging content and timely topic discussion.`,
      transcript: `Sample transcript for ${item.title}...`,
      suggestedCaption: `🚀 Amazing insights from ${item.speaker_name}! #Innovation #${item.event_name.replace(/\s+/g, '')}`,
      suggestedHashtags: ['#Innovation', '#Leadership', '#TechTalk'],
    }));

  } catch (error) {
    console.error('Error ensuring mock data exists:', error);
    // Fallback to in-memory mock data if database operations fail
    return MOCK_CONTENT_DATA.map((item, index) => ({
      ...item,
      id: `mock_${index + 1}`,
      viralityScore: generateViralityScore(item.title),
      reasoning: `This video has strong potential due to its engaging content and timely topic discussion.`,
      transcript: `Sample transcript for ${item.title}...`,
      suggestedCaption: `🚀 Amazing insights from ${item.speaker_name}! #Innovation #${item.event_name.replace(/\s+/g, '')}`,
      suggestedHashtags: ['#Innovation', '#Leadership', '#TechTalk'],
    }));
  }
};

export const isDemoUser = (userEmail?: string): boolean => {
  return userEmail === 'testlast@pod.com';
};