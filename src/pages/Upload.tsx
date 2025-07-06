import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import SessionUpload from "@/components/SessionUpload";

export default function Upload() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Upload Session</h1>
                <p className="text-muted-foreground">
                  Upload video/audio files, text documents, or paste links to generate AI-powered podcast recaps
                </p>
              </div>
              
              <SessionUpload />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 