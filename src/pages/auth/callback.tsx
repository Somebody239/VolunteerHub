import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const [message, setMessage] = useState('Verifying your email...');
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          setMessage('Email verified successfully!');
          setIsVerified(true);
          
          // Create user_onboarding record if it doesn't exist (RLS should allow this after email confirmation)
          const userRole = session.user.user_metadata?.role || 'student';
          try {
            const { OnboardingService } = await import('@/lib/onboardingService');
            const onboardingService = new OnboardingService(session.user.id);
            const existingStatus = await onboardingService.getOnboardingStatus();
            if (!existingStatus) {
              await onboardingService.createOnboardingStatus({
                intended_role: userRole === 'organization' ? 'organization' : 'student',
                onboarding_completed: false,
                onboarding_skipped: false,
              });
            }
          } catch (error) {
            // Non-critical - onboarding record creation can fail, will be created during onboarding flow
            console.warn('Could not create onboarding record after email confirmation:', error);
          }
          
          // Redirect to the appropriate onboarding page based on user role
          setTimeout(() => {
            navigate(`/onboarding/${userRole === 'organization' ? 'organization' : 'volunteer'}`);
          }, 2000);
        } else {
          setMessage('No active session found. Please try signing in again.');
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setMessage('There was an error verifying your email. Please try again.');
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-bold">
          {isVerified ? 'Email Verified!' : 'Verifying...'}
        </h1>
        <p className="text-muted-foreground">{message}</p>
        {!isVerified && (
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
          </div>
        )}
        {!isVerified && (
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mt-4"
          >
            Back to Home
          </Button>
        )}
      </div>
    </div>
  );
}
