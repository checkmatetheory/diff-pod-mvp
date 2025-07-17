/**
 * AI Content Generation Prompts for Event Content Diffusion Platform
 * 
 * Tailored for:
 * - Event Producers (conferences, earnings calls, investor updates)
 * - Professional Attendees (VCs, executives, entrepreneurs)
 * - Content Consumers (seeking actionable insights)
 * 
 * Focus: High-quality, professional, shareable content that drives event attendance
 */

export interface ContentGenerationResult {
  title: string;
  summary: string;
  contentScript: string;
  socialPosts: {
    linkedin: string;
    twitter: string;
    email: string;
  };
  blogContent: string;
  keyQuotes: string[];
  actionableInsights: string[];
}

export interface PromptContext {
  eventCategory: 'conference' | 'earnings_call' | 'board_meeting' | 'investor_update' | 
                'due_diligence' | 'portfolio_review' | 'market_update' | 'team_meeting';
  eventName?: string;
  nextEventDate?: string;
  brandVoice?: 'professional' | 'conversational' | 'authoritative' | 'inspiring';
  targetAudience?: 'investors' | 'entrepreneurs' | 'executives' | 'technologists' | 'general';
  contentLength?: 'short' | 'medium' | 'long';
}

export class ContentPrompts {
  /**
   * Master content generation prompt - generates all content types in one call
   */
  static getMasterPrompt(content: string, context: PromptContext): string {
    const { eventCategory, eventName, nextEventDate, brandVoice = 'professional', targetAudience = 'executives' } = context;
    
    const categoryContext = this.getCategoryContext(eventCategory);
    const audienceContext = this.getAudienceContext(targetAudience);
    const voiceContext = this.getVoiceContext(brandVoice);

    return `
You are an expert content strategist specializing in ${categoryContext.domain} content that drives event attendance and professional engagement.

CONTENT TO PROCESS:
"${content}"

EVENT CONTEXT:
- Event Type: ${categoryContext.description}
- Event Name: ${eventName || 'Professional Session'}
- Target Audience: ${audienceContext.description}
- Brand Voice: ${voiceContext.description}
${nextEventDate ? `- Next Event: ${nextEventDate}` : ''}

YOUR MISSION:
Transform this content into a complete content suite that:
1. Captures the most valuable, actionable insights
2. Appeals to ${audienceContext.description}
3. Creates FOMO for future events
4. Drives professional sharing and engagement
5. Maintains a ${voiceContext.description} tone

REQUIRED OUTPUT FORMAT:

**TITLE:** [Compelling 60-80 character title that drives clicks]

**EXECUTIVE SUMMARY:**
[2-3 sentences highlighting the most important takeaways, statistics, and actionable insights. Focus on ROI, strategic implications, and competitive advantages.]

**PODCAST SCRIPT:**
[3-4 minute professional audio script written for spoken delivery. Include:
- Engaging hook that establishes credibility
- 3-4 key insights with specific examples
- Actionable takeaways listeners can implement
- Clear call-to-action for event engagement
Use conversational tone while maintaining authority.]

**LINKEDIN POST:**
[Professional LinkedIn post (1300 characters max) that:
- Opens with a compelling insight or statistic
- Includes 3-4 key takeaways in bullet format
- Ends with engagement question
- Uses 2-3 relevant hashtags]

**TWITTER THREAD:**
[Twitter thread starter (280 characters) that:
- Creates curiosity with a bold statement
- Promises valuable insights
- Includes relevant hashtags]

**EMAIL SUBJECT:**
[Email subject line that drives 40%+ open rates]

**BLOG CONTENT:**
[800-1200 word professional blog post with:
- SEO-optimized structure
- Executive summary section
- 4-5 detailed takeaways with examples
- Industry implications
- Clear next steps/action items]

**KEY QUOTES:**
[3-5 quotable insights perfect for social sharing]

**ACTIONABLE INSIGHTS:**
[5-7 specific, implementable strategies or tactics mentioned in the content]

QUALITY STANDARDS:
- Every piece must be immediately shareable by a ${targetAudience} professional
- Focus on specificity over generalization
- Include metrics, statistics, and concrete examples when available
- Avoid jargon unless it's standard for the ${targetAudience} audience
- Each format should work standalone while supporting the overall narrative

${categoryContext.specificInstructions}
${audienceContext.specificInstructions}
${voiceContext.specificInstructions}
`;
  }

