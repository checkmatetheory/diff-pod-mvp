import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Copy, 
  FileText, 
  MessageSquare, 
  Users, 
  Clock,
  Edit,
  Save,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Mock session data - in real app this would come from API
  const session = {
    id: id || '1',
    title: 'AI in Fintech: Future Trends Panel',
    date: '2024-01-15',
    duration: '47 min',
    speakers: ['Sarah Chen', 'Michael Rodriguez', 'Dr. Lisa Zhang'],
    status: 'complete' as const,
    publicUrl: `https://recaps.diffused.app/ai-fintech-trends-${id}`,
    content: {
      summary: `This comprehensive panel discussion explored the transformative impact of artificial intelligence on the financial technology sector. Industry leaders discussed emerging trends, regulatory challenges, and the future landscape of AI-powered financial services.

Key themes included the democratization of financial services through AI, the importance of ethical AI implementation, and the need for robust regulatory frameworks to ensure consumer protection while fostering innovation.`,
      
      blog: `# AI in Fintech: Shaping the Future of Financial Services

The financial technology sector stands at a pivotal moment as artificial intelligence continues to reshape how we interact with money, investments, and financial services. In our recent panel discussion, three industry leaders shared their insights on the transformative power of AI in fintech.

## The Current Landscape

According to Sarah Chen, CEO of FinTech Innovations, "We're witnessing an unprecedented acceleration in AI adoption across financial services. From automated trading algorithms to personalized financial advice, AI is becoming the backbone of modern fintech."

### Key Developments

- **Automated Decision Making**: AI algorithms now process millions of loan applications, credit assessments, and risk evaluations daily
- **Personalized Services**: Machine learning enables hyper-personalized financial products and recommendations
- **Fraud Detection**: Advanced AI systems can identify suspicious patterns in real-time, protecting both institutions and consumers

## Challenges and Opportunities

Dr. Lisa Zhang, Director of AI Ethics at Global Bank, emphasized the importance of responsible AI implementation: "While the opportunities are immense, we must ensure that AI systems are transparent, fair, and aligned with regulatory requirements."

### Regulatory Considerations

The panel highlighted several key regulatory challenges:
- Data privacy and protection
- Algorithmic transparency
- Fair lending practices
- Consumer protection measures

## Looking Ahead

Michael Rodriguez, CTO of NextGen Payments, shared his vision for the future: "The next five years will see AI become even more integrated into financial services, with conversational AI, predictive analytics, and automated portfolio management becoming standard features."

## Conclusion

The intersection of AI and fintech presents both tremendous opportunities and significant responsibilities. As the industry continues to evolve, the focus must remain on creating innovative solutions that benefit consumers while maintaining the highest standards of ethics and security.`,

      social: {
        twitter: `🚀 Key insights from our AI in Fintech panel:

• AI is democratizing financial services
• Regulatory frameworks must evolve with technology  
• Ethical AI implementation is non-negotiable
• The next 5 years will be transformative

What's your take on AI's role in finance? 

#FinTech #ArtificialIntelligence #Finance`,

        linkedin: `Reflecting on our recent "AI in Fintech: Future Trends" panel discussion with industry leaders Sarah Chen, Michael Rodriguez, and Dr. Lisa Zhang.

🔍 Key Takeaways:

→ AI is transforming every aspect of financial services - from automated decision-making to personalized recommendations
→ Regulatory frameworks need to evolve to keep pace with technological advancement
→ Ethical AI implementation isn't just important - it's essential for sustainable growth
→ The democratization of financial services through AI will create unprecedented opportunities

The conversation highlighted both the immense potential and the critical responsibilities we face as an industry. As we build the future of finance, we must ensure that innovation serves everyone equitably.

What trends are you seeing in AI-powered financial services? I'd love to hear your perspectives.

#FinTech #ArtificialIntelligence #Finance #Innovation #TechTrends`
      },

      quotes: [
        {
          speaker: 'Sarah Chen',
          role: 'CEO, FinTech Innovations',
          quote: "We're witnessing an unprecedented acceleration in AI adoption across financial services. The companies that embrace this transformation will define the next decade of finance."
        },
        {
          speaker: 'Dr. Lisa Zhang',
          role: 'Director of AI Ethics, Global Bank',
          quote: "While the opportunities are immense, we must ensure that AI systems are transparent, fair, and aligned with regulatory requirements. Ethics cannot be an afterthought."
        },
        {
          speaker: 'Michael Rodriguez',
          role: 'CTO, NextGen Payments',
          quote: "The next five years will see AI become even more integrated into financial services, with conversational AI and predictive analytics becoming standard features."
        }
      ],

      transcript: `[00:00:00] Moderator: Welcome everyone to our panel on AI in Fintech. I'm joined today by three incredible experts...

[00:01:30] Sarah Chen: Thank you for having me. I'm excited to discuss how AI is reshaping the financial landscape...

[00:02:45] Dr. Lisa Zhang: The ethical implications of AI in finance cannot be overstated...

[00:04:20] Michael Rodriguez: From a technical perspective, we're seeing remarkable advances in machine learning algorithms...

[Transcript continues for full 47-minute session...]`
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${type} content copied successfully`,
    });
  };

  const handleDownload = (format: string) => {
    toast({
      title: "Download started",
      description: `Downloading ${session.title} as ${format}`,
    });
  };

  const handlePublish = () => {
    toast({
      title: "Published successfully",
      description: "Your session recap is now live and shareable",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Session Info Card */}
            <Card className="shadow-card mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{session.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {session.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {session.speakers.length} speakers
                      </div>
                      <span>{session.date}</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {session.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                      {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                      {isEditing ? 'Save' : 'Edit'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Content Tabs */}
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="blog">Blog</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="quotes">Quotes</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                    <CardDescription>AI-generated summary of key discussion points</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea 
                        value={session.content.summary}
                        className="min-h-[200px] resize-none"
                        placeholder="Edit summary..."
                      />
                    ) : (
                      <div className="prose max-w-none">
                        <p className="text-foreground leading-relaxed">{session.content.summary}</p>
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopy(session.content.summary, "Summary")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload("PDF")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
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
                    {isEditing ? (
                      <Textarea 
                        value={session.content.blog}
                        className="min-h-[400px] resize-none font-mono text-sm"
                        placeholder="Edit blog content..."
                      />
                    ) : (
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap text-foreground">{session.content.blog}</div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopy(session.content.blog, "Blog")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy HTML
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload("Markdown")}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Markdown
                      </Button>
                    </div>
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
                      {isEditing ? (
                        <Textarea 
                          value={session.content.social.twitter}
                          className="min-h-[150px] resize-none"
                          placeholder="Edit Twitter content..."
                        />
                      ) : (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{session.content.social.twitter}</p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopy(session.content.social.twitter, "Twitter thread")}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle>LinkedIn Post</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Textarea 
                          value={session.content.social.linkedin}
                          className="min-h-[200px] resize-none"
                          placeholder="Edit LinkedIn content..."
                        />
                      ) : (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="whitespace-pre-wrap">{session.content.social.linkedin}</p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopy(session.content.social.linkedin, "LinkedIn post")}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="quotes" className="mt-6">
                <div className="space-y-4">
                  {session.content.quotes.map((quote, index) => (
                    <Card key={index} className="shadow-card">
                      <CardContent className="p-6">
                        <blockquote className="text-lg italic mb-4">
                          "{quote.quote}"
                        </blockquote>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{quote.speaker}</p>
                            <p className="text-sm text-muted-foreground">{quote.role}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCopy(quote.quote, "Quote")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="transcript" className="mt-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Full Transcript</CardTitle>
                    <CardDescription>Complete session transcript with timestamps</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{session.content.transcript}</pre>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopy(session.content.transcript, "Transcript")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload("TXT")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-accent hover:bg-accent-hover"
                  onClick={handlePublish}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Publish Recap
                </Button>
                <Button variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Session
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </CardContent>
            </Card>

            {/* Public URL */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Public Recap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor="public-url">Shareable URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="public-url"
                      value={session.publicUrl}
                      readOnly
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopy(session.publicUrl, "URL")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(`/recap/${session.id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview Public Page
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Speakers */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Speakers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {session.speakers.map((speaker, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {speaker.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-sm">{speaker}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SessionDetail;