import { useState, useEffect } from "react";
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
import { CalendarIcon, Loader2, X, Check, Info, Palette, Eye, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn, getContrastingTextColor } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateEventModal } from "@/contexts/CreateEventModalContext";
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

export default function CreateEventModal({ onEventCreated }: CreateEventModalProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const {
    isOpen,
    currentStep,
    completedSteps,
    formData,
    brandConfig,
    selectedDate,
    closeModal,
    setCurrentStep,
    setCompletedSteps,
    updateFormData,
    updateBrandConfig,
    setSelectedDate,
    resetModal
  } = useCreateEventModal();

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
    defaultValues: formData,
  });

  const watchedValues = watch();

  // Initialize form with context data only once when modal opens
  useEffect(() => {
    if (isOpen) {
      reset(formData);
      if (selectedDate) {
        setValue("next_event_date", selectedDate);
      }
    }
  }, [isOpen]); // Only run when modal opens

  // Save form data to context when stepping between pages or closing
  const saveFormDataToContext = () => {
    const currentFormData = watchedValues;
    updateFormData(currentFormData);
  };

  const handleClose = () => {
    // Don't save form data on close to prevent re-render flash
    // Reset modal state for clean UX when reopened
    resetModal();
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1: {
        const step1Valid = await trigger(["name", "subdomain", "description"]);
        return step1Valid;
      }
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
      saveFormDataToContext(); // Save current form data before stepping
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      saveFormDataToContext(); // Save current form data before stepping
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = async (stepNumber: number) => {
    if (stepNumber < currentStep || completedSteps.includes(stepNumber)) {
      saveFormDataToContext(); // Save current form data before stepping
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
      resetModal(); // Reset modal state after successful creation
      
      // Notify other components that an event was created
      window.dispatchEvent(new CustomEvent('eventCreated'));
      
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
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Event Name</Label>
                <Input
                  id="name"
                  placeholder="FinTech Innovation Summit 2024"
                  {...register("name")}
                  className="backdrop-blur-sm bg-white/70 border-blue-200/60 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain" className="text-sm font-medium text-slate-700">URL Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    placeholder="fintech-summit-2024"
                    {...register("subdomain")}
                    className="backdrop-blur-sm bg-white/70 border-blue-200/60 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                  />
                  <span className="text-sm text-slate-500 whitespace-nowrap">.diffused.app</span>
                </div>
                {errors.subdomain && (
                  <p className="text-sm text-red-500">{errors.subdomain.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
              <Textarea
                id="description"
                placeholder="A premier financial technology conference bringing together industry leaders..."
                className="min-h-[120px] backdrop-blur-sm bg-white/70 border-blue-200/60 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200 resize-none"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Next Event Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal backdrop-blur-sm bg-white/70 border-blue-200/60 hover:border-blue-400 transition-all duration-200",
                        !selectedDate && "text-slate-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(newDate) => {
                        setSelectedDate(newDate);
                        setValue("next_event_date", newDate);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_url" className="text-sm font-medium text-slate-700">Registration URL (Optional)</Label>
                <Input
                  id="registration_url"
                  placeholder="https://eventbrite.com/your-event"
                  {...register("next_event_registration_url")}
                  className="backdrop-blur-sm bg-white/70 border-blue-200/60 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                />
                {errors.next_event_registration_url && (
                  <p className="text-sm text-red-500">{errors.next_event_registration_url.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <BrandCustomization
              value={brandConfig}
              onChange={updateBrandConfig}
              showCTA={true}
              hidePreview={true}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Event Preview
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-700">Event Name:</h4>
                  <p className="text-slate-600">{watchedValues.name || "Untitled Event"}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-700">Subdomain:</h4>
                  <p className="text-blue-600 font-mono text-sm">{watchedValues.subdomain || "untitled"}.diffused.app</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-700">Description:</h4>
                  <p className="text-slate-600 text-sm">{watchedValues.description || "No description provided"}</p>
                </div>

                {selectedDate && (
                  <div>
                    <h4 className="font-medium text-slate-700">Next Event Date:</h4>
                    <p className="text-slate-600">{format(selectedDate, "PPP")}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Brand Colors:</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: brandConfig.primary_color }}
                      />
                      <span className="text-sm text-slate-600">Primary: {brandConfig.primary_color}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: brandConfig.secondary_color }}
                      />
                      <span className="text-sm text-slate-600">Secondary: {brandConfig.secondary_color}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Button Preview:</h4>
                  <div className="flex gap-3">
                    <Button 
                      size="sm" 
                      style={{ 
                        backgroundColor: brandConfig.primary_color,
                        color: getContrastingTextColor(brandConfig.primary_color)
                      }}
                      className="hover:opacity-90 shadow-sm"
                      type="button"
                    >
                      {brandConfig.cta_text}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      style={{ borderColor: brandConfig.secondary_color, color: brandConfig.secondary_color }}
                      className="backdrop-blur-sm bg-white/80 shadow-sm"
                      type="button"
                    >
                      Learn More
                    </Button>
                  </div>
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 gap-0 overflow-hidden bg-gradient-to-br from-blue-50/95 via-indigo-50/90 to-sky-50/95 backdrop-blur-xl border-blue-200/30">
        <div className="flex h-full">
          {/* Enhanced Premium Sidebar */}
          <div className="w-80 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-sky-600/10 border-r border-blue-300/30 p-6 backdrop-blur-xl">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Create New Event
              </DialogTitle>
              <p className="text-sm text-slate-600">Set up a new event and configure speaker microsites</p>
            </DialogHeader>

            <div className="space-y-3">
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
                      "w-full text-left p-4 rounded-xl border transition-all duration-300 group",
                      isActive 
                        ? "bg-blue-100/80 border-blue-300/60 shadow-lg backdrop-blur-sm ring-1 ring-blue-400/20" 
                        : isCompleted
                        ? "bg-emerald-50/80 border-emerald-200/60 hover:bg-emerald-100/80 backdrop-blur-sm shadow-sm"
                        : isAccessible
                        ? "bg-white/40 border-blue-200/40 hover:bg-white/60 backdrop-blur-sm hover:shadow-md"
                        : "bg-white/20 border-slate-200/30 opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                        isCompleted
                          ? "bg-emerald-100 border-emerald-300 text-emerald-600 shadow-sm"
                          : isActive
                          ? "bg-blue-100 border-blue-300 text-blue-600 shadow-md"
                          : "bg-white/60 border-slate-300/60 text-slate-400"
                      )}>
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <IconComponent className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-semibold text-sm",
                          isActive ? "text-blue-800" : isCompleted ? "text-emerald-800" : "text-slate-700"
                        )}>
                          {step.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Enhanced Progress Dots */}
            <div className="flex justify-center gap-3 mt-8">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    completedSteps.includes(step.id)
                      ? "bg-emerald-400 shadow-sm ring-2 ring-emerald-200"
                      : currentStep === step.id
                      ? "bg-blue-500 shadow-md ring-2 ring-blue-200"
                      : "bg-slate-300/60"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1 flex flex-col bg-white/30 backdrop-blur-sm min-h-0">
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                    {steps[currentStep - 1]?.title}
                  </h2>
                  <p className="text-slate-600 text-lg">
                    {steps[currentStep - 1]?.description}
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  {renderStepContent()}
                </form>
              </div>
            </div>

            {/* Premium Footer Actions */}
            <div className="border-t border-blue-200/40 py-3 px-6 bg-white/40 backdrop-blur-xl">
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="backdrop-blur-sm bg-white/80 border-slate-300/60 hover:bg-white/90 text-slate-700 shadow-sm disabled:opacity-50"
                >
                  Previous
                </Button>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="backdrop-blur-sm bg-white/80 border-slate-300/60 hover:bg-white/90 text-slate-700 shadow-sm"
                  >
                    Cancel
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 border-0 ring-1 ring-emerald-300/50"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      onClick={handleSubmit(onSubmit)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 border-0 ring-1 ring-blue-300/50"
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