import { ProfileCard } from "@/components/ProfileCard";
import { Navigation } from "@/components/Navigation";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Search, Settings, Bell, UserPlus } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useMemo, useState } from "react";
import { JobDetailsDialog, type JobDetails } from "@/components/JobDetailsDialog";
import { toast } from "@/hooks/use-toast";
import { SettingsDialog } from "@/components/SettingsDialog";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { InviteDialog } from "@/components/InviteDialog";
import { SignInDialog } from "@/components/SignInDialog";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useNotifications } from "@/context/NotificationsContext";

const Index = () => {
  const qc = useQueryClient();
  const { user, signOut } = useAuth();
  const { push: pushNotification } = useNotifications();

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

  type ApplicationRow = {
    id: string;
    opportunity_id: string;
    student_id: string;
    status: "applied" | "accepted" | "declined" | "waitlisted" | "withdrawn";
    created_at: string | null;
  };

  const opportunitiesQuery = useQuery({
    queryKey: ["opportunities", "home"],
    queryFn: async (): Promise<OpportunityRow[]> => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, organizer_id, title, description, category, location, start_dt, end_dt, slots")
        .order("start_dt", { ascending: true, nullsFirst: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

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

  const applicationsQuery = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async (): Promise<ApplicationRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("id, opportunity_id, student_id, status, created_at")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { name, school, level, xpInLevel, maxXp, totalHours, streak } = useUser();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<JobDetails | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const orgMap = new Map((organizationsQuery.data ?? []).map((o) => [o.id, o.name] as const));
    const list = (opportunitiesQuery.data ?? []).map<JobDetails & { opportunityId: string }>((o) => ({
      title: o.title,
      organization: orgMap.get(o.organizer_id) ?? "Organizer",
      date: o.start_dt ? new Date(o.start_dt).toLocaleString() : "TBD",
      location: o.location ?? undefined,
      duration: o.start_dt && o.end_dt ? `${Math.max(0, (new Date(o.end_dt).getTime() - new Date(o.start_dt).getTime()) / 3600000)} hours` : undefined,
      spots: o.slots ?? undefined,
      category: o.category,
      opportunityId: o.id,
    }));
    return list.filter((o) => {
      const matchesQuery = [o.title, o.organization, o.location, o.category]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(query.toLowerCase()));
      return matchesQuery;
    });
  }, [organizationsQuery.data, opportunitiesQuery.data, query]);

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

  // Saved (bookmarked) opportunities from localStorage
  const savedIds = useMemo(() => {
    try {
      const raw = localStorage.getItem('vp_saved');
      return (raw ? JSON.parse(raw) : []) as string[];
    } catch {
      return [] as string[];
    }
  }, [open]);

  const savedItemsLite = useMemo(() => {
    try {
      const raw = localStorage.getItem('vp_saved_items');
      return (raw ? JSON.parse(raw) : []) as Array<{ id: string; title: string; organization: string; date?: string; location?: string; category: string }>;
    } catch {
      return [] as any[];
    }
  }, [open]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal Header: left profile (plain), centered nav, right actions */}
      <header className="grid grid-cols-[1fr,auto,1fr] items-center p-3 md:p-4 border-b border-border/50 gap-4 md:gap-8">
        {/* Left: Profile */}
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
        {/* Center: Navigation */}
        <div className="justify-self-center">
          <Navigation activeTab="home" />
        </div>
        {/* Right: Unified actions + Auth */}
        <div className="justify-self-end flex items-center gap-1 sm:gap-2">
          <button className="p-2 rounded-full hover:bg-muted/50 transition-colors" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <Settings size={16} className="text-foreground" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted/50 transition-colors" aria-label="Notifications" onClick={() => setNotificationsOpen(true)}>
            <Bell size={16} className="text-foreground" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted/50 transition-colors" aria-label="Invite Friend" onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} className="text-foreground" />
          </button>
          {/* Auth controls */}
          {user ? (
            <div className="flex items-center gap-2 ml-1">
              <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[140px]" title={user.email ?? undefined}>
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={async () => {
                const { error } = await signOut();
                if (error) {
                  toast({ title: "Sign out failed", description: error.message, variant: "destructive" });
                } else {
                  toast({ title: "Signed out" });
                }
              }}>Sign Out</Button>
            </div>
          ) : (
            <SignInDialog />
          )}
        </div>
      </header>

      {/* Main Content - Dashboard layout */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Quick search */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-3xl relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full glass-card text-base focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </section>

        {/* Recommended (subset) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Recommended</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 auto-rows-fr items-stretch">
            {filtered.slice(0, 4).map((opportunity, index) => (
              <div key={index} className="h-full w-full">
                <OpportunityCard {...opportunity} onClick={() => { setSelected(opportunity); setOpen(true); }} />
              </div>
            ))}
            {(!opportunitiesQuery.isLoading && filtered.length === 0) && (
              <div className="text-sm text-muted-foreground">No opportunities yet.</div>
            )}
          </div>
        </section>

        {/* Saved */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Saved</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 auto-rows-fr items-stretch">
            {filtered.filter(f => savedIds.includes(f.opportunityId!)).slice(0, 6).map((opportunity) => (
              <div key={opportunity.opportunityId} className="h-full w-full">
                <OpportunityCard {...opportunity} onClick={() => { setSelected(opportunity); setOpen(true); }} />
              </div>
            ))}
            {savedIds.length === 0 && savedItemsLite.length > 0 && savedItemsLite.slice(0, 6).map((lite) => (
              <div key={lite.id} className="h-full w-full">
                <OpportunityCard
                  title={lite.title}
                  organization={lite.organization}
                  date={lite.date ?? "TBD"}
                  location={lite.location}
                  duration={undefined}
                  spots={undefined}
                  category={lite.category}
                  onClick={() => {
                    setSelected({
                      title: lite.title,
                      organization: lite.organization,
                      date: lite.date ?? "TBD",
                      location: lite.location,
                      duration: undefined,
                      spots: undefined,
                      category: lite.category,
                      opportunityId: lite.id,
                    });
                    setOpen(true);
                  }}
                />
              </div>
            ))}
            {savedIds.length === 0 && savedItemsLite.length === 0 && (
              <div className="text-sm text-muted-foreground">No saved opportunities yet.</div>
            )}
          </div>
        </section>

        <JobDetailsDialog open={open} onOpenChange={setOpen} job={selected} onApply={(id, answers) => applyMutation.mutate({ id, answers })} />
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
        <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />

        {/* My Applications - Live (with Withdraw) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">My Applications</h2>
            <span className="text-sm text-muted-foreground">
              {applicationsQuery.isLoading ? "Loading..." : `${applicationsQuery.data?.length ?? 0} total`}
            </span>
          </div>
          <div className="grid gap-3">
            {applicationsQuery.data?.map((a) => {
              const opp = (opportunitiesQuery.data ?? []).find((o) => o.id === a.opportunity_id);
              const statusClass = a.status === 'accepted' ? 'text-status-confirmed' : a.status === 'declined' ? 'text-destructive' : 'text-status-pending';
              const dotClass = a.status === 'accepted' ? 'bg-status-confirmed' : a.status === 'declined' ? 'bg-destructive' : 'bg-status-pending';
              return (
                <div key={a.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${dotClass}`}></div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{opp?.title ?? 'Opportunity'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{a.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium capitalize ${statusClass}`}>{a.status}</span>
                    {a.status === 'applied' && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        const { error } = await supabase.from('applications').update({ status: 'withdrawn' }).eq('id', a.id);
                        if (error) { toast({ title: 'Withdraw failed', description: error.message, variant: 'destructive' }); return; }
                        qc.invalidateQueries({ queryKey: ['applications', user?.id] });
                        toast({ title: 'Application withdrawn' });
                      }}>Withdraw</Button>
                    )}
                  </div>
                </div>
              );
            })}
            {!applicationsQuery.isLoading && (applicationsQuery.data ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground">No applications yet.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
