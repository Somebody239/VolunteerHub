import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Confirmed = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-status-confirmed/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="text-status-confirmed" size={22} />
        </div>
        <h1 className="text-xl font-semibold mb-1">Email confirmed</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your email has been verified. You can proceed to sign in or continue to onboarding.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate("/welcome")}>Go to welcome</Button>
          <Button onClick={() => navigate("/")}>Continue</Button>
        </div>
      </div>
    </div>
  );
};

export default Confirmed;