  /**
   * Social media content prompt for viral sharing
   */
  static getSocialPrompt(content: string, context: PromptContext, platform: 'linkedin' | 'twitter'): string {
    const { targetAudience = 'executives' } = context;
    const audienceContext = this.getAudienceContext(targetAudience);

    if (platform === 'linkedin') {
      return `
Create a LinkedIn post that ${audienceContext.description} will want to share to demonstrate their expertise.

CONTENT: "${content}"

LINKEDIN POST REQUIREMENTS:
- Max 1300 characters
- Hook: Start with a counterintuitive insight or surprising statistic
- Value: Include 3-4 bullet points with actionable takeaways
- Social proof: Reference credible sources or speakers when available
- Engagement: End with a thought-provoking question
- Hashtags: Include 2-3 relevant hashtags (no more)

TONE: Professional but engaging, positioning the sharer as an industry thought leader

STRUCTURE:
[Hook line]

Key insights from [event/session]:

• [Insight 1 with specific detail]
• [Insight 2 with metric if available]  
• [Insight 3 with actionable element]
• [Insight 4 with future implication]

[Engagement question that invites discussion]

#RelevantHashtag #IndustryTag

${audienceContext.linkedinInstructions}
`;
    } else {
      return `
Create a Twitter thread starter that drives engagement and retweets.

CONTENT: "${content}"

TWITTER REQUIREMENTS:
- Max 280 characters for main tweet
- Create curiosity without giving everything away
- Include thread indicator (1/x)
- Use power words: exclusive, revealed, breakthrough, insider
- Include 1-2 hashtags maximum

STRUCTURE:
[Bold statement or surprising stat] 

[Brief context about the insight source]

[Promise of value in thread]

Thread below 👇 (1/x)

#Hashtag #IndustryTag

${audienceContext.twitterInstructions}
`;
    }
  }

  /**
   * Blog content prompt for SEO and thought leadership
   */
  static getBlogPrompt(content: string, context: PromptContext): string {
    const { eventCategory, eventName, targetAudience = 'executives' } = context;
    const categoryContext = this.getCategoryContext(eventCategory);
    const audienceContext = this.getAudienceContext(targetAudience);

    return `
You are a professional business writer creating thought leadership content for ${audienceContext.description}.

CONTENT: "${content}"
EVENT: ${eventName || 'Professional Session'}

Create a 800-1200 word blog post that establishes the author as a thought leader in ${categoryContext.domain}.

STRUCTURE:
1. COMPELLING HEADLINE (60-80 characters, SEO-optimized)
2. EXECUTIVE SUMMARY (2-3 sentences of key takeaways)
3. INTRODUCTION (Set context, establish stakes)
4. MAIN INSIGHTS (4-5 sections, each with examples and implications)
5. INDUSTRY IMPLICATIONS (What this means for the sector)
6. ACTIONABLE NEXT STEPS (What readers should do)
7. CONCLUSION (Forward-looking statement)

REQUIREMENTS:
- Write for busy executives who skim content
- Include subheadings for easy scanning
- Use bullet points and numbered lists
- Include specific metrics, quotes, and examples
- Maintain professional credibility throughout
- End sections with clear takeaways
- Include relevant industry terminology (but explain if needed)

SEO ELEMENTS:
- Use the main keyword in the headline and first paragraph
- Include related keywords naturally throughout
- Create scannable content with clear structure
- End with a compelling call-to-action

${categoryContext.blogInstructions}
${audienceContext.blogInstructions}
`;
  }

  private static getCategoryContext(category: PromptContext['eventCategory']) {
    const contexts = {
      conference: {
        domain: 'professional conference and industry events',
        description: 'professional conferences featuring industry leaders and innovation showcases',
        specificInstructions: 'Focus on networking value, industry trends, and competitive insights.',
        blogInstructions: 'Position as industry analysis with forward-looking perspectives.'
      },
      earnings_call: {
        domain: 'financial reporting and investor relations',
        description: 'corporate earnings calls and financial performance discussions',
        specificInstructions: 'Focus on financial performance drivers and strategic implications.',
        blogInstructions: 'Structure as financial analysis with clear metrics and forward guidance.'
      },
      investor_meeting: {
        domain: 'investment and portfolio management',
        description: 'investor meetings and portfolio strategy discussions',
        specificInstructions: 'Highlight market trends and investment opportunities.',
        blogInstructions: 'Frame as investment thesis with supporting market analysis.'
      },
      board_meeting: {
        domain: 'corporate governance and strategic planning',
        description: 'board meetings and strategic decision-making sessions',
        specificInstructions: 'Emphasize strategic thinking and decision-making frameworks.',
        blogInstructions: 'Present as strategic commentary with actionable frameworks.'
      },
      limited_partner: {
        domain: 'private equity and fund management',
        description: 'limited partner meetings and fund performance reviews',
        specificInstructions: 'Focus on performance drivers and portfolio optimization strategies.',
        blogInstructions: 'Structure as performance analysis with portfolio insights.'
      },
      sales: {
        domain: 'sales strategy and revenue optimization',
        description: 'sales meetings and revenue strategy sessions',
        specificInstructions: 'Emphasize market opportunities and risk factors.',
        blogInstructions: 'Position as sales strategy guide with practical tactics.'
      },
      investment_committee: {
        domain: 'investment analysis and decision making',
        description: 'investment committee meetings and deal evaluation sessions',
        specificInstructions: 'Focus on analytical frameworks and decision-making criteria.',
        blogInstructions: 'Frame as investment analysis with detailed evaluation criteria.'
      },
      team_meeting: {
        domain: 'team management and organizational development',
        description: 'team meetings and organizational strategy discussions',
        specificInstructions: 'Emphasize teamwork strategies and organizational best practices.',
        blogInstructions: 'Present as leadership insights with actionable team strategies.'
      }
    };
    
    return contexts[category];
  }

