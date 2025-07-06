import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Palette, 
  Globe, 
  Volume2, 
  FileText, 
  Save, 
  X,
  Plus,
  Settings,
  Monitor,
  Mic,
  Image as ImageIcon
} from "lucide-react";

interface SettingsInterfaceProps {
  title?: string;
  description?: string;
}

export const SettingsInterface = ({ 
  title = "Portfolio Settings", 
  description = "Configure your conference portfolio settings and branding" 
}: SettingsInterfaceProps) => {
  const [brandColor, setBrandColor] = useState("#1e40af");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [websiteMonitoring, setWebsiteMonitoring] = useState(true);
  const [autoGenerate, setAutoGenerate] = useState(false);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="domain" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domain
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Brand Identity
              </CardTitle>
              <CardDescription>
                Customize your portfolio's visual identity and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <Label htmlFor="logo-upload">Portfolio Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/20">
                    {logoFile ? (
                      <img 
                        src={URL.createObjectURL(logoFile)} 
                        alt="Logo preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="relative overflow-hidden">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Recommended: 256x256px, PNG or SVG
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand Color */}
              <div className="space-y-3">
                <Label htmlFor="brand-color">Primary Brand Color</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg border border-border"
                    style={{ backgroundColor: brandColor }}
                  />
                  <Input
                    id="brand-color"
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-20 h-12 p-1 border border-border"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    placeholder="#1e40af"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Portfolio Name */}
              <div className="space-y-3">
                <Label htmlFor="portfolio-name">Portfolio Name</Label>
                <Input
                  id="portfolio-name"
                  placeholder="TechCorp Conference Portfolio"
                  defaultValue="TechCorp Conference Portfolio"
                />
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Label htmlFor="portfolio-description">Description</Label>
                <Textarea
                  id="portfolio-description"
                  placeholder="Describe your conference portfolio..."
                  defaultValue="Annual technology conferences and trade shows featuring the latest innovations."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Custom Domain
              </CardTitle>
              <CardDescription>
                Configure custom domain and website monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="custom-domain">Custom Domain</Label>
                <Input
                  id="custom-domain"
                  placeholder="podcast.yourcompany.com"
                  defaultValue="podcast.techcorp.com"
                />
                <p className="text-sm text-muted-foreground">
                  Your podcast will be available at this custom domain
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Website Monitoring</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically monitor your website for new content
                  </p>
                </div>
                <Switch
                  checked={websiteMonitoring}
                  onCheckedChange={setWebsiteMonitoring}
                />
              </div>

              {websiteMonitoring && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <Label htmlFor="monitor-url">Website URL to Monitor</Label>
                  <Input
                    id="monitor-url"
                    placeholder="https://yourcompany.com/events"
                    defaultValue="https://techcorp.com/events"
                  />
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Monitor className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Active</span>
                    </div>
                    <span className="text-muted-foreground">Last checked: 2 hours ago</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Audio Settings
              </CardTitle>
              <CardDescription>
                Configure default audio settings and custom voices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Intro */}
              <div className="space-y-3">
                <Label>Default Intro Audio</Label>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Volume2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Welcome Intro</p>
                    <p className="text-sm text-muted-foreground">Duration: 15 seconds</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-3 w-3 mr-2" />
                    Replace
                  </Button>
                </div>
              </div>

              {/* Custom Voices */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Custom AI Voices</Label>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3 w-3 mr-2" />
                    Train New Voice
                  </Button>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Sarah Chen", type: "Host", status: "trained" },
                    { name: "Marcus Rodriguez", type: "Co-host", status: "training" },
                    { name: "Corporate Narrator", type: "Intro/Outro", status: "trained" }
                  ].map((voice, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <Mic className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{voice.name}</p>
                        <p className="text-sm text-muted-foreground">{voice.type}</p>
                      </div>
                      <Badge variant={voice.status === 'trained' ? 'default' : 'secondary'}>
                        {voice.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Generation
              </CardTitle>
              <CardDescription>
                Configure how content is automatically generated from your sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-generate Content</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create blog posts, social media content, and summaries
                  </p>
                </div>
                <Switch
                  checked={autoGenerate}
                  onCheckedChange={setAutoGenerate}
                />
              </div>

              {autoGenerate && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <Label>Content Types to Generate</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "Blog Article",
                      "Twitter Thread", 
                      "LinkedIn Post",
                      "Executive Summary",
                      "Key Quotes",
                      "Episode Transcript"
                    ].map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="content-template">Content Template</Label>
                <Textarea
                  id="content-template"
                  placeholder="Define how your content should be structured..."
                  defaultValue="Generate a professional summary focusing on key insights, actionable takeaways, and industry implications."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button variant="outline">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <div className="flex gap-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="gradient">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};