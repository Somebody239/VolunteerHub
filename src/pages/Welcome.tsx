import React, { useState } from "react";
import { SignInDialog } from "@/components/SignInDialog";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Welcome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  // Handle successful sign up
  const handleSignUp = (email: string) => {
    setAwaitingVerification(true);
    
    // Store email in localStorage to show in the verification screen
    try {
      localStorage.setItem('pendingVerificationEmail', email);
    } catch (e) {
      console.warn('Failed to store email in localStorage', e);
    }
  };

  // Verification screen overlay
  if (awaitingVerification && !user) {
    // Get the email from localStorage if available
    let pendingEmail = '';
    try {
      pendingEmail = localStorage.getItem('pendingVerificationEmail') || '';
    } catch (e) {
      console.warn('Failed to read email from localStorage', e);
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-xl text-center space-y-6 border border-border">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight">Check Your Email</h1>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              We've sent a verification link to <span className="font-medium text-foreground">{pendingEmail || 'your email'}</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              Please click the link in the email to verify your account and continue.
            </p>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setAwaitingVerification(false)}
                className="text-primary hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center space-y-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Volunteer Hub</h1>
        <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
          A trusted platform where students discover, apply for, and track volunteer opportunities. 
          Organizations can easily post, manage, and verify hours — building stronger communities together.
        </p>

        {/* Auth Buttons */}
        {!user ? (
          <div className="flex flex-col sm:flex-row gap-4">
            <SignInDialog role="student" triggerLabel="I'm a Student" onSignUp={handleSignUp} />
            <SignInDialog role="organization" triggerLabel="We're an Organization" onSignUp={handleSignUp} />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="flex-1" onClick={() => navigate("/onboarding/volunteer")}>I'm a Volunteer</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/onboarding/organization")}>We're an Organization</Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* Info Section */}
      <div className="bg-card border-t border-border py-12 px-6 grid md:grid-cols-3 gap-8 text-center">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">For Students</h3>
          <p className="text-sm text-muted-foreground">Find all volunteer opportunities in one place, get verified hours, and build your profile with gamified achievements.</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">For Organizations</h3>
          <p className="text-sm text-muted-foreground">Post and manage opportunities, screen applicants, and verify hours in just one click with built-in tools.</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">For Schools & Parents</h3>
          <p className="text-sm text-muted-foreground">Access clear logs, exportable reports, and safer, vetted volunteering opportunities for your students.</p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;