import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";

export const SessionLoadingSkeleton = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto px-6 py-8">
              {/* Header Section Skeleton */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-9 w-40 bg-gray-200 rounded-md animate-pulse"></div>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content Skeleton */}
                <div className="flex-1 space-y-6">
                  {/* Session Info Card Skeleton */}
                  <div className="bg-white rounded-lg border p-6 space-y-4 shadow-card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                        <div className="flex gap-4">
                          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="h-6 w-28 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                    </div>
                  </div>

                  {/* Tabs Skeleton */}
                  <div className="bg-white rounded-lg border shadow-card">
                    {/* Tab Headers */}
                    <div className="flex border-b p-1 space-x-1">
                      {['Videos', 'Summary', 'Blog', 'Social', 'Quotes', 'Transcript'].map((tab, i) => (
                        <div key={i} className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                    
                    {/* Tab Content */}
                    <div className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                        </div>
                        <div className="h-9 w-28 bg-gray-200 rounded-md animate-pulse"></div>
                      </div>
                      
                      {/* Content Cards Skeleton */}
                      <div className="space-y-6">
                        {[1, 2].map((i) => (
                          <div key={i} className="flex gap-6 p-6 border rounded-lg">
                            {/* Video Thumbnail Skeleton */}
                            <div className="w-48 h-72 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
                            
                            {/* Content Skeleton */}
                            <div className="flex-1 space-y-4">
                              <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                              </div>
                              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                              <div className="flex gap-3 mt-6">
                                <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                                <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="w-full lg:w-80 space-y-6">
                  {/* Quick Actions Card */}
                  <div className="bg-white rounded-lg border p-6 shadow-card space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>

                  {/* Public Recap Card */}
                  <div className="bg-white rounded-lg border p-6 shadow-card space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-28 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="flex gap-2">
                        <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                        <div className="h-10 w-12 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>

                  {/* Speakers Card */}
                  <div className="bg-white rounded-lg border p-6 shadow-card space-y-4">
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                    </div>
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                          </div>
                          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}; 