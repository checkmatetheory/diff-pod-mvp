import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import NewEvent from "./pages/NewEvent";
import EventAnalytics from "./pages/EventAnalytics";
import PublicEvent from "./pages/PublicEvent";
import Portfolios from "./pages/Portfolios";
import PortfolioAnalytics from "./pages/PortfolioAnalytics";
import NewPortfolio from "./pages/NewPortfolio";
import Browse from "./pages/Browse";
import Favorites from "./pages/Favorites";
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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/recap/:id" element={<PublicRecap />} />
            <Route path="/event/:subdomain" element={<PublicEvent />} />
            <Route path="/event/:eventId/speaker/:speakerId" element={<SpeakerMicrosite />} />
            <Route path="/session/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><NewEvent /></ProtectedRoute>} />
            <Route path="/events/:eventId/manage" element={<ProtectedRoute><EventManage /></ProtectedRoute>} />
            <Route path="/events/:eventId/speakers/approve" element={<ProtectedRoute><SpeakerApprovalDashboard /></ProtectedRoute>} />
            <Route path="/events/:eventId/analytics" element={<ProtectedRoute><EventAnalytics /></ProtectedRoute>} />
            <Route path="/portfolios" element={<ProtectedRoute><Portfolios /></ProtectedRoute>} />
            <Route path="/portfolio/new" element={<ProtectedRoute><NewPortfolio /></ProtectedRoute>} />
            <Route path="/portfolio/:portfolioId/analytics" element={<ProtectedRoute><PortfolioAnalytics /></ProtectedRoute>} />
            <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/test-audio" element={<TestAudio />} />
            <Route path="/category/conference" element={<ProtectedRoute><Conferences /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
