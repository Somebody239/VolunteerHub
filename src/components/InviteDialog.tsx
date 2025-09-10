import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mail, UserPlus, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InviteDialog = ({ open, onOpenChange }: InviteDialogProps) => {
  const inviteLink = `${location.origin}/join`;

  const copy = () => {
    navigator.clipboard?.writeText(inviteLink).then(() => {
      toast({ title: "Copied", description: "Invite link copied to clipboard." });
    });
  };

  const send = () => toast({ title: "Invite sent", description: "We'll send an invite email (mock)." });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Invite a Friend</DialogTitle>
          <DialogDescription className="text-muted-foreground">Share impact with your friends</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate"><UserPlus size={16} /><span className="truncate">{inviteLink}</span></div>
            <button className="p-2 rounded-full hover:bg-muted/50" aria-label="Copy link" onClick={copy}><Copy size={16} /></button>
          </div>
          <div className="glass-card p-3 flex items-center gap-2">
            <Mail size={16} />
            <input placeholder="friend@email.com" className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground" />
            <button onClick={send} className="px-3 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90">Send</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
