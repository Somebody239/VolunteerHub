import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Moon, Sun, Bell, Shield, User2 } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground">Personalize your experience</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><Sun size={16} /><span>Appearance</span></div>
            <span className="text-muted-foreground">System</span>
          </div>
          <div className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><Bell size={16} /><span>Notifications</span></div>
            <span className="text-muted-foreground">Enabled</span>
          </div>
          <div className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><Shield size={16} /><span>Privacy</span></div>
            <span className="text-muted-foreground">Standard</span>
          </div>
          <div className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><User2 size={16} /><span>Account</span></div>
            <span className="text-muted-foreground">Student</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
