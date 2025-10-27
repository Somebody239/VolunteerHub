import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { signUpWithPassword, signInWithPassword } from "@/lib/auth.ts";
import { OnboardingService } from "@/lib/onboardingService";

type Props = {
  role?: "student" | "organization";
  triggerLabel?: string;
  onSignUp?: (email: string) => void; // tells parent to show "verify email"
};

export const SignInDialog: React.FC<Props> = ({
  role,
  triggerLabel = "Sign In",
  onSignUp,
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const onOpenChange = async (v: boolean) => {
    setOpen(v);
    if (v && role) {
      // Store intended role in database when user signs up
      // This will be handled by the auth context when the user is created
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing info",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await signUpWithPassword(email, password, {
          role: role ?? "student",
          full_name: email.split('@')[0], // Default username from email
        });

        if (error) throw error;

        // Check if email confirmation is required
        if (data.user?.identities?.length === 0) {
          // User might already exist
          throw new Error('This email is already registered. Please sign in instead.');
        }

        // If we get here, signup was successful
        toast({
          title: "Check your email",
          description: "We've sent a verification link to your email. Please verify your email to continue.",
        });
        
        // Notify parent component about successful signup
        if (onSignUp) onSignUp(email);
        
        // Reset form and close dialog
        setEmail('');
        setPassword('');
        setMode('signin');
        setOpen(false);
      } else {
        // Sign in flow
        const { error } = await signInWithPassword(email, password);
        
        if (error) throw error;
        
        toast({ 
          title: "Welcome back!", 
          description: "You've been successfully signed in." 
        });
        setOpen(false);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle specific error cases
      let errorMessage = error.message || 'An unexpected error occurred';
      
      if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before signing in. Check your inbox for the verification link.';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message.includes('already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      }
      
      toast({
        title: "Authentication failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="px-3">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "signup" ? "Create account" : "Sign in"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signup"
              ? "Enter your email and password to create your account. You'll need to verify your email before you can log in."
              : "Enter your email and password to sign in."}
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
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={() =>
                setMode((m) => (m === "signin" ? "signup" : "signin"))
              }
            >
              {mode === "signin"
                ? "Need an account? Sign up"
                : "Have an account? Sign in"}
            </button>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading
                ? mode === "signup"
                  ? "Creating..."
                  : "Signing in..."
                : mode === "signup"
                ? "Create account"
                : "Sign in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
