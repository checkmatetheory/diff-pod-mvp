import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Loader2, Save, User } from "lucide-react";
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

interface SpeakerProfileModalProps {
  speaker: Speaker | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedSpeaker: Speaker) => void;
}

export default function SpeakerProfileModal({ 
  speaker, 
  isOpen, 
  onClose, 
  onUpdate 
}: SpeakerProfileModalProps) {
  const [formData, setFormData] = useState<Speaker | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Move all hooks to the top before any conditional logic
  const handleInputChange = React.useCallback((field: keyof Speaker, value: string) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const removeImage = React.useCallback(() => {
    setFormData(prev => prev ? { ...prev, headshot_url: null } : null);
  }, []);

  const handleClose = React.useCallback(() => {
    setFormData(null);
    setUploading(false);
    setSaving(false);
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    if (isOpen && speaker) {
      setFormData({ ...speaker });
    } else {
      setFormData(null);
      setUploading(false);
      setSaving(false);
    }
  }, [isOpen, speaker]);

  // Now we can safely do early returns after all hooks
  if (!speaker) return null;

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

      setFormData(prev => prev ? { ...prev, headshot_url: publicUrl } : null);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData || !speaker) return;

    setSaving(true);
    try {
      const updateData = {
        job_title: formData.job_title || '',
        bio: formData.bio || '',
        linkedin_url: formData.linkedin_url || '',
        headshot_url: formData.headshot_url || null
      };

      const { error } = await supabase
        .from('speakers')
        .update(updateData)
        .eq('id', speaker.id);

      if (error) throw error;

      const updatedSpeaker = { ...speaker, ...updateData };
      onUpdate(updatedSpeaker);
      toast.success("Speaker profile updated successfully!");
      handleClose();
    } catch (error) {
      console.error('Error updating speaker:', error);
      toast.error("Failed to update speaker profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full backdrop-blur-md bg-white/95 border-0 shadow-[0_0_40px_rgba(59,130,246,0.15)] rounded-xl p-8 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl text-gray-800">
            <User className="h-6 w-6" />
            Edit Speaker Profile
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            Update {speaker.full_name}'s profile information
          </DialogDescription>
        </DialogHeader>

        {!formData ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <span className="ml-4 text-gray-600 text-lg">Loading...</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            {/* Left Column - Photo */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {formData?.headshot_url ? (
                    <AvatarImage src={formData.headshot_url} alt={speaker.full_name} />
                  ) : (
                    <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {speaker.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  )}
                </Avatar>
                {formData?.headshot_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="absolute -top-1 -right-1 h-7 w-7 p-0 rounded-full bg-red-100 hover:bg-red-200 border-red-200"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full backdrop-blur-sm bg-white/60 border border-white/40 hover:bg-white/80 py-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {formData?.headshot_url ? 'Change Photo' : 'Add Photo'}
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Middle Column - Speaker Info */}
            <div className="space-y-5">
              <div className="text-center pb-4 border-b border-gray-200/60">
                <h3 className="font-semibold text-gray-800 text-xl mb-1">{speaker.full_name}</h3>
                <p className="text-gray-500 text-base">{speaker.company}</p>
                <p className="text-sm text-gray-400">{speaker.email}</p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="job_title" className="text-sm font-medium text-gray-700">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData?.job_title || ''}
                  onChange={(e) => handleInputChange('job_title', e.target.value)}
                  placeholder="e.g. CEO, CTO, VP of Engineering"
                  className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80 h-10"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="linkedin_url" className="text-sm font-medium text-gray-700">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  value={formData?.linkedin_url || ''}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80 h-10"
                />
              </div>
            </div>

            {/* Right Column - Bio & Actions */}
            <div className="space-y-5 flex flex-col">
              <div className="flex-1">
                <Label htmlFor="bio" className="text-sm font-medium text-gray-700 mb-3 block">Speaker Bio</Label>
                <Textarea
                  id="bio"
                  value={formData?.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Brief description of the speaker's background and expertise..."
                  rows={7}
                  className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80 resize-none w-full"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 backdrop-blur-sm bg-white/60 border border-white/40 hover:bg-white/80 h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[hsl(210_65%_58%)] hover:bg-[hsl(210_75%_65%)] hover:shadow-[0_0_20px_rgba(91,155,213,0.4)] text-white border-0 h-11 font-medium shadow-lg transition-all duration-200"
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 