  private static getAudienceContext(audience: PromptContext['targetAudience']) {
    const contexts = {
      investors: {
        description: 'venture capitalists, private equity professionals, and institutional investors',
        specificInstructions: 'Focus on ROI, market sizing, competitive positioning, and scalability factors.',
        linkedinInstructions: 'Emphasize investment thesis and market opportunity insights.',
        twitterInstructions: 'Highlight market trends and investment opportunities.',
        blogInstructions: 'Include quantitative analysis and market opportunity assessment.'
      },
      entrepreneurs: {
        description: 'startup founders, business owners, and innovation leaders',
        specificInstructions: 'Emphasize actionable strategies, growth tactics, and operational insights.',
        linkedinInstructions: 'Focus on practical business building and scaling strategies.',
        twitterInstructions: 'Highlight entrepreneurial insights and business building tactics.',
        blogInstructions: 'Include actionable strategies and implementation frameworks.'
      },
      executives: {
        description: 'C-suite executives, senior managers, and business leaders',
        specificInstructions: 'Focus on strategic implications, competitive advantages, and market positioning.',
        linkedinInstructions: 'Emphasize strategic thinking and leadership insights.',
        twitterInstructions: 'Highlight strategic decisions and market positioning.',
        blogInstructions: 'Include strategic analysis and competitive intelligence.'
      },
      technologists: {
        description: 'CTOs, engineering leaders, and technology professionals',
        specificInstructions: 'Emphasize technical innovations, implementation strategies, and technology trends.',
        linkedinInstructions: 'Focus on technical insights and innovation opportunities.',
        twitterInstructions: 'Highlight technology trends and technical innovations.',
        blogInstructions: 'Include technical analysis and implementation considerations.'
      },
      general: {
        description: 'business professionals seeking industry insights and professional development',
        specificInstructions: 'Balance accessibility with professional depth, focus on broadly applicable insights.',
        linkedinInstructions: 'Emphasize professional development and industry awareness.',
        twitterInstructions: 'Highlight broadly applicable insights and trends.',
        blogInstructions: 'Include accessible analysis with practical applications.'
      }
    };
    
    return contexts[audience!];
  }

  private static getVoiceContext(voice: PromptContext['brandVoice']) {
    const contexts = {
      professional: {
        description: 'authoritative and credible, establishing expertise while remaining accessible',
        specificInstructions: 'Use clear, direct language with industry credibility. Avoid overly casual language while maintaining readability.'
      },
      conversational: {
        description: 'friendly and approachable, like a trusted industry advisor sharing insights',
        specificInstructions: 'Use warm, engaging language with personality. Include relatable examples and conversational transitions.'
      },
      authoritative: {
        description: 'confident and definitive, positioning as a definitive industry voice',
        specificInstructions: 'Use strong, declarative statements. Position insights as expert analysis with high confidence.'
      },
      inspiring: {
        description: 'motivational and forward-looking, energizing readers about opportunities',
        specificInstructions: 'Use energetic language that builds excitement. Focus on possibilities and positive outcomes.'
      }
    };
    
    return contexts[voice!];
  }
}

/**
 * Utility function to generate all content types using the master prompt
 */
export async function generateAllContent(
  content: string, 
  context: PromptContext,
  openaiApiKey: string
): Promise<ContentGenerationResult> {
  const prompt = ContentPrompts.getMasterPrompt(content, context);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4', // Use GPT-4 for highest quality output
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert content strategist who creates professional, engaging content that drives business results. You always follow the exact format requested and prioritize actionable insights over generic statements.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API request failed: ${response.status}`);
  }

  const data = await response.json();
  const aiContent = data.choices[0].message.content;
  
  // Parse the structured response
  return parseAIResponse(aiContent);
}

/**
 * Parse the AI response into structured content
 */
function parseAIResponse(content: string): ContentGenerationResult {
  // This would include robust parsing logic to extract each section
  // For now, providing a simplified structure
  
  const sections = content.split('**').filter(section => section.trim());
  
  return {
    title: extractSection(content, 'TITLE:') || 'AI-Generated Content',
    summary: extractSection(content, 'EXECUTIVE SUMMARY:') || '',
    contentScript: extractSection(content, 'PODCAST SCRIPT:') || '',
    socialPosts: {
      linkedin: extractSection(content, 'LINKEDIN POST:') || '',
      twitter: extractSection(content, 'TWITTER THREAD:') || '',
      email: extractSection(content, 'EMAIL SUBJECT:') || ''
    },
    blogContent: extractSection(content, 'BLOG CONTENT:') || '',
    keyQuotes: extractListSection(content, 'KEY QUOTES:') || [],
    actionableInsights: extractListSection(content, 'ACTIONABLE INSIGHTS:') || []
  };
}

function extractSection(content: string, sectionName: string): string | null {
  const regex = new RegExp(`\\*\\*${sectionName.replace(':', '')}:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[A-Z][A-Z\\s]*:|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function extractListSection(content: string, sectionName: string): string[] | null {
  const section = extractSection(content, sectionName);
  if (!section) return null;
  
  return section
    .split('\n')
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(line => line.length > 0);
} 