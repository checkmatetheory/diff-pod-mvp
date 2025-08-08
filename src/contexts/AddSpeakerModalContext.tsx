import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SpeakerFormData {
  full_name: string;
  email: string;
  company: string;
  job_title: string;
  linkedin_url: string;
  bio: string;
  headshot_url: string;
}

interface AddSpeakerModalContextType {
  // Modal state
  isOpen: boolean;
  formData: SpeakerFormData;
  
  // Actions
  openModal: () => void;
  closeModal: () => void;
  updateFormData: (data: Partial<SpeakerFormData>) => void;
  resetForm: () => void;
}

const defaultFormData: SpeakerFormData = {
  full_name: "",
  email: "",
  company: "",
  job_title: "",
  linkedin_url: "",
  bio: "",
  headshot_url: ""
};

const AddSpeakerModalContext = createContext<AddSpeakerModalContextType | undefined>(undefined);

export const useAddSpeakerModal = () => {
  const context = useContext(AddSpeakerModalContext);
  if (context === undefined) {
    throw new Error('useAddSpeakerModal must be used within an AddSpeakerModalProvider');
  }
  return context;
};

interface AddSpeakerModalProviderProps {
  children: ReactNode;
}

export const AddSpeakerModalProvider: React.FC<AddSpeakerModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<SpeakerFormData>(defaultFormData);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  
  const updateFormData = (data: Partial<SpeakerFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };
  
  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const value: AddSpeakerModalContextType = {
    isOpen,
    formData,
    openModal,
    closeModal,
    updateFormData,
    resetForm,
  };

  return (
    <AddSpeakerModalContext.Provider value={value}>
      {children}
    </AddSpeakerModalContext.Provider>
  );
};