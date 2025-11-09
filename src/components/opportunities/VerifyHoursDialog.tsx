import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface VerifyHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  opportunityTitle: string;
  claimedHours?: number | null;
  defaultHours?: number | null;
  isSubmitting?: boolean;
  onConfirm: (payload: { verifiedHours: number; notes?: string }) => Promise<void> | void;
}

export const VerifyHoursDialog: React.FC<VerifyHoursDialogProps> = ({
  open,
  onOpenChange,
  studentName,
  opportunityTitle,
  claimedHours,
  defaultHours,
  isSubmitting,
  onConfirm,
}) => {
  const [hours, setHours] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (open) {
      setHours(defaultHours ? String(defaultHours) : claimedHours ? String(claimedHours) : "");
      setNotes("");
    }
  }, [open, defaultHours, claimedHours]);

  const handleSubmit = async () => {
    const parsed = parseFloat(hours);
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast({ title: "Enter a valid number of hours", variant: "destructive" });
      return;
    }
    await Promise.resolve(onConfirm({ verifiedHours: parsed, notes: notes.trim() || undefined }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify volunteer hours</DialogTitle>
          <DialogDescription>
            Confirm the time {studentName} completed for {opportunityTitle}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Claimed hours</span>
              <span className="font-medium text-foreground">{claimedHours ?? "—"}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Verified hours</label>
            <Input
              type="number"
              min={0}
              step={0.25}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes for the student (optional)</label>
            <Textarea
              rows={3}
              placeholder="Share feedback or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyHoursDialog;

