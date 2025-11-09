import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, CheckCircle2, AlertCircle, User, Calendar, Briefcase } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ExternalApplicationsService } from "@/lib/externalApplicationsService";
import { supabase } from "@/lib/supabaseClient";

interface VerificationData {
  id: string;
  jobTitle: string;
  studentName: string;
  jobDate: string;
  studentHours: number;
  organization: string;
  status: 'pending' | 'verified' | 'rejected';
}

const Verification = () => {
  const { verificationId } = useParams<{ verificationId: string }>();
  const navigate = useNavigate();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [verifiedHours, setVerifiedHours] = useState<number>(0);
  const [showUpRate, setShowUpRate] = useState<number>(100);
  const [onTimeRate, setOnTimeRate] = useState<number>(100);
  const [starRating, setStarRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [supervisorName, setSupervisorName] = useState<string>('');
  const [supervisorEmail, setSupervisorEmail] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  const [applicationId, setApplicationId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  // Load verification data
  useEffect(() => {
    const loadVerificationData = async () => {
      if (!verificationId) {
        setLoading(false);
        return;
      }

      try {
        // Load application from database using verification ID (including user_id)
        const { data, error } = await supabase
          .from('external_applications')
          .select('*')
          .eq('verification_id', verificationId)
          .single();
        
        if (data) {
          setApplicationId(data.id);
          setUserId(data.user_id || '');
          
          setVerificationData({
            id: data.id,
            jobTitle: data.title,
            studentName: '', // This would need to come from user data
            jobDate: data.start_date || data.date_applied,
            studentHours: data.hours_worked,
            organization: data.organization,
            status: data.status === 'verify' ? 'pending' : data.status as any
          });
          setVerifiedHours(data.hours_worked);
        } else {
          toast({
            title: "Verification not found",
            description: "This verification link is invalid or has expired.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading verification data:', error);
        toast({
          title: "Error",
          description: "Failed to load verification data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadVerificationData();
  }, [verificationId]);

  const handleSubmit = async () => {
    if (!verificationData || !supervisorName.trim() || !supervisorEmail.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in supervisor name and email.",
        variant: "destructive"
      });
      return;
    }

    if (!verificationId || !userId || !applicationId) {
      toast({
        title: "Error",
        description: "Invalid verification ID or missing data.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // First, get the application details to check credited_xp and calculate awards
      const { data: appData } = await supabase
        .from('external_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (!appData) {
        throw new Error('Application not found');
      }

      const hasBeenCredited = appData.credited_xp;
      const xpReward = appData.xp_reward || 0;

      // Update the application in the database with verification results
      const success = await ExternalApplicationsService.updateApplicationByVerificationId(
        verificationId,
        {
          status: 'done',
          hours_worked: verifiedHours,
          notes: `Verified by ${supervisorName} (${supervisorEmail}): ${feedback}. Show-up: ${showUpRate}%, On-time: ${onTimeRate}%, Rating: ${starRating}/5. ${additionalNotes ? 'Additional notes: ' + additionalNotes : ''}`
        }
      );
      
      if (success) {
        // Only award XP and hours if not already credited
        if (!hasBeenCredited && userId) {
          // Award XP and log hours in the database
          try {
            // Get current gamification data
            const { data: gamData } = await supabase
              .from('gamification')
              .select('*')
              .eq('student_id', userId)
              .single();

            if (gamData) {
              const newHours = (gamData.hours_completed || 0) + verifiedHours;
              const xpFromHours = Math.round(verifiedHours * 10);
              const newBonusXp = (gamData.bonus_xp || 0) + xpFromHours + xpReward;
              const newStreak = (gamData.streak || 0) + 1;

              // Update gamification
              await supabase
                .from('gamification')
                .update({
                  hours_completed: newHours,
                  bonus_xp: newBonusXp,
                  streak: newStreak,
                  last_activity_at: new Date().toISOString()
                })
                .eq('student_id', userId);

              // Add to user progress history
              await supabase
                .from('user_progress_history')
                .insert({
                  user_id: userId,
                  title: appData.title,
                  organization: appData.organization,
                  hours_worked: verifiedHours,
                  date_worked: appData.start_date || appData.date_applied || new Date().toISOString().split('T')[0],
                  notes: `Verified by ${supervisorName}. Rated ${starRating}/5 stars.`
                });

              // Create notification in localStorage for the user
              const notificationRaw = localStorage.getItem('vp_notifications');
              const notifications = notificationRaw ? JSON.parse(notificationRaw) : [];
              const notification = {
                id: `verify_${Date.now()}`,
                type: 'verification_complete',
                title: 'Hours Verified!',
                message: `${appData.title} verified by ${supervisorName}. You earned ${verifiedHours}h and ${xpFromHours + xpReward} XP!`,
                timestamp: new Date().toISOString(),
                read: false,
                data: {
                  studentName: verificationData.studentName,
                  jobTitle: appData.title,
                  verifiedHours: verifiedHours,
                  awardedXp: xpFromHours + xpReward,
                  verifiedBy: supervisorName,
                  starRating,
                  showUpRate,
                  onTimeRate
                }
              };
              notifications.unshift(notification);
              localStorage.setItem('vp_notifications', JSON.stringify(notifications.slice(0, 50)));
              
              // Trigger notification update event
              window.dispatchEvent(new Event('notifications-updated'));
            }

            // Mark as credited
            await supabase
              .from('external_applications')
              .update({ credited_xp: true })
              .eq('id', applicationId);

          } catch (error) {
            console.error('Error awarding XP and hours:', error);
          }
        }

        toast({
          title: "Verification submitted successfully!",
          description: !hasBeenCredited ? "The student will receive their XP and hours automatically." : "Verification complete.",
        });
        
        // Redirect to success page or close
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error('Failed to update application');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Error",
        description: "Failed to submit verification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (!verificationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Verification Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This verification link is invalid or has expired.
              </p>
              <Button onClick={() => navigate('/')}>
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationData.status === 'verified') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Already Verified</h2>
              <p className="text-muted-foreground mb-4">
                This verification has already been completed.
              </p>
              <Button onClick={() => navigate('/')}>
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Volunteer Work Verification
            </CardTitle>
            <p className="text-muted-foreground">
              Please verify the volunteer work completed by the student below.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Student Work Details */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Work Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Student:</span>
                  <span>{verificationData.studentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Job:</span>
                  <span>{verificationData.jobTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>{verificationData.jobDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Hours Claimed:</span>
                  <Badge variant="secondary">{verificationData.studentHours}h</Badge>
                </div>
              </div>
            </div>

            {/* Verification Form */}
            <div className="space-y-4">
              <h3 className="font-semibold">Verification Details</h3>
              
              {/* Hours Verification */}
              <div className="space-y-2">
                <Label htmlFor="verified-hours">Verified Hours Worked</Label>
                <Input
                  id="verified-hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={verifiedHours}
                  onChange={(e) => setVerifiedHours(parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Confirm the actual hours worked by the student
                </p>
              </div>

              {/* Performance Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="show-up-rate">Show-up Rate (%)</Label>
                  <Input
                    id="show-up-rate"
                    type="number"
                    min="0"
                    max="100"
                    value={showUpRate}
                    onChange={(e) => setShowUpRate(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="on-time-rate">On-time Rate (%)</Label>
                  <Input
                    id="on-time-rate"
                    type="number"
                    min="0"
                    max="100"
                    value={onTimeRate}
                    onChange={(e) => setOnTimeRate(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Star Rating */}
              <div className="space-y-2">
                <Label>Overall Performance Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setStarRating(rating)}
                      className={`p-1 rounded ${
                        rating <= starRating
                          ? 'text-yellow-400'
                          : 'text-muted-foreground hover:text-yellow-300'
                      }`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rate the student's overall performance (1-5 stars)
                </p>
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback">Performance Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide specific feedback about the student's performance..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Supervisor Information */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold">Your Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supervisor-name">Your Name *</Label>
                    <Input
                      id="supervisor-name"
                      value={supervisorName}
                      onChange={(e) => setSupervisorName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor-email">Your Email *</Label>
                    <Input
                      id="supervisor-email"
                      type="email"
                      value={supervisorEmail}
                      onChange={(e) => setSupervisorEmail(e.target.value)}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="additional-notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="additional-notes"
                    placeholder="Any additional comments or notes..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !supervisorName.trim() || !supervisorEmail.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting ? 'Submitting...' : 'Submit Verification'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Verification;
