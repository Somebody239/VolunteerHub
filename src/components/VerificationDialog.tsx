import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (verificationLink: string) => void;
  jobTitle: string;
  jobDate: string;
  studentHours: number;
  studentName: string;
}

export const VerificationDialog: React.FC<VerificationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  jobTitle,
  jobDate,
  studentHours,
  studentName,
}) => {
  const [verificationLink, setVerificationLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Generate verification link when dialog opens
  React.useEffect(() => {
    if (open && !verificationLink) {
      const baseUrl = window.location.origin;
      const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const link = `${baseUrl}/verify/${verificationId}`;
      setVerificationLink(link);
    }
  }, [open, verificationLink]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationLink);
      setLinkCopied(true);
      toast({ title: "Verification link copied to clipboard" });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      toast({ 
        title: "Failed to copy link", 
        description: "Please copy the link manually",
        variant: "destructive" 
      });
    }
  };

  const handleConfirm = () => {
    // Create verification request in localStorage
    try {
      const raw = localStorage.getItem('verification_requests');
      const requests = raw ? JSON.parse(raw) : [];
      const verificationId = verificationLink.split('/').pop();
      
      const request = {
        verificationId,
        jobTitle,
        jobDate,
        studentHours,
        studentName,
        organization: 'External Organization', // This would come from props in a real app
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      requests.push(request);
      localStorage.setItem('verification_requests', JSON.stringify(requests));
    } catch (error) {
      console.error('Error creating verification request:', error);
    }
    
    onConfirm(verificationLink);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Verification Required
          </DialogTitle>
          <DialogDescription>
            Before awarding XP and hours, this application needs to be verified by a mentor or supervisor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Job Details */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Job Details</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Job:</strong> {jobTitle}</p>
              <p><strong>Student:</strong> {studentName}</p>
              <p><strong>Date:</strong> {jobDate}</p>
              <p><strong>Hours Claimed:</strong> {studentHours}h</p>
            </div>
          </div>

          {/* Verification Link */}
          <div className="space-y-2">
            <Label htmlFor="verification-link">Verification Link</Label>
            <div className="flex gap-2">
              <Input
                id="verification-link"
                value={verificationLink}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center gap-1"
              >
                {linkCopied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {linkCopied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with the mentor or supervisor who can verify the work completed.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Next Steps:</strong>
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <li>• Share the verification link with your mentor/supervisor</li>
              <li>• They will verify your hours and provide feedback</li>
              <li>• Once verified, you'll receive XP and hours automatically</li>
              <li>• Your reputation score will be updated based on their feedback</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-amber-600 hover:bg-amber-700">
            Confirm & Generate Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
