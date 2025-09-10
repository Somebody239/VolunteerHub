import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, Clock3, MapPin, Users, Tag, Share2, BookmarkPlus, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

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
};

interface JobDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobDetails | null;
  onApply?: (opportunityId?: string, answers?: Record<string, any>) => Promise<void> | void;
}

export const JobDetailsDialog = ({ open, onOpenChange, job, onApply }: JobDetailsDialogProps) => {
  if (!job) return null;

  const [answers, setAnswers] = useState<{ why?: string; experience?: string }>({});
  const isRealId = !!job.opportunityId && /[0-9a-fA-F-]{36}/.test(job.opportunityId);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vp_saved');
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setSaved(!!(job.opportunityId && arr.includes(job.opportunityId)));
    } catch {
      setSaved(false);
    }
  }, [job?.opportunityId]);

  const apply = async () => {
    if (onApply) {
      if (!isRealId) {
        toast({ title: "Demo item only", description: "This is a sample opportunity. Create or select a real listing to apply.", variant: "destructive" });
        return;
      }
      await Promise.resolve(onApply(job.opportunityId, answers));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">{job.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{job.organization}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 max-h-[70vh] overflow-auto pr-1">
          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Calendar size={14} /><span>{job.date}</span></div>
            {job.location && <div className="flex items-center gap-2"><MapPin size={14} /><span>{job.location}</span></div>}
            {job.duration && <div className="flex items-center gap-2"><Clock3 size={14} /><span>{job.duration}</span></div>}
            {typeof job.spots === 'number' && <div className="flex items-center gap-2"><Users size={14} /><span>{job.spots} spots</span></div>}
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

          <div className="grid gap-2 text-sm">
            <p className="text-foreground font-medium">Quick Application</p>
            <label className="text-xs text-muted-foreground">Why are you interested?</label>
            <textarea
              className="min-h-[70px] rounded-md border border-input bg-background text-foreground text-sm p-2"
              placeholder="A sentence or two..."
              value={answers.why ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, why: e.target.value }))}
            />
            <label className="text-xs text-muted-foreground">Relevant experience (optional)</label>
            <textarea
              className="min-h-[70px] rounded-md border border-input bg-background text-foreground text-sm p-2"
              placeholder="e.g., helped at a library event last month"
              value={answers.experience ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, experience: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-full hover:bg-muted/50"
                aria-label="Save"
                onClick={() => {
                  try {
                    // store ids
                    const raw = localStorage.getItem('vp_saved');
                    const arr: string[] = raw ? JSON.parse(raw) : [];
                    if (job.opportunityId && !arr.includes(job.opportunityId)) arr.unshift(job.opportunityId);
                    localStorage.setItem('vp_saved', JSON.stringify(arr.slice(0, 200)));
                    // also store light-weight items to render even if DB is empty
                    const itemsRaw = localStorage.getItem('vp_saved_items');
                    const items: any[] = itemsRaw ? JSON.parse(itemsRaw) : [];
                    const lite = { id: job.opportunityId ?? `lite-${Date.now()}`, title: job.title, organization: job.organization, date: job.date, location: job.location, category: job.category };
                    const dedup = [lite, ...items.filter((it) => it.id !== lite.id)].slice(0, 200);
                    localStorage.setItem('vp_saved_items', JSON.stringify(dedup));
                    toast({ title: "Saved", description: "Added to your saved opportunities." });
                    setSaved(true);
                  } catch {
                    save();
                  }
                }}
              >
                <BookmarkPlus size={16} className={saved ? 'text-primary' : ''} />
              </button>
              <button className="p-2 rounded-full hover:bg-muted/50" aria-label="Share" onClick={share}><Share2 size={16} /></button>
            </div>
            <button onClick={apply} disabled={!isRealId} className={`px-4 py-2 rounded-full ${isRealId ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>{isRealId ? 'Apply' : 'Apply (demo disabled)'}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
