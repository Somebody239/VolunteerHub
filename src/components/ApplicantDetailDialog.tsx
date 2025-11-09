import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Mail, Clock3, Star, ShieldCheck, ClipboardList, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OpportunityQuestion, OpportunityResponse, ApplicationAnswers } from "@/types/opportunities";

export type ApplicantProfile = {
  id: string;
  full_name?: string | null;
  location?: string | null;
  availability?: string | null;
  total_hours?: number | null;
  on_time_rate?: number | null;
  show_up_rate?: number | null;
  contact_email?: string | null;
};

export type ApplicantApplication = {
  opportunityTitle?: string;
  status?: string;
  created_at?: string | null;
  answers?: ApplicationAnswers;
  claimed_hours?: number | null;
  verified_hours?: number | null;
  verification_notes?: string | null;
  verified_at?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile?: ApplicantProfile | null;
  application?: ApplicantApplication | null;
  questions?: OpportunityQuestion[];
};

export const ApplicantDetailDialog: React.FC<Props> = ({ open, onOpenChange, profile, application, questions }) => {
  if (!profile) return null;
  const hours = typeof profile.total_hours === 'number' ? profile.total_hours : 0;
  const onTime = typeof profile.on_time_rate === 'number' ? profile.on_time_rate : 0;
  const showUp = typeof profile.show_up_rate === 'number' ? profile.show_up_rate : 0;
  const isNew = hours <= 0;

  const responses = useMemo<OpportunityResponse[]>(() => {
    if (!application?.answers) return [];
    const payload = application.answers;
    if ((payload as any)?.version === 2) {
      const modern = payload as Extract<ApplicationAnswers, { version: 2 }>;
      return modern.responses ?? [];
    }
    const legacy = payload as Record<string, any>;
    const result: OpportunityResponse[] = [];
    if (legacy.why) result.push({ prompt: "Why are you interested in this opportunity?", answer: legacy.why });
    if (legacy.experience) result.push({ prompt: "Relevant experience", answer: legacy.experience });
    Object.entries(legacy)
      .filter(([key]) => key !== "why" && key !== "experience")
      .forEach(([key, value]) => {
        if (typeof value === "string" && value.trim().length > 0) {
          result.push({ prompt: key.replace(/_/g, " "), answer: value });
        }
      });
    return result;
  }, [application?.answers]);

  const questionMap = useMemo(() => {
    if (!questions) return new Map<string | undefined, OpportunityQuestion>();
    return new Map(questions.map((q) => [q.id, q]));
  }, [questions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{profile.full_name || 'Student'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          {application?.opportunityTitle && (
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Applied to</div>
          )}
          {application?.opportunityTitle && (
            <div className="font-medium text-foreground">{application.opportunityTitle}</div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock size={14} />
            <span>
              Applied {application?.created_at ? new Date(application.created_at).toLocaleString() : "—"}
            </span>
            {application?.status && <Badge variant="outline" className="ml-auto capitalize">{application.status}</Badge>}
          </div>
          {profile.location && (
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin size={14} /><span>{profile.location}</span></div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card p-3">
              <div className="flex items-center gap-2"><Clock3 size={14} /><span className="font-medium">{hours}</span></div>
              <div className="text-xs text-muted-foreground mt-1">Total Hours</div>
            </div>
            <div className="glass-card p-3">
              <div className="flex items-center gap-2"><Star size={14} /><span className="font-medium">{onTime}%</span></div>
              <div className="text-xs text-muted-foreground mt-1">On-Time</div>
            </div>
            <div className="glass-card p-3">
              <div className="flex items-center gap-2"><ShieldCheck size={14} /><span className="font-medium">{showUp}%</span></div>
              <div className="text-xs text-muted-foreground mt-1">Show-Up</div>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Availability</div>
            <div className="text-foreground/90 whitespace-pre-wrap min-h-[40px]">{profile.availability || '—'}</div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail size={14} />
            <span>{profile.contact_email || 'Contact not available'}</span>
          </div>
          {isNew && <div className="text-xs text-muted-foreground">This applicant is new.</div>}

          {(responses.length > 0 || (questions?.length ?? 0) > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList size={14} />
                Application responses
              </div>
              <div className="space-y-3 rounded-lg border border-border/60 p-3 bg-muted/30">
                {questions?.map((q) => {
                  const response = responses.find((r) => r.question_id === q.id);
                  const answerText = response?.answer ?? responses.find((r) => r.prompt === q.prompt)?.answer;
                  return (
                    <div key={q.id ?? q.prompt} className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{q.prompt}</div>
                      <div className="text-sm text-foreground whitespace-pre-wrap">
                        {renderAnswer(answerText) ?? <span className="text-muted-foreground/80">No response</span>}
                      </div>
                    </div>
                  );
                })}
                {responses
                  .filter((resp) => !resp.question_id || !questionMap.has(resp.question_id))
                  .map((resp, idx) => (
                    <div key={`legacy-${idx}`} className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {resp.prompt ?? "Response"}
                      </div>
                      <div className="text-sm text-foreground whitespace-pre-wrap">{renderAnswer(resp.answer)}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {(typeof application?.claimed_hours === "number" ||
            typeof application?.verified_hours === "number" ||
            application?.verification_notes) && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Hours & verification</div>
              <div className="glass-card p-3 space-y-2 text-sm">
                {typeof application?.claimed_hours === "number" && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Claimed</span>
                    <span className="font-medium text-foreground">{application.claimed_hours}h</span>
                  </div>
                )}
                {typeof application?.verified_hours === "number" && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Verified</span>
                    <span className="font-medium text-foreground">{application.verified_hours}h</span>
                  </div>
                )}
                {application?.verified_at && (
                  <div className="text-xs text-muted-foreground">
                    Verified {new Date(application.verified_at).toLocaleString()}
                  </div>
                )}
                {application?.verification_notes && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Notes</div>
                    <div className="text-sm text-foreground whitespace-pre-wrap">{application.verification_notes}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicantDetailDialog;

function renderAnswer(answer?: string | string[] | OpportunityResponse["answer"]) {
  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer.join(", ") : null;
  }
  if (!answer) return null;
  return answer;
}


