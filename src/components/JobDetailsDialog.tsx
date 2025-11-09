import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, Clock3, MapPin, Users, Tag, Share2, BookmarkPlus, CheckCircle2, Flag, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SavedOpportunitiesService } from "@/lib/savedOpportunitiesService";

export type JobDetails = {
  title: string;
  organization: string;
  date: string;
  location?: string;
  duration?: string;
  spots?: number;
  category: string;
  isUpcoming?: boolean;
  opportunityId?: string; // optional id to support apply actions
  applyUrl?: string;
  contactEmail?: string;
  applicationForm?: Array<{
    id: string;
    label: string;
    type: "short_text" | "long_text" | "select";
    required?: boolean;
    options?: string[];
  }>;
};

interface JobDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobDetails | null;
  onApply?: (opportunityId?: string, answers?: Record<string, any>) => Promise<void> | void;
  stars?: number;
  xp?: number;
  applied?: boolean;
  savedOpportunitiesService?: SavedOpportunitiesService | null;
  onSaveChange?: () => void;
}

export const JobDetailsDialog = ({ open, onOpenChange, job, onApply, stars, xp, applied, savedOpportunitiesService, onSaveChange }: JobDetailsDialogProps) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [saved, setSaved] = useState(false);
  const [appliedLocal, setAppliedLocal] = useState(false);
  
  const isRealId = !!job?.opportunityId && /[0-9a-fA-F-]{36}/.test(job?.opportunityId || '');

  // Check if opportunity is already saved when dialog opens
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!savedOpportunitiesService || !job?.opportunityId) return;
      
      const isSaved = await savedOpportunitiesService.isOpportunitySaved(job.opportunityId);
      setSaved(isSaved);
    };
    
    if (open) {
      checkIfSaved();
    }
  }, [open, savedOpportunitiesService, job?.opportunityId]);
  
  const [isAppliedFromStorage, setIsAppliedFromStorage] = useState(false);
  
  const isApplied = applied || appliedLocal || isAppliedFromStorage;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vp_saved');
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setSaved(!!(job?.opportunityId && arr.includes(job.opportunityId)));
    } catch {
      // Ignore localStorage errors
      setSaved(false);
    }
  }, [job?.opportunityId ?? '']);

  const checkAppliedStatus = useCallback(() => {
    if (!job) {
      setIsAppliedFromStorage(false);
      return;
    }
    
    try {
      // Check external applications store
      const raw = localStorage.getItem('my_external_applications');
      const list: Array<{ opportunity_id: string; title: string }> = raw ? JSON.parse(raw) : [];
      if (job.opportunityId && list.some((e) => e.opportunity_id === job.opportunityId)) {
        setIsAppliedFromStorage(true);
        return;
      }
      // Fallback: check by title
      setIsAppliedFromStorage(list.some((e) => e.title === job.title));
    } catch {
      setIsAppliedFromStorage(false);
    }
  }, [job?.opportunityId, job?.title]);

  useEffect(() => {
    checkAppliedStatus();
  }, [checkAppliedStatus]);

  // Listen for external application updates
  useEffect(() => {
    const handleExternalUpdate = () => {
      checkAppliedStatus();
    };

    window.addEventListener('external-updated', handleExternalUpdate);
    return () => window.removeEventListener('external-updated', handleExternalUpdate);
  }, [checkAppliedStatus]);

  // Refresh applied status when dialog opens or job changes
  useEffect(() => {
    if (open && job) {
      checkAppliedStatus();
      // Reset appliedLocal when job changes
      setAppliedLocal(false);
    } else if (!open) {
      // Reset appliedLocal when dialog closes
      setAppliedLocal(false);
    }
  }, [open, job, checkAppliedStatus]);

  // Always render the dialog, but control visibility with open prop
  if (!open) return null;
  
  // If no job is provided, show empty state
  if (!job) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-foreground">Job Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">No job selected</DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center text-muted-foreground">
            Please select a job to view details.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const apply = async () => {
    if (onApply) {
      const hasInternalForm = Array.isArray(job.applicationForm) && job.applicationForm.length > 0;
      
      // Validate required fields for internal applications
      if (!job.applyUrl) {
        // Check structured form fields
        if (hasInternalForm) {
          const missingRequired = job.applicationForm!.filter(q => {
            const key = q.id || q.label;
            return q.required && (!answers[key] || String(answers[key]).trim() === '');
          });
          
          if (missingRequired.length > 0) {
            toast({ 
              title: "Required fields missing", 
              description: `Please fill in: ${missingRequired.map(q => q.label).join(', ')}`,
              variant: "destructive" 
            });
            return;
          }
        } else {
          // Check fallback form fields
          if (!answers['interest'] || String(answers['interest']).trim() === '') {
            toast({ 
              title: "Required field missing", 
              description: "Please tell us why you're interested in this opportunity",
              variant: "destructive" 
            });
            return;
          }
        }
      }
      
      // Allow apply for external jobs (with applyUrl) even if not a UUID id, unless internal form exists
      const canApply = (!!job.applyUrl && !hasInternalForm) || isRealId;
      if (!canApply) {
        toast({ title: "Demo item only", description: "This is a sample opportunity. Create or select a real listing to apply.", variant: "destructive" });
        return;
      }
      await Promise.resolve(onApply(job.opportunityId, answers));
      setAppliedLocal(true);
      // Dispatch event to update other components
      window.dispatchEvent(new Event('external-updated'));
      if (job.applyUrl && !hasInternalForm) {
        try { window.open(job.applyUrl, '_blank', 'noopener,noreferrer'); } catch {
          // Ignore window.open errors (e.g., popup blocked)
        }
      }
    } else {
      toast({ title: "Application started", description: `We'll guide you through applying to ${job.title}.` });
    }
    onOpenChange(false);
  };

  const save = () => toast({ title: "Saved", description: "Added to your saved opportunities." });
  const share = () => {
    navigator.clipboard?.writeText(`${location.origin}/jobs#${encodeURIComponent(job.title)}`).catch(() => {});
    toast({ title: "Link copied", description: "Share this opportunity with your friends." });
  };

  const report = async () => {
    try {
      const reason = window.prompt("Report this listing. What is the issue? (e.g., closed, broken link, inappropriate)")?.trim();
      if (!reason) return;
      if (job.opportunityId) {
        await supabase.from('reports').insert({ opportunity_id: job.opportunityId, reason }).throwOnError();
      }
      // Notify via email: if external (no organizer), email admin; otherwise prefer contactEmail
      let targetEmail = job.contactEmail || '';
      if (!targetEmail && job.opportunityId) {
        const { data } = await supabase.from('opportunities').select('organizer_id').eq('id', job.opportunityId).maybeSingle();
        if (!data || !data.organizer_id) {
          targetEmail = 'joshi_kishan@icloud.com';
        }
      }
      if (!targetEmail) targetEmail = 'joshi_kishan@icloud.com';
      const subject = encodeURIComponent(`Report: ${job.title}`);
      const body = encodeURIComponent(`Listing: ${job.title}\nOrganization: ${job.organization}\nLink: ${job.applyUrl || location.href}\nReason: ${reason}`);
      window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');
      toast({ title: 'Reported', description: 'Thanks for the feedback.' });
    } catch (e: any) {
      toast({ title: 'Could not report', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-foreground">{job.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{job.organization}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
          {(typeof stars === 'number' || typeof xp === 'number') && (
            <div className="flex items-center gap-3">
              {typeof stars === 'number' && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < Math.max(0, Math.min(5, stars || 0)) ? 'text-yellow-500' : 'text-muted-foreground'} />
                  ))}
                </div>
              )}
              {typeof xp === 'number' && (
                <span className="text-sm font-medium text-green-600">+{xp} XP</span>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Calendar size={14} /><span>{job.date}</span></div>
            {job.location && <div className="flex items-center gap-2"><MapPin size={14} /><span>{job.location}</span></div>}
            {job.duration && <div className="flex items-center gap-2"><Clock3 size={14} /><span>{job.duration}</span></div>}
            {typeof job.spots === 'number' && <div className="flex items-center gap-2"><Users size={14} /><span>{job.spots} spots</span></div>}
            {!!((job as any).min_age || (job as any).max_age) && (
              <div className="flex items-center gap-2">
                <span>Age</span>
                <span>
                  {(job as any).min_age ?? 0}
                  {" - "}
                  {(job as any).max_age ?? 120}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-muted/50 text-muted-foreground text-xs rounded-full inline-flex items-center gap-1">
              <Tag size={12} /> {job.category}
            </span>
            {job.isUpcoming && (
              <span className="px-2 py-0.5 bg-status-pending/20 text-status-pending text-xs rounded-full inline-flex items-center gap-1">
                <CheckCircle2 size={12} /> Upcoming
              </span>
            )}
          </div>

          <div className="grid gap-2 text-sm">
            <p className="text-foreground font-medium">What you'll do</p>
            <p className="text-muted-foreground">Assist organizers, coordinate attendees, and help create a great experience for participants. Light setup and support during the event.</p>
          </div>

          <div className="grid gap-2 text-sm">
            <p className="text-foreground font-medium">Requirements</p>
            <ul className="text-muted-foreground list-disc pl-5 space-y-1">
              <li>Comfortable working with people</li>
              <li>Arrive 10 minutes early</li>
              <li>Follow organizer instructions</li>
            </ul>
          </div>

          {!job.applyUrl && (
            <div className="grid gap-3 text-sm">
              <p className="text-foreground font-medium">Application Questions</p>
              {Array.isArray(job.applicationForm) && job.applicationForm.length > 0 ? (
                job.applicationForm.map((q) => {
                  const key = q.id || q.label;
                  if (q.type === "short_text") {
                    return (
                      <div key={key} className="grid gap-1">
                        <label className="text-xs text-muted-foreground">
                          {q.label} {q.required ? "*" : ""}
                        </label>
                        <input
                          className="rounded-md border border-input bg-background text-foreground text-sm p-2"
                          value={answers[key] ?? ""}
                          onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))}
                          required={!!q.required}
                        />
                      </div>
                    );
                  }
                  if (q.type === "long_text") {
                    return (
                      <div key={key} className="grid gap-1">
                        <label className="text-xs text-muted-foreground">
                          {q.label} {q.required ? "*" : ""}
                        </label>
                        <textarea
                          className="min-h-[90px] rounded-md border border-input bg-background text-foreground text-sm p-2"
                          value={answers[key] ?? ""}
                          onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))}
                          required={!!q.required}
                        />
                      </div>
                    );
                  }
                  if (q.type === "select") {
                    return (
                      <div key={key} className="grid gap-1">
                        <label className="text-xs text-muted-foreground">
                          {q.label} {q.required ? "*" : ""}
                        </label>
                        <select
                          className="rounded-md border border-input bg-background text-foreground text-sm p-2"
                          value={answers[key] ?? ""}
                          onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))}
                          required={!!q.required}
                        >
                          <option value="" disabled>
                            Select...
                          </option>
                          {(q.options ?? []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                // Fallback: Quick Application form when no structured form exists
                <>
                  <div className="grid gap-1">
                    <label className="text-xs text-muted-foreground">
                      Why are you interested in this opportunity? *
                    </label>
                    <textarea
                      className="min-h-[90px] rounded-md border border-input bg-background text-foreground text-sm p-2"
                      value={answers['interest'] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, interest: e.target.value }))}
                      required
                      placeholder="Tell us why you'd like to volunteer..."
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs text-muted-foreground">
                      Relevant experience or skills (optional)
                    </label>
                    <textarea
                      className="min-h-[70px] rounded-md border border-input bg-background text-foreground text-sm p-2"
                      value={answers['experience'] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, experience: e.target.value }))}
                      placeholder="Any relevant experience..."
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-full hover:bg-muted/50"
                aria-label="Save"
                onClick={async () => {
                  if (!savedOpportunitiesService || !job?.opportunityId) return;
                  
                  try {
                    const success = await savedOpportunitiesService.saveOpportunity({
                      opportunity_id: job.opportunityId,
                      title: job.title,
                      organization: job.organization,
                      date: job.date,
                      location: job.location,
                      category: job.category,
                      external_url: job.applyUrl,
                      contact_email: job.contactEmail,
                    });
                    
                    if (success) {
                      toast({ title: "Saved", description: "Added to your saved opportunities." });
                      setSaved(true);
                      onSaveChange?.(); // Notify parent to refresh saved opportunities
                    } else {
                      toast({ title: "Error", description: "Failed to save opportunity.", variant: "destructive" });
                    }
                  } catch (error) {
                    console.error('Error saving opportunity:', error);
                    toast({ title: "Error", description: "Failed to save opportunity.", variant: "destructive" });
                  }
                }}
              >
                <BookmarkPlus size={16} className={saved ? 'text-primary' : ''} />
              </button>
              <button className="p-2 rounded-full hover:bg-muted/50" aria-label="Share" onClick={share}><Share2 size={16} /></button>
              <button className="p-2 rounded-full hover:bg-muted/50" aria-label="Report" onClick={report}><Flag size={16} /></button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={apply}
                disabled={isApplied === true || (!job.applyUrl && !isRealId)}
                className={`px-4 py-2 rounded-full ${isApplied ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
              >
                {isApplied ? 'Applied' : 'Apply'}
              </button>
              {job.applyUrl && (
                <a href={job.applyUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full border border-border hover:bg-muted/40 text-foreground">Company site</a>
              )}
            </div>
          </div>

          {job.contactEmail && (
            <div className="text-xs text-muted-foreground">For questions: <a className="underline" href={`mailto:${job.contactEmail}`}>{job.contactEmail}</a></div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
