import React from "react";
import { SignInDialog } from "@/components/SignInDialog";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Welcome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="max-w-xl w-full glass-card p-6 md:p-8 rounded-xl space-y-4">
        <h1 className="text-2xl font-semibold">Welcome to VolunPath</h1>
        <p className="text-sm text-muted-foreground">
          Connect volunteers and organizations. Sign in to get started.
        </p>

        {!user ? (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <SignInDialog role="student" triggerLabel="I'm a Student" />
            <SignInDialog role="organization" triggerLabel="We're an Organization" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button className="flex-1" onClick={() => navigate("/onboarding/volunteer")}>I'm a Volunteer</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/onboarding/organization")}>We're an Organization</Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Welcome;
