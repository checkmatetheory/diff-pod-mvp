import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  User, 
  Settings2, 
  Users, 
  CreditCard, 
  Bell, 
  Shield, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle,
  Save,
  RotateCcw,
  Archive,
  Crown,
  Database,
  Palette,
  Volume2,
  Zap,
  ExternalLink,
  BarChart3,
  FileText,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { toast } from "sonner";
import SpeakerManagementCard from "@/components/ui/SpeakerManagementCard";
import QuickEditSpeakerModal from "@/components/ui/QuickEditSpeakerModal";
import AdvancedSpeakerModal from "@/components/ui/AdvancedSpeakerModal";
import { useCreateEventModal } from "@/contexts/CreateEventModalContext";

interface Speaker {
  id: string;
  full_name: string;
  email: string;
  company: string;
  job_title: string;
  bio: string;
  linkedin_url: string;
  headshot_url: string | null;
  slug: string;
  created_at: string;
  total_sessions?: number;
  total_views?: number;
  revenue_attributed?: number;
  avg_engagement?: number;
}

interface UserProfile {
  display_name: string;
  avatar_url: string | null;
  email: string;
}

interface DeletionDetails {
  sessions: number;
  analytics_records: number;
  microsite_views: number;
  created_date: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { openModal } = useCreateEventModal();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    display_name: '',
    avatar_url: null,
    email: ''
  });

  // Speaker management state
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [archivedSpeakers, setArchivedSpeakers] = useState<Speaker[]>([]);
  const [speakerView, setSpeakerView] = useState<'active' | 'archived'>('active');
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);

  // Deletion confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [speakerToDelete, setSpeakerToDelete] = useState<Speaker | null>(null);
  const [deletionDetails, setDeletionDetails] = useState<DeletionDetails | null>(null);
  const [loadingDeletionDetails, setLoadingDeletionDetails] = useState(false);

  // Email change modal state
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email_processing: true,
      email_weekly_summary: true,
      browser_notifications: true
    },
    processing: {
      auto_generate_clips: true,
      default_quality: 'high',
      ai_enhancement: true
    },
    branding: {
      company_name: 'Your Company',
      default_logo_url: '',
      primary_color: '#5B9BD5',
      accent_color: '#87CEEB',
      subdomain: 'your-company'
    }
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Listen for email change confirmations
  useEffect(() => {
    if (!user) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' && session?.user) {
        // Update profile email when user email is confirmed
        if (session.user.email !== profile.email) {
          setProfile(prev => ({ ...prev, email: session.user.email || '' }));
          toast.success("Email successfully updated!");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [user, profile.email]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profileData) {
        setProfile({
          display_name: profileData.display_name || '',
          avatar_url: profileData.avatar_url,
          email: user!.email || ''
        });
      }

      // Load speakers (active and archived)
      await loadSpeakers();
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const loadSpeakers = async () => {
    try {
      // Load active speakers
      const { data: activeSpeakers } = await supabase
        .from('speakers')
        .select(`
          id, full_name, email, company, job_title, bio, linkedin_url, 
          headshot_url, slug, created_at
        `)
        .eq('created_by', user!.id)
        .not('full_name', 'like', '[DELETED]%')
        .order('created_at', { ascending: false });

      // Load archived speakers
      const { data: archived } = await supabase
        .from('speakers')
        .select('id, full_name, email, company, job_title, bio, linkedin_url, headshot_url, slug, created_at')
        .eq('created_by', user!.id)
        .like('full_name', '[DELETED]%')
        .order('updated_at', { ascending: false });

      setSpeakers(activeSpeakers || []);
      setArchivedSpeakers(archived || []);
    } catch (error) {
      console.error('Error loading speakers:', error);
    }
  };

  const loadDeletionDetails = async (speakerId: string) => {
    setLoadingDeletionDetails(true);
    try {
      // Get session count
      const { data: sessions, count: sessionCount } = await supabase
        .from('user_sessions')
        .select('id', { count: 'exact' })
        .contains('speaker_ids', [speakerId]);

      // Get analytics/views count (mock data for now)
      const analyticsCount = Math.floor(Math.random() * 500) + 50;
      const micrositeViews = Math.floor(Math.random() * 1000) + 100;

      setDeletionDetails({
        sessions: sessionCount || 0,
        analytics_records: analyticsCount,
        microsite_views: micrositeViews,
        created_date: speakerToDelete?.created_at || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading deletion details:', error);
      setDeletionDetails({
        sessions: 0,
        analytics_records: 0,
        microsite_views: 0,
        created_date: speakerToDelete?.created_at || new Date().toISOString()
      });
    } finally {
      setLoadingDeletionDetails(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user!.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url
        });

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (newEmail === profile.email) {
      toast.error("New email must be different from current email");
      return;
    }

    setEmailChangeLoading(true);
    try {
      // Use Supabase Auth to update email - this automatically sends verification emails
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        if (error.message.includes('email_change_confirm_status')) {
          toast.success("Verification emails sent! Please check both your current and new email addresses.");
          setShowEmailChangeModal(false);
          setNewEmail('');
        } else {
          throw error;
        }
      } else {
        toast.success(`Verification emails sent to both ${profile.email} and ${newEmail}. Please confirm both emails to complete the change.`);
        setShowEmailChangeModal(false);
        setNewEmail('');
      }
    } catch (error: any) {
      console.error('Error updating email:', error);
      
      // Handle specific Supabase Auth errors
      if (error.message?.includes('email_address_invalid')) {
        toast.error("Please enter a valid email address");
      } else if (error.message?.includes('email_address_not_authorized')) {
        toast.error("This email domain is not authorized");
      } else if (error.message?.includes('too_many_requests')) {
        toast.error("Too many requests. Please wait a few minutes before trying again.");
      } else {
        toast.error("Failed to update email. Please try again.");
      }
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handleRestoreSpeaker = async (speaker: Speaker) => {
    try {
      const restoredName = speaker.full_name.replace('[DELETED] ', '');
      const newSlug = restoredName.toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-');

      const { error } = await supabase
        .from('speakers')
        .update({
          full_name: restoredName,
          slug: newSlug
        })
        .eq('id', speaker.id);

      if (error) throw error;

      toast.success(`${restoredName} has been restored!`);
      loadSpeakers();
    } catch (error) {
      console.error('Error restoring speaker:', error);
      toast.error("Failed to restore speaker");
    }
  };

  const handleDeleteClick = async (speaker: Speaker) => {
    setSpeakerToDelete(speaker);
    setShowDeleteConfirm(true);
    await loadDeletionDetails(speaker.id);
  };

  const handlePermanentDelete = async () => {
    if (!speakerToDelete) return;

    try {
      const { error } = await supabase
        .from('speakers')
        .delete()
        .eq('id', speakerToDelete.id);

      if (error) throw error;

      const cleanName = speakerToDelete.full_name.replace('[DELETED] ', '');
      toast.success(`${cleanName} has been permanently deleted`);
      loadSpeakers();
      setShowDeleteConfirm(false);
      setSpeakerToDelete(null);
      setDeletionDetails(null);
    } catch (error) {
      console.error('Error deleting speaker:', error);
      toast.error("Failed to delete speaker");
    }
  };

  const handleSpeakerUpdate = (updatedSpeaker: Speaker) => {
    setSpeakers(prev => prev.map(s => 
      s.id === updatedSpeaker.id ? updatedSpeaker : s
    ));
  };

  const handleSpeakerDelete = (speakerId: string) => {
    setSpeakers(prev => prev.filter(s => s.id !== speakerId));
    loadSpeakers(); // Refresh to move to archived
  };

  const exportData = async () => {
    try {
      // Export all user data
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user!.id);

      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user!.id);

      const exportData = {
        profile,
        speakers,
        sessions,
        events,
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diffused-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully!");
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error("Failed to export data");
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar onCreateEvent={openModal} />
          <SidebarInset className="flex-1">
            <Header />
            <main className="flex-1 p-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  const cleanSpeakerName = speakerToDelete?.full_name.replace('[DELETED] ', '') || '';

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar onCreateEvent={openModal} />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your account, speakers, and application preferences</p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="account" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Account
                  </TabsTrigger>
                  <TabsTrigger value="speakers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Speakers
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Preferences
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Billing
                  </TabsTrigger>
                  <TabsTrigger value="data" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Data
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Advanced
                  </TabsTrigger>
                </TabsList>

                {/* Account Tab */}
                <TabsContent value="account">
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                          Update your personal information and preferences
                  </CardDescription>
                </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20">
                            {profile.avatar_url ? (
                              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                            ) : (
                              <AvatarFallback className="text-lg">
                                {profile.display_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Change Photo
                            </Button>
                            <p className="text-sm text-muted-foreground mt-1">
                              JPG, PNG or GIF. Max size 5MB.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="display_name">Display Name</Label>
                      <Input
                              id="display_name"
                              value={profile.display_name}
                              onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                              placeholder="Your display name"
                      />
                    </div>
                          <div>
                            <Label htmlFor="email">Email Address</Label>
                        <Input
                              id="email"
                              value={profile.email}
                              disabled
                              className="bg-muted"
                            />
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-muted-foreground">
                                Email changes require verification
                              </p>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="text-xs p-0 h-auto"
                                onClick={() => setShowEmailChangeModal(true)}
                              >
                                Change Email
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                          <Button onClick={handleSaveProfile} disabled={saving}>
                            {saving ? (
                              <>
                                <Settings2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>
                          Control how and when you receive notifications
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">
                              Processing updates and weekly summaries
                            </p>
                          </div>
                          <Switch
                            checked={settings.notifications.email_processing}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({
                                ...prev,
                                notifications: { ...prev.notifications, email_processing: checked }
                              }))
                            }
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Browser Notifications</p>
                            <p className="text-sm text-muted-foreground">
                              Real-time updates in your browser
                            </p>
                      </div>
                          <Switch
                            checked={settings.notifications.browser_notifications}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({
                                ...prev,
                                notifications: { ...prev.notifications, browser_notifications: checked }
                              }))
                            }
                          />
                    </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Speakers Tab - THE KEY ADDITION! */}
                <TabsContent value="speakers">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Speaker Management</CardTitle>
                            <CardDescription>
                              Manage your speaker network and archived speakers
                            </CardDescription>
                          </div>
                          <Select value={speakerView} onValueChange={(value: 'active' | 'archived') => setSpeakerView(value)}>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active Speakers ({speakers.length})</SelectItem>
                              <SelectItem value="archived">Archived Speakers ({archivedSpeakers.length})</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {speakerView === 'active' ? (
                          <div className="space-y-4">
                            {speakers.length > 0 ? (
                              <div className="grid gap-4">
                                {speakers.map((speaker) => (
                                  <SpeakerManagementCard
                                    key={speaker.id}
                                    speaker={speaker}
                                    onEdit={(speaker) => {
                                      setSelectedSpeaker(speaker);
                                      setIsQuickEditOpen(true);
                                    }}
                                    onAdvanced={(speaker) => {
                                      setSelectedSpeaker(speaker);
                                      setIsAdvancedModalOpen(true);
                                    }}
                                    onDelete={(speaker) => {
                                      setSelectedSpeaker(speaker);
                                      setIsAdvancedModalOpen(true);
                                    }}
                                    compact={true}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No active speakers found</p>
                                <p className="text-sm">Upload content to automatically create speaker profiles</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {archivedSpeakers.length > 0 ? (
                              <div className="space-y-4">
                                {archivedSpeakers.map((speaker) => (
                                  <div key={speaker.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10">
                                        {speaker.headshot_url ? (
                                          <AvatarImage src={speaker.headshot_url} alt={speaker.full_name} />
                                        ) : (
                                          <AvatarFallback>
                                            {speaker.full_name.replace('[DELETED] ', '').split(' ').map(n => n[0]).join('')}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-gray-500">
                                          {speaker.full_name.replace('[DELETED] ', '')}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                          {speaker.job_title} {speaker.company && `at ${speaker.company}`}
                                        </p>
                                        <Badge variant="secondary" className="text-xs mt-1">
                                          <Archive className="h-3 w-3 mr-1" />
                                          Archived
                                        </Badge>
                                      </div>
                      </div>
                                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRestoreSpeaker(speaker)}
                                      >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Restore
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteClick(speaker)}
                                        className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Forever
                      </Button>
                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No archived speakers</p>
                                <p className="text-sm">Archived speakers will appear here</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences">
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Processing Preferences</CardTitle>
                        <CardDescription>
                          Configure how your content is processed
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Auto-generate Viral Clips</p>
                            <p className="text-sm text-muted-foreground">
                              Automatically create shareable clips from your content
                            </p>
                          </div>
                          <Switch
                            checked={settings.processing.auto_generate_clips}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({
                                ...prev,
                                processing: { ...prev.processing, auto_generate_clips: checked }
                              }))
                            }
                          />
                        </div>

                        <Separator />

                    <div className="space-y-2">
                          <Label>Default Video Quality</Label>
                          <Select 
                            value={settings.processing.default_quality} 
                            onValueChange={(value) => 
                              setSettings(prev => ({
                                ...prev,
                                processing: { ...prev.processing, default_quality: value }
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard (720p)</SelectItem>
                              <SelectItem value="high">High (1080p)</SelectItem>
                              <SelectItem value="ultra">Ultra (4K)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Brand Customization</CardTitle>
                        <CardDescription>
                          Set default branding for your content and microsites
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="company_name">Company Name</Label>
                            <Input
                              id="company_name"
                              value={settings.branding.company_name}
                              onChange={(e) => 
                                setSettings(prev => ({
                                  ...prev,
                                  branding: { ...prev.branding, company_name: e.target.value }
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="subdomain">Subdomain</Label>
                            <div className="relative">
                        <Input
                                id="subdomain"
                                value={settings.branding.subdomain}
                                onChange={(e) => 
                                  setSettings(prev => ({
                                    ...prev,
                                    branding: { ...prev.branding, subdomain: e.target.value }
                                  }))
                                }
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                .diffused.app
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="primary_color">Primary Color</Label>
                            <div className="flex gap-2">
                        <Input
                                id="primary_color"
                                value={settings.branding.primary_color}
                                onChange={(e) => 
                                  setSettings(prev => ({
                                    ...prev,
                                    branding: { ...prev.branding, primary_color: e.target.value }
                                  }))
                                }
                              />
                              <div 
                                className="w-10 h-10 rounded border border-gray-300"
                                style={{ backgroundColor: settings.branding.primary_color }}
                        />
                      </div>
                    </div>
                          <div>
                            <Label htmlFor="accent_color">Accent Color</Label>
                            <div className="flex gap-2">
                        <Input
                                id="accent_color"
                                value={settings.branding.accent_color}
                                onChange={(e) => 
                                  setSettings(prev => ({
                                    ...prev,
                                    branding: { ...prev.branding, accent_color: e.target.value }
                                  }))
                                }
                              />
                              <div 
                                className="w-10 h-10 rounded border border-gray-300"
                                style={{ backgroundColor: settings.branding.accent_color }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                  </div>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing">
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-yellow-500" />
                          Current Plan
                  </CardTitle>
                        <CardDescription>
                          Manage your subscription and billing
                  </CardDescription>
                </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-semibold">Pro Plan</h3>
                              <p className="text-sm text-muted-foreground">
                                Unlimited speakers, advanced analytics, priority support
                              </p>
                            </div>
                                                        <div className="text-right">
                              <p className="text-2xl font-bold">$365</p>
                              <p className="text-sm text-muted-foreground">per month</p>
                            </div>
                  </div>

                          <div className="flex gap-3 pt-4 border-t">
                            <Button variant="outline">
                              <CreditCard className="h-4 w-4 mr-2" />
                              Update Payment Method
                            </Button>
                            <Button variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download Invoices
                            </Button>
                          </div>
                    </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Data Tab */}
                <TabsContent value="data">
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Data Management</CardTitle>
                        <CardDescription>
                          Export, import, and manage your data
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Export All Data</h3>
                            <p className="text-sm text-muted-foreground">
                              Download all your sessions, speakers, and analytics data
                            </p>
                          </div>
                          <Button onClick={exportData}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced">
                  <div className="grid gap-6">
                    <Card className="border-destructive">
                      <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Danger Zone
                  </CardTitle>
                        <CardDescription>
                          Irreversible actions that will permanently affect your account
                  </CardDescription>
                </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                          <div>
                            <h3 className="font-medium text-destructive">Delete Account</h3>
                            <p className="text-sm text-muted-foreground">
                              Permanently delete your account and all associated data
                            </p>
                      </div>
                          <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white border-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                    </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Speaker Management Modals */}
      <QuickEditSpeakerModal
        speaker={selectedSpeaker}
        isOpen={isQuickEditOpen}
        onClose={() => {
          setIsQuickEditOpen(false);
          setSelectedSpeaker(null);
        }}
        onUpdate={handleSpeakerUpdate}
      />

      <AdvancedSpeakerModal
        speaker={selectedSpeaker}
        isOpen={isAdvancedModalOpen}
        onClose={() => {
          setIsAdvancedModalOpen(false);
          setSelectedSpeaker(null);
        }}
        onUpdate={handleSpeakerUpdate}
        onDelete={handleSpeakerDelete}
      />

      {/* Deletion Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Permanent Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {cleanSpeakerName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {loadingDeletionDetails ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading deletion details...</p>
            </div>
          ) : deletionDetails ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This speaker has been archived and will be permanently deleted.
                The deletion will affect the following data:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                <li>{deletionDetails.sessions} user sessions</li>
                <li>{deletionDetails.analytics_records} analytics records</li>
                <li>{deletionDetails.microsite_views} microsite views</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                This action will remove all associated analytics data and make the speaker profile permanently inaccessible.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handlePermanentDelete} 
              disabled={loadingDeletionDetails}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              {loadingDeletionDetails ? (
                <>
                  <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Forever
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Change Modal */}
      <Dialog open={showEmailChangeModal} onOpenChange={setShowEmailChangeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              For security, we'll send verification links to both your current and new email addresses. 
              You must confirm both emails to complete the change.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-email">Current Email</Label>
              <Input
                id="current-email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="new-email">New Email Address</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="Enter your new email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={emailChangeLoading}
              />
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Security Notice
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Check your current email ({profile.email}) for a confirmation link</li>
                      <li>Check your new email for a verification link</li>
                      <li>Both links must be clicked to complete the change</li>
                      <li>This process helps protect your account from unauthorized changes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={handleEmailChange}
              disabled={emailChangeLoading || !newEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              {emailChangeLoading ? (
                <>
                  <Settings2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Verification...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Send Verification Emails
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}