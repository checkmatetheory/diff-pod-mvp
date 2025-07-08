/**
 * Prompt Configuration for Event Content Diffusion Platform
 * 
 * This file allows easy customization of AI prompts for different:
 * - Event types and industries
 * - Brand voices and tones
 * - Target audiences
 * - Content formats and goals
 */

export interface PromptConfig {
  // Event and Brand Context
  eventType: string;
  brandName: string;
  brandVoice: 'professional' | 'conversational' | 'authoritative' | 'inspiring';
  industry: string;
  
  // Audience Configuration
  primaryAudience: 'executives' | 'investors' | 'entrepreneurs' | 'technologists' | 'general';
  audienceLevel: 'c-suite' | 'senior-management' | 'mid-management' | 'individual-contributors';
  
  // Content Goals
  primaryGoal: 'lead-generation' | 'thought-leadership' | 'engagement' | 'brand-awareness';
  contentStyle: 'data-driven' | 'story-driven' | 'insight-driven' | 'action-driven';
  
  // Platform-Specific Settings
  platforms: {
    linkedin: boolean;
    twitter: boolean;
    blog: boolean;
    podcast: boolean;
    email: boolean;
  };
}

export const DEFAULT_CONFIG: PromptConfig = {
  eventType: 'Professional Conference',
  brandName: 'Event Platform',
  brandVoice: 'professional',
  industry: 'Business & Technology',
  primaryAudience: 'executives',
  audienceLevel: 'c-suite',
  primaryGoal: 'lead-generation',
  contentStyle: 'insight-driven',
  platforms: {
    linkedin: true,
    twitter: true,
    blog: true,
    podcast: true,
    email: true
  }
};

export const INDUSTRY_CONFIGS = {
  'fintech': {
    keywords: ['financial technology', 'digital banking', 'payments', 'blockchain', 'regulatory compliance'],
    focusAreas: ['innovation', 'regulation', 'market disruption', 'customer experience'],
    voiceTone: 'authoritative',
    targetAudience: 'executives'
  },
  'healthcare': {
    keywords: ['digital health', 'medical technology', 'patient care', 'healthcare innovation'],
    focusAreas: ['patient outcomes', 'cost reduction', 'regulatory compliance', 'innovation'],
    voiceTone: 'professional',
    targetAudience: 'executives'
  },
  'enterprise-tech': {
    keywords: ['enterprise software', 'digital transformation', 'automation', 'AI/ML'],
    focusAreas: ['efficiency', 'scalability', 'competitive advantage', 'ROI'],
    voiceTone: 'authoritative',
    targetAudience: 'technologists'
  },
  'venture-capital': {
    keywords: ['venture capital', 'startup funding', 'portfolio management', 'market trends'],
    focusAreas: ['deal flow', 'portfolio performance', 'market opportunities', 'exit strategies'],
    voiceTone: 'authoritative',
    targetAudience: 'investors'
  }
};

export const CONTENT_TEMPLATES = {
  'executive-briefing': {
    title: 'Strategic insights from [EVENT_NAME]: [KEY_INSIGHT]',
    structure: ['executive-summary', 'key-findings', 'strategic-implications', 'recommendations'],
    tone: 'authoritative',
    length: 'concise'
  },
  'thought-leadership': {
    title: '[CONTRARIAN_INSIGHT] from [EVENT_NAME]',
    structure: ['hook', 'context', 'insights', 'implications', 'call-to-action'],
    tone: 'inspiring',
    length: 'comprehensive'
  },
  'industry-analysis': {
    title: '[TREND] reshaping [INDUSTRY]: Insights from [EVENT_NAME]',
    structure: ['trend-overview', 'market-implications', 'company-strategies', 'next-steps'],
    tone: 'professional',
    length: 'detailed'
  },
  'actionable-takeaways': {
    title: '[NUMBER] actionable strategies from [EVENT_NAME]',
    structure: ['quick-summary', 'strategy-list', 'implementation-tips', 'results-tracking'],
    tone: 'conversational',
    length: 'scannable'
  }
};

export const PLATFORM_OPTIMIZATION = {
  linkedin: {
    maxLength: 1300,
    optimalLength: 1000,
    structure: ['hook', 'insights-bullets', 'engagement-question'],
    hashtags: 3,
    tone: 'professional-engaging'
  },
  twitter: {
    maxLength: 280,
    optimalLength: 250,
    structure: ['bold-statement', 'context', 'thread-promise'],
    hashtags: 2,
    tone: 'conversational-authoritative'
  },
  blog: {
    minLength: 800,
    optimalLength: 1200,
    structure: ['headline', 'summary', 'sections', 'conclusion', 'cta'],
    tone: 'professional-detailed'
  },
  podcast: {
    duration: '3-4 minutes',
    structure: ['hook', 'context', 'insights', 'takeaway', 'cta'],
    tone: 'conversational-authoritative'
  },
  email: {
    subjectLength: 50,
    previewLength: 90,
    structure: ['subject', 'preview', 'content-summary'],
    tone: 'professional-urgent'
  }
};

/**
 * Generate platform-specific prompts based on configuration
 */
