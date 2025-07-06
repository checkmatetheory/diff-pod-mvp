import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Share2, 
  Download, 
  Clock, 
  Users, 
  Calendar,
  ExternalLink,
  Mail,
  Twitter,
  Linkedin,
  Copy,
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PublicRecap = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [showFullContent, setShowFullContent] = useState(false);

  // Mock session data - in real app this would come from API
  const session = {
    id: id || '1',
    title: 'AI in Fintech: Future Trends Panel',
    date: '2024-01-15',
    duration: '47 min',
    speakers: ['Sarah Chen', 'Michael Rodriguez', 'Dr. Lisa Zhang'],
    company: {
      name: 'Acme Corp',
      logo: '',
      primaryColor: '#6EC1E4',
      accentColor: '#FF7755'
    },
    content: {
      summary: `This comprehensive panel discussion explored the transformative impact of artificial intelligence on the financial technology sector. Industry leaders discussed emerging trends, regulatory challenges, and the future landscape of AI-powered financial services.

Key themes included the democratization of financial services through AI, the importance of ethical AI implementation, and the need for robust regulatory frameworks to ensure consumer protection while fostering innovation.`,
      
      keyTakeaways: [
        "AI is democratizing access to financial services globally",
        "Regulatory frameworks must evolve with technological advancement",
        "Ethical AI implementation is critical for sustainable growth",
        "The next 5 years will see unprecedented AI integration in finance"
      ],

      quotes: [
        {
          speaker: 'Sarah Chen',
          role: 'CEO, FinTech Innovations',
          quote: "We're witnessing an unprecedented acceleration in AI adoption across financial services."
        },
        {
          speaker: 'Dr. Lisa Zhang',
          role: 'Director of AI Ethics, Global Bank',
          quote: "Ethics cannot be an afterthought when implementing AI in financial services."
        }
      ]
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setShowFullContent(true);
      toast({
        title: "Access granted!",
        description: "You now have full access to the content.",
      });
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this insightful recap: ${session.title}`;
    
    let shareUrl = '';
    
    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "The recap link has been copied to your clipboard.",
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ 
                background: `linear-gradient(135deg, ${session.company.primaryColor}, ${session.company.accentColor})`
              }}
            >
              {session.company.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-bold text-lg">{session.company.name}</h1>
              <p className="text-xs text-muted-foreground">Session Recap</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleShare('copy')}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              style={{ backgroundColor: session.company.accentColor }}
              className="text-white hover:opacity-90"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Session Recap
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {session.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {session.date}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {session.duration}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {session.speakers.length} speakers
            </div>
          </div>
          
          {/* Audio Player Preview */}
          <div className="bg-muted/30 rounded-lg p-4 mb-8 max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                variant="outline"
                style={{ borderColor: session.company.primaryColor }}
              >
                <Play className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <div className="w-full bg-muted h-2 rounded-full">
                  <div 
                    className="h-2 rounded-full w-1/3"
                    style={{ backgroundColor: session.company.primaryColor }}
                  />
                </div>
              </div>
              <span className="text-sm text-muted-foreground">15:32</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Executive Summary */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
                <CardDescription>Key insights from the discussion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-foreground leading-relaxed">
                    {session.content.summary}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Key Takeaways */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Key Takeaways</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {session.content.keyTakeaways.map((takeaway, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div 
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: session.company.accentColor }}
                      />
                      <span className="text-foreground">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Speaker Quotes */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Notable Quotes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {session.content.quotes.map((quote, index) => (
                  <div key={index}>
                    <blockquote className="text-lg italic mb-3">
                      "{quote.quote}"
                    </blockquote>
                    <div>
                      <p className="font-semibold">{quote.speaker}</p>
                      <p className="text-sm text-muted-foreground">{quote.role}</p>
                    </div>
                    {index < session.content.quotes.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Email Gate for Full Content */}
            {!showFullContent && (
              <Card className="shadow-card border-accent/20">
                <CardHeader className="text-center">
                  <CardTitle>Want the Full Report?</CardTitle>
                  <CardDescription>
                    Get access to the complete blog post, social content, and full transcript
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex-1"
                      />
                      <Button 
                        type="submit"
                        style={{ backgroundColor: session.company.accentColor }}
                        className="text-white hover:opacity-90"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Get Access
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Full Content (shown after email) */}
            {showFullContent && (
              <Card className="shadow-card border-green-200 bg-green-50/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <CardTitle className="text-green-800">Full Access Granted</CardTitle>
                  </div>
                  <CardDescription className="text-green-700">
                    Thank you! You now have access to all content and can download the complete report.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="border-green-300 text-green-800 hover:bg-green-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-green-300 text-green-800 hover:bg-green-100"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Blog Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Share */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Share This Recap</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleShare('twitter')}
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Share on Twitter
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleShare('linkedin')}
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  Share on LinkedIn
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleShare('copy')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </CardContent>
            </Card>

            {/* Speakers */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Featured Speakers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.speakers.map((speaker, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: session.company.primaryColor }}
                      >
                        {speaker.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium">{speaker}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">About {session.company.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This content was generated using Diffused, transforming live sessions 
                  into lasting insights that drive business value.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 {session.company.name}. All rights reserved. • 
            <span className="ml-2">
              Powered by <span className="font-medium">Diffused</span>
            </span>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PublicRecap;