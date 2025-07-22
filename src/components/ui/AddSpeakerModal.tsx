import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Speaker {
  id: string;
  full_name: string;
  email: string;
  company: string;
  job_title: string;
  slug: string;
  headshot_url?: string;
}

interface AddSpeakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeakerCreated: (speaker: Speaker) => void;
}

export default function AddSpeakerModal({ isOpen, onClose, onSpeakerCreated }: AddSpeakerModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company: "",
    job_title: "",
    linkedin_url: "",
    bio: "",
    headshot_url: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileName = `speaker-headshots/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, headshot_url: publicUrl }));

      toast({
        title: "Image uploaded successfully",
        description: "Speaker headshot has been added.",
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, headshot_url: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.full_name) return;

    setLoading(true);
    try {
      // Generate slug from name
      const slug = formData.full_name.toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-');

      const { data, error } = await supabase
        .from('speakers')
        .insert({
          ...formData,
          slug,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      onSpeakerCreated(data);
      
      // Reset form
      setFormData({
        full_name: "",
        email: "",
        company: "",
        job_title: "",
        linkedin_url: "",
        bio: "",
        headshot_url: ""
      });
      
      toast({
        title: "Speaker created successfully!",
        description: `${data.full_name} has been added to your speaker network.`,
      });

      onClose();

    } catch (error: any) {
      console.error('Error creating speaker:', error);
      toast({
        title: "Failed to create speaker",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form when closing
      setFormData({
        full_name: "",
        email: "",
        company: "",
        job_title: "",
        linkedin_url: "",
        bio: "",
        headshot_url: ""
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Add New Speaker
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Speaker Image Upload */}
          <div className="flex items-center gap-4">
            {formData.headshot_url ? (
              <div className="relative">
                <img
                  src={formData.headshot_url}
                  alt="Speaker headshot"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('modal-headshot-input')?.click()}
                disabled={uploadingImage}
                className="mb-2"
              >
                {uploadingImage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.headshot_url ? 'Change Photo' : 'Upload Photo'}
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                JPG, PNG up to 5MB. Square image recommended.
              </p>
              <input
                id="modal-headshot-input"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="modal_full_name">Full Name *</Label>
              <Input
                id="modal_full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Sarah Chen"
                required
              />
            </div>
            <div>
              <Label htmlFor="modal_email">Email</Label>
              <Input
                id="modal_email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="sarah@company.com"
              />
            </div>
            <div>
              <Label htmlFor="modal_company">Company</Label>
              <Input
                id="modal_company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="TechCorp Inc"
              />
            </div>
            <div>
              <Label htmlFor="modal_job_title">Job Title</Label>
              <Input
                id="modal_job_title"
                value={formData.job_title}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
                placeholder="VP of Engineering"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="modal_linkedin_url">LinkedIn URL</Label>
              <Input
                id="modal_linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/sarah-chen"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="modal_bio">Bio</Label>
              <Input
                id="modal_bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="VP of Engineering at CloudScale Technologies with 10+ years experience..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.full_name}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Adding Speaker..." : "Add Speaker"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 