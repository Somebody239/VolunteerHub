import { supabase } from "./supabaseClient";

export const signUpWithPassword = async (
  email: string,
  password: string,
  metadata?: Record<string, any>
) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        ...metadata,
        email_verified: false,
      },
    },
  });
};

export const signInWithPassword = async (
  email: string,
  password: string
) => {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signInWithOtp = async (
  email: string,
  metadata?: Record<string, any>
) => {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
      data: metadata,
    },
  });
};
