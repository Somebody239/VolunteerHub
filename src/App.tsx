import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { UserProvider } from "./context/UserContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import Welcome from "./pages/Welcome";
import OnboardingVolunteer from "./pages/OnboardingVolunteer";
import OnboardingOrganization from "./pages/OnboardingOrganization";
import { RequireAuth } from "./components/RequireAuth";
import { AuthBootstrap } from "./components/AuthBootstrap";
import OrgPortal from "./pages/OrgPortal";
import ResetPassword from "./pages/ResetPassword";
import { RequireOrganizer } from "./components/RequireOrganizer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <NotificationsProvider>
        <UserProvider>
          <BrowserRouter>
            <AuthBootstrap />
            <Routes>
              {/* Public */}
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding/volunteer" element={<RequireAuth><OnboardingVolunteer /></RequireAuth>} />
              <Route path="/onboarding/organization" element={<RequireAuth><OnboardingOrganization /></RequireAuth>} />

              {/* Protected */}
              <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
              <Route path="/jobs" element={<RequireAuth><Jobs /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/org" element={<RequireAuth><RequireOrganizer><OrgPortal /></RequireOrganizer></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </UserProvider>
        </NotificationsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
