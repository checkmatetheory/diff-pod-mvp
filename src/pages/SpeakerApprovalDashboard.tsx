import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Check, 
  X, 
  Eye, 
  Edit3, 
  ArrowLeft,
  Clock,
  User,
  AlertCircle,
  ExternalLink,
  Mail,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PendingMicrosite {
  id: string;
  microsite_url: string;
  custom_cta_text: string;
  custom_cta_url: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  created_at: string;
  speaker: {
    id: string;
    full_name: string;
    email: string;
    bio: string;
    headshot_url: string;
    company: string;
    job_title: string;
    slug: string;
  };
  content: {
    generated_summary: string;
    key_quotes: string[];
    key_takeaways: string[];
    video_clips: Array<{
      url: string;
      title: string;
      duration: number;
    }>;
    highlight_reel_url: string;
    processing_status: string;
  };
  session: {
    id: string;
    session_name: string;
    generated_summary: string;
  };
}

export default function SpeakerApprovalDashboard() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingMicrosites, setPendingMicrosites] = useState<PendingMicrosite[]>([]);
  const [selectedMicrosite, setSelectedMicrosite] = useState<PendingMicrosite | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    custom_cta_text: '',
    custom_cta_url: '',
    generated_summary: '',
    key_takeaways: [] as string[],
    key_quotes: [] as string[]
  });

  useEffect(() => {
    if (eventId) {
      fetchPendingMicrosites();
    }
  }, [eventId]);

  const fetchPendingMicrosites = async () => {
    try {
      const { data, error } = await supabase
        .from('speaker_microsites')
        .select(`
          *,
          speaker:speakers(*),
          content:speaker_content(*),
          session:user_sessions(id, session_name, generated_summary)
        `)
        .eq('event_id', eventId)
        .in('approval_status', ['pending', 'needs_revision'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingMicrosites(data || []);
    } catch (error) {
      console.error('Error fetching pending microsites:', error);
      toast.error('Failed to load pending microsites');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMicrosite = (microsite: PendingMicrosite) => {
    setSelectedMicrosite(microsite);
    setIsEditing(false);
    
    // Populate edit form
    setEditForm({
      custom_cta_text: microsite.custom_cta_text,
      custom_cta_url: microsite.custom_cta_url,
      generated_summary: microsite.content?.generated_summary || '',
      key_takeaways: microsite.content?.key_takeaways || [],
      key_quotes: microsite.content?.key_quotes || []
    });
  };

  const handleApprove = async (micrositeId: string) => {
    try {
      // Update approval status
      const { error: updateError } = await supabase
        .from('speaker_microsites')
        .update({
          approval_status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          is_live: true,
          published_at: new Date().toISOString()
        })
        .eq('id', micrositeId);

      if (updateError) throw updateError;

      // Add to approval history
      await supabase
        .from('microsite_approval_history')
        .insert({
          microsite_id: micrositeId,
          previous_status: 'pending',
          new_status: 'approved',
          changed_by: user?.id,
          change_reason: 'Approved by organizer'
        });

      // Send notification email to speaker (placeholder for now)
      await sendSpeakerNotification(micrositeId, 'approved');

      toast.success('Microsite approved and published!');
      fetchPendingMicrosites();
      setSelectedMicrosite(null);
    } catch (error) {
      console.error('Error approving microsite:', error);
      toast.error('Failed to approve microsite');
    }
  };

  const handleReject = async (micrositeId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const { error } = await supabase
        .from('speaker_microsites')
        .update({
          approval_status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', micrositeId);

      if (error) throw error;

      // Add to approval history
      await supabase
        .from('microsite_approval_history')
        .insert({
          microsite_id: micrositeId,
          previous_status: 'pending',
          new_status: 'rejected',
          changed_by: user?.id,
          change_reason: rejectionReason
        });

      toast.success('Microsite rejected');
      fetchPendingMicrosites();
      setSelectedMicrosite(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting microsite:', error);
      toast.error('Failed to reject microsite');
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedMicrosite) return;

    try {
      // Update microsite details
      const { error: micrositeError } = await supabase
        .from('speaker_microsites')
        .update({
          custom_cta_text: editForm.custom_cta_text,
          custom_cta_url: editForm.custom_cta_url,
          approval_status: 'needs_revision'
        })
        .eq('id', selectedMicrosite.id);

      if (micrositeError) throw micrositeError;

      // Update content
      const { error: contentError } = await supabase
        .from('speaker_content')
        .update({
          generated_summary: editForm.generated_summary,
          key_takeaways: editForm.key_takeaways,
          key_quotes: editForm.key_quotes
        })
        .eq('microsite_id', selectedMicrosite.id);

      if (contentError) throw contentError;

      toast.success('Changes saved successfully');
      setIsEditing(false);
      fetchPendingMicrosites();
    } catch (error) {
      console.error('Error saving edits:', error);
      toast.error('Failed to save changes');
    }
  };

  const sendSpeakerNotification = async (micrositeId: string, status: string) => {
    // Placeholder for email notification
    // In production, this would trigger an email via Resend/Mailgun
    console.log(`Sending ${status} notification for microsite ${micrositeId}`);
  };

  const previewMicrosite = () => {
    if (selectedMicrosite) {
      const url = `/event/${eventId}/speaker/${selectedMicrosite.speaker.id}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/events/${eventId}/manage`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Speaker Microsite Approvals</h1>
            <p className="text-muted-foreground">
              Review and approve speaker microsites before they go live
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Microsites List */}
          <div className="lg:col-span-1">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Approval ({pendingMicrosites.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingMicrosites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No microsites pending approval</p>
                  </div>
                ) : (
                  pendingMicrosites.map((microsite) => (
                    <Card
                      key={microsite.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedMicrosite?.id === microsite.id
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:shadow-card-hover'
                      }`}
                      onClick={() => handleSelectMicrosite(microsite)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={microsite.speaker.headshot_url || '/placeholder.svg'}
                            alt={microsite.speaker.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {microsite.speaker.full_name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {microsite.speaker.company}
                            </p>
                            <Badge
                              variant={microsite.approval_status === 'pending' ? 'secondary' : 'outline'}
                              className="mt-2 text-xs"
                            >
                              {microsite.approval_status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Microsite Preview/Edit */}
          <div className="lg:col-span-2">
            {selectedMicrosite ? (
              <Card className="enhanced-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {selectedMicrosite.speaker.full_name}
                      </CardTitle>
                      <CardDescription>
                        {selectedMicrosite.speaker.company} • {selectedMicrosite.speaker.job_title}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={previewMicrosite}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                      <TabsTrigger value="actions">Actions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-6">
                      {isEditing ? (
                        // Edit Form
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Session Summary
                            </label>
                            <Textarea
                              value={editForm.generated_summary}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                generated_summary: e.target.value
                              }))}
                              rows={6}
                              placeholder="Edit the AI-generated summary..."
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Key Takeaways (one per line)
                            </label>
                            <Textarea
                              value={editForm.key_takeaways.join('\n')}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                key_takeaways: e.target.value.split('\n').filter(t => t.trim())
                              }))}
                              rows={4}
                              placeholder="Edit takeaways..."
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Key Quotes (one per line)
                            </label>
                            <Textarea
                              value={editForm.key_quotes.join('\n')}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                key_quotes: e.target.value.split('\n').filter(q => q.trim())
                              }))}
                              rows={4}
                              placeholder="Edit quotes..."
                            />
                          </div>

                          <Button onClick={handleSaveEdits} className="enhanced-button">
                            Save Changes
                          </Button>
                        </div>
                      ) : (
                        // Preview Content
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-semibold mb-2">Session Summary</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              {selectedMicrosite.content?.generated_summary || 'No summary generated yet'}
                            </p>
                          </div>

                          {selectedMicrosite.content?.key_takeaways && selectedMicrosite.content.key_takeaways.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2">Key Takeaways</h3>
                              <ul className="space-y-2">
                                {selectedMicrosite.content.key_takeaways.map((takeaway, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                      {index + 1}
                                    </span>
                                    <span className="text-muted-foreground">{takeaway}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {selectedMicrosite.content?.key_quotes && selectedMicrosite.content.key_quotes.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2">Key Quotes</h3>
                              <div className="space-y-3">
                                {selectedMicrosite.content.key_quotes.map((quote, index) => (
                                  <blockquote key={index} className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                                    "{quote}"
                                  </blockquote>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Call-to-Action Text
                        </label>
                        <Input
                          value={isEditing ? editForm.custom_cta_text : selectedMicrosite.custom_cta_text}
                          onChange={(e) => isEditing && setEditForm(prev => ({
                            ...prev,
                            custom_cta_text: e.target.value
                          }))}
                          placeholder="Join us next year!"
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Call-to-Action URL
                        </label>
                        <Input
                          value={isEditing ? editForm.custom_cta_url : selectedMicrosite.custom_cta_url}
                          onChange={(e) => isEditing && setEditForm(prev => ({
                            ...prev,
                            custom_cta_url: e.target.value
                          }))}
                          placeholder="https://event.com/register"
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Microsite URL
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={selectedMicrosite.microsite_url}
                            disabled
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={previewMicrosite}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="actions" className="space-y-6">
                      <div className="flex flex-col gap-4">
                        <Button
                          onClick={() => handleApprove(selectedMicrosite.id)}
                          className="bg-green-600 hover:bg-green-700 text-white enhanced-button"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve & Publish
                        </Button>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Rejection Reason
                          </label>
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please provide feedback for the speaker..."
                            rows={3}
                          />
                          <Button
                            onClick={() => handleReject(selectedMicrosite.id)}
                            variant="destructive"
                            className="mt-3 enhanced-button"
                            disabled={!rejectionReason.trim()}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject Microsite
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="enhanced-card">
                <CardContent className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Select a Microsite</h3>
                    <p className="text-muted-foreground">
                      Choose a pending microsite from the list to review and approve
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 