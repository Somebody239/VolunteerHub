import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

type Props = {
  role?: "student" | "organization";
  triggerLabel?: string;
};

export const SignInDialog: React.FC<Props> = ({ role, triggerLabel = "Sign In" }) => {
  const { signInWithOtp, signInWithPassword, signUpWithPassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    if (role) {
      try {
        localStorage.setItem("intendedRole", role);
      } catch {}
    }
    let error: Error | null = null;
    if (usePassword) {
      if (!password) {
        toast({ title: "Missing password", description: "Please enter a password.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (mode === "signup") {
        ({ error } = await signUpWithPassword(email, password));
      } else {
        ({ error } = await signInWithPassword(email, password));
      }
    } else {
      ({ error } = await signInWithOtp(email));
    }
    setLoading(false);
    if (error) {
      const msg = (error as any)?.message ?? String(error);
      // Heuristic: if email not confirmed, prompt to resend
      if (msg.toLowerCase().includes("confirm") || msg.toLowerCase().includes("not confirmed")) {
        setNeedsConfirm(email);
        toast({ title: "Confirm your email", description: "We can resend a confirmation link.", variant: "destructive" });
      } else {
        toast({ title: "Auth failed", description: msg, variant: "destructive" });
      }
      return;
    }
    if (usePassword) {
      toast({ title: mode === "signup" ? "Account created" : "Signed in" });
    } else {
      toast({ title: "Check your inbox", description: "We've sent you a magic link to sign in." });
    }
    setOpen(false);
  };

  const resendConfirmation = async () => {
    if (!needsConfirm) return;
    setLoading(true);
    try {
      // Supabase v2 resend
      // @ts-ignore - resend exists in supabase-js v2
      const { error } = await (supabase as any).auth.resend({
        type: "signup",
        email: needsConfirm,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast({ title: "Confirmation email resent", description: `Sent to ${needsConfirm}` });
    } catch (e: any) {
      toast({ title: "Could not resend", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      toast({ title: "Enter email first", description: "Provide your email to receive a reset link.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      toast({ title: "Reset link sent", description: `Check ${email}` });
    } catch (e: any) {
      toast({ title: "Could not send reset link", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="px-3">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            {role === "organization" ? "Sign in to manage your organization." : role === "student" ? "Sign in to volunteer and track hours." : "Enter your email to receive a magic link."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {usePassword && (
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => setUsePassword((v) => !v)}>
              {usePassword ? "Use magic link instead" : "Use email + password"}
            </button>
            {usePassword && (
              <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}>
                {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
              </button>
            )}
          </div>
          {needsConfirm && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Email not confirmed</span>
              <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={resendConfirmation} disabled={loading}>
                Resend confirmation
              </button>
            </div>
          )}
          {usePassword && (
            <div className="flex items-center justify-end text-xs">
              <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={resetPassword} disabled={loading}>
                Forgot password?
              </button>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (usePassword ? (mode === "signup" ? "Creating..." : "Signing in...") : "Sending...") : usePassword ? (mode === "signup" ? "Create account" : "Sign in") : "Send magic link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
