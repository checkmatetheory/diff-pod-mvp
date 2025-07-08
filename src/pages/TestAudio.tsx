import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const TestAudio = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [url, setUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [textContent, setTextContent] = useState("This comprehensive document explores strategic frameworks for business transformation and competitive advantage. The analysis covers key methodologies for market positioning, operational excellence, and sustainable growth strategies. Organizations implementing these frameworks see measurable improvements in performance metrics and strategic outcomes. The discussion includes case studies from leading companies that have successfully leveraged these approaches to drive innovation and market leadership. Key insights focus on data-driven decision making, systematic operational optimization, and strategic planning processes that create sustainable competitive advantages in dynamic market environments.");

  const testEdgeFunction = async (type: 'url' | 'text') => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      // Create a test session first
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          session_name: `Test ${type} - ${new Date().toISOString()}`,
          user_id: user.id,
          event_id: 'ed79b2da-1357-4062-b029-a7114c03bcd5', // Using TestCon 2025
          processing_status: 'uploaded',
          session_data: type === 'url' ? { source_url: url } : { text_content: textContent }
        })
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      console.log('Created test session:', session);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('process-session', {
        body: { 
          sessionId: session.id,
          filePath: null,
          fileType: type,
          textContent: type === 'text' ? textContent : null
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        throw error;
      }

      setResponse({ success: true, data, sessionId: session.id });
      
      toast({
        title: "Test successful!",
        description: `Edge function processed ${type} successfully`,
      });

    } catch (error: any) {
      console.error('Test error:', error);
      setResponse({ success: false, error: error.message });
      
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testPDFSimulation = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    const pdfSimulationContent = `Smart Farming Technologies and Sustainability Analysis

Executive Summary:
This comprehensive analysis examines the intersection of advanced agricultural technologies and sustainable farming practices. The research demonstrates how precision agriculture, IoT sensors, and data analytics are revolutionizing farming efficiency while reducing environmental impact.

Key Findings:
1. Precision agriculture technologies reduce water usage by 30-50% while maintaining crop yields
2. IoT sensor networks enable real-time monitoring of soil conditions, weather patterns, and crop health
3. Machine learning algorithms optimize planting schedules and resource allocation
4. Sustainable farming practices combined with technology create measurable ROI improvements
5. Integration challenges exist but are solvable with proper planning and implementation

Strategic Recommendations:
The analysis recommends a phased approach to technology adoption, starting with pilot programs in controlled environments before scaling to full operations. Investment in training and change management is crucial for successful implementation.

Conclusion:
Smart farming represents the future of sustainable agriculture, offering solutions that benefit both productivity and environmental stewardship. Organizations that invest early in these technologies will have significant competitive advantages.`;

    try {
      console.log('🧪 Testing PDF simulation content generation...');
      console.log('Content length:', pdfSimulationContent.length);
      
      const sessionData = {
        content: pdfSimulationContent,
        fileName: 'Smart_Farming_Technologies_and_Sustainability.pdf',
        videoTitle: 'Smart Farming Technologies and Sustainability Analysis'
      };

      const { data, error } = await supabase.functions.invoke('process-session', {
        body: sessionData
      });

      if (error) {
        console.error('Edge function error:', error);
        setResponse({ error: `Edge function error: ${error.message}` });
      } else {
        console.log('✅ Edge function response:', data);
        setResponse(data);
        
        // Now check the database for the generated content
        setTimeout(async () => {
          console.log('🔍 Checking database for generated content...');
          const { data: sessions, error: dbError } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (dbError) {
            console.error('Database query error:', dbError);
          } else if (sessions && sessions.length > 0) {
            const latestSession = sessions[0];
            console.log('📊 Latest session data:', {
              id: latestSession.id,
              processing_status: latestSession.processing_status,
              generated_summary: latestSession.generated_summary ? 'Present' : 'Missing',
              podcast_url: latestSession.podcast_url ? 'Present' : 'Missing',
              session_data: latestSession.session_data ? 'Present' : 'Missing',
              session_data_keys: latestSession.session_data ? Object.keys(latestSession.session_data) : 'No session_data'
            });
            
            if (latestSession.session_data) {
              console.log('📝 Session data structure:', {
                blog_content: (latestSession.session_data as any).blog_content ? 'Present' : 'Missing',
                social_posts: (latestSession.session_data as any).social_posts ? 'Present' : 'Missing',
                key_quotes: (latestSession.session_data as any).key_quotes ? 'Present' : 'Missing',
                podcast_script: (latestSession.session_data as any).podcast_script ? 'Present' : 'Missing',
                ai_enhanced: (latestSession.session_data as any).ai_enhanced
              });
              
              if ((latestSession.session_data as any).blog_content) {
                console.log('📄 Blog content preview:', (latestSession.session_data as any).blog_content.slice(0, 200) + '...');
              }
              
              if ((latestSession.session_data as any).social_posts) {
                console.log('📱 Social posts available:', Object.keys((latestSession.session_data as any).social_posts));
              }
              
              if ((latestSession.session_data as any).key_quotes) {
                console.log('💬 Key quotes:', (latestSession.session_data as any).key_quotes);
              }
            }
          }
        }, 3000); // Wait 3 seconds for processing to complete
      }
    } catch (error) {
      console.error('Test error:', error);
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkLogs = async () => {
    try {
      // Get recent logs
      const logsResponse = await fetch('/api/logs');
      console.log('Would check Supabase logs here');
      
      toast({
        title: "Check console",
        description: "Check browser console for edge function logs",
      });
    } catch (error) {
      console.error('Error checking logs:', error);
    }
  };

  const checkDebugSession = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const { data: sessions, error: dbError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (dbError) {
        throw dbError;
      }

      if (sessions && sessions.length > 0) {
        const latestSession = sessions[0];
        console.log('📊 Debugging latest session:', {
          id: latestSession.id,
          processing_status: latestSession.processing_status,
          generated_summary: latestSession.generated_summary ? 'Present' : 'Missing',
          podcast_url: latestSession.podcast_url ? 'Present' : 'Missing',
          session_data: latestSession.session_data ? 'Present' : 'Missing',
          session_data_keys: latestSession.session_data ? Object.keys(latestSession.session_data) : 'No session_data'
        });
        
        if (latestSession.session_data) {
          console.log('📝 Session data structure:', {
            blog_content: latestSession.session_data.blog_content ? 'Present' : 'Missing',
            social_posts: latestSession.session_data.social_posts ? 'Present' : 'Missing',
            key_quotes: latestSession.session_data.key_quotes ? 'Present' : 'Missing',
            podcast_script: latestSession.session_data.podcast_script ? 'Present' : 'Missing',
            ai_enhanced: latestSession.session_data.ai_enhanced
          });
          
          if (latestSession.session_data.blog_content) {
            console.log('📄 Blog content preview:', latestSession.session_data.blog_content.slice(0, 200) + '...');
          }
          
          if (latestSession.session_data.social_posts) {
            console.log('📱 Social posts available:', Object.keys(latestSession.session_data.social_posts));
          }
          
          if (latestSession.session_data.key_quotes) {
            console.log('💬 Key quotes:', latestSession.session_data.key_quotes);
          }
        }
        setResponse({ success: true, data: latestSession });
        toast({
          title: "Debug session found!",
          description: `Latest session data for user ${user.id}`,
        });
      } else {
        setResponse({ success: false, error: "No session found for this user." });
        toast({
          title: "No Session Found",
          description: `No session found for user ${user.id}. Please run a test session first.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Debug session error:', error);
      setResponse({ success: false, error: error.message });
      toast({
        title: "Debug failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reprocessSession = async (sessionId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      console.log('🔄 Reprocessing session:', sessionId);
      
      // First, get the session to understand what type of content it has
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        throw sessionError;
      }

      console.log('📋 Session to reprocess:', {
        id: session.id,
        name: session.session_name,
        status: session.processing_status,
        hasSessionData: !!session.session_data
      });

      // Reset the session status to processing
      const { error: resetError } = await supabase
        .from('user_sessions')
        .update({ processing_status: 'processing' })
        .eq('id', sessionId);

      if (resetError) {
        throw resetError;
      }

      // Determine the content type and reprocess accordingly
      let contentParams = {
        sessionId: sessionId,
        filePath: null,
        fileType: 'text',
        textContent: null
      };

      // If there's text content in session_data, use that
      if (session.session_data?.text_content) {
        contentParams.textContent = session.session_data.text_content;
        contentParams.fileType = 'text';
      }
      // If there's a PDF or file, we need to reconstruct the file path
      else if (session.session_name?.includes('.pdf') || session.session_name?.includes('MEGATRENDS')) {
        // For PDF files, we'll let the edge function handle the filename-based processing
        contentParams.filePath = `${user.id}/${session.session_name}`;
        contentParams.fileType = 'application/pdf';
      }
      // If there's a URL, handle that
      else if (session.session_data?.source_url) {
        contentParams.fileType = 'url';
      }

      console.log('🚀 Calling edge function with params:', contentParams);

      const { data, error: processError } = await supabase.functions.invoke('process-session', {
        body: contentParams
      });

      if (processError) {
        console.error('Edge function error:', processError);
        setResponse({ error: `Reprocessing failed: ${processError.message}` });
        
        // Reset status back to complete if reprocessing fails
        await supabase
          .from('user_sessions')
          .update({ processing_status: 'complete' })
          .eq('id', sessionId);
      } else {
        console.log('✅ Reprocessing initiated successfully:', data);
        setResponse({ success: true, message: 'Session reprocessing started', data });
        
        toast({
          title: "Reprocessing Started",
          description: `Session ${sessionId} is being reprocessed with improved content generation.`,
        });

        // Wait a moment and then check the results
        setTimeout(async () => {
          const { data: updatedSession } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
            
          if (updatedSession) {
            console.log('📊 Reprocessed session result:', {
              status: updatedSession.processing_status,
              hasContent: !!(updatedSession.session_data?.blog_content && 
                            updatedSession.session_data?.social_posts && 
                            updatedSession.session_data?.key_quotes)
            });
          }
        }, 5000);
      }
    } catch (error: any) {
      console.error('Reprocessing error:', error);
      setResponse({ error: error.message });
      toast({
        title: "Reprocessing failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto px-6 py-8">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Edge Function Test</CardTitle>
                    <CardDescription>
                      Test the process-session edge function with different inputs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* URL Test */}
                    <div className="space-y-3">
                      <Label htmlFor="url-input">YouTube URL Test</Label>
                      <Input
                        id="url-input"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter YouTube URL..."
                      />
                      <Button 
                        onClick={() => testEdgeFunction('url')}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Test URL Processing
                      </Button>
                    </div>

                    {/* Text Test */}
                    <div className="space-y-3">
                      <Label htmlFor="text-input">Text Content Test</Label>
                      <Textarea
                        id="text-input"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Enter text content..."
                        className="min-h-[100px]"
                      />
                      <Button 
                        onClick={() => testEdgeFunction('text')}
                        disabled={loading}
                        className="w-full"
                        variant="outline"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Test Text Processing
                      </Button>
                    </div>

                    {/* PDF Simulation Test */}
                    <div className="space-y-3">
                      <Label htmlFor="pdf-simulation-input">PDF Simulation Test</Label>
                      <Button 
                        onClick={testPDFSimulation}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Test PDF Simulation Processing
                      </Button>
                    </div>

                    {/* Logs Button */}
                    <Button 
                      onClick={checkLogs}
                      variant="secondary"
                      className="w-full"
                    >
                      Check Logs (Console)
                    </Button>

                    <Button 
                      onClick={checkDebugSession}
                      disabled={loading}
                      className="w-full"
                      variant="outline"
                    >
                      Debug Latest Session
                    </Button>
                    
                    {/* Reprocess Session */}
                    <div className="space-y-3 pt-4 border-t">
                      <Label htmlFor="session-id-input">Reprocess Existing Session</Label>
                      <Input
                        id="session-id-input"
                        placeholder="69322dd3-250c-4852-9003-7412e8e815bf"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                      />
                      <Button 
                        onClick={() => setSessionId('69322dd3-250c-4852-9003-7412e8e815bf')}
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                      >
                        Use MEGATRENDS Session (Has Content)
                      </Button>
                      <Button 
                        onClick={() => reprocessSession(sessionId)} 
                        disabled={loading || !sessionId.trim()}
                        className="w-full"
                        variant="destructive"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Fix Session Content
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Use this to fix sessions that show "Complete" but have missing content. 
                        Get the session ID from the URL (e.g., /session/69322dd3-250c-4852-9003-7412e8e815bf)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Display */}
                {response && (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Test Result: {response.success ? "✅ Success" : "❌ Error"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(response, null, 2)}
                      </pre>
                      {response.sessionId && (
                        <div className="mt-4">
                          <Button 
                            onClick={() => window.open(`/session/${response.sessionId}`, '_blank')}
                            variant="outline"
                          >
                            View Session Detail
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Debug Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Debug Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
                      <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</p>
                      <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default TestAudio; 