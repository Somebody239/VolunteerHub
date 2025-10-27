import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import OrgHeader from "@/components/OrgHeader";
import { useNotifications } from "@/context/NotificationsContext";
import { useHeaderInfo } from "@/hooks/use-header-info";
import { TagEditor } from "@/components/TagEditor";
import { Building2, ShieldCheck, Clock3, Users, BarChart3, Plus, CheckCircle2, AlertTriangle, CalendarDays, Filter } from "lucide-react";
import ApplicantDetailDialog, { type ApplicantProfile } from "@/components/ApplicantDetailDialog";

const schema = z.object({
  title: z.string().min(3, "Enter a title"),
  description: z.string().min(10, "Enter a short description"),
  category: z.string().min(2, "Enter a category"),
  location: z.string().optional(),
  start_dt: z.string().optional(),
  end_dt: z.string().optional(),
  slots: z.coerce.number().int().min(1, "At least 1 slot"),
  fcfs: z.boolean().optional(),
  tagsCsv: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Opportunity = {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  start_dt: string | null;
  end_dt: string | null;
  slots: number | null;
  created_at: string;
  fcfs?: boolean | null;
  tags?: string[] | null;
};

type Application = {
  id: string;
  opportunity_id: string;
  student_id: string;
  status: "applied" | "accepted" | "declined" | "waitlisted" | "withdrawn" | "done" | "verify";
  created_at: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
};

const OrgPortal: React.FC = () => {
  const { user } = useAuth();
  const header = useHeaderInfo();
  const qc = useQueryClient();
  const { push: pushNotification } = useNotifications();
  const [tab, setTab] = useState<"active" | "upcoming" | "past">("active");
  const orgInfoQuery = useQuery({
    queryKey: ["organizations", user?.id, "header"],
    queryFn: async (): Promise<{ name?: string; verified?: boolean } | null> => {
      if (!user) return null;
      const { data, error } = await supabase.from("organizations").select("name, verified").eq("id", user.id).maybeSingle();
      if (error) return null;
      return data as any;
    },
    enabled: !!user,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", category: "Community", location: "", start_dt: "", end_dt: "", slots: 10, fcfs: false, tagsCsv: "" },
  });

  const listQuery = useQuery({
    queryKey: ["opportunities", user?.id],
    queryFn: async (): Promise<Opportunity[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, organizer_id, title, description, category, location, start_dt, end_dt, slots, created_at, fcfs, tags, is_deleted")
        .eq("organizer_id", user.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const applicationsQuery = useQuery({
    queryKey: ["applications", user?.id, (listQuery.data ?? []).map((o) => o.id).join(",")],
    queryFn: async (): Promise<(Application & { answers_json?: any })[]> => {
      if (!user) return [];
      const oppIds = (listQuery.data ?? []).map((o) => o.id);
      if (oppIds.length === 0) return [];
      let q = supabase
        .from("applications")
        .select("id, opportunity_id, student_id, status, created_at, answers_json")
        .order("created_at", { ascending: false });
      if (oppIds.length === 1) {
        q = q.eq("opportunity_id", oppIds[0]);
      } else {
        q = q.in("opportunity_id", oppIds);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!listQuery.data,
  });

  const studentIds = useMemo(() => Array.from(new Set((applicationsQuery.data ?? []).map((a) => a.student_id))), [applicationsQuery.data]);

  const profilesQuery = useQuery({
    queryKey: ["profiles", studentIds.join(",")],
    queryFn: async (): Promise<(Profile & { location?: string | null; availability?: string | null; total_hours?: number | null; on_time_rate?: number | null; show_up_rate?: number | null; contact_email?: string | null })[]> => {
      if (studentIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, location, availability, total_hours, on_time_rate, show_up_rate, contact_email")
        .in("id", studentIds)
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: studentIds.length > 0,
  });

  const profileName = (id: string) => (profilesQuery.data || []).find((p) => p.id === id)?.full_name ?? "Student";
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProfile, setDetailProfile] = useState<ApplicantProfile | null>(null);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Application["status"] }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Application updated" });
      qc.invalidateQueries({ queryKey: ["applications", user?.id] });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message ?? String(e), variant: "destructive" }),
  });

  

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        organizer_id: user.id,
        title: values.title,
        description: values.description,
        category: values.category,
        location: values.location || null,
        start_dt: values.start_dt || null,
        end_dt: values.end_dt || null,
        slots: values.slots,
        fcfs: values.fcfs ?? false,
        tags: (values.tagsCsv ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      };
      const { error } = await supabase.from("opportunities").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Opportunity created" });
      form.reset({ title: "", description: "", category: "Community", location: "", start_dt: "", end_dt: "", slots: 10, fcfs: false, tagsCsv: "" });
      qc.invalidateQueries({ queryKey: ["opportunities", user?.id] });
    },
    onError: (e: any) => toast({ title: "Could not create", description: e.message ?? String(e), variant: "destructive" }),
  });

  // Derived dashboard stats
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(startOfDay); endOfWeek.setDate(endOfWeek.getDate() + 7);
  const opps = listQuery.data ?? [];
  const apps = applicationsQuery.data ?? [];
  const activeOpps = opps.filter(o => !o.end_dt || new Date(o.end_dt) >= now).length;
  const pendingApplicants = apps.filter(a => a.status === 'applied').length;
  const upcomingThisWeek = opps.filter(o => o.start_dt && new Date(o.start_dt) >= startOfDay && new Date(o.start_dt) <= endOfWeek).length;
  const totals = opps.reduce((acc, o) => {
    const accepted = apps.filter(a => a.opportunity_id === o.id && a.status === 'accepted').length;
    const slots = Math.max(0, o.slots ?? 0);
    acc.accepted += accepted; acc.slots += slots; return acc;
  }, { accepted: 0, slots: 0 });
  const fillRate = totals.slots > 0 ? Math.round((totals.accepted / totals.slots) * 100) : 0;

  // Tab filtering
  const jobsByTab = useMemo(() => {
    const isPast = (o: Opportunity) => !!o.end_dt && new Date(o.end_dt) < now;
    const isUpcoming = (o: Opportunity) => !!o.start_dt && new Date(o.start_dt) > now;
    const isActive = (o: Opportunity) => !isPast(o) && !isUpcoming(o);
    return {
      active: opps.filter(isActive),
      upcoming: opps.filter(isUpcoming),
      past: opps.filter(isPast),
    };
  }, [opps]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OrgHeader activeTab="org" />

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Dashboard Cards */}
        <section className="grid gap-4 md:grid-cols-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users size={14} /> Active Opportunities</div>
            <div className="mt-1 text-2xl font-semibold">{activeOpps}</div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 size={14} /> Pending Applicants</div>
            <div className="mt-1 text-2xl font-semibold">{pendingApplicants}</div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays size={14} /> Upcoming (7d)</div>
            <div className="mt-1 text-2xl font-semibold">{upcomingThisWeek}</div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><BarChart3 size={14} /> Fill Rate</div>
            <div className="mt-1 text-2xl font-semibold">{fillRate}%</div>
            <div className="mt-2 h-2 bg-level rounded-full overflow-hidden" aria-label="Fill rate" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fillRate}>
              <div className="h-full bg-xp progress-fill rounded-full" style={{ width: `${fillRate}%` }} />
            </div>
          </div>
        </section>

        {/* Quick Actions & Alerts */}
        <section className="grid gap-4 md:grid-cols-[2fr,1fr] items-stretch">
          <div className="glass-card p-4">
            <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => document.getElementById('create-opportunity')?.scrollIntoView({ behavior: 'smooth' })}><Plus size={14} className="mr-1" /> Post Opportunity</Button>
              <Button size="sm" variant="outline" onClick={() => document.getElementById('applicants')?.scrollIntoView({ behavior: 'smooth' })}><Filter size={14} className="mr-1" /> View Applicants</Button>
              <Button size="sm" variant="outline" disabled title="Coming soon">Verify Hours (bulk)</Button>
              <Button size="sm" variant="outline" disabled title="Coming soon">Export Logs</Button>
            </div>
          </div>
          <div className="glass-card p-4">
            <h2 className="text-sm font-semibold mb-3">Notifications</h2>
            <div className="text-xs text-muted-foreground flex items-center gap-2"><AlertTriangle size={14} /> No alerts</div>
          </div>
        </section>

        {/* Jobs Manager */}
        <section className="glass-card p-4 md:p-6 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Opportunities</h2>
            <div className="flex items-center gap-1 text-xs">
              {(["active","upcoming","past"] as const).map(k => (
                <button key={k} className={`px-3 py-1 rounded-full border ${tab===k? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/40'}`} onClick={() => setTab(k)}>{k[0].toUpperCase()+k.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {jobsByTab[tab].map((o) => {
              const accepted = apps.filter(a => a.opportunity_id === o.id && a.status === 'accepted').length;
              const total = Math.max(0, o.slots ?? 0);
              const fill = total>0 ? Math.round((accepted/total)*100) : 0;
              const pending = apps.filter(a => a.opportunity_id === o.id && a.status === 'applied').length;
              return (
                <div key={o.id} className="glass-card p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{o.title}</p>
                      <p className="text-xs text-muted-foreground">{o.category} • {o.location || ''}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{accepted}/{total} filled</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-level rounded-full overflow-hidden"><div className="h-full bg-xp" style={{width:`${fill}%`}} /></div>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
                    {pending>0 && <span>Applications Pending</span>}
                    {total>0 && accepted<Math.ceil(total*0.5) && <span>Low Signups</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => document.getElementById('applicants')?.scrollIntoView({behavior:'smooth'})}>View Applicants</Button>
                    <Button size="sm" variant="outline" onClick={async () => { 
                      const { error } = await supabase.from('opportunities').update({ is_deleted: true }).eq('id', o.id);
                      if (error) {
                        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
                        return;
                      }
                      qc.invalidateQueries({ queryKey: ["opportunities", user?.id] });
                      toast({ title: 'Listing removed' });
                    }}>Delete</Button>
                    <Button size="sm" variant="outline" disabled>Edit</Button>
                    <Button size="sm" variant="outline" disabled>Duplicate</Button>
                    <Button size="sm" variant="outline" disabled>Close</Button>
                  </div>
                </div>
              );
            })}
            {jobsByTab[tab].length===0 && <div className="text-sm text-muted-foreground">No items.</div>}
          </div>
        </section>

        <section id="create-opportunity" className="glass-card p-4 md:p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Create Opportunity</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="grid gap-3 md:grid-cols-2">
              <FormField name="title" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="Food Pantry Helper" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="category" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Category</FormLabel>
                  <FormControl><Input placeholder="Community" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="description" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Describe the role, tasks, and expectations" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="location" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Location</FormLabel>
                  <FormControl><Input placeholder="Austin, TX or Remote" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="slots" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Slots</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="start_dt" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Start (ISO or date)</FormLabel>
                  <FormControl><Input placeholder="2025-09-15 10:00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="end_dt" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>End (ISO or date)</FormLabel>
                  <FormControl><Input placeholder="2025-09-15 13:00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="tagsCsv" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagEditor value={field.value ?? ''} onChange={(csv) => field.onChange(csv)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="fcfs" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <input id="fcfs" type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
                    <FormLabel htmlFor="fcfs">First-Come-First-Serve (auto-accept until slots are full)</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="md:col-span-2 flex justify-end pt-2">
                <Button type="submit" disabled={createMutation.isPending}>Create</Button>
              </div>
            </form>
          </Form>
        </section>

        <section id="applicants" className="space-y-3">
          <h2 className="text-lg font-semibold">Applicant Management</h2>
          {applicationsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading applications...</div>
          ) : applicationsQuery.error ? (
            <div className="text-sm text-destructive">{(applicationsQuery.error as any).message ?? String(applicationsQuery.error)}</div>
          ) : (
            <div className="grid gap-3">
              {(applicationsQuery.data ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">No applications yet.</div>
              )}
              {[...(applicationsQuery.data ?? [])].sort((a,b)=> (a.status==='applied'?0:1)-(b.status==='applied'?0:1)).map((a) => {
                const opp = (listQuery.data ?? []).find((o) => o.id === a.opportunity_id);
                return (
                  <div key={a.id} className="glass-card p-4 rounded-xl flex items-center justify-between">
                    <div className="min-w-0 cursor-pointer" onClick={() => {
                      const p = (profilesQuery.data || []).find((pr) => pr.id === a.student_id) as any;
                      setDetailProfile({
                        id: a.student_id,
                        full_name: p?.full_name || 'Student',
                        location: p?.location ?? null,
                        availability: p?.availability ?? null,
                        total_hours: p?.total_hours ?? 0,
                        on_time_rate: p?.on_time_rate ?? 0,
                        show_up_rate: p?.show_up_rate ?? 0,
                        contact_email: p?.contact_email ?? null,
                      });
                      setDetailOpen(true);
                    }}>
                      <p className="font-medium truncate">{opp?.title ?? "Opportunity"}</p>
                      <p className="text-xs text-muted-foreground truncate">{profileName(a.student_id)} • {new Date(a.created_at ?? "").toLocaleString()}</p>
                      {a.answers_json && (
                        <div className="mt-2 text-xs text-muted-foreground line-clamp-3">
                          {a.answers_json.why && (<p><span className="text-foreground">Why:</span> {a.answers_json.why}</p>)}
                          {a.answers_json.experience && (<p><span className="text-foreground">Experience:</span> {a.answers_json.experience}</p>)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs capitalize ${a.status === 'accepted' ? 'text-status-confirmed' : a.status === 'declined' ? 'text-destructive' : a.status === 'done' ? 'text-green-600' : 'text-status-pending'}`}>{a.status === 'applied' ? 'in review' : a.status}</span>
                      <div className="flex gap-1">
                        {a.status === 'applied' && (
                          <>
                            <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: a.id, status: "accepted" })}>Accept</Button>
                            <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: a.id, status: "declined" })}>Decline</Button>
                          </>
                        )}
                        {a.status === 'accepted' && (
                          <>
                            <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: a.id, status: "done" })}>Mark Complete</Button>
                            <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: a.id, status: "verify" })}>Verify Hours</Button>
                          </>
                        )}
                        {(a.status === 'done' || a.status === 'verify') && (
                          <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: a.id, status: "accepted" })}>Re-open</Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <ApplicantDetailDialog open={detailOpen} onOpenChange={setDetailOpen} profile={detailProfile} />

        <section className="glass-card p-4 md:p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Organization Settings</h2>
          <OrgSettings />
        </section>
      </main>
    </div>
  );
};

const OrgSettings: React.FC = () => {
  const { user } = useAuth();
  const { push } = useNotifications();
  const form = useForm<{ name: string; website?: string; about?: string; location?: string }>({ defaultValues: { name: "", website: "", about: "", location: "" } });

  useQuery({
    queryKey: ["organizations", user?.id, "settings"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("organizations").select("name, website, about, location").eq("id", user.id).maybeSingle();
      if (error) return null;
      if (data) form.reset({ name: (data as any).name ?? "", website: (data as any).website ?? "", about: (data as any).about ?? "", location: (data as any).location ?? "" });
      return data;
    },
    enabled: !!user,
  });

  const onSubmit = async (v: { name: string; website?: string; about?: string; location?: string }) => {
    if (!user) return;
    const payload: any = { id: user.id, name: v.name, updated_at: new Date().toISOString() };
    if (v.website) payload.website = v.website;
    if (v.about) payload.about = v.about;
    if (v.location) payload.location = v.location;
    const { error } = await supabase.from("organizations").upsert(payload, { onConflict: "id" });
    if (error) { toast({ title: "Could not save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Organization updated" });
    push({ kind: "success", text: "Organization profile saved." });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-1">
        <Label>Name</Label>
        <Input placeholder="Your Organization" {...form.register("name", { required: true })} />
      </div>
      <div className="md:col-span-1">
        <Label>Website</Label>
        <Input placeholder="https://example.org" {...form.register("website")} />
      </div>
      <div className="md:col-span-2">
        <Label>About</Label>
        <Textarea placeholder="Mission and overview" {...form.register("about")} />
      </div>
      <div className="md:col-span-1">
        <Label>Location</Label>
        <Input placeholder="Austin, TX" {...form.register("location")} />
      </div>
      <div className="md:col-span-2 flex justify-end pt-2">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

export default OrgPortal;
