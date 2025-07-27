import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Clock, 
  Download, 
  Share2, 
  Copy, 
  FileText, 
  Video, 
  Loader2, 
  RefreshCw, 
  MessageSquare,
  Play
} from 'lucide-react';
import { PublishModal } from "@/components/ui/PublishModal";
import { BaseContentItem } from "@/types/publish";

// Mock data for preview
const mockViralClips = [
  {
    id: '1',
    title: 'The Rise of Women\'s Sports Investment',
    duration: 75, // 1:15
    viralityScore: 88,
    reasoning: 'This video discusses a timely and relevant topic—women\'s sports investment—which is gaining traction and interest. The speaker\'s enthusiasm and optimism about the future of women\'s sports can resonate with viewers, encouraging shares and discussions. The mention of record-breaking transfer fees adds a compelling hook, while the call for investment and patience creates a sense of community and shared purpose. However, the pacing and depth of the content may limit its appeal to a broader audience, preventing a perfect score.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop',
    transcript: 'and uh the good news is success begets more success and i think right now you\'re seeing this sweep you know throughout the world and and at the end of the day everyone realizes especially these athletes you know none of these women are looking for a handout they all understand that the broader business needs to justify those revenues and those salaries and so they\'ve been incredibly patient...',
    suggestedCaption: '🏆 Women\'s sports are leveling up! Ready for the future 💪🏽 #WomensSports #InvestInHer',
    suggestedHashtags: ['#WomensSports', '#InvestInHer', '#SportsInvestment', '#FutureOfSports'],
    eventName: 'Web Summit Qatar 2025',
    speakerName: 'Sarah Chen'
  },
  {
    id: '2',
    title: 'Listening to Your Inner Voice: The Journey of an Entrepreneur',
    duration: 53,
    viralityScore: 85,
    reasoning: 'This video has strong emotional resonance, as it shares a personal journey of self-discovery and entrepreneurship. The relatable theme of listening to one\'s inner voice can inspire viewers, especially those interested in personal development and business. The storytelling aspect, combined with a motivational message, enhances its shareability. However, the pacing could be slightly faster to maintain high engagement throughout the entire duration.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop',
    transcript: 'I listened to that voice inside of me that was like, you don\'t actually wanna be here. You don\'t actually wanna be doing this. You know, that was in 2004. So here we are a couple decades later, and I\'ve never heard that voice since. The only voice that I hear, and I realize how blessed I am to live this professionally. I\'ve only had a voice encouraging me to keep doing more, to be motivated...',
    suggestedCaption: '💭 What if your inner voice could lead you to success? This entrepreneur\'s journey will inspire you 🚀 #Entrepreneurship #InnerVoice',
    suggestedHashtags: ['#Entrepreneurship', '#InnerVoice', '#PersonalDevelopment', '#StartupLife'],
    eventName: 'TechConf 2025',
    speakerName: 'Alex Rivera'
  },
  {
    id: '3',
    title: 'The Evolution of Content Consumption in the Digital Age',
    duration: 180, // 3:00
    viralityScore: 92,
    reasoning: 'This clip captures a transformative insight about how digital platforms are reshaping content consumption patterns. The speaker\'s expertise and the trending nature of this topic make it highly shareable among marketing professionals and content creators. The actionable insights provided create immediate value for viewers, driving engagement and shares.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=600&fit=crop',
    transcript: 'What if your favorite athletes lived together? The reality show featuring professional athletes which most successful collaboration between traditional media and digital platforms. This represents the future of content consumption where audiences demand authentic, behind-the-scenes access to their heroes...',
    suggestedCaption: '🔮 The future of content is here! How digital platforms are changing everything we know about media consumption 📱✨ #DigitalTransformation #ContentStrategy',
    suggestedHashtags: ['#DigitalTransformation', '#ContentStrategy', '#MediaEvolution', '#FutureOfMedia'],
    eventName: 'Digital Marketing Summit 2025',
    speakerName: 'Dr. Maya Patel'
  }
];

