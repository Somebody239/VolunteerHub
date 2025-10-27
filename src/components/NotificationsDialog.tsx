import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bell, CheckCircle2, Star, Clock, User } from "lucide-react";
import { useNotifications } from "@/context/NotificationsContext";
import { useState, useEffect } from "react";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationsDialog = ({ open, onOpenChange }: NotificationsDialogProps) => {
  const { items, markAllRead } = useNotifications();
  const [verificationNotifications, setVerificationNotifications] = useState<any[]>([]);

  // Load verification notifications from localStorage
  useEffect(() => {
    const loadVerificationNotifications = () => {
      try {
        const raw = localStorage.getItem('vp_notifications');
        const notifications = raw ? JSON.parse(raw) : [];
        setVerificationNotifications(notifications);
      } catch (error) {
        console.error('Error loading verification notifications:', error);
      }
    };

    loadVerificationNotifications();

    // Listen for notification updates
    const handleNotificationUpdate = () => loadVerificationNotifications();
    window.addEventListener('notifications-updated', handleNotificationUpdate);
    
    return () => window.removeEventListener('notifications-updated', handleNotificationUpdate);
  }, []);

  const markVerificationAsRead = (id: string) => {
    try {
      const raw = localStorage.getItem('vp_notifications');
      const notifications = raw ? JSON.parse(raw) : [];
      const updated = notifications.map((n: any) => 
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem('vp_notifications', JSON.stringify(updated));
      setVerificationNotifications(updated);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const allNotifications = [
    ...items.map(item => ({ ...item, type: 'system' })),
    ...verificationNotifications.filter(n => !n.read).map(n => ({ ...n, type: 'verification' }))
  ].sort((a, b) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Notifications</DialogTitle>
          <DialogDescription className="text-muted-foreground">Recent updates</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {allNotifications.length === 0 && (
            <div className="text-sm text-muted-foreground">No new notifications.</div>
          )}
          {allNotifications.map((n) => (
            <div key={n.id} className="glass-card p-3 flex items-start gap-3">
              {n.type === 'verification' ? (
                <CheckCircle2 size={14} className="text-green-500" />
              ) : (
                <Bell size={14} className={n.kind === 'success' ? 'text-status-confirmed' : n.kind === 'warning' ? 'text-status-pending' : 'text-foreground'} />
              )}
              <div className="flex-1">
                {n.type === 'verification' ? (
                  <div>
                    <p className="text-sm text-foreground font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    {n.data && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User size={12} />
                          <span>Verified by: {n.data.verifiedBy}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span>{n.data.verifiedHours}h worked</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Star size={12} />
                          <span>Rating: {n.data.starRating}/5 stars</span>
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2">{new Date(n.timestamp).toLocaleString()}</p>
                    <button
                      onClick={() => markVerificationAsRead(n.id)}
                      className="text-[10px] text-primary hover:underline mt-1"
                    >
                      Mark as read
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-foreground">{n.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                )}
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
