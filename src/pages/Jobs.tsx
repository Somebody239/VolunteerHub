import { ProfileCard } from "@/components/ProfileCard";
import { Navigation } from "@/components/Navigation";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Search, Filter, Settings, Bell, UserPlus } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useMemo, useState } from "react";
import { JobDetailsDialog, type JobDetails } from "@/components/JobDetailsDialog";
import { toast } from "@/hooks/use-toast";
import { SettingsDialog } from "@/components/SettingsDialog";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { InviteDialog } from "@/components/InviteDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationsContext";

const Jobs = () => {
  const qc = useQueryClient();
  const { push: pushNotification } = useNotifications();
  const { user } = useAuth();

  type OpportunityRow = {
    id: string;
    organizer_id: string;
    title: string;
    description: string | null;
    category: string;
    location: string | null;
    start_dt: string | null;
    end_dt: string | null;
    slots: number | null;
  };

  type OrganizationRow = {
    id: string; // owner id matches auth user id for now
    name: string;
  };

  const resultsQuery = useQuery({
    queryKey: ["opportunities", "jobs"],
    queryFn: async (): Promise<OpportunityRow[]> => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, organizer_id, title, description, category, location, start_dt, end_dt, slots")
        .order("start_dt", { ascending: true, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Removed dev seeding button per request; fallback samples remain for UX

  const organizationsQuery = useQuery({
    queryKey: ["organizations", "all"],
    queryFn: async (): Promise<OrganizationRow[]> => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { name, school, level, xpInLevel, maxXp, totalHours, streak } = useUser();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<JobDetails | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"soonest" | "slots">("soonest");
  const categories = useMemo(() => Array.from(new Set((resultsQuery.data ?? []).map(o => o.category))), [resultsQuery.data]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const filtered = useMemo(() => {
    const orgMap = new Map((organizationsQuery.data ?? []).map((o) => [o.id, o.name] as const));
    const raw = (resultsQuery.data ?? []);
    const fallbackOrgs = new Map<string, string>([
      ["orgA", "Green Austin Initiative"],
      ["orgB", "Austin Public Library"],
      ["orgC", "Central Food Bank"],
      ["orgD", "Tech for Seniors"],
      ["orgE", "Animal Rescue ATX"],
      ["orgF", "City Parks Dept"],
    ]);
    if (raw.length === 0) {
      // merge fallback org names so organizer displays nicely
      for (const [k, v] of fallbackOrgs.entries()) orgMap.set(k, v);
    }
    const source = raw.length > 0 ? raw : [
      { id: "s1", organizer_id: "orgA", title: "Community Garden Cleanup", description: null, category: "Environment", location: "Zilker Park", start_dt: new Date(Date.now()+48*3600000).toISOString(), end_dt: new Date(Date.now()+51*3600000).toISOString(), slots: 12 },
      { id: "s2", organizer_id: "orgB", title: "Elementary School Reading Program", description: null, category: "Education", location: "Central Library", start_dt: new Date(Date.now()+72*3600000).toISOString(), end_dt: new Date(Date.now()+74*3600000).toISOString(), slots: 5 },
      { id: "s3", organizer_id: "orgA", title: "Park Clean-Up Lead", description: null, category: "Environment", location: "Town Lake", start_dt: new Date(Date.now()+96*3600000).toISOString(), end_dt: new Date(Date.now()+100*3600000).toISOString(), slots: 6 },
      { id: "s4", organizer_id: "orgB", title: "Senior Tech Buddy", description: null, category: "Technology", location: "Downtown Center", start_dt: new Date(Date.now()+120*3600000).toISOString(), end_dt: new Date(Date.now()+121.5*3600000).toISOString(), slots: 3 },
      { id: "s5", organizer_id: "orgC", title: "Food Bank Sorting", description: null, category: "Community", location: "Riverside Warehouse", start_dt: new Date(Date.now()+36*3600000).toISOString(), end_dt: new Date(Date.now()+39*3600000).toISOString(), slots: 20 },
      { id: "s6", organizer_id: "orgD", title: "Tech Help Drop-In", description: null, category: "Technology", location: "Senior Center East", start_dt: new Date(Date.now()+168*3600000).toISOString(), end_dt: new Date(Date.now()+170*3600000).toISOString(), slots: 8 },
      { id: "s7", organizer_id: "orgE", title: "Animal Shelter Walker", description: null, category: "Animals", location: "Shelter North", start_dt: new Date(Date.now()+24*3600000).toISOString(), end_dt: new Date(Date.now()+26*3600000).toISOString(), slots: 10 },
      { id: "s8", organizer_id: "orgF", title: "Park Trail Maintenance", description: null, category: "Environment", location: "Barton Creek", start_dt: new Date(Date.now()+192*3600000).toISOString(), end_dt: new Date(Date.now()+195*3600000).toISOString(), slots: 15 },
      { id: "s9", organizer_id: "orgC", title: "Mobile Pantry Setup", description: null, category: "Community", location: "Eastside Lot", start_dt: new Date(Date.now()+12*3600000).toISOString(), end_dt: new Date(Date.now()+14*3600000).toISOString(), slots: 6 },
      { id: "s10", organizer_id: "orgE", title: "Pet Adoption Event Helper", description: null, category: "Animals", location: "Domain Plaza", start_dt: new Date(Date.now()+216*3600000).toISOString(), end_dt: new Date(Date.now()+219*3600000).toISOString(), slots: 9 },
      { id: "s11", organizer_id: "orgB", title: "Library Makerspace Mentor", description: null, category: "Education", location: "Carver Branch", start_dt: new Date(Date.now()+60*3600000).toISOString(), end_dt: new Date(Date.now()+63*3600000).toISOString(), slots: 4 },
      { id: "s12", organizer_id: "orgF", title: "City Creek Clean-Up", description: null, category: "Environment", location: "Shoal Creek", start_dt: new Date(Date.now()+84*3600000).toISOString(), end_dt: new Date(Date.now()+87*3600000).toISOString(), slots: 30 },
    ];
    let list = source.map<JobDetails & { opportunityId: string; start?: string; slotsNum?: number }>((o: any) => ({
      title: o.title,
      organization: orgMap.get(o.organizer_id) ?? "Organizer",
      date: o.start_dt ? new Date(o.start_dt).toLocaleString() : "TBD",
      location: o.location ?? undefined,
      duration: o.start_dt && o.end_dt ? `${Math.max(0, (new Date(o.end_dt).getTime() - new Date(o.start_dt).getTime()) / 3600000)} hours` : undefined,
      spots: o.slots ?? undefined,
      category: o.category,
      opportunityId: o.id,
      start: o.start_dt ?? undefined,
      slotsNum: o.slots ?? undefined,
    }));
    return list.filter((o) => {
      const matchesQuery = [o.title, o.organization, o.location, o.category]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(query.toLowerCase()));
      const matchesCat = activeCategories.length === 0 || activeCategories.includes(o.category);
      return matchesQuery && matchesCat;
    }).sort((a, b) => {
      if (sortBy === "slots") {
        return (b.slotsNum ?? 0) - (a.slotsNum ?? 0);
      }
      // soonest
      const ta = a.start ? new Date(a.start).getTime() : Infinity;
      const tb = b.start ? new Date(b.start).getTime() : Infinity;
      return ta - tb;
    });
  }, [organizationsQuery.data, resultsQuery.data, query, activeCategories, sortBy]);

  const applyMutation = useMutation({
    mutationFn: async (payloadIn: { id?: string; answers?: Record<string, any> }) => {
      if (!user) throw new Error("Please sign in to apply");
      if (!payloadIn.id) throw new Error("Missing opportunity id");
      const payload = {
        opportunity_id: payloadIn.id,
        student_id: user.id,
        status: "applied",
        answers_json: payloadIn.answers ?? null,
        created_at: new Date().toISOString(),
      };
      const { data: created, error } = await supabase.from("applications").insert(payload).select("id").single();
      if (error) throw error;

      // FCFS auto-accept: if opportunity.fcfs and accepted < slots, promote to accepted
      const { data: opp } = await supabase.from("opportunities").select("slots, fcfs").eq("id", payloadIn.id).maybeSingle();
      if (opp?.fcfs && typeof opp.slots === 'number' && opp.slots > 0 && created?.id) {
        const { count } = await supabase.from("applications").select("id", { count: "exact", head: true }).eq("opportunity_id", payloadIn.id).eq("status", "accepted");
        if ((count ?? 0) < opp.slots) {
          await supabase.from("applications").update({ status: "accepted" }).eq("id", created.id);
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Application submitted" });
      qc.invalidateQueries({ queryKey: ["applications", user?.id] });
      pushNotification({ kind: "success", text: "Your application was submitted." });
    },
    onError: (e: any) => toast({ title: "Could not apply", description: e.message ?? String(e), variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="grid grid-cols-[1fr,auto,1fr] items-center p-3 md:p-4 border-b border-border/50 gap-4 md:gap-8">
        <div className="justify-self-start min-w-0 w-full pr-4 md:pr-8">
          <ProfileCard
            name={name}
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
          <Navigation activeTab="jobs" />
        </div>
        <div className="justify-self-end hidden sm:flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-muted/50 transition-colors" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <Settings size={16} />
          </button>
          <button className="p-2 rounded-full hover:bg-muted/50 transition-colors" aria-label="Notifications" onClick={() => setNotificationsOpen(true)}>
            <Bell size={16} />
          </button>
          <button className="p-2 rounded-full hover:bg-muted/50 transition-colors" aria-label="Invite Friend" onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} />
          </button>
          {user && (
            <>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={user.email ?? undefined}>{user.email}</span>
              <Button variant="outline" size="sm" onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  toast({ title: "Sign out failed", description: error.message, variant: "destructive" });
                } else {
                  toast({ title: "Signed out" });
                }
              }}>Sign Out</Button>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Search + Filters */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-4xl relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search opportunities, orgs, or tags"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full glass-card text-base focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-3">
            <button className="p-3 glass-card card-hover rounded-full" aria-label="Filters" title="Toggle category filters" onClick={() => {
              if (activeCategories.length) setActiveCategories([]); else setActiveCategories([...categories]);
            }}>
              <Filter size={18} />
            </button>
          </div>
        </section>

        {/* Filter chips (category-based, interactive) */}
        {categories.length > 0 && (
          <section className="flex flex-wrap items-center gap-2 justify-center">
            {categories.map((c) => {
              const active = activeCategories.includes(c);
              return (
                <button key={c} onClick={() => setActiveCategories(prev => active ? prev.filter(x => x!==c) : [...prev, c])} className={`px-3 py-1.5 rounded-full text-sm ${active ? 'bg-foreground text-background' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'}`}>
                  {c}
                </button>
              );
            })}
          </section>
        )}

        {/* Results */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Results</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-full p-0.5">
                <button
                  className={`px-3 py-1 text-xs rounded-full ${sortBy === 'soonest' ? 'bg-foreground text-background' : 'text-foreground/80'}`}
                  onClick={() => setSortBy('soonest')}
                  aria-label="Sort by soonest"
                >
                  Soonest
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded-full ${sortBy === 'slots' ? 'bg-foreground text-background' : 'text-foreground/80'}`}
                  onClick={() => setSortBy('slots')}
                  aria-label="Sort by most slots"
                >
                  Slots
                </button>
              </div>
              <span className="text-sm text-muted-foreground">{resultsQuery.isLoading ? "Loading..." : `${resultsQuery.data?.length ?? 0} opportunities`}</span>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 auto-rows-fr items-stretch">
            {filtered.map((item, idx) => (
              <div key={idx} className="h-full w-full">
                <OpportunityCard {...item} onClick={() => { setSelected(item); setOpen(true); }} />
              </div>
            ))}
          </div>
          <JobDetailsDialog open={open} onOpenChange={setOpen} job={selected} onApply={(id, answers) => applyMutation.mutate({ id, answers })} />
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
          <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
          <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
        </section>
      </main>
    </div>
  );
};

export default Jobs;
