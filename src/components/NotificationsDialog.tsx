import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bell } from "lucide-react";
import { useNotifications } from "@/context/NotificationsContext";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationsDialog = ({ open, onOpenChange }: NotificationsDialogProps) => {
  const { items, markAllRead } = useNotifications();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Notifications</DialogTitle>
          <DialogDescription className="text-muted-foreground">Recent updates</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">No new notifications.</div>
          )}
          {items.map((n) => (
            <div key={n.id} className="glass-card p-3 flex items-start gap-3">
              <Bell size={14} className={n.kind === 'success' ? 'text-status-confirmed' : n.kind === 'warning' ? 'text-status-pending' : 'text-foreground'} />
              <div>
                <p className="text-sm text-foreground">{n.text}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <button className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground" onClick={() => markAllRead()}>Mark all as read</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
