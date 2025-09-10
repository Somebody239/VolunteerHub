import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

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
      const intendedRole = (() => {
        try {
          return localStorage.getItem("intendedRole") as "student" | "organization" | null;
        } catch {
          return null;
        }
      })();

      const skipOnboarding = (() => {
        try {
          return localStorage.getItem("skipOnboarding") === "1";
        } catch {
          return false;
        }
      })();

      // Handle password recovery links: Supabase sends access_token with type=recovery
      try {
        const sp = new URLSearchParams(location.hash.replace(/^#/, ""));
        const type = sp.get("type");
        const email = sp.get("email");
        if (type === "recovery") {
          navigate(`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ""}` , { replace: true });
          return;
        }
      } catch {}

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

      // Redirect logic: only trigger from /welcome to avoid loops on "/"
      if (path === "/welcome") {
        if (skipOnboarding) {
          navigate("/", { replace: true });
          return;
        }
        const has = await checkHas();
        if (intendedRole === "organization") {
          if (!("org" in has) || !has.org) {
            navigate("/onboarding/organization", { replace: true });
            return;
          }
        } else {
          if (!("profile" in has) || !has.profile) {
            navigate("/onboarding/volunteer", { replace: true });
            return;
          }
        }
        // If profile exists, go home
        navigate("/", { replace: true });
      }
    };

    void go();
  }, [user, loading, location.pathname, navigate]);

  return null;
};
