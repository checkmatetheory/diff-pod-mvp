import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Palette, Eye, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BrandConfig {
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  cta_text?: string;
  cta_url?: string;
}

interface BrandCustomizationProps {
  value: BrandConfig;
  onChange: (config: BrandConfig) => void;
  showCTA?: boolean;
  className?: string;
}

// Predefined color palettes
const colorPalettes = [
  { name: "Sky Blue", primary: "#5B9BD5", secondary: "#4A8BC2" },
  { name: "Ocean Blue", primary: "#3b82f6", secondary: "#1e40af" },
  { name: "Emerald", primary: "#10b981", secondary: "#047857" },
  { name: "Purple", primary: "#8b5cf6", secondary: "#7c3aed" },
  { name: "Rose", primary: "#f43f5e", secondary: "#e11d48" },
  { name: "Orange", primary: "#f97316", secondary: "#ea580c" },
  { name: "Teal", primary: "#14b8a6", secondary: "#0f766e" },
  { name: "Slate", primary: "#64748b", secondary: "#475569" },
];

export default function BrandCustomization({
  value,
  onChange,
  showCTA = false,
  className = ""
}: BrandCustomizationProps) {
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleColorPaletteSelect = (palette: typeof colorPalettes[0]) => {
    onChange({
      ...value,
      primary_color: palette.primary,
      secondary_color: palette.secondary,
    });
  };

  const handleCustomColorChange = (type: 'primary' | 'secondary', color: string) => {
    onChange({
      ...value,
      [`${type}_color`]: color,
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileName = `logos/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);

      onChange({
        ...value,
        logo_url: publicUrl,
      });

      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    onChange({
      ...value,
      logo_url: null,
    });
  };

  const handleCTAChange = (field: 'cta_text' | 'cta_url', newValue: string) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Brand Customization
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="ml-auto"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </CardTitle>
        <CardDescription>
          Customize your event's branding with colors and logo. This will be applied to all speaker microsites.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!previewMode ? (
          <>
            {/* Color Palettes */}
            <div className="space-y-3">
              <Label>Color Palette</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {colorPalettes.map((palette) => (
                  <Button
                    key={palette.name}
                    type="button"
                    variant="outline"
                    onClick={() => handleColorPaletteSelect(palette)}
                    className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-accent"
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: palette.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: palette.secondary }}
                      />
                    </div>
                    <span className="text-xs">{palette.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={value.primary_color}
                    onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                    className="w-12 h-10 p-1 border"
                  />
                  <Input
                    value={value.primary_color}
                    onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={value.secondary_color}
                    onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                    className="w-12 h-10 p-1 border"
                  />
                  <Input
                    value={value.secondary_color}
                    onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                    placeholder="#1e40af"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label>Event Logo</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {value.logo_url ? (
                  <div className="space-y-3">
                    <img
                      src={value.logo_url}
                      alt="Event logo"
                      className="max-h-20 mx-auto object-contain"
                    />
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Upload your event logo</h4>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG, SVG up to 5MB. Recommended: 200x50px
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Choose File'}
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* CTA Configuration */}
            {showCTA && (
              <div className="space-y-4">
                <Label>Call-to-Action Button</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cta-text">Button Text</Label>
                    <Input
                      id="cta-text"
                      value={value.cta_text || ''}
                      onChange={(e) => handleCTAChange('cta_text', e.target.value)}
                      placeholder="Register for Next Event"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cta-url">Button URL</Label>
                    <Input
                      id="cta-url"
                      type="url"
                      value={value.cta_url || ''}
                      onChange={(e) => handleCTAChange('cta_url', e.target.value)}
                      placeholder="https://your-event.com/register"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Preview Mode */
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Brand Preview</h3>
              
              {/* Logo Preview */}
              {value.logo_url && (
                <div className="flex justify-center">
                  <img
                    src={value.logo_url}
                    alt="Event logo preview"
                    className="max-h-16 object-contain"
                  />
                </div>
              )}

              {/* Color Preview */}
              <div className="bg-gradient-to-r p-6 rounded-lg text-white" 
                   style={{ 
                     background: `linear-gradient(135deg, ${value.primary_color}, ${value.secondary_color})` 
                   }}>
                <h4 className="text-xl font-bold mb-2">Speaker Microsite Header</h4>
                <p className="opacity-90">This is how your branding will appear on speaker microsites</p>
              </div>

              {/* Button Preview */}
              {showCTA && value.cta_text && (
                <Button
                  className="text-white border-0"
                  style={{ backgroundColor: value.primary_color }}
                >
                  {value.cta_text}
                </Button>
              )}

              {/* Color Values */}
              <div className="flex justify-center gap-4 text-sm">
                <Badge variant="outline">
                  Primary: {value.primary_color}
                </Badge>
                <Badge variant="outline">
                  Secondary: {value.secondary_color}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 