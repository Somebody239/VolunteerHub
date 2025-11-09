import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { OnboardingService } from "@/lib/onboardingService";

// Listens to auth state and routes users to onboarding if needed.
export const AuthBootstrap = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const go = async () => {
      if (!user) return; // RequireAuth handles redirecting to /welcome

      // Only perform bootstrap on welcome or root landings
      const path = location.pathname;
      const urlIntendedRole = (() => {
        try {
          const url = new URL(window.location.href);
          const r = url.searchParams.get('role');
          if (r === 'organization' || r === 'student') return r as 'organization' | 'student';
          return null;
        } catch { return null; }
      })();
      // Get intended role from URL, database, or user metadata (gracefully handle errors)
      let intendedRole = urlIntendedRole;
      if (!intendedRole && user) {
        try {
          intendedRole = await new OnboardingService(user.id).getIntendedRole();
        } catch (error) {
          console.warn('Could not fetch onboarding status, trying user metadata');
        }
        // Fallback to user_metadata.role if database doesn't have it yet
        if (!intendedRole && user.user_metadata?.role) {
          const roleFromMetadata = user.user_metadata.role;
          if (roleFromMetadata === 'organization' || roleFromMetadata === 'student') {
            intendedRole = roleFromMetadata as 'organization' | 'student';
          }
        }
      }

      // Check if onboarding should be skipped from database (gracefully handle errors)
      let skipOnboarding = false;
      if (user) {
        try {
          skipOnboarding = await new OnboardingService(user.id).shouldSkipOnboarding();
        } catch (error) {
          console.warn('Could not check onboarding skip status');
        }
      }

      // Handle supabase auth link types via URL hash params
      try {
        const sp = new URLSearchParams(location.hash.replace(/^#/, ""));
        const type = sp.get("type");
        const email = sp.get("email");
        // Debug logs
        // eslint-disable-next-line no-console
        
        if (type === "recovery") {
          navigate(`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ""}` , { replace: true });
          return;
        }
        if (type === "signup") {
          navigate("/confirmed", { replace: true });
          return;
        }
      } catch {
        // Ignore URL parsing errors for hash params
      }

      // Helper to check if profile/org exists
      const checkHas = async () => {
        if (intendedRole === "organization") {
          const { data, error } = await supabase
            .from("organizations")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();
          if (error) return { org: false };
          return { org: !!data };
        }
        // default to student
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        if (error) return { profile: false };
        return { profile: !!data };
      };

      // Redirect logic: trigger from /welcome after fresh auth
      if (path === "/welcome") {
        // eslint-disable-next-line no-console
        
        const has = await checkHas();
        if (intendedRole === "organization") {
          if (!("org" in has) || !has.org) {
            // eslint-disable-next-line no-console
            
            navigate("/onboarding/organization", { replace: true });
            return;
          }
        } else {
          if (!("profile" in has) || !has.profile) {
            // eslint-disable-next-line no-console
            
            navigate("/onboarding/volunteer", { replace: true });
            return;
          }
        }
        // If record exists and we're on /welcome, go to dashboard
        if (path === "/welcome") navigate("/dashboard", { replace: true });
      }
    };

    void go();
  }, [user, loading, location.pathname, location.hash, navigate]);

  return null;
};
