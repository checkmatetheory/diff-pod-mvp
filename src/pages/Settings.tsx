import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Palette, 
  Globe, 
  Settings as SettingsIcon, 
  Save,
  Eye,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    companyName: "Acme Corp",
    companyLogo: "",
    subdomain: "acme",
    primaryColor: "#6EC1E4",
    accentColor: "#FF7755",
    defaultTemplate: "professional",
    emailCapture: true,
    analytics: true,
    customFooter: "© 2024 Acme Corp. All rights reserved.",
    seoDescription: "Discover insights from our latest industry discussions and expert panels.",
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your brand settings have been updated successfully.",
    });
  };

  const handleLogoUpload = () => {
    toast({
      title: "Logo uploaded",
      description: "Your company logo has been updated.",
    });
  };

  const previewUrl = `https://${settings.subdomain}.diffused.app`;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto px-6 py-8 max-w-4xl">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                <p className="text-muted-foreground">
                  Customize your brand and manage your Diffused experience
                </p>
              </div>

              <div className="space-y-8">
                {/* Brand Settings */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Brand Settings
                    </CardTitle>
                    <CardDescription>
                      Customize how your content appears to your audience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input
                          id="company-name"
                          value={settings.companyName}
                          onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                          placeholder="Your company name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subdomain">Subdomain</Label>
                        <div className="flex items-center">
                          <Input
                            id="subdomain"
                            value={settings.subdomain}
                            onChange={(e) => setSettings({...settings, subdomain: e.target.value})}
                            placeholder="your-brand"
                            className="rounded-r-none"
                          />
                          <div className="px-3 py-2 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                            .diffused.app
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Your content will be available at {previewUrl}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logo-upload">Company Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/30">
                          {settings.companyLogo ? (
                            <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <Upload className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Button variant="outline" onClick={handleLogoUpload}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Logo
                          </Button>
                          <p className="text-sm text-muted-foreground mt-1">
                            PNG, JPG up to 2MB. Recommended: 200x200px
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-10 h-10 rounded border-2 border-muted-foreground/25"
                            style={{ backgroundColor: settings.primaryColor }}
                          />
                          <Input
                            id="primary-color"
                            type="color"
                            value={settings.primaryColor}
                            onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                            className="w-20"
                          />
                          <Input
                            value={settings.primaryColor}
                            onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                            placeholder="#6EC1E4"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accent-color">Accent Color</Label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-10 h-10 rounded border-2 border-muted-foreground/25"
                            style={{ backgroundColor: settings.accentColor }}
                          />
                          <Input
                            id="accent-color"
                            type="color"
                            value={settings.accentColor}
                            onChange={(e) => setSettings({...settings, accentColor: e.target.value})}
                            className="w-20"
                          />
                          <Input
                            value={settings.accentColor}
                            onChange={(e) => setSettings({...settings, accentColor: e.target.value})}
                            placeholder="#FF7755"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seo-description">SEO Description</Label>
                      <Textarea
                        id="seo-description"
                        value={settings.seoDescription}
                        onChange={(e) => setSettings({...settings, seoDescription: e.target.value})}
                        placeholder="Brief description for search engines and social media..."
                        className="resize-none"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Content Settings */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SettingsIcon className="h-5 w-5 text-primary" />
                      Content Settings
                    </CardTitle>
                    <CardDescription>
                      Configure how your content is generated and displayed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-capture">Email Capture</Label>
                        <p className="text-sm text-muted-foreground">
                          Require email signup to access full content
                        </p>
                      </div>
                      <Switch
                        id="email-capture"
                        checked={settings.emailCapture}
                        onCheckedChange={(checked) => setSettings({...settings, emailCapture: checked})}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="analytics">Analytics Tracking</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable visitor tracking and engagement metrics
                        </p>
                      </div>
                      <Switch
                        id="analytics"
                        checked={settings.analytics}
                        onCheckedChange={(checked) => setSettings({...settings, analytics: checked})}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="custom-footer">Custom Footer</Label>
                      <Textarea
                        id="custom-footer"
                        value={settings.customFooter}
                        onChange={(e) => setSettings({...settings, customFooter: e.target.value})}
                        placeholder="Add custom footer text, links, or copyright notice..."
                        className="resize-none"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Domain Settings */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Domain Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your custom domain and subdomain settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Current URL</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-background px-2 py-1 rounded">{previewUrl}</code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(previewUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border border-accent/20 bg-accent-subtle rounded-lg">
                      <h4 className="font-medium mb-2">🚀 Custom Domain (Pro Feature)</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Connect your own domain (e.g., recaps.yourcompany.com) for a fully branded experience.
                      </p>
                      <Button variant="outline" className="bg-accent hover:bg-accent-hover text-white border-accent">
                        Upgrade to Pro
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Preview
                    </CardTitle>
                    <CardDescription>
                      See how your branding will appear to visitors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 bg-muted/10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {settings.companyName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold" style={{ color: settings.primaryColor }}>
                            {settings.companyName}
                          </h3>
                          <p className="text-xs text-muted-foreground">{previewUrl}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Sample Session Title</h4>
                        <p className="text-sm text-muted-foreground">{settings.seoDescription}</p>
                        <Button 
                          size="sm" 
                          style={{ backgroundColor: settings.accentColor }}
                          className="text-white hover:opacity-90"
                        >
                          Read Full Recap
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button onClick={handleSave} className="bg-accent hover:bg-accent-hover">
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Settings;