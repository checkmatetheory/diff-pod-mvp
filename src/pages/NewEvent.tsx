import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Calendar, Upload } from "lucide-react";

export default function NewEvent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    date: "",
    location: "",
    website: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Event created successfully!",
        description: "Your event has been added to your portfolio.",
      });
      setIsLoading(false);
      navigate("/events");
    }, 1000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          
          <main className="flex-1 p-8 bg-gradient-subtle min-h-screen">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/events")}
                  className="hover:bg-white/50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Events
                </Button>
              </div>

              <div className="text-center">
                <h1 className="text-4xl font-display font-bold text-gradient-primary mb-3">Add New Event</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Create a new event portfolio to organize your sessions and generate AI-powered recaps
                </p>
              </div>

              {/* Form */}
              <Card className="bg-gradient-card shadow-xl border-0">
                <CardHeader className="pb-8">
                  <CardTitle className="text-2xl font-display">Event Details</CardTitle>
                  <CardDescription className="text-base">
                    Provide basic information about your event to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Event Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Tech Summit 2024"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select onValueChange={(value) => handleChange("category", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conference">Conference</SelectItem>
                            <SelectItem value="earnings_call">Earnings Call</SelectItem>
                            <SelectItem value="board_meeting">Board Meeting</SelectItem>
                            <SelectItem value="investor_update">Investor Update</SelectItem>
                            <SelectItem value="due_diligence">Due Diligence</SelectItem>
                            <SelectItem value="portfolio_review">Portfolio Review</SelectItem>
                            <SelectItem value="market_update">Market Update</SelectItem>
                            <SelectItem value="team_meeting">Team Meeting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the event..."
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Event Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => handleChange("date", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="e.g., San Francisco, CA"
                          value={formData.location}
                          onChange={(e) => handleChange("location", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Event Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://..."
                        value={formData.website}
                        onChange={(e) => handleChange("website", e.target.value)}
                      />
                    </div>

                    <div className="flex gap-4 pt-6">
                      <Button 
                        type="submit" 
                        disabled={isLoading || !formData.name || !formData.category}
                        className="bg-gradient-accent hover:shadow-accent transition-all duration-300 px-8 py-6 text-lg font-semibold"
                        size="lg"
                      >
                        {isLoading ? "Creating..." : "Create Event"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => navigate("/events")}
                        className="px-8 py-6 text-lg"
                        size="lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="bg-gradient-card shadow-xl border-0">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-display">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    What's Next?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-base text-muted-foreground space-y-4">
                    <p className="font-medium">After creating your event, you'll be able to:</p>
                    <ul className="space-y-3 ml-2">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-accent mt-2"></div>
                        <span>Upload session recordings (video/audio)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-accent mt-2"></div>
                        <span>Generate AI-powered recaps and summaries</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-accent mt-2"></div>
                        <span>Create branded content for your audience</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-accent mt-2"></div>
                        <span>Track engagement and analytics</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}