export function generatePrompt(config: PromptConfig, content: string, platform: keyof typeof PLATFORM_OPTIMIZATION): string {
  const platformConfig = PLATFORM_OPTIMIZATION[platform];
  const industryConfig = INDUSTRY_CONFIGS[config.industry as keyof typeof INDUSTRY_CONFIGS];
  
  const basePrompt = `
You are an expert content strategist creating ${platform} content for ${config.primaryAudience} in the ${config.industry} industry.

CONTENT TO PROCESS:
"${content}"

BRAND CONTEXT:
- Brand: ${config.brandName}
- Voice: ${config.brandVoice}
- Primary Goal: ${config.primaryGoal}
- Content Style: ${config.contentStyle}

TARGET AUDIENCE:
- Primary: ${config.primaryAudience} at ${config.audienceLevel} level
- Industry: ${config.industry}
${industryConfig ? `- Focus Areas: ${industryConfig.focusAreas.join(', ')}` : ''}

PLATFORM REQUIREMENTS:
${platform === 'linkedin' ? `
- Max length: ${platformConfig.maxLength} characters
- Structure: ${platformConfig.structure.join(' → ')}
- Include ${platformConfig.hashtags} relevant hashtags
- Tone: Professional but engaging
- End with engagement question
` : platform === 'twitter' ? `
- Max length: ${platformConfig.maxLength} characters  
- Structure: ${platformConfig.structure.join(' → ')}
- Include thread indicator (1/x)
- Max ${platformConfig.hashtags} hashtags
- Create curiosity without giving everything away
` : platform === 'blog' ? `
- Length: ${platformConfig.minLength}-${platformConfig.optimalLength} words
- Structure: ${platformConfig.structure.join(' → ')}
- Use subheadings and bullet points
- Include SEO-optimized headline
- Professional but accessible tone
` : platform === 'podcast' ? `
- Duration: ${platformConfig.duration}
- Structure: ${platformConfig.structure.join(' → ')}
- Write for spoken delivery
- Include natural speech patterns
- Conversational but authoritative
` : ''}

CONTENT FOCUS:
${config.primaryGoal === 'lead-generation' ? 
'- Create content that drives email signups and event registrations\n- Include clear value propositions and next steps' :
config.primaryGoal === 'thought-leadership' ?
'- Position as industry expertise and forward-thinking insights\n- Include contrarian or unique perspectives' :
config.primaryGoal === 'engagement' ?
'- Optimize for likes, shares, and comments\n- Include engaging questions and shareable quotes' :
'- Build brand awareness and recognition\n- Include brand messaging and unique positioning'}

${config.contentStyle === 'data-driven' ? 'Focus on statistics, metrics, and quantitative insights.' :
config.contentStyle === 'story-driven' ? 'Use narrative structure with examples and case studies.' :
config.contentStyle === 'insight-driven' ? 'Emphasize strategic insights and implications.' :
'Focus on specific, implementable actions and tactics.'}

Create content that ${config.primaryAudience} would immediately want to share to demonstrate their industry expertise.
`;

  return basePrompt;
}

/**
 * Quick prompt generators for common use cases
 */
export const QuickPrompts = {
  executiveSummary: (content: string, eventName: string) => `
Create a concise executive summary of this content for C-suite consumption:

"${content}"

Format as:
- 2-3 sentence overview
- 3-4 key strategic takeaways  
- Bottom-line business impact
- Recommended next steps

Focus on strategic implications and competitive advantages.
`,

  socialShare: (content: string, platform: 'linkedin' | 'twitter') => `
Create a ${platform} post that busy executives would share to demonstrate thought leadership:

"${content}"

${platform === 'linkedin' ? 
'LinkedIn format: Professional insight with 3-4 bullet points and engagement question' :
'Twitter format: Compelling thread starter with bold claim and thread promise'}

Focus on shareable insights that position the poster as industry-informed.
`,

  podcastScript: (content: string, duration = '3 minutes') => `
Write a ${duration} podcast script for this content that sounds natural when spoken:

"${content}"

Structure:
- Hook (compelling opening)
- Context (brief setup)  
- Insights (main content)
- Takeaway (what to remember)
- CTA (next step)

Write for the ear with natural speech patterns and clear transitions.
`,

  blogOutline: (content: string) => `
Create a comprehensive blog post outline from this content:

"${content}"

Include:
- SEO-optimized headline
- Executive summary
- 4-5 main sections with subheadings
- Key quotes and statistics
- Actionable next steps
- Compelling conclusion

Target: Business executives seeking strategic insights.
`
};

/**
 * Prompt quality checklist for validation
 */
export const PROMPT_QUALITY_CHECKLIST = {
  clarity: 'Is the request specific and unambiguous?',
  context: 'Does it include sufficient context about audience and goals?',
  structure: 'Does it specify the desired output format?',
  tone: 'Is the brand voice and tone clearly defined?',
  constraints: 'Are length and platform requirements specified?',
  examples: 'Are there examples or specific instructions?',
  validation: 'Can the output quality be measured?'
};

export default {
  DEFAULT_CONFIG,
  INDUSTRY_CONFIGS,
  CONTENT_TEMPLATES,
  PLATFORM_OPTIMIZATION,
  generatePrompt,
  QuickPrompts,
  PROMPT_QUALITY_CHECKLIST
}; 