interface SessionContentProps {
  session: any;
  showPreview: boolean;
  isProcessing: boolean;
  hasError: boolean;
  isEditing: boolean;
  refreshing: boolean;
  onRefreshSession: () => void;
  onCopy: (text: string, type: string) => void;
  onDownload: (format: string) => void;
}

export const SessionContent = ({
  session,
  showPreview,
  isProcessing,
  hasError,
  isEditing,
  refreshing,
  onRefreshSession,
  onCopy,
  onDownload
}: SessionContentProps) => {
  // Publish modal state
  const [selectedClip, setSelectedClip] = useState<BaseContentItem | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Helper functions for viral clips
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getViralityColor = (score: number) => {
    if (score >= 90) return 'bg-green-500 text-white';
    if (score >= 80) return 'bg-blue-500 text-white';
    if (score >= 70) return 'bg-yellow-500 text-black';
    return 'bg-gray-500 text-white';
  };

  const getViralityRank = (score: number) => {
    if (score >= 90) return '#1';
    if (score >= 80) return '#2';
    if (score >= 70) return '#3';
    return `#${Math.floor(score / 10)}`;
  };

  const handlePublishClip = (clip: any) => {
    // Convert clip to BaseContentItem format
    const baseContent: BaseContentItem = {
      id: clip.id,
      title: clip.title,
      type: 'reel',
      thumbnail_url: clip.thumbnail,
      duration: clip.duration,
      viralityScore: clip.viralityScore,
      reasoning: clip.reasoning,
      suggestedCaption: clip.suggestedCaption,
      suggestedHashtags: clip.suggestedHashtags,
      speaker_name: clip.speakerName,
      event_name: clip.eventName
    };
    setSelectedClip(baseContent);
    setIsPublishModalOpen(true);
  };

  const handleDownloadClip = (content: BaseContentItem) => {
    // This will be handled by parent component
    onDownload(`${content.title}`);
  };

  const handlePublish = async (platforms: string[], caption: string) => {
    // This will be called by the shared modal
    // Implementation will be handled by parent
    setIsPublishModalOpen(false);
  };

  return (
    <div className="flex-1">
      {isProcessing && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>🧠 AI is finding your most viral moments...</AlertTitle>
          <AlertDescription>
            Your content is being processed with AI. This usually takes 30-60 seconds. 
            The page will automatically update when processing is complete.
            <div className="mt-2 text-sm text-muted-foreground">
              Status: {session.processing_status} • Last updated: {new Date().toLocaleTimeString()}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {hasError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Processing Error</AlertTitle>
          <AlertDescription>
            There was an error processing your content. Please try refreshing or contact support.
            <div className="mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefreshSession}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Retry'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>

        {/* VIDEOS TAB */}
        <TabsContent value="videos" className="mt-6">
          <div className="space-y-6">
            {showPreview ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Your Viral Clips ({mockViralClips.length})</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generated from {session.session_name || 'your session'} • Ready to publish
                    </p>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>

                {/* Clips Grid */}
                <div className="space-y-6">
                  {mockViralClips.map((clip, index) => (
                    <div key={clip.id} className="flex gap-6 p-6 border rounded-lg hover:shadow-md transition-shadow bg-white">
                      {/* Video Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <div className="w-48 h-72 bg-black rounded-lg overflow-hidden relative cursor-pointer"
                             onClick={() => handlePublishClip(clip)}>
                          <img 
                            src={clip.thumbnail} 
                            alt={clip.title}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                            <div className="bg-white/20 rounded-full p-3">
                              <Play className="h-8 w-8 text-white" />
                            </div>
                          </div>

                          {/* Duration Badge */}
                          <div className="absolute bottom-3 right-3">
                            <Badge variant="secondary" className="bg-black/70 text-white">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(clip.duration)}
                            </Badge>
                          </div>

                          {/* Virality Score Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge className={getViralityColor(clip.viralityScore)}>
                              {getViralityRank(clip.viralityScore)} Virality score ({clip.viralityScore}/100)
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex-1">
                          {/* Title and Event */}
                          <h3 className="text-xl font-bold mb-2 leading-tight">{clip.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Generated from <span className="font-medium">{clip.eventName}</span>
                          </p>

                          {/* Virality Reasoning */}
                          <div className="mb-6">
                            <p className="text-sm leading-relaxed text-gray-700">
                              {clip.reasoning}
                            </p>
                          </div>

                          {/* Transcript Preview */}
                          <div className="mb-6">
                            <h4 className="font-medium text-sm mb-2">Transcript</h4>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {clip.transcript}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Button 
                            className="flex-1 bg-black hover:bg-gray-800 text-white"
                            onClick={() => handlePublishClip(clip)}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Publish
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              const baseContent: BaseContentItem = {
                                id: clip.id,
                                title: clip.title,
                                type: 'reel',
                                duration: clip.duration,
                                viralityScore: clip.viralityScore,
                                reasoning: clip.reasoning,
                                suggestedCaption: clip.suggestedCaption,
                                suggestedHashtags: clip.suggestedHashtags,
                                speaker_name: clip.speakerName,
                                event_name: clip.eventName
                              };
                              handleDownloadClip(baseContent);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
                <div className="text-center space-y-3">
                  <Video className="h-12 w-12 mx-auto opacity-50" />
                  <p>No video content uploaded yet.</p>
                  <p className="text-sm">Video content will appear here once uploaded and processed.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="mt-4"
                  >
                    Show Preview Mode
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
              <CardDescription>AI-generated summary of key discussion points</CardDescription>
            </CardHeader>
            <CardContent>
              {isProcessing ? (
                <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p>AI is analyzing your content and generating a professional summary...</p>
                    <p className="text-sm">This usually takes 30-60 seconds</p>
                  </div>
                </div>
              ) : hasError ? (
                <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                  <div className="text-center space-y-3">
                    <p>There was an error generating the summary.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onRefreshSession}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : isEditing ? (
                <Textarea 
                  value={session.generated_summary || session.transcript_summary || 'No summary available.'}
                  className="min-h-[200px] resize-none"
                  placeholder="Edit summary..."
                />
              ) : (
                <div className="prose max-w-none">
                  <p className="text-foreground leading-relaxed">
                    {session.generated_summary || session.transcript_summary || 'No summary available yet. The content is being processed.'}
                  </p>
                </div>
              )}
              {!isProcessing && !hasError && (
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onCopy(session.generated_summary || session.transcript_summary || 'No summary available.', "Summary")}
                    disabled={!session.generated_summary && !session.transcript_summary}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDownload("PDF")}
                    disabled={!session.generated_summary && !session.transcript_summary}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog" className="mt-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Blog Article</CardTitle>
              <CardDescription>Ready-to-publish blog post</CardDescription>
            </CardHeader>
            <CardContent>
              {isProcessing ? (
                <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p>AI is generating your blog content...</p>
                    <p className="text-sm">Creating professional article with insights</p>
                  </div>
                </div>
              ) : hasError ? (
                <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                  <div className="text-center space-y-3">
                    <p>There was an error generating the blog content.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onRefreshSession}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : isEditing ? (
                <Textarea 
                  value={session.session_data?.blog_content || 'No blog content available.'}
                  className="min-h-[400px] resize-none font-mono text-sm"
                  placeholder="Edit blog content..."
                />
              ) : (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-foreground">
                    {session.session_data?.blog_content || 'No blog content available yet. The content is being processed.'}
                  </div>
                </div>
              )}
              {!isProcessing && !hasError && (
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onCopy(session.session_data?.blog_content || 'No blog content available.', "Blog")}
                    disabled={!session.session_data?.blog_content}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy HTML
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDownload("Markdown")}
                    disabled={!session.session_data?.blog_content}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Markdown
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Twitter Thread</CardTitle>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="flex items-center justify-center min-h-[150px] text-muted-foreground">
                    <div className="text-center space-y-3">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p>Generating Twitter content...</p>
                    </div>
                  </div>
                ) : hasError ? (
                  <div className="flex items-center justify-center min-h-[150px] text-muted-foreground">
                    <div className="text-center space-y-3">
                      <p>Error generating Twitter content.</p>
                      <Button variant="outline" size="sm" onClick={onRefreshSession} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{session.session_data?.social_posts?.twitter || 'No Twitter content available yet.'}</p>
                  </div>
                )}
                {!isProcessing && !hasError && (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onCopy(session.session_data?.social_posts?.twitter || 'No Twitter content available.', "Twitter thread")}
                      disabled={!session.session_data?.social_posts?.twitter}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>LinkedIn Post</CardTitle>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                    <div className="text-center space-y-3">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p>Generating LinkedIn content...</p>
                    </div>
                  </div>
                ) : hasError ? (
                  <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                    <div className="text-center space-y-3">
                      <p>Error generating LinkedIn content.</p>
                      <Button variant="outline" size="sm" onClick={onRefreshSession} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{session.session_data?.social_posts?.linkedin || 'No LinkedIn content available yet.'}</p>
                  </div>
                )}
                {!isProcessing && !hasError && (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onCopy(session.session_data?.social_posts?.linkedin || 'No LinkedIn content available.', "LinkedIn post")}
                      disabled={!session.session_data?.social_posts?.linkedin}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <div className="space-y-4">
            {isProcessing ? (
              <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p>Extracting key quotes...</p>
                  <p className="text-sm">Finding the most impactful statements</p>
                </div>
              </div>
            ) : hasError ? (
              <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                <div className="text-center space-y-3">
                  <p>Error extracting quotes.</p>
                  <Button variant="outline" size="sm" onClick={onRefreshSession} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                </div>
              </div>
            ) : session.session_data?.key_quotes && session.session_data.key_quotes.length > 0 ? (
              session.session_data.key_quotes.map((quote, index) => (
                <Card key={index} className="shadow-card">
                  <CardContent className="p-6">
                    <blockquote className="text-lg italic mb-4">
                      "{quote}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Key Insight {index + 1}</p>
                        <p className="text-sm text-muted-foreground">Extracted from content</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onCopy(quote, "Quote")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                <div className="text-center space-y-3">
                  <MessageSquare className="h-12 w-12 mx-auto opacity-50" />
                  <p>No key quotes available yet.</p>
                  <p className="text-sm">Quotes will appear here once processing is complete.</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transcript" className="mt-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Full Transcript</CardTitle>
              <CardDescription>Complete session transcript with timestamps</CardDescription>
            </CardHeader>
            <CardContent>
              {isProcessing ? (
                <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p>Processing transcript...</p>
                    <p className="text-sm">Extracting text content</p>
                  </div>
                </div>
              ) : hasError ? (
                <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                  <div className="text-center space-y-3">
                    <p>Error processing transcript.</p>
                    <Button variant="outline" size="sm" onClick={onRefreshSession} disabled={refreshing}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">
                    {session.session_data?.extracted_text || session.transcript_summary || 'No transcript content available yet.'}
                  </pre>
                </div>
              )}
              {!isProcessing && !hasError && (
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onCopy(session.session_data?.extracted_text || session.transcript_summary || 'No transcript content available.', "Transcript")}
                    disabled={!session.session_data?.extracted_text && !session.transcript_summary}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDownload("TXT")}
                    disabled={!session.session_data?.extracted_text && !session.transcript_summary}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PUBLISH MODAL */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        content={selectedClip}
        onPublish={handlePublish}
        onDownload={handleDownloadClip}
        title="Publish Your Video"
      />
    </div>
  );
}; 