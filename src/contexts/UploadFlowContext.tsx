import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UploadFlowState {
  currentStep: number;
  selectedEventId: string;
  selectedSpeakerIds: string[];
  uploads: any[];
}

interface UploadFlowContextType {
  // State
  currentStep: number;
  selectedEventId: string;
  selectedSpeakerIds: string[];
  uploads: any[];
  
  // Actions
  setCurrentStep: (step: number) => void;
  setSelectedEventId: (eventId: string) => void;
  setSelectedSpeakerIds: (speakerIds: string[]) => void;
  addSpeaker: (speakerId: string) => void;
  removeSpeaker: (speakerId: string) => void;
  setUploads: (uploads: any[]) => void;
  addUpload: (upload: any) => void;
  updateUpload: (uploadId: string, updates: any) => void;
  removeUpload: (uploadId: string) => void;
  
  // Flow control
  canProceedToStep2: () => boolean;
  canProceedToStep3: () => boolean;
  resetFlow: () => void;
  
  // Navigation helpers
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
}

const defaultState: UploadFlowState = {
  currentStep: 1,
  selectedEventId: "",
  selectedSpeakerIds: [],
  uploads: []
};

const UploadFlowContext = createContext<UploadFlowContextType | undefined>(undefined);

export const useUploadFlow = () => {
  const context = useContext(UploadFlowContext);
  if (context === undefined) {
    throw new Error('useUploadFlow must be used within an UploadFlowProvider');
  }
  return context;
};

interface UploadFlowProviderProps {
  children: ReactNode;
}

export const UploadFlowProvider: React.FC<UploadFlowProviderProps> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(defaultState.currentStep);
  const [selectedEventId, setSelectedEventId] = useState(defaultState.selectedEventId);
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<string[]>(defaultState.selectedSpeakerIds);
  const [uploads, setUploads] = useState<any[]>(defaultState.uploads);

  // Speaker management
  const addSpeaker = (speakerId: string) => {
    setSelectedSpeakerIds(prev => 
      prev.includes(speakerId) ? prev : [...prev, speakerId]
    );
  };

  const removeSpeaker = (speakerId: string) => {
    setSelectedSpeakerIds(prev => prev.filter(id => id !== speakerId));
  };

  // Upload management
  const addUpload = (upload: any) => {
    setUploads(prev => [...prev, upload]);
  };

  const updateUpload = (uploadId: string, updates: any) => {
    setUploads(prev => prev.map(upload => 
      upload.id === uploadId ? { ...upload, ...updates } : upload
    ));
  };

  const removeUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  // Flow validation
  const canProceedToStep2 = () => selectedEventId !== "";
  const canProceedToStep3 = () => canProceedToStep2() && selectedSpeakerIds.length > 0;

  // Navigation helpers
  const goToStep = (step: number) => {
    // Validate step transitions
    if (step === 2 && !canProceedToStep2()) return;
    if (step === 3 && !canProceedToStep3()) return;
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep === 1 && canProceedToStep2()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedToStep3()) {
      setCurrentStep(3);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetFlow = () => {
    setCurrentStep(defaultState.currentStep);
    setSelectedEventId(defaultState.selectedEventId);
    setSelectedSpeakerIds(defaultState.selectedSpeakerIds);
    setUploads(defaultState.uploads);
  };

  const value: UploadFlowContextType = {
    // State
    currentStep,
    selectedEventId,
    selectedSpeakerIds,
    uploads,
    
    // Actions
    setCurrentStep,
    setSelectedEventId,
    setSelectedSpeakerIds,
    addSpeaker,
    removeSpeaker,
    setUploads,
    addUpload,
    updateUpload,
    removeUpload,
    
    // Flow control
    canProceedToStep2,
    canProceedToStep3,
    resetFlow,
    
    // Navigation helpers
    goToStep,
    nextStep,
    previousStep,
  };

  return (
    <UploadFlowContext.Provider value={value}>
      {children}
    </UploadFlowContext.Provider>
  );
};