import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Upload, Globe, Palette } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function NewPortfolio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brand_logo_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conference_portfolios')
        .insert([
          {
            name: formData.name,
            description: formData.description || null,
            brand_logo_url: formData.brand_logo_url || null,
            user_id: (await supabase.auth.getUser()).data.user?.id!,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Portfolio Created",
        description: "Your new conference portfolio has been created successfully.",
      });

      navigate('/portfolios');
    } catch (error) {
      console.error('Error creating portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to create portfolio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative">
      {/* Background Hero Image */}
      <div className="absolute inset-0 opacity-5">
        <img 
          src="/diff media hero.png" 
          alt="Diffused Media Background" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <Link to="/portfolios">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gradient-primary">Create New Portfolio</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Set up a new conference portfolio with custom branding and automation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  Portfolio Details
                </CardTitle>
                <CardDescription>
                  Configure the basic information for your conference portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Portfolio Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., FinTech Innovation Summit"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your conference series and target audience..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">Brand Logo URL</Label>
                    <Input
                      id="logo"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={formData.brand_logo_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand_logo_url: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      className="bg-gradient-primary hover:opacity-90"
                      disabled={loading || !formData.name.trim()}
                    >
                      {loading ? "Creating..." : "Create Portfolio"}
                    </Button>
                    <Link to="/portfolios">
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Next Steps */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Next Steps</CardTitle>
                <CardDescription>
                  After creating your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary-subtle">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Upload Sessions</p>
                    <p className="text-sm text-muted-foreground">Add conference recordings to generate podcasts</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-accent-subtle">
                    <Palette className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Customize Branding</p>
                    <p className="text-sm text-muted-foreground">Set up intro/outro audio and visual themes</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <Globe className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Website Monitoring</p>
                    <p className="text-sm text-muted-foreground">Automate content detection and processing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card bg-gradient-card">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">Enterprise Features</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unlock advanced automation, custom voices, and sponsor integration
                </p>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}