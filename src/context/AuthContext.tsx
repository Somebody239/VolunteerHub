import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, type Session, type User } from "@/lib/supabaseClient";
import { OnboardingService } from "@/lib/onboardingService";

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  // Basic auth helpers. We can extend as needed (OAuth, OTP, etc.).
  signInWithOtp: (email: string, opts?: { role?: 'student' | 'organization' }) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string, opts?: { role?: 'student' | 'organization' }) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string, opts?: { role?: 'student' | 'organization' }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        // eslint-disable-next-line no-console
        console.warn("supabase.auth.getSession error", error);
      }
      if (!mounted) return;
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session ?? null);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      signInWithOtp: async (email: string, opts?: { role?: 'student' | 'organization' }) => {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}?${opts?.role ? `role=${encodeURIComponent(opts.role)}` : ''}`.replace(/\?$/,'') : undefined,
          },
        });
        return { error: error as unknown as Error | null };
      },
  signUpWithPassword: async (email: string, password: string, opts?: { role?: 'student' | 'organization' }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}?${opts?.role ? `role=${encodeURIComponent(opts.role)}` : ''}`.replace(/\?$/,'') : undefined,
            data: opts?.role ? { intendedRole: opts.role } : undefined,
          },
        });
        
        // Store intended role in database if user was created successfully
        if (!error && data.user && opts?.role) {
          try {
            const onboardingService = new OnboardingService(data.user.id);
            await onboardingService.createOnboardingStatus({
              intended_role: opts.role,
              onboarding_completed: false,
              onboarding_skipped: false,
              tags: [], // onboarding tags placeholder
              preferred_location: undefined,
              min_age: undefined,
              max_distance_km: undefined,
              max_age: undefined
            });
          } catch (onboardingError) {
            console.error('Error storing intended role:', onboardingError);
          }
        }
        
        return { error: error as unknown as Error | null };
      },
      signInWithPassword: async (email: string, password: string, _opts?: { role?: 'student' | 'organization' }) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error as unknown as Error | null };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error: error as unknown as Error | null };
      },
    }),
    [session, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
