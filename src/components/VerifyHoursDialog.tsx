import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type VerifyHoursPayload = {
  verifiedHours: number;
  starRating?: number;
  onTimeRate?: number;
  showUpRate?: number;
  notes?: string;
};

type VerifyHoursDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: VerifyHoursPayload) => Promise<void> | void;
  studentName?: string;
  opportunityTitle?: string;
};

export const VerifyHoursDialog: React.FC<VerifyHoursDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  studentName,
  opportunityTitle,
}) => {
  const [hours, setHours] = useState<string>("0");
  const [rating, setRating] = useState<string>("5");
  const [onTime, setOnTime] = useState<string>("100");
  const [showUp, setShowUp] = useState<string>("100");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Hours{opportunityTitle ? ` — ${opportunityTitle}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {studentName && <div className="text-sm text-muted-foreground">Student: <span className="text-foreground">{studentName}</span></div>}
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Verified Hours</label>
            <input
              type="number"
              min={0}
              step={0.5}
              className="rounded-md border border-input bg-background text-foreground text-sm p-2"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Rating (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              className="rounded-md border border-input bg-background text-foreground text-sm p-2"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </div>
          <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
            <div>
              <label className="text-xs text-muted-foreground">On-time %</label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-md border border-input bg-background text-foreground text-sm p-2"
                value={onTime}
                onChange={(e) => setOnTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Show-up %</label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-md border border-input bg-background text-foreground text-sm p-2"
                value={showUp}
                onChange={(e) => setShowUp(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-muted-foreground">Notes</label>
            <textarea
              className="min-h-[100px] rounded-md border border-input bg-background text-foreground text-sm p-2"
              placeholder="Feedback or notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button
              onClick={async () => {
                const verifiedHours = Math.max(0, parseFloat(hours || "0")) || 0;
                const starRating = Math.max(1, Math.min(5, parseInt(rating || "5", 10)));
                const onTimeRate = Math.max(0, Math.min(100, parseInt(onTime || "100", 10)));
                const showUpRate = Math.max(0, Math.min(100, parseInt(showUp || "100", 10)));
                setSubmitting(true);
                try {
                  await Promise.resolve(onSubmit({ verifiedHours, starRating, onTimeRate, showUpRate, notes }));
                  onOpenChange(false);
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
            >
              Verify and Complete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyHoursDialog;


