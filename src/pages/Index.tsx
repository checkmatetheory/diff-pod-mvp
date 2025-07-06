import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Sparkles, Headphones, Mic, Building2, Users, DollarSign, Settings, Play, Briefcase, Megaphone, Volume2, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import SessionUpload from "@/components/SessionUpload";

const Index = () => {
  const [showUpload, setShowUpload] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !showUpload) {
      navigate('/portfolios');
    }
  }, [user, showUpload, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Enterprise Podcast Platform</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu />
            ) : (
              <Link to="/auth">
                <Button variant="outline">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {!showUpload ? (
          <>
            {/* Enterprise Hero Section */}
            <div className="text-center mb-20">
              <div className="flex justify-center mb-8">
                <div className="p-8 rounded-full bg-gradient-primary shadow-xl">
                  <Building2 className="h-16 w-16 text-white" />
                </div>
              </div>
              <h1 className="text-6xl font-bold text-gradient-primary mb-6 leading-tight">
                Enterprise AI Podcast Platform
              </h1>
              <p className="text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
                Transform your conference portfolio into professional podcast content with custom voices, 
                sponsor integrations, and multi-host AI generation for media groups and enterprise clients.
              </p>
              <div className="flex justify-center gap-6 flex-wrap">
                {user ? (
                  <Button 
                    onClick={() => setShowUpload(true)}
                    size="lg"
                    className="bg-gradient-accent hover:opacity-90 transition-opacity text-xl px-10 py-6"
                  >
                    <Upload className="h-6 w-6 mr-3" />
                    Upload Content
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button 
                      size="lg"
                      className="bg-gradient-accent hover:opacity-90 transition-opacity text-xl px-10 py-6"
                    >
                      <Upload className="h-6 w-6 mr-3" />
                      Start Enterprise Trial
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="lg" className="text-xl px-10 py-6">
                  <Briefcase className="h-6 w-6 mr-3" />
                  Schedule Demo
                </Button>
              </div>
            </div>

            {/* Enterprise Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
              <Card className="shadow-xl border-0 bg-card hover:shadow-2xl transition-shadow">
                <CardHeader className="text-center pb-6">
                  <div className="p-6 rounded-full bg-primary-subtle mx-auto mb-6 w-fit">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Portfolio Management</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-lg">
                    Manage multiple conference brands and events under unified portfolios with custom branding and audio assets
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-card hover:shadow-2xl transition-shadow">
                <CardHeader className="text-center pb-6">
                  <div className="p-6 rounded-full bg-accent-subtle mx-auto mb-6 w-fit">
                    <Volume2 className="h-10 w-10 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">Custom Voice Training</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-lg">
                    Train custom AI voices for your hosts, create unique brand voices, and support multi-host podcast formats
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-card hover:shadow-2xl transition-shadow">
                <CardHeader className="text-center pb-6">
                  <div className="p-6 rounded-full bg-primary-subtle mx-auto mb-6 w-fit">
                    <DollarSign className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Sponsor Integration</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-lg">
                    Seamlessly integrate sponsor ads with custom placement, revenue tracking, and automated ad insertion
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-card hover:shadow-2xl transition-shadow">
                <CardHeader className="text-center pb-6">
                  <div className="p-6 rounded-full bg-accent-subtle mx-auto mb-6 w-fit">
                    <Sparkles className="h-10 w-10 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">AI-Powered Production</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-lg">
                    Advanced AI creates professional podcast content with custom intro/outro music and intelligent editing
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-card hover:shadow-2xl transition-shadow">
                <CardHeader className="text-center pb-6">
                  <div className="p-6 rounded-full bg-primary-subtle mx-auto mb-6 w-fit">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Multi-Host Support</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-lg">
                    Configure multiple podcast hosts per event with custom voice assignments and speaking time distribution
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-card hover:shadow-2xl transition-shadow">
                <CardHeader className="text-center pb-6">
                  <div className="p-6 rounded-full bg-accent-subtle mx-auto mb-6 w-fit">
                    <Megaphone className="h-10 w-10 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">Enterprise Distribution</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-lg">
                    White-label RSS feeds, custom embed codes, and enterprise-grade analytics for media distribution
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Enterprise Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-20">
              <Card className="shadow-lg border-0 bg-card text-center p-8">
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <p className="text-muted-foreground">Enterprise Clients</p>
              </Card>
              <Card className="shadow-lg border-0 bg-card text-center p-8">
                <div className="text-4xl font-bold text-accent mb-2">10K+</div>
                <p className="text-muted-foreground">Conferences Processed</p>
              </Card>
              <Card className="shadow-lg border-0 bg-card text-center p-8">
                <div className="text-4xl font-bold text-primary mb-2">$2M+</div>
                <p className="text-muted-foreground">Sponsor Revenue Generated</p>
              </Card>
              <Card className="shadow-lg border-0 bg-card text-center p-8">
                <div className="text-4xl font-bold text-accent mb-2">99.9%</div>
                <p className="text-muted-foreground">Enterprise Uptime</p>
              </Card>
            </div>

            {/* Enterprise CTA */}
            <div className="text-center bg-card p-16 rounded-3xl shadow-xl">
              <h2 className="text-4xl font-bold mb-6 text-gradient-primary">Ready for Enterprise Scale?</h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
                Join leading media groups and conference organizers who trust our platform to monetize their content 
                and deliver professional podcast experiences to millions of listeners.
              </p>
              <div className="flex justify-center gap-6 flex-wrap">
                {user ? (
                  <>
                    <Button 
                      onClick={() => setShowUpload(true)}
                      size="lg"
                      className="bg-gradient-primary hover:opacity-90 text-xl px-10 py-6"
                    >
                      <Upload className="h-6 w-6 mr-3" />
                      Start Production
                    </Button>
                    <Link to="/portfolios">
                      <Button variant="outline" size="lg" className="text-xl px-10 py-6">
                        <Play className="h-6 w-6 mr-3" />
                        View Portfolios
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button 
                      size="lg"
                      className="bg-gradient-primary hover:opacity-90 text-xl px-10 py-6"
                    >
                      <Upload className="h-6 w-6 mr-3" />
                      Get Started
                    </Button>
                  </Link>
                )}
              </div>
              <div className="mt-8 flex justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Settings className="h-3 w-3 mr-1" />
                    Enterprise SSO
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Headphones className="h-3 w-3 mr-1" />
                    24/7 Support
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Revenue Sharing
                  </Badge>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gradient-primary">Enterprise Podcast Studio</h1>
                <p className="text-muted-foreground mt-2 text-lg">Upload your conference content to generate professional multi-host podcasts with sponsor integration</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowUpload(false)}
                size="lg"
              >
                Back to Home
              </Button>
            </div>
            <SessionUpload />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
