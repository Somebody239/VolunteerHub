import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Award,
  Trophy,
  ShieldCheck,
  Medal,
  Crown,
} from "lucide-react";
import { type Quest } from "@/lib/questUtils";
import { toast } from "@/hooks/use-toast";

interface QuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quests: Quest[];
  onClaimQuest: (quest: Quest) => Promise<boolean>;
  onAddBonusXp: (xp: number) => void;
}

export const QuestDialog = ({ 
  open, 
  onOpenChange, 
  quests, 
  onClaimQuest, 
  onAddBonusXp 
}: QuestDialogProps) => {
  // Sort quests: 1st Unclaimed (done but not claimed), 2nd Unfinished (not done), 3rd Claimed
  const sortedQuests = useMemo(() => {
    return [...quests].sort((a, b) => {
      // Use the same sorting logic as questUtils: completed unclaimed first, incomplete middle, claimed last
      const aPri = a.done && !a.claimed ? 3 : a.claimed ? 0 : 1;
      const bPri = b.done && !b.claimed ? 3 : b.claimed ? 0 : 1;
      if (aPri !== bPri) return bPri - aPri;
      return a.key.localeCompare(b.key); // stable sort by key
    });
  }, [quests]);

  const handleClaimQuest = async (quest: Quest) => {
    if (quest.done && !quest.claimed) {
      const success = await onClaimQuest(quest);
      if (success) {
        onAddBonusXp(quest.xp);
        toast({ title: `+${quest.xp} XP claimed` });
        
        if (quest.badgeIfClaimed) {
          toast({ title: `Badge earned: ${quest.badgeIfClaimed.label}` });
        }
        
        // Force re-render to update quest order
        window.dispatchEvent(new Event("quest-claimed"));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>All Quests</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 sm:grid-cols-2">
          {sortedQuests.map((q) => (
            <div
              key={q.key}
              className={`p-4 rounded-xl border transition-colors ${
                q.done ? "bg-muted/40" : "hover:bg-muted/30"
              } ${q.done && q.claimed ? "opacity-60 grayscale" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2">
                  <span>{q.title}</span>
                  {q.badgeIfClaimed && (() => {
                    const badge = q.badgeIfClaimed as { label: string; icon?: string };
                    const Icon = 
                      badge.icon === "Trophy" ? Trophy : 
                      badge.icon === "ShieldCheck" ? ShieldCheck : 
                      badge.icon === "Medal" ? Medal : 
                      badge.icon === "Crown" ? Crown : 
                      Award;
                    return (
                      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-muted/60 text-foreground/80 border whitespace-nowrap">
                        <Icon size={10} aria-hidden />
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
                {q.done && (
                  <CheckCircle2 size={16} className="text-green-500" />
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {q.xp} XP
              </div>
              <div className="mt-2">
                {q.done ? (
                  q.claimed ? (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Claimed
                    </span>
                  ) : (
                    <button
                      className="text-xs px-2 py-1 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
                      onClick={() => handleClaimQuest(q)}
                    >
                      Claim {q.xp} XP
                    </button>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Complete to claim
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
