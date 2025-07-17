import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CreateEventModalProvider } from "@/contexts/CreateEventModalContext";
import GlobalCreateEventModal from "@/components/GlobalCreateEventModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SessionDetail from "./pages/SessionDetail";
import Settings from "./pages/Settings";
import PublicRecap from "./pages/PublicRecap";
import Analytics from "./pages/Analytics";
import Conferences from "./pages/Conferences";
import Events from "./pages/Events";

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
      <CreateEventModalProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalCreateEventModal />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/recap/:id" element={<PublicRecap />} />
            <Route path="/event/:subdomain" element={<PublicEvent />} />
            <Route path="/event/:subdomain/speaker/:slug" element={<SpeakerMicrosite />} />
            <Route path="/event/:eventId/speaker/:speakerId" element={<SpeakerMicrosite />} />
            
            {/* Protected routes - all using consistent layout */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
            <Route path="/speakers" element={<ProtectedRoute><AllSpeakers /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/session/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />

            <Route path="/events/:eventId/manage" element={<ProtectedRoute><EventManage /></ProtectedRoute>} />
            <Route path="/events/:eventId/speakers/approve" element={<ProtectedRoute><SpeakerApprovalDashboard /></ProtectedRoute>} />
            <Route path="/events/:eventId/analytics" element={<ProtectedRoute><EventAnalytics /></ProtectedRoute>} />
            <Route path="/test-audio" element={<ProtectedRoute><TestAudio /></ProtectedRoute>} />
            <Route path="/conference/:id" element={<ProtectedRoute><Conferences /></ProtectedRoute>} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </CreateEventModalProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
