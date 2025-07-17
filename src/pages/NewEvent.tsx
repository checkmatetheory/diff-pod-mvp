import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import BrandCustomization from "@/components/ui/BrandCustomization";

const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  subdomain: z.string().min(3, "Subdomain must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  next_event_date: z.date().optional(),
  next_event_registration_url: z.string().url().optional().or(z.literal("")),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function NewEvent() {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [brandConfig, setBrandConfig] = useState({
    primary_color: "#5B9BD5",
    secondary_color: "#4A8BC2",
    logo_url: null as string | null,
    cta_text: "Register for Next Event",
    cta_url: "",
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const subdomain = watch("subdomain");

  const onSubmit = async (data: EventFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      // Check if subdomain is available
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('subdomain', data.subdomain)
        .single();

      if (existingEvent) {
        toast.error("Subdomain already taken. Please choose another one.");
        return;
      }

      // Create event
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          name: data.name,
          subdomain: data.subdomain,
          description: data.description,
          next_event_date: data.next_event_date,
          next_event_registration_url: data.next_event_registration_url || null,
          user_id: user.id,
          branding: brandConfig,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Event created successfully!");
      navigate(`/events`);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/20 to-sky-50/30" />
      
      {/* Minimal Cloud Elements */}
      <div className="absolute top-20 right-1/4 w-20 h-10 bg-white/10 rounded-full blur-lg" />
      <div className="absolute bottom-1/3 left-1/6 w-28 h-14 bg-white/8 rounded-full blur-xl" />
      
      <div className="relative z-10 container mx-auto px-8 py-12 max-w-4xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/events')}
            className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
          <div className="backdrop-blur-sm bg-white/40 p-6 rounded-2xl border border-white/30 shadow-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Event</h1>
            <p className="text-gray-600">Set up a new event and configure speaker microsites</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Basic Information */}
          <Card className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
            <CardHeader className="pb-6">
              <CardTitle className="text-gray-800">Event Information</CardTitle>
              <CardDescription className="text-gray-600">
                Basic details about your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">Event Name</Label>
                  <Input
                    id="name"
                    placeholder="FinTech Innovation Summit 2024"
                    {...register("name")}
                    className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain" className="text-gray-700">URL Subdomain</Label>
                  <div className="relative">
                    <Input
                      id="subdomain"
                      placeholder="fintech-summit-2024"
                      {...register("subdomain")}
                      className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-sm text-gray-500">.diffused.app</span>
                    </div>
                  </div>
                  {errors.subdomain && (
                    <p className="text-sm text-red-600">{errors.subdomain.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A premier financial technology conference bringing together industry leaders..."
                  {...register("description")}
                  className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80"
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Next Event Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal backdrop-blur-sm bg-white/60 border border-white/40 hover:bg-white/80",
                          !date && "text-gray-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 backdrop-blur-md bg-white/90 border border-white/50">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => {
                          setDate(date);
                          setValue("next_event_date", date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_url" className="text-gray-700">Registration URL (Optional)</Label>
                  <Input
                    id="registration_url"
                    placeholder="https://eventbrite.com/your-event"
                    {...register("next_event_registration_url")}
                    className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80"
                  />
                  {errors.next_event_registration_url && (
                    <p className="text-sm text-red-600">{errors.next_event_registration_url.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand Customization */}
          <Card className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
            <CardHeader className="pb-6">
              <CardTitle className="text-gray-800">Brand Customization</CardTitle>
              <CardDescription className="text-gray-600">
                Customize the look and feel of your event microsites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="backdrop-blur-sm bg-white/40 rounded-xl border border-white/30 p-6">
                <BrandCustomization
                  value={brandConfig}
                  onChange={setBrandConfig}
                  showCTA={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
            <CardHeader className="pb-6">
              <CardTitle className="text-gray-800">Preview</CardTitle>
              <CardDescription className="text-gray-600">
                How your event will appear to visitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="backdrop-blur-sm bg-white/40 rounded-xl border border-white/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-8 h-8 rounded backdrop-blur-sm border border-white/30"
                    style={{ backgroundColor: brandConfig.primary_color }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">{watch("name") || "Your Event Name"}</h3>
                    <p className="text-sm text-gray-600">
                      {watch("subdomain") ? `${watch("subdomain")}.diffused.app` : "your-subdomain.diffused.app"}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  {watch("description") || "Your event description will appear here..."}
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    style={{ backgroundColor: brandConfig.primary_color }}
                    className="text-white hover:opacity-90"
                    type="button"
                  >
                    {brandConfig.cta_text}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    style={{ borderColor: brandConfig.secondary_color, color: brandConfig.secondary_color }}
                    className="backdrop-blur-sm bg-white/60"
                    type="button"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm shadow-lg border border-blue-500/20"
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Event
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}