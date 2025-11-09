import { ProfileCard } from "@/components/ProfileCard";
import { Navigation } from "@/components/Navigation";
import {
  Award,
  Zap,
  Clock3,
  Star,
  ShieldCheck,
  Settings,
  Bell,
  UserPlus,
  Medal,
  Crown,
  Trophy,
  CheckCircle2,
  X,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";
import { useEffect, useState, lazy, Suspense, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { InlineEditableText } from "@/components/InlineEditableText";
import { TagEditor } from "@/components/TagEditor";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { generateQuests, claimQuest, type Quest, type QuestData } from "@/lib/questUtils";
import { QuestService } from "@/lib/questService";
import { SavedOpportunitiesService } from "@/lib/savedOpportunitiesService";
import { QuestDialog } from "@/components/QuestDialog";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { supabase } from "@/lib/supabaseClient";
import { QuickLogHoursDialog } from "@/components/QuickLogHoursDialog";
import { useQuery } from "@tanstack/react-query";

// Lazy load heavy dialogs
const SettingsDialog = lazy(() =>
  import("@/components/SettingsDialog").then((m) => ({
    default: m.SettingsDialog,
  })),
);
const NotificationsDialog = lazy(() =>
  import("@/components/NotificationsDialog").then((m) => ({
    default: m.NotificationsDialog,
  })),
);
const InviteDialog = lazy(() =>
  import("@/components/InviteDialog").then((m) => ({
    default: m.InviteDialog,
  })),
);

const Profile = () => {
  const badges = [
    {
      icon: Medal,
      label: "First Shift",
      earned: (hours: number, _streak: number) => hours >= 1,
    },
    {
      icon: Trophy,
      label: "10-Hour Club",
      earned: (hours: number, _streak: number) => hours >= 10,
    },
    {
      icon: Crown,
      label: "Weekend Warrior",
      earned: (_hours: number, streak: number) => streak >= 2,
    },
  ];
  const { user, signOut } = useAuth();

  // Query for user progress history from database
  const historyQuery = useQuery({
    queryKey: ["user_progress_history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_progress_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date_worked', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get history from localStorage and database
  const history = useMemo(() => {
    const historyItems: Array<{
      title: string;
      org: string;
      date: string;
      hours: number;
      rating: number;
      type: 'completed' | 'history';
      status?: string;
      notes?: string;
    }> = [];

    // Add history from database
    if (historyQuery.data) {
      historyQuery.data.forEach((item: any) => {
        historyItems.push({
          title: item.title || 'Unknown',
          org: item.organization || 'Unknown Organization',
          date: item.date_worked || new Date().toISOString().slice(0,10),
          hours: item.hours_worked || 0,
          rating: 5, // Default rating
          type: 'history',
          status: 'done',
          notes: item.notes || ''
        });
      });
    }

    // Add localStorage history (for backward compatibility)
    try {
      const hraw = localStorage.getItem('vp_history');
      const hist: any[] = hraw ? JSON.parse(hraw) : [];
      hist.forEach((item: any) => {
        historyItems.push({
          title: item.title || 'Unknown',
          org: item.org || 'Unknown Organization',
          date: item.date || new Date().toISOString().slice(0,10),
          hours: item.hours || 0,
          rating: 5, // Default rating
          type: 'history',
          status: item.status || 'history',
          notes: item.notes || ''
        });
      });
    } catch {}

    // Sort by date (newest first)
    return historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historyQuery.data]);

  const {
    name,
    school,
    totalHours,
    streak,
    level,
    xpInLevel,
    maxXp,
    avgRating,
    onTimeRate,
    showUpRate,
    addBonusXp,
    logHours,
  } = useUser();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  
  // History edit form state
  const [historyFormStatus, setHistoryFormStatus] = useState<string>("done");
  const [historyFormDate, setHistoryFormDate] = useState<string>("");
  const [historyFormHours, setHistoryFormHours] = useState<string>("0");
  const [historyFormNotes, setHistoryFormNotes] = useState<string>("");
  const [allQuestsOpen, setAllQuestsOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [schoolVal, setSchoolVal] = useState("");
  const [about, setAbout] = useState("");
  const [locationVal, setLocationVal] = useState("");
  const [interests, setInterests] = useState("");
  const [availability, setAvailability] = useState("");
  const [questRefresh, setQuestRefresh] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questService, setQuestService] = useState<QuestService | null>(null);

  
  const [role, setRole] = useState<"student" | "organizer" | undefined>(
    undefined,
  );
  const [orgName, setOrgName] = useState<string>("");

  // Listen for quest updates to sync between pages
  useEffect(() => {
    const handleQuestUpdate = () => setQuestRefresh((prev) => prev + 1);
    window.addEventListener("quest-claimed", handleQuestUpdate);
    return () => window.removeEventListener("quest-claimed", handleQuestUpdate);
  }, []);

  // Listen for saved opportunities updates
  useEffect(() => {
    const handleSavedUpdate = () => {
      try {
        const saved = localStorage.getItem("vp_saved");
        if (saved) {
          setSavedIds(JSON.parse(saved));
        }
      } catch {}
    };
    window.addEventListener("external-updated", handleSavedUpdate);
    return () => window.removeEventListener("external-updated", handleSavedUpdate);
  }, []);

  // Query for applications to sync with Index page
  const applicationsQuery = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("applicant_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Quest data for shared quest system
  const questData: QuestData = {
    fullName: fullName || name || "",
    interests: interests || "",
    emailVerified: !!(user as any)?.email_confirmed_at,
    totalHours: totalHours,
    availability: availability || "",
    appliedCount: (applicationsQuery.data ?? []).length,
    savedCount: savedIds.length,
    location: locationVal || "",
    about: about || "",
    level: level
  };


  // Local component to show badges including quest-awarded ones
  const BadgesPanel = () => {
    const [refresh, setRefresh] = useState(0);
    const [earnedKeys, setEarnedKeys] = useState<string[]>([]);
    
    useEffect(() => {
      const handler = () => setRefresh((r) => r + 1);
      window.addEventListener("quest-claimed", handler);
      return () => window.removeEventListener("quest-claimed", handler);
    }, []);

    // Load earned badges from database
    useEffect(() => {
      const loadBadges = async () => {
        if (questService) {
          const badges = await questService.getEarnedBadges();
          setEarnedKeys(badges);
        }
      };
      loadBadges();
    }, [questService, refresh]);

    const questBadgeCatalog: Record<string, { label: string; icon: any }> = {
      badge_profile_ready: { label: "Profile Ready", icon: Award },
      badge_first_application: { label: "First Application", icon: Trophy },
      badge_verified: { label: "Verified", icon: ShieldCheck },
      badge_profile_complete: { label: "Profile Complete", icon: Medal },
      badge_second_application: { label: "Second Application", icon: Trophy },
      badge_scout: { label: "Scout", icon: Crown },
    };

    const questBadges = earnedKeys
      .map((k) => ({ key: k, ...questBadgeCatalog[k] }))
      .filter((b) => !!b.icon && !!b.label) as Array<{
      key: string;
      label: string;
      icon: any;
    }>;

    const systemBadges = badges
      .map((b) => ({ ...b, has: b.earned(totalHours, streak) }))
      .map((b) => ({ key: b.label, label: b.label, icon: b.icon, has: b.has }));

    return (
      <div className="flex items-center gap-3 flex-wrap">
        {systemBadges.map((b) => {
          const Icon = b.icon as any;
          return (
            <div
              key={`sys-${b.key}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-full bg-muted/40 ${b.has ? "" : "opacity-60 grayscale"}`}
            >
              <Icon size={16} />
              <span className="text-xs">{b.label}</span>
            </div>
          );
        })}
        {questBadges.map((b) => {
          const Icon = b.icon as any;
          return (
            <div
              key={`quest-${b.key}`}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/40"
            >
              <Icon size={16} />
              <span className="text-xs">{b.label}</span>
            </div>
          );
        })}
        {systemBadges.length === 0 && questBadges.length === 0 && (
          <div className="text-xs text-muted-foreground">No badges yet</div>
        )}
      </div>
    );
  };

  // Load profile values to bind inline editors
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, school, about, location, interests, availability")
        .eq("id", user.id)
        .maybeSingle();
      if (error) return;
      setFullName((data?.full_name as string) ?? name ?? "");
      setSchoolVal((data?.school as string) ?? school ?? "");
      setAbout((data?.about as string) ?? "");
      setLocationVal((data?.location as string) ?? "");
      setInterests((data?.interests as string) ?? "");
      setAvailability((data?.availability as string) ?? "");

      // Load saved opportunities from database
      if (user?.id) {
        const savedOpportunitiesService = new SavedOpportunitiesService(user.id);
        const saved = await savedOpportunitiesService.getSavedOpportunities();
        setSavedIds(saved.map(opp => opp.opportunity_id));
      }

      // Check if organizer
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();
      if (org) {
        setRole("organizer");
        setOrgName((org as any).name ?? "Organization");
      } else if (!role) {
        setRole("student");
      }
    };
    void load();
  }, [user?.id, name, school]);

  // Initialize quest service
  useEffect(() => {
    if (user?.id) {
      setQuestService(new QuestService(user.id));
    }
  }, [user?.id]);

  // Load quests when quest data changes
  useEffect(() => {
    const loadQuests = async () => {
      if (!questService) return;

      const loadedQuests = await questService.getQuests(questData);
      setQuests(loadedQuests);
    };

    loadQuests();
  }, [questService, questData, questRefresh]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center p-3 md:p-4 border-b border-border/50 gap-3 md:gap-8">
        <div className="justify-self-start min-w-0 w-full pr-0 md:pr-8">
          <ProfileCard
            name={fullName || name}
            level={level}
            xp={xpInLevel}
            maxXp={maxXp}
            totalHours={totalHours}
            streak={streak}
            school={school}
            variant="plain"
          />
        </div>
        <div className="justify-self-center">
          <Navigation activeTab="profile" />
        </div>
        <div className="justify-self-end hidden sm:flex items-center gap-2">
          <button
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={16} />
          </button>
          <button
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell size={16} />
          </button>
          <button
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Invite Friend"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus size={16} />
          </button>
          {user && (
            <>
              <span
                className="text-xs text-muted-foreground truncate max-w-[160px]"
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { error } = await signOut();
                  if (error)
                    toast({
                      title: "Sign out failed",
                      description: error.message,
                      variant: "destructive",
                    });
                  else toast({ title: "Signed out" });
                }}
              >
                Sign Out
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {/* Gamified header */}
        <section className="grid gap-4 md:grid-cols-3 items-stretch">
          {/* Summary */}
          <div className="md:col-span-2 glass-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Award size={18} className="text-badge" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-lg font-semibold truncate">
                      {fullName || name}
                    </h2>
                    {role && (
                      <span className="px-2 py-0.5 text-xs rounded-full border border-border text-muted-foreground flex-shrink-0">
                        {role === "organizer"
                          ? `Organizer${orgName ? ` • ${orgName}` : ""}`
                          : "Student"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Lvl. {level}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 bg-level rounded-full overflow-hidden"
                  aria-label="XP Progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={maxXp}
                  aria-valuenow={xpInLevel}
                >
                  <div
                    className="h-full bg-xp progress-fill rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, (xpInLevel / Math.max(1, maxXp)) * 100))}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {xpInLevel} / {maxXp} XP
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="glass-card p-3 flex items-center gap-2">
                <Clock3 size={14} />
                <div>
                  <div className="font-medium">{totalHours}h</div>
                  <div className="text-xs text-muted-foreground">
                    Verified Hours
                  </div>
                </div>
              </div>
              <div className="glass-card p-3 flex items-center gap-2">
                <Zap size={14} className="text-status-confirmed" />
                <div>
                  <div className="font-medium">{streak}</div>
                  <div className="text-xs text-muted-foreground">
                    Day Streak
                  </div>
                </div>
              </div>
              <div className="glass-card p-3 flex items-center gap-2">
                <ShieldCheck size={14} />
                <div>
                  <div className="font-medium">New Account</div>
                  <div className="text-xs text-muted-foreground">
                    Leaderboard
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3">Badges</h3>
            <BadgesPanel />
          </div>
        </section>

        {/* Reputation (full width) */}
        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Reputation</h3>
            <span className="text-xs text-muted-foreground">Lvl. {level} • {xpInLevel} / {maxXp} XP</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="glass-card p-3">
              <div className="flex items-center gap-2">
                <Star size={14} />
                <span className="font-medium">{avgRating.toFixed(1)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Average Rating
              </div>
            </div>
            <div className="glass-card p-3">
              <div className="flex items-center gap-2">
                <Zap size={14} />
                <span className="font-medium">{onTimeRate}%</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                On-Time Rate
              </div>
            </div>
            <div className="glass-card p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} />
                <span className="font-medium">{showUpRate}%</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Show-Up Rate
              </div>
            </div>
          </div>
        </section>

        {/* Quests under reputation */}
        <section className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Quests</h3>
            <button
              className="text-xs underline underline-offset-2"
              onClick={() => setAllQuestsOpen(true)}
            >
              View all
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {useMemo(() => {
              // Use the same sorting logic as QuestDialog to ensure consistency
              const sortedQuests = [...quests].sort((a, b) => {
                const aPri = a.done && !a.claimed ? 3 : a.claimed ? 0 : 1;
                const bPri = b.done && !b.claimed ? 3 : b.claimed ? 0 : 1;
                if (aPri !== bPri) return bPri - aPri;
                return a.key.localeCompare(b.key);
              });
              
              return sortedQuests.slice(0, 3).map((q) => (
                <div
                  key={q.claimKey}
                  className={`p-4 rounded-xl border ${q.done ? "bg-muted/40" : "hover:bg-muted/30"} transition-colors ${q.done && q.claimed ? "opacity-60 grayscale" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span>{q.title}</span>
                      {(q as any).badgeIfClaimed && (() => {
                        const badge = (q as any).badgeIfClaimed as { label: string; icon?: string };
                        const Icon = badge.icon === "Trophy" ? Trophy : badge.icon === "ShieldCheck" ? ShieldCheck : badge.icon === "Medal" ? Medal : Award;
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
                          onClick={async () => {
                            if (questService && await questService.claimQuest(q)) {
                              addBonusXp(q.xp);
                              toast({ title: `+${q.xp} XP claimed` });
                              if (q.badgeIfClaimed) {
                                toast({ title: `Badge earned: ${q.badgeIfClaimed.label}` });
                              }
                              // Force re-render to update quest order
                              window.dispatchEvent(new Event("quest-claimed"));
                              setQuestRefresh((prev) => prev + 1);
                            }
                          }}
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
              ));
            }, [
              quests,
              questRefresh,
              questService,
              fullName,
              name,
              interests,
              availability,
              user?.email_confirmed_at,
              totalHours,
              savedIds.length,
              applicationsQuery.data?.length,
            ])}
          </div>
          <QuestDialog
            open={allQuestsOpen}
            onOpenChange={setAllQuestsOpen}
            quests={quests}
            onClaimQuest={async (quest) => {
              if (questService) {
                const success = await questService.claimQuest(quest);
                if (success) {
                  setQuestRefresh((prev) => prev + 1);
                }
                return success;
              }
              return false;
            }}
            onAddBonusXp={addBonusXp}
          />
        </section>

        {/* Settings (left) and Hours (right) */}
        <section className="grid gap-4 md:grid-cols-2 items-stretch">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3">Settings</h3>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Full Name</div>
                <InlineEditableText
                  value={fullName || name}
                  onChange={async (v) => {
                    if (!user) return;
                    const { error } = await supabase.from("profiles").upsert(
                      {
                        id: user.id,
                        full_name: v,
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: "id" },
                    );
                    if (error) {
                      toast({
                        title: "Save failed",
                        description: error.message,
                        variant: "destructive",
                      });
                    } else {
                      setFullName(v);
                      toast({ title: "Saved" });
                    }
                  }}
                />
              </div>
              <div>
                <div className="text-muted-foreground mb-1">School</div>
                <InlineEditableText
                  value={schoolVal || school || ""}
                  onChange={async (v) => {
                    if (!user) return;
                    const { error } = await supabase.from("profiles").upsert(
                      {
                        id: user.id,
                        school: v,
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: "id" },
                    );
                    if (error) {
                      toast({
                        title: "Save failed",
                        description: error.message,
                        variant: "destructive",
                      });
                    } else {
                      setSchoolVal(v);
                      toast({ title: "Saved" });
                    }
                  }}
                />
              </div>
              <div>
                <div className="text-muted-foreground mb-1">About</div>
                <InlineEditableText
                  value={about}
                  onChange={async (v) => {
                    if (!user) return;
                    const { error } = await supabase.from("profiles").upsert(
                      {
                        id: user.id,
                        about: v,
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: "id" },
                    );
                    if (error) {
                      toast({
                        title: "Save failed",
                        description: error.message,
                        variant: "destructive",
                      });
                    } else {
                      setAbout(v);
                      toast({ title: "Saved" });
                    }
                  }}
                  placeholder="Add a short bio"
                />
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Location</div>
                <LocationAutocomplete
                  value={locationVal}
                  onChange={async (v) => {
                    if (!user) return;
                    if (!v || v.length < 2) {
                      toast({
                        title: "Invalid location",
                        description: "Pick a real location from suggestions.",
                        variant: "destructive",
                      });
                      return;
                    }
                    const { error } = await supabase.from("profiles").upsert(
                      {
                        id: user.id,
                        location: v,
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: "id" },
                    );
                    if (error) {
                      toast({
                        title: "Save failed",
                        description: error.message,
                        variant: "destructive",
                      });
                    } else {
                      setLocationVal(v);
                      toast({ title: "Saved" });
                    }
                  }}
                  placeholder="Search your city or address"
                />
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Interests</div>
                <TagEditor
                  value={interests}
                  onChange={async (csv) => {
                    if (!user) return;
                    const { error } = await supabase.from("profiles").upsert(
                      {
                        id: user.id,
                        interests: csv,
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: "id" },
                    );
                    if (error) {
                      toast({
                        title: "Save failed",
                        description: error.message,
                        variant: "destructive",
                      });
                    } else {
                      setInterests(csv);
                      toast({ title: "Saved" });
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3">Availability</h3>
            <div className="text-sm">
              <ScheduleEditor
                value={availability}
                onChange={async (json) => {
                  if (!user) return;
                  const { error } = await supabase.from("profiles").upsert(
                    {
                      id: user.id,
                      availability: json,
                      updated_at: new Date().toISOString(),
                    },
                    { onConflict: "id" },
                  );
                  if (error) {
                    toast({
                      title: "Save failed",
                      description: error.message,
                      variant: "destructive",
                    });
                  } else {
                    setAvailability(json);
                    toast({ title: "Saved" });
                  }
                }}
              />
            </div>
          </div>
        </section>

        {/* History */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">History</h3>
            <button
              className="text-sm text-primary hover:text-primary/80"
              aria-label="Download verification letter"
              onClick={() => {
                try {
                  const lines = [
                    `Volunteer Hours Verification`,
                    `Name: ${fullName || name}`,
                    `School: ${school || schoolVal || ""}`,
                    `Total Verified Hours: ${totalHours}`,
                    `Date: ${new Date().toLocaleString()}`,
                    "",
                    "This letter verifies the volunteer hours logged in VolunPath.",
                  ].join("\n");
                  const blob = new Blob([lines], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `volunteer-verification-${(fullName || name || "volunteer").replace(/\s+/g, "-").toLowerCase()}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (e: any) {
                  toast({
                    title: "Download failed",
                    description: e?.message ?? String(e),
                    variant: "destructive",
                  });
                }
              }}
            >
              Download Verification
            </button>
          </div>
          <div className="grid gap-3">
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No history yet. Complete an opportunity to see it here.
              </div>
            ) : (
              history.map((item, index) => {
                const isExpanded = expandedHistoryId === `hist:${index}`;
                const statusConfig = {
                  done: { color: "text-green-300", bg: "bg-green-900/30", dot: "bg-green-500", border: "border-green-600/50", glow: "shadow-green-500/30" },
                  accepted: { color: "text-emerald-300", bg: "bg-emerald-900/30", dot: "bg-emerald-500", border: "border-emerald-600/50", glow: "shadow-emerald-500/30" },
                  rejected: { color: "text-red-300", bg: "bg-red-900/30", dot: "bg-red-500", border: "border-red-600/50", glow: "shadow-red-500/30" },
                  cancelled: { color: "text-gray-300", bg: "bg-gray-900/30", dot: "bg-gray-500", border: "border-gray-600/50", glow: "shadow-gray-500/30" },
                  history: { color: "text-blue-300", bg: "bg-blue-900/30", dot: "bg-blue-500", border: "border-blue-600/50", glow: "shadow-blue-500/30" }
                };
                const status = item.status || 'history';
                const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.history;
                
                return (
                  <div key={index} className="glass-card overflow-hidden transition-all duration-200 hover:shadow-lg">
                    {/* Compact header */}
                    <div
                      className="p-4 cursor-pointer transition-colors hover:bg-muted/20"
                      onClick={() => {
                        const id = `hist:${index}`;
                        if (isExpanded) {
                          setExpandedHistoryId(null);
                          return;
                        }
                        setExpandedHistoryId(id);
                        // Load form state for this history item
                        setHistoryFormStatus(item.status || 'done');
                        setHistoryFormDate(item.date || '');
                        setHistoryFormHours(String(item.hours || 0));
                        setHistoryFormNotes(item.notes || '');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-3 h-3 rounded-full ${config.dot} flex-shrink-0`}></div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.color} ${config.border}`}>
                                {item.status === 'done' ? 'Completed' :
                                 item.status === 'accepted' ? 'Accepted' :
                                 item.status === 'rejected' ? 'Rejected' :
                                 item.status === 'cancelled' ? 'Cancelled' :
                                 'History'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="capitalize">{item.org}</span>
                              <span>{item.date}</span>
                              {item.hours > 0 && (
                                <span className="text-green-600 font-medium">{item.hours}h</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.hours > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock3 size={12} />
                              <span>{item.hours}h</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={`${
                                  i < item.rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <div className={`w-4 h-4 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details - Similar to My Applications */}
                    {isExpanded && (
                      <div className="border-t border-border/50 bg-muted/10">
                        <div className="p-3 space-y-3">
                          {/* Status Selection */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {[
                              { 
                                key: 'done', 
                                label: 'Completed', 
                                baseColor: 'bg-green-900/30 hover:bg-green-800/40 text-green-300 border-green-600/50',
                                activeColor: 'bg-green-800/50 text-green-200 border-green-500 shadow-green-500/20',
                                glowColor: 'shadow-green-500/30'
                              },
                              { 
                                key: 'accepted', 
                                label: 'Accepted', 
                                baseColor: 'bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-300 border-emerald-600/50',
                                activeColor: 'bg-emerald-800/50 text-emerald-200 border-emerald-500 shadow-emerald-500/20',
                                glowColor: 'shadow-emerald-500/30'
                              },
                              { 
                                key: 'rejected', 
                                label: 'Rejected', 
                                baseColor: 'bg-red-900/30 hover:bg-red-800/40 text-red-300 border-red-600/50',
                                activeColor: 'bg-red-800/50 text-red-200 border-red-500 shadow-red-500/20',
                                glowColor: 'shadow-red-500/30'
                              },
                              { 
                                key: 'cancelled', 
                                label: 'Cancelled', 
                                baseColor: 'bg-gray-900/30 hover:bg-gray-800/40 text-gray-300 border-gray-600/50',
                                activeColor: 'bg-gray-800/50 text-gray-200 border-gray-500 shadow-gray-500/20',
                                glowColor: 'shadow-gray-500/30'
                              },
                              { 
                                key: 'history', 
                                label: 'History', 
                                baseColor: 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border-blue-600/50',
                                activeColor: 'bg-blue-800/50 text-blue-200 border-blue-500 shadow-blue-500/20',
                                glowColor: 'shadow-blue-500/30'
                              }
                            ].map((status) => (
                              <button
                                key={status.key}
                                onClick={() => setHistoryFormStatus(status.key as any)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all duration-300 ${
                                  historyFormStatus === status.key
                                    ? `${status.activeColor} ring-2 ring-opacity-50 shadow-lg ${status.glowColor}` 
                                    : `${status.baseColor} hover:shadow-md`
                                } hover:${status.glowColor}`}
                              >
                                {status.label}
                              </button>
                            ))}
                          </div>

                          {/* Hours and Date */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">
                                Hours Worked
                                {['done', 'accepted'].includes(historyFormStatus) && (
                                  <span className="text-amber-500 ml-1">(Verified - Cannot Change)</span>
                                )}
                              </label>
                              <input 
                                type="number" 
                                min="0" 
                                step="0.5" 
                                value={historyFormHours} 
                                onChange={(e) => setHistoryFormHours(e.target.value)} 
                                disabled={['done', 'accepted'].includes(historyFormStatus)}
                                className={`w-full px-3 py-2 text-sm border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 ${
                                  ['done', 'accepted'].includes(historyFormStatus) 
                                    ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' 
                                    : 'bg-background/50 text-foreground'
                                }`}
                              />
                              {['done', 'accepted'].includes(historyFormStatus) && (
                                <p className="text-xs text-amber-600">
                                  Hours are verified and cannot be changed
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Date</label>
                              <input 
                                type="date" 
                                value={historyFormDate} 
                                onChange={(e) => setHistoryFormDate(e.target.value)} 
                                className="w-full px-3 py-2 text-sm border border-border/30 bg-background/50 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" 
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Notes</label>
                            <textarea 
                              value={historyFormNotes} 
                              onChange={(e) => setHistoryFormNotes(e.target.value)} 
                              placeholder="Add notes about this work..."
                              className="w-full min-h-[80px] px-3 py-2 text-sm border border-border/30 bg-background/50 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none" 
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-between items-center pt-3 border-t border-border/30">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setExpandedHistoryId(null)}
                                className="flex items-center px-3 py-2 rounded-xl text-xs font-medium bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/30 hover:border-border/60 transition-all duration-200"
                              >
                                <X size={12} className="mr-1" />
                                Close
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                // Update history item
                                try {
                                  const hraw = localStorage.getItem('vp_history');
                                  const hist: any[] = hraw ? JSON.parse(hraw) : [];
                                  if (hist[index]) {
                                    hist[index] = {
                                      ...hist[index],
                                      status: historyFormStatus,
                                      date: historyFormDate,
                                      hours: Math.max(0, parseFloat(historyFormHours || '0')) || 0,
                                      notes: historyFormNotes
                                    };
                                    localStorage.setItem('vp_history', JSON.stringify(hist));
                                    toast({ title: 'History updated successfully!' });
                                    setExpandedHistoryId(null);
                                    // Trigger refresh
                                    window.dispatchEvent(new Event('external-updated'));
                                  }
                                } catch (err: any) {
                                  toast({ title: 'Update failed', description: err?.message ?? String(err), variant: 'destructive' });
                                }
                              }}
                              className="flex items-center px-4 py-2 rounded-xl text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20 hover:border-primary/40 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <Save size={12} className="mr-1" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
      <Suspense fallback={<div className="hidden" />}>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </Suspense>
      <Suspense fallback={<div className="hidden" />}>
        <NotificationsDialog
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
        />
      </Suspense>
      <Suspense fallback={<div className="hidden" />}>
        <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      </Suspense>
    </div>
  );
};

export default Profile;