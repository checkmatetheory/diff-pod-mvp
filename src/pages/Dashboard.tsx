import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import CreateEventModal from "@/components/ui/CreateEventModal";

export default function DashboardPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onCreateEvent={() => setCreateModalOpen(true)} />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1 p-6">
            <Dashboard />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>

    <CreateEventModal 
      open={createModalOpen} 
      onOpenChange={setCreateModalOpen}
      onEventCreated={() => {
        // Could navigate to events page or show success message
        setCreateModalOpen(false);
      }}
    />
    </>
  );
} 