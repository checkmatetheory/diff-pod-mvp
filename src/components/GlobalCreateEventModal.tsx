import { useCreateEventModal } from "@/contexts/CreateEventModalContext";
import CreateEventModal from "@/components/ui/CreateEventModal";

export default function GlobalCreateEventModal() {
  const { isOpen } = useCreateEventModal();
  
  if (!isOpen) return null;
  
  return <CreateEventModal />;
} 