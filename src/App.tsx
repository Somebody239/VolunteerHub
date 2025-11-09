import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { UserProvider } from "@/context/UserContext";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import Welcome from "./pages/Welcome";
import OnboardingVolunteer from "./pages/OnboardingVolunteer";
import OnboardingOrganization from "./pages/OnboardingOrganization";
import { RequireAuth } from "./components/RequireAuth";
import { AuthBootstrap } from "./components/AuthBootstrap";
import OrgPortal from "./pages/OrgPortal";
import OrgProfile from "./pages/OrgProfile";
import OrgJobs from "./pages/OrgJobs";
import ResetPassword from "./pages/ResetPassword";
import { RequireOrganizer } from "./components/RequireOrganizer";
import { RequireStudent } from "./components/RequireStudent";
import Confirmed from "./pages/Confirmed";
import AuthCallback from "./pages/auth/callback";
import Verification from "./pages/Verification";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
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
                  <Route path="/" element={<Landing />} />
                  <Route path="/welcome" element={<Welcome />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/confirmed" element={<Confirmed />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/verify/:verificationId" element={<Verification />} />
                  <Route path="/onboarding/volunteer" element={<RequireAuth><OnboardingVolunteer /></RequireAuth>} />
                  <Route path="/onboarding/organization" element={<RequireAuth><OnboardingOrganization /></RequireAuth>} />

                  {/* Protected */}
                  <Route path="/dashboard" element={<ErrorBoundary><RequireAuth><Index /></RequireAuth></ErrorBoundary>} />
                  <Route path="/jobs" element={<ErrorBoundary><RequireAuth><RequireStudent><Jobs /></RequireStudent></RequireAuth></ErrorBoundary>} />
                  <Route path="/profile" element={<ErrorBoundary><RequireAuth><RequireStudent><Profile /></RequireStudent></RequireAuth></ErrorBoundary>} />
                  <Route path="/org" element={<ErrorBoundary><RequireAuth><RequireOrganizer><OrgPortal /></RequireOrganizer></RequireAuth></ErrorBoundary>} />
                  <Route path="/org/profile" element={<ErrorBoundary><RequireAuth><RequireOrganizer><OrgProfile /></RequireOrganizer></RequireAuth></ErrorBoundary>} />
                  <Route path="/org/jobs" element={<ErrorBoundary><RequireAuth><RequireOrganizer><OrgJobs /></RequireOrganizer></RequireAuth></ErrorBoundary>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </UserProvider>
          </NotificationsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
