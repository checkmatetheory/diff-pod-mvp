import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface EventFormData {
  name: string;
  subdomain: string;
  description: string;
  next_event_date?: Date;
  next_event_registration_url?: string;
}

export interface BrandConfig {
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  cta_text: string;
  cta_url: string;
}

interface CreateEventModalContextType {
  // Modal state
  isOpen: boolean;
  currentStep: number;
  completedSteps: number[];
  
  // Form data
  formData: Partial<EventFormData>;
  brandConfig: BrandConfig;
  selectedDate?: Date;
  
  // Actions
  openModal: () => void;
  closeModal: () => void;
  setCurrentStep: (step: number) => void;
  setCompletedSteps: (steps: number[]) => void;
  updateFormData: (data: Partial<EventFormData>) => void;
  updateBrandConfig: (config: BrandConfig) => void;
  setSelectedDate: (date?: Date) => void;
  resetModal: () => void;
}

const CreateEventModalContext = createContext<CreateEventModalContextType | undefined>(undefined);

export const useCreateEventModal = () => {
  const context = useContext(CreateEventModalContext);
  if (context === undefined) {
    throw new Error('useCreateEventModal must be used within a CreateEventModalProvider');
  }
  return context;
};

const initialBrandConfig: BrandConfig = {
  primary_color: "#5B9BD5",
  secondary_color: "#4A8BC2",
  logo_url: null,
  cta_text: "Register for Next Event",
  cta_url: "",
};

const initialFormData: Partial<EventFormData> = {
  name: "",
  subdomain: "",
  description: "",
  next_event_date: undefined,
  next_event_registration_url: "",
};

export const CreateEventModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStepState] = useState(1);
  const [completedSteps, setCompletedStepsState] = useState<number[]>([]);
  const [formData, setFormData] = useState<Partial<EventFormData>>(initialFormData);
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(initialBrandConfig);
  const [selectedDate, setSelectedDateState] = useState<Date | undefined>(undefined);

  const openModal = () => setIsOpen(true);
  
  const closeModal = () => setIsOpen(false);

  const setCurrentStep = (step: number) => setCurrentStepState(step);

  const setCompletedSteps = (steps: number[]) => setCompletedStepsState(steps);

  const updateFormData = (data: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const updateBrandConfig = (config: BrandConfig) => {
    setBrandConfig(config);
  };

  const setSelectedDate = (date?: Date) => {
    setSelectedDateState(date);
    if (date) {
      updateFormData({ next_event_date: date });
    }
  };

  const resetModal = () => {
    setCurrentStepState(1);
    setCompletedStepsState([]);
    setFormData(initialFormData);
    setBrandConfig(initialBrandConfig);
    setSelectedDateState(undefined);
    setIsOpen(false);
  };

  const value: CreateEventModalContextType = {
    isOpen,
    currentStep,
    completedSteps,
    formData,
    brandConfig,
    selectedDate,
    openModal,
    closeModal,
    setCurrentStep,
    setCompletedSteps,
    updateFormData,
    updateBrandConfig,
    setSelectedDate,
    resetModal,
  };

  return (
    <CreateEventModalContext.Provider value={value}>
      {children}
    </CreateEventModalContext.Provider>
  );
}; 