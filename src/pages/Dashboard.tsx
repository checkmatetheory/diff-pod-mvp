import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import { useCreateEventModal } from "@/contexts/CreateEventModalContext";

export default function DashboardPage() {
  const { openModal } = useCreateEventModal();

  return (
    <>
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onCreateEvent={openModal} />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1 p-6">
            <Dashboard />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>


    </>
  );
} 