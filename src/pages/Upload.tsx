import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import SpeakerContentUpload from "@/components/SpeakerContentUpload";

export default function Upload() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-sky-50/30">
      {/* Subtle cloud elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-blue-100/40 rounded-full blur-3xl"></div>
      </div>

      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-8 relative">
              <div className="max-w-5xl mx-auto">
                <SpeakerContentUpload />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
} 