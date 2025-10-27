import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Mail, Clock3, Star, ShieldCheck } from "lucide-react";

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

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile?: ApplicantProfile | null;
};

export const ApplicantDetailDialog: React.FC<Props> = ({ open, onOpenChange, profile }) => {
  if (!profile) return null;
  const hours = typeof profile.total_hours === 'number' ? profile.total_hours : 0;
  const onTime = typeof profile.on_time_rate === 'number' ? profile.on_time_rate : 0;
  const showUp = typeof profile.show_up_rate === 'number' ? profile.show_up_rate : 0;
  const isNew = hours <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{profile.full_name || 'Student'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicantDetailDialog;


