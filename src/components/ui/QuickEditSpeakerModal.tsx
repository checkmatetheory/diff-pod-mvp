import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Loader2, Save } from "lucide-react";
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
}

interface QuickEditSpeakerModalProps {
  speaker: Speaker | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedSpeaker: Speaker) => void;
}

export default function QuickEditSpeakerModal({ 
  speaker, 
  isOpen, 
  onClose, 
  onUpdate 
}: QuickEditSpeakerModalProps) {
  const [formData, setFormData] = useState<Partial<Speaker>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && speaker) {
      setFormData({
        full_name: speaker.full_name,
        email: speaker.email,
        company: speaker.company,
        job_title: speaker.job_title,
        headshot_url: speaker.headshot_url
      });
    } else {
      setFormData({});
      setUploading(false);
      setSaving(false);
    }
  }, [isOpen, speaker]);

  if (!speaker) return null;

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

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleSave = async () => {
    if (!formData.full_name?.trim()) {
      toast.error("Speaker name is required");
      return;
    }

    setSaving(true);
    try {
      const updateData: Partial<Speaker> = {
        full_name: formData.full_name.trim(),
        email: formData.email?.trim() || '',
        company: formData.company?.trim() || '',
        job_title: formData.job_title?.trim() || '',
        headshot_url: formData.headshot_url || null
      };

      // Generate new slug if name changed
      if (formData.full_name !== speaker.full_name) {
        const newSlug = generateSlug(formData.full_name);
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
      onClose();
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

  const removeImage = () => {
    setFormData(prev => ({ ...prev, headshot_url: null }));
  };

  const handleClose = () => {
    if (!saving && !uploading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Edit Speaker</DialogTitle>
          <DialogDescription>
            Update basic speaker information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {formData.headshot_url ? (
                  <AvatarImage src={formData.headshot_url} alt={formData.full_name} />
                ) : (
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {(formData.full_name || speaker.full_name).split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                )}
              </Avatar>
              {formData.headshot_url && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={removeImage}
                  disabled={uploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
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
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
} 