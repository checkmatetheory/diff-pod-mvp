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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative overflow-hidden">
        {/* Subtle Sky Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/20 to-sky-50/30" />
        
        {/* Minimal Cloud Elements */}
        <div className="absolute top-20 right-1/4 w-20 h-10 bg-white/10 rounded-full blur-lg" />
        <div className="absolute bottom-1/3 left-1/6 w-28 h-14 bg-white/8 rounded-full blur-xl" />
        
        <AppSidebar />
        <SidebarInset className="flex-1 relative z-10">
          <Header />
          <main className="flex-1 px-8 py-12">
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Header */}
              <div className="backdrop-blur-sm bg-white/40 p-6 rounded-2xl border border-white/30 shadow-lg">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
                <p className="text-gray-600">Customize your brand and platform preferences</p>
              </div>

              {/* Brand Settings */}
              <Card className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Palette className="h-5 w-5" />
                    Brand Settings
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Customize your company branding and visual identity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-gray-700">Company Name</Label>
                      <Input
                        id="companyName"
                        value={settings.companyName}
                        onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                        className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subdomain" className="text-gray-700">Custom Subdomain</Label>
                      <div className="relative">
                        <Input
                          id="subdomain"
                          value={settings.subdomain}
                          onChange={(e) => setSettings({...settings, subdomain: e.target.value})}
                          className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-sm text-gray-500">.diffused.app</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg backdrop-blur-sm bg-white/40 border border-white/30 flex items-center justify-center">
                        {settings.companyLogo ? (
                          <img src={settings.companyLogo} alt="Logo" className="w-12 h-12 object-contain" />
                        ) : (
                          <Upload className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <Button 
                        onClick={handleLogoUpload}
                        className="backdrop-blur-sm bg-white/60 text-gray-700 border border-white/40 hover:bg-white/80"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor" className="text-gray-700">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                          className="w-16 h-10 p-1 backdrop-blur-sm bg-white/60 border border-white/40"
                        />
                        <Input
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                          className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accentColor" className="text-gray-700">Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="accentColor"
                          type="color"
                          value={settings.accentColor}
                          onChange={(e) => setSettings({...settings, accentColor: e.target.value})}
                          className="w-16 h-10 p-1 backdrop-blur-sm bg-white/60 border border-white/40"
                        />
                        <Input
                          value={settings.accentColor}
                          onChange={(e) => setSettings({...settings, accentColor: e.target.value})}
                          className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Settings */}
              <Card className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <SettingsIcon className="h-5 w-5" />
                    Platform Settings
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure platform features and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 backdrop-blur-sm bg-white/40 rounded-xl border border-white/30">
                    <div className="space-y-1">
                      <Label className="text-gray-800">Email Capture</Label>
                      <p className="text-sm text-gray-600">Collect email addresses from visitors</p>
                    </div>
                    <Switch
                      checked={settings.emailCapture}
                      onCheckedChange={(checked) => setSettings({...settings, emailCapture: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 backdrop-blur-sm bg-white/40 rounded-xl border border-white/30">
                    <div className="space-y-1">
                      <Label className="text-gray-800">Analytics Tracking</Label>
                      <p className="text-sm text-gray-600">Enable detailed analytics and reporting</p>
                    </div>
                    <Switch
                      checked={settings.analytics}
                      onCheckedChange={(checked) => setSettings({...settings, analytics: checked})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seoDescription" className="text-gray-700">SEO Description</Label>
                    <Textarea
                      id="seoDescription"
                      value={settings.seoDescription}
                      onChange={(e) => setSettings({...settings, seoDescription: e.target.value})}
                      className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customFooter" className="text-gray-700">Custom Footer</Label>
                    <Input
                      id="customFooter"
                      value={settings.customFooter}
                      onChange={(e) => setSettings({...settings, customFooter: e.target.value})}
                      className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Preview Section */}
              <Card className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Eye className="h-5 w-5" />
                    Preview
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    See how your brand settings will appear
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="backdrop-blur-sm bg-white/40 rounded-xl border border-white/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded backdrop-blur-sm border border-white/30"
                          style={{ backgroundColor: settings.primaryColor }}
                        />
                        <span className="font-semibold text-gray-800">{settings.companyName}</span>
                      </div>
                      <Badge className="backdrop-blur-sm bg-white/60 text-gray-700 border border-white/40">
                        {settings.subdomain}.diffused.app
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-4">{settings.seoDescription}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        style={{ backgroundColor: settings.primaryColor }}
                        className="text-white hover:opacity-90"
                      >
                        Primary Action
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        style={{ borderColor: settings.accentColor, color: settings.accentColor }}
                        className="backdrop-blur-sm bg-white/60"
                      >
                        Secondary Action
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline"
                  className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Live Site
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm shadow-lg border border-blue-500/20"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>

            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Settings;