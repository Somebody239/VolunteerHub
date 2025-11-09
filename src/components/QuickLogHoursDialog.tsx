import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type Props = { 
  onLogged: (hours: number, title?: string, organization?: string, notes?: string) => void; 
  trigger?: React.ReactNode 
};

export const QuickLogHoursDialog: React.FC<Props> = ({ onLogged, trigger }) => {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [organization, setOrganization] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleSave = () => {
    const h = parseFloat(hours);
    if (Number.isNaN(h) || h <= 0) { 
      toast({ title: "Enter a valid number of hours", variant: "destructive" }); 
      return; 
    }
    
    onLogged(h, title || undefined, organization || undefined, notes || undefined);
    setOpen(false);
    setHours("");
    setTitle("");
    setOrganization("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline" size="sm">Log Hours</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Hours</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Hours Worked</label>
            <Input 
              type="number" 
              min={0} 
              step={0.5} 
              value={hours} 
              onChange={(e) => setHours(e.target.value)} 
              placeholder="e.g., 1.5" 
            />
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Activity Title (Optional)</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Community Garden Cleanup" 
            />
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Organization (Optional)</label>
            <Input 
              value={organization} 
              onChange={(e) => setOrganization(e.target.value)} 
              placeholder="e.g., Local Food Bank" 
            />
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Additional details about your volunteer work..." 
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Hours
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


