import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, Loader2, X, Check, Info, Palette, Eye } from "lucide-react";
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

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: () => void;
}

const steps = [
  {
    id: 1,
    title: "Event Information",
    description: "Basic details about your event",
    icon: Info,
  },
  {
    id: 2,
    title: "Brand Customization",
    description: "Customize the look and feel",
    icon: Palette,
  },
  {
    id: 3,
    title: "Preview",
    description: "Review and create your event",
    icon: Eye,
  },
];

export default function CreateEventModal({ open, onOpenChange, onEventCreated }: CreateEventModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [brandConfig, setBrandConfig] = useState({
    primary_color: "#5B9BD5",
    secondary_color: "#4A8BC2",
    logo_url: null as string | null,
    cta_text: "Register for Next Event",
    cta_url: "",
  });
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const watchedValues = watch();

  const resetModal = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
    setDate(undefined);
    setBrandConfig({
      primary_color: "#5B9BD5",
      secondary_color: "#4A8BC2",
      logo_url: null,
      cta_text: "Register for Next Event",
      cta_url: "",
    });
    reset();
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        const step1Valid = await trigger(["name", "subdomain", "description"]);
        return step1Valid;
      case 2:
        // Brand customization doesn't have required validation
        return true;
      case 3:
        // Preview step - all validation should be complete
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    
    if (!isValid) {
      toast.error("Please fix the errors before continuing");
      return;
    }

    if (currentStep < 3) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = async (stepNumber: number) => {
    if (stepNumber < currentStep || completedSteps.includes(stepNumber)) {
      setCurrentStep(stepNumber);
    } else if (stepNumber === currentStep + 1) {
      await handleNext();
    }
  };

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
        setCurrentStep(1);
        setLoading(false);
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
      handleClose();
      onEventCreated?.();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
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
                    className="backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80 pr-24"
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
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                        setValue("next_event_date", newDate);
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="backdrop-blur-sm bg-white/40 rounded-xl border border-white/30 p-6">
              <BrandCustomization
                value={brandConfig}
                onChange={setBrandConfig}
                showCTA={true}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Event Details Preview */}
            <div className="backdrop-blur-sm bg-white/40 rounded-xl border border-white/30 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium text-gray-800">{watchedValues.name || "Untitled Event"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">URL:</span>
                  <p className="font-medium text-blue-600">{watchedValues.subdomain || "subdomain"}.diffused.app</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Description:</span>
                  <p className="text-gray-700">{watchedValues.description || "No description provided"}</p>
                </div>
                {date && (
                  <div>
                    <span className="text-sm text-gray-600">Next Event Date:</span>
                    <p className="text-gray-700">{format(date, "PPP")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Brand Preview */}
            <div className="backdrop-blur-sm bg-white/40 rounded-xl border border-white/30 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Brand Preview</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-8 h-8 rounded border border-white/30"
                    style={{ backgroundColor: brandConfig.primary_color }}
                  />
                  <span className="text-sm text-gray-600">Primary Color: {brandConfig.primary_color}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-8 h-8 rounded border border-white/30"
                    style={{ backgroundColor: brandConfig.secondary_color }}
                  />
                  <span className="text-sm text-gray-600">Secondary Color: {brandConfig.secondary_color}</span>
                </div>
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
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-full h-[80vh] p-0 gap-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 bg-gradient-to-br from-slate-50 via-blue-50/20 to-sky-50/30 border-r border-white/40 p-6">
            <DialogHeader className="pb-6">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold text-gray-800">Create New Event</DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">Set up a new event and configure speaker microsites</p>
            </DialogHeader>

            <div className="space-y-4">
              {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isCompleted = completedSteps.includes(step.id);
                const isAccessible = step.id <= currentStep || isCompleted;
                const IconComponent = step.icon;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isAccessible}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all duration-200",
                      isActive 
                        ? "bg-white/60 border-blue-200 shadow-md" 
                        : isCompleted
                        ? "bg-white/40 border-green-200 hover:bg-white/50"
                        : isAccessible
                        ? "bg-white/20 border-white/30 hover:bg-white/30"
                        : "bg-white/10 border-white/20 opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2",
                        isCompleted
                          ? "bg-green-100 border-green-300 text-green-600"
                          : isActive
                          ? "bg-blue-100 border-blue-300 text-blue-600"
                          : "bg-white/40 border-white/60 text-gray-400"
                      )}>
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <IconComponent className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-medium text-sm",
                          isActive ? "text-gray-800" : "text-gray-600"
                        )}>
                          {step.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    completedSteps.includes(step.id)
                      ? "bg-green-400"
                      : currentStep === step.id
                      ? "bg-blue-400"
                      : "bg-white/40"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {steps[currentStep - 1]?.title}
                  </h2>
                  <p className="text-gray-600">
                    {steps[currentStep - 1]?.description}
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  {renderStepContent()}
                </form>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-white/40 p-6 bg-white/20 backdrop-blur-sm">
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="backdrop-blur-sm bg-white/60 border border-white/40"
                >
                  Previous
                </Button>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="backdrop-blur-sm bg-white/60 border border-white/40"
                  >
                    Cancel
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm shadow-lg border border-blue-500/20"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      onClick={handleSubmit(onSubmit)}
                      className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm shadow-lg border border-blue-500/20"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Event
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 