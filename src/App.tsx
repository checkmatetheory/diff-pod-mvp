import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SessionDetail from "./pages/SessionDetail";
import Settings from "./pages/Settings";
import PublicRecap from "./pages/PublicRecap";
import Analytics from "./pages/Analytics";
import Conferences from "./pages/Conferences";
import Events from "./pages/Events";
import NewEvent from "./pages/NewEvent";
import EventAnalytics from "./pages/EventAnalytics";
import PublicEvent from "./pages/PublicEvent";

import Browse from "./pages/Browse";
import Favorites from "./pages/Favorites";
import AllSpeakers from "./pages/AllSpeakers";
import Upload from "./pages/Upload";
import TestAudio from "./pages/TestAudio";
import EventManage from "./pages/EventManage";
import SpeakerMicrosite from "./pages/SpeakerMicrosite";
import SpeakerApprovalDashboard from "./pages/SpeakerApprovalDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/recap/:id" element={<PublicRecap />} />
            <Route path="/event/:subdomain" element={<PublicEvent />} />
            <Route path="/event/:subdomain/speaker/:slug" element={<SpeakerMicrosite />} />
            <Route path="/event/:eventId/speaker/:speakerId" element={<SpeakerMicrosite />} />
            
            {/* Protected routes with main app layout */}
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="session/:id" element={<SessionDetail />} />
              <Route path="settings" element={<Settings />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="events" element={<Events />} />
              <Route path="events/new" element={<NewEvent />} />
              <Route path="events/:eventId/manage" element={<EventManage />} />
              <Route path="events/:eventId/speakers/approve" element={<SpeakerApprovalDashboard />} />
              <Route path="events/:eventId/analytics" element={<EventAnalytics />} />
              <Route path="speakers" element={<AllSpeakers />} />
              <Route path="browse" element={<Browse />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="upload" element={<Upload />} />
              <Route path="test-audio" element={<TestAudio />} />
              <Route path="conference/:id" element={<Conferences />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
