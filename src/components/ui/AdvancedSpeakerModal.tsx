import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  X, 
  Loader2, 
  Save, 
  ExternalLink, 
  BarChart3, 
  AlertTriangle,
  Copy,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface AdvancedSpeakerModalProps {
  speaker: Speaker | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedSpeaker: Speaker) => void;
  onDelete: (speakerId: string) => void;
}

export default function AdvancedSpeakerModal({ 
  speaker, 
  isOpen, 
  onClose, 
  onUpdate,
  onDelete
}: AdvancedSpeakerModalProps) {
  const [formData, setFormData] = useState<Partial<Speaker>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [dependencies, setDependencies] = useState<any>(null);
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && speaker) {
      setFormData({ ...speaker });
      if (activeTab === 'danger') {
        loadDependencies();
      }
    } else {
      setFormData({});
      setDependencies(null);
      setActiveTab('profile');
      setUploading(false);
      setSaving(false);
    }
  }, [isOpen, speaker, activeTab]);

  if (!speaker) return null;

  const loadDependencies = async () => {
    setLoadingDependencies(true);
    try {
      // Check for microsites
      const { data: microsites } = await supabase
        .from('speaker_microsites')
        .select(`
          id,
          microsite_url,
          is_live,
          total_views,
          speaker_microsite_sessions (
            user_sessions (
              id,
              session_name
            )
          )
        `)
        .eq('speaker_id', speaker.id);

      // Check for attribution data
      const { data: attributions } = await supabase
        .from('attribution_tracking')
        .select('id, conversion_value')
        .in('microsite_id', microsites?.map(m => m.id) || []);

      setDependencies({
        microsites: microsites || [],
        totalAttributions: attributions?.length || 0,
        totalRevenue: attributions?.reduce((sum, attr) => sum + (attr.conversion_value || 0), 0) || 0
      });
    } catch (error) {
      console.error('Error loading dependencies:', error);
    } finally {
      setLoadingDependencies(false);
    }
  };

  const handleInputChange = (field: keyof Speaker, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${speaker.id}-${Date.now()}.${fileExt}`;
      const filePath = `speaker-headshots/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, headshot_url: publicUrl }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name?.trim()) {
      toast.error("Speaker name is required");
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        full_name: formData.full_name.trim(),
        email: formData.email?.trim() || '',
        company: formData.company?.trim() || '',
        job_title: formData.job_title?.trim() || '',
        bio: formData.bio?.trim() || '',
        linkedin_url: formData.linkedin_url?.trim() || '',
        headshot_url: formData.headshot_url || null
      };

      // Generate new slug if name changed
      if (formData.full_name !== speaker.full_name) {
        const newSlug = formData.full_name.toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .trim();
        updateData.slug = newSlug;
      }

      const { error } = await supabase
        .from('speakers')
        .update(updateData)
        .eq('id', speaker.id);

      if (error) throw error;

      const updatedSpeaker = { ...speaker, ...updateData };
      onUpdate(updatedSpeaker as Speaker);
      toast.success("Speaker updated successfully!");
    } catch (error: any) {
      console.error('Error updating speaker:', error);
      if (error.code === '23505') {
        toast.error("A speaker with this name already exists");
      } else {
        toast.error("Failed to update speaker");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Archive instead of hard delete to preserve analytics
      const { error } = await supabase
        .from('speakers')
        .update({ 
          full_name: `[DELETED] ${speaker.full_name}`,
          email: null,
          slug: `deleted-${speaker.id}` 
        })
        .eq('id', speaker.id);

      if (error) throw error;

      toast.success("Speaker archived successfully");
      onDelete(speaker.id);
      onClose();
    } catch (error) {
      console.error('Error deleting speaker:', error);
      toast.error("Failed to delete speaker");
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, headshot_url: null }));
  };

  const handleClose = () => {
    if (!saving && !uploading) {
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Speaker: {speaker.full_name}</DialogTitle>
          <DialogDescription>
            Complete speaker profile and microsite management
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="microsites">Microsites</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="danger">Delete</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Photo and Basic Info */}
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      {formData.headshot_url ? (
                        <AvatarImage src={formData.headshot_url} alt={formData.full_name} />
                      ) : (
                        <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {(formData.full_name || speaker.full_name).split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {formData.headshot_url && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                        onClick={removeImage}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading ? 'Uploading...' : 'Change Photo'}
                  </Button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter speaker's full name"
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title || ''}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    placeholder="Enter job title"
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Enter company name"
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    value={formData.linkedin_url || ''}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Enter speaker bio..."
                    className="min-h-[100px] resize-none"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={saving || uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || uploading || !formData.full_name?.trim()}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
          </TabsContent>

          <TabsContent value="microsites" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Speaker Microsites</CardTitle>
                <CardDescription>
                  Manage all microsites associated with this speaker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dependencies?.microsites?.length ? (
                    dependencies.microsites.map((microsite: any) => (
                      <div key={microsite.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{microsite.user_sessions?.session_name || 'Unknown Session'}</p>
                          <p className="text-sm text-muted-foreground">{microsite.microsite_url}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={microsite.is_live ? "default" : "secondary"}>
                              {microsite.is_live ? "Live" : "Draft"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {microsite.total_views || 0} views
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No microsites found for this speaker
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                      <p className="text-lg font-bold">{speaker.total_sessions || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(speaker.revenue_attributed || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Views</p>
                      <p className="text-lg font-bold">{speaker.total_views || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Engagement</p>
                      <p className="text-lg font-bold">{speaker.avg_engagement?.toFixed(0) || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Detailed metrics and attribution data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed analytics coming soon!</p>
                  <p className="text-sm">Track conversions, engagement rates, and ROI</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger" className="mt-6">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that will affect this speaker and associated data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDependencies ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {dependencies && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-800 mb-2">Dependencies Found</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• {dependencies.microsites.length} microsite(s)</li>
                          <li>• {dependencies.totalAttributions} attribution record(s)</li>
                          <li>• {formatCurrency(dependencies.totalRevenue)} in tracked revenue</li>
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Archive Speaker</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Archive this speaker to hide them from listings while preserving all analytics data.
                        This action can be reversed.
                      </p>
                      <Button 
                        variant="destructive" 
                        onClick={handleDelete}
                        className="w-full"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Archive Speaker
                      </Button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Need to Delete Permanently?</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        For complete permanent deletion that removes all data:
                      </p>
                      <ol className="text-sm text-blue-700 space-y-1 mb-3 list-decimal list-inside">
                        <li>Archive the speaker using the button above</li>
                        <li>Go to Settings → Speakers → Archived Speakers</li>
                        <li>Find the archived speaker and click "Delete Forever"</li>
                      </ol>
                      <p className="text-xs text-blue-600">
                        ⚠️ Permanent deletion cannot be undone and removes all analytics data
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 