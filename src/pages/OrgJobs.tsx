import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import OrgHeader from "@/components/OrgHeader";
import { TagEditor } from "@/components/TagEditor";
import { Users, Plus } from "lucide-react";
import ApplicantDetailDialog, { type ApplicantProfile } from "@/components/ApplicantDetailDialog";
import { useHeaderInfo } from "@/hooks/use-header-info";
import VerifyHoursDialog, { type VerifyHoursPayload } from "@/components/VerifyHoursDialog";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import DateTimePicker from "@/components/DateTimePicker";

const schema = z.object({
  title: z.string().min(3, "Enter a title"),
  description: z.string().min(10, "Enter a short description"),
  category: z.string().min(2, "Enter a category"),
  location: z.string().optional(),
  min_age: z.coerce.number().int().min(0).max(120).optional(),
  max_age: z.coerce.number().int().min(0).max(120).optional(),
  start_dt: z.string().optional(),
  end_dt: z.string().optional(),
  slots: z.coerce.number().int().min(1, "At least 1 slot"),
  fcfs: z.boolean().optional(),
  tagsCsv: z.string().optional(),
  apply_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  contact_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
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

type Profile = { id: string; full_name: string | null };

const OrgJobs: React.FC = () => {
  const { user } = useAuth();
  const header = useHeaderInfo();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"active" | "upcoming" | "past">("active");
  const [questions, setQuestions] = useState<Array<{ id: string; label: string; type: "short_text" | "long_text" | "select"; required?: boolean; options?: string[] }>>([]);
  const [newQ, setNewQ] = useState<{ label: string; type: "short_text" | "long_text" | "select"; required: boolean; optionsCsv: string }>({ label: "", type: "short_text", required: false, optionsCsv: "" });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", category: "Community", location: "", min_age: undefined, max_age: undefined, start_dt: "", end_dt: "", slots: 10, fcfs: false, tagsCsv: "", apply_url: "", contact_email: "" },
  });

  const listQuery = useQuery({
    queryKey: ["opportunities", user?.id],
    queryFn: async (): Promise<Opportunity[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, organizer_id, title, description, category, location, start_dt, end_dt, slots, created_at, fcfs, tags, application_form")
        .eq("organizer_id", user.id)
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

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        organizer_id: user.id,
        title: values.title,
        description: values.description,
        category: values.category,
        location: values.location || null,
        min_age: values.min_age ?? null,
        max_age: values.max_age ?? null,
        start_dt: values.start_dt || null,
        end_dt: values.end_dt || null,
        slots: values.slots,
        fcfs: values.fcfs ?? false,
        tags: (values.tagsCsv ?? "").split(",").map((t) => t.trim()).filter(Boolean),
        apply_url: values.apply_url || null,
        contact_email: values.contact_email || null,
        application_form: questions,
      };
      const { error } = await supabase.from("opportunities").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Opportunity created" });
      form.reset({ title: "", description: "", category: "Community", location: "", min_age: undefined, max_age: undefined, start_dt: "", end_dt: "", slots: 10, fcfs: false, tagsCsv: "", apply_url: "", contact_email: "" });
      setQuestions([]);
      qc.invalidateQueries({ queryKey: ["opportunities", user?.id] });
    },
    onError: (e: any) => toast({ title: "Could not create", description: e.message ?? String(e), variant: "destructive" }),
  });

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

  const closeOpportunity = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // Mark as closed by setting end_dt to now
      const { error } = await supabase.from("opportunities").update({ end_dt: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Opportunity closed" });
      qc.invalidateQueries({ queryKey: ["opportunities", user?.id] });
    },
    onError: (e: any) => toast({ title: "Close failed", description: e.message ?? String(e), variant: "destructive" }),
  });

  const reopenOpportunity = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // Reopen by clearing end_dt
      const { error } = await supabase.from("opportunities").update({ end_dt: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Opportunity reopened" });
      qc.invalidateQueries({ queryKey: ["opportunities", user?.id] });
    },
    onError: (e: any) => toast({ title: "Reopen failed", description: e.message ?? String(e), variant: "destructive" }),
  });

  const now = new Date();
  const jobsByTab = useMemo(() => {
    const isPast = (o: Opportunity) => !!o.end_dt && new Date(o.end_dt) < now;
    const isUpcoming = (o: Opportunity) => !!o.start_dt && new Date(o.start_dt) > now;
    const isActive = (o: Opportunity) => !isPast(o) && !isUpcoming(o);
    const opps = (listQuery.data ?? []);
    return {
      active: opps.filter(isActive),
      upcoming: opps.filter(isUpcoming),
      past: opps.filter(isPast),
    };
  }, [listQuery.data]);

  const apps = applicationsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OrgHeader activeTab="org_jobs" />

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
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
              const isClosed = !!o.end_dt && new Date(o.end_dt) < now;
              return (
                <div key={o.id} className="glass-card p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{o.title}</p>
                      <p className="text-xs text-muted-foreground">{o.category} • {o.location || ''}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{accepted}/{total} filled</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{width:`${fill}%`}} /></div>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
                    {pending>0 && <span>Applications Pending</span>}
                    {total>0 && accepted<Math.ceil(total*0.5) && <span>Low Signups</span>}
                    {isClosed && <span>Closed</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => document.getElementById('applicants')?.scrollIntoView({behavior:'smooth'})}>View Applicants</Button>
                    <Button size="sm" variant="outline" disabled>Edit</Button>
                    <Button size="sm" variant="outline" disabled>Duplicate</Button>
                    {!isClosed ? (
                      <Button size="sm" variant="outline" disabled={closeOpportunity.isPending} onClick={() => closeOpportunity.mutate({ id: o.id })}>Close</Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={reopenOpportunity.isPending} onClick={() => reopenOpportunity.mutate({ id: o.id })}>Reopen</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={async () => { 
                      const { error } = await supabase.from('opportunities').update({ is_deleted: true }).eq('id', o.id);
                      if (error) {
                        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
                        return;
                      }
                      qc.invalidateQueries({ queryKey: ["opportunities", user?.id] });
                      toast({ title: 'Listing removed' });
                    }}>Delete</Button>
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <LocationAutocomplete
                      value={field.value ?? ''}
                      onChange={(label) => field.onChange(label)}
                      placeholder="Search address..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="min_age" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Minimum Age</FormLabel>
                  <FormControl><Input type="number" min={0} max={120} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="max_age" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Maximum Age</FormLabel>
                  <FormControl><Input type="number" min={0} max={120} {...field} /></FormControl>
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
                  <FormLabel>Start</FormLabel>
                  <FormControl>
                    <DateTimePicker value={field.value ?? ''} onChange={(v) => field.onChange(v)} placeholder="Pick start" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="end_dt" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>End</FormLabel>
                  <FormControl>
                    <DateTimePicker value={field.value ?? ''} onChange={(v) => field.onChange(v)} placeholder="Pick end" />
                  </FormControl>
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
              <FormField name="apply_url" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>External Apply URL</FormLabel>
                  <FormControl><Input placeholder="https://company.com/apply" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="contact_email" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl><Input placeholder="hr@company.com" {...field} /></FormControl>
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

        <section className="glass-card p-4 md:p-6 rounded-xl">
          <h3 className="text-md font-semibold mb-3">Application Form (optional)</h3>
          <div className="grid md:grid-cols-4 gap-2 items-end">
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">Question label</label>
              <input className="w-full rounded-md border border-input bg-background text-foreground text-sm p-2"
                     placeholder="e.g., Why are you interested?"
                     value={newQ.label}
                     onChange={(e) => setNewQ((q) => ({ ...q, label: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <select className="w-full rounded-md border border-input bg-background text-foreground text-sm p-2"
                      value={newQ.type}
                      onChange={(e) => setNewQ((q) => ({ ...q, type: e.target.value as any }))}>
                <option value="short_text">Short text</option>
                <option value="long_text">Long text</option>
                <option value="select">Select</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input id="req" type="checkbox" checked={newQ.required} onChange={(e) => setNewQ((q) => ({ ...q, required: e.target.checked }))} />
              <label htmlFor="req" className="text-xs text-muted-foreground">Required</label>
            </div>
            {newQ.type === "select" && (
              <div className="md:col-span-4">
                <label className="text-xs text-muted-foreground">Options (comma separated)</label>
                <input className="w-full rounded-md border border-input bg-background text-foreground text-sm p-2"
                       placeholder="Yes,No,Maybe"
                       value={newQ.optionsCsv}
                       onChange={(e) => setNewQ((q) => ({ ...q, optionsCsv: e.target.value }))} />
              </div>
            )}
            <div className="md:col-span-4 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => {
                const label = newQ.label.trim();
                if (!label) { toast({ title: "Add a label", variant: "destructive" }); return; }
                const id = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`;
                const opts = newQ.type === "select" ? (newQ.optionsCsv || "").split(",").map(s => s.trim()).filter(Boolean) : undefined;
                setQuestions((arr) => [...arr, { id, label, type: newQ.type, required: newQ.required, options: opts }]);
                setNewQ({ label: "", type: "short_text", required: false, optionsCsv: "" });
              }}>Add Question</Button>
            </div>
          </div>
          {questions.length > 0 && (
            <div className="mt-3 grid gap-2">
              {questions.map((q) => (
                <div key={q.id} className="flex items-center justify-between border rounded-md p-2">
                  <div className="text-sm">
                    <div className="font-medium">{q.label} {q.required ? "*" : ""}</div>
                    <div className="text-xs text-muted-foreground">{q.type}{q.type === "select" && q.options?.length ? ` • ${q.options.join(", ")}` : ""}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setQuestions((arr) => arr.filter((x) => x.id !== q.id))}>Remove</Button>
                </div>
              ))}
            </div>
          )}
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
                        <div className="mt-2 text-xs text-muted-foreground line-clamp-4">
                          {opp && Array.isArray((opp as any).application_form) && (opp as any).application_form.length > 0 ? (
                            <>
                              {(opp as any).application_form.map((q: any) => {
                                const key = q.id || q.label;
                                const val = a.answers_json?.[key];
                                if (val == null || val === "") return null;
                                return <p key={key}><span className="text-foreground">{q.label}:</span> {String(val)}</p>;
                              })}
                            </>
                          ) : (
                            <>
                              {a.answers_json.why && (<p><span className="text-foreground">Why:</span> {a.answers_json.why}</p>)}
                              {a.answers_json.experience && (<p><span className="text-foreground">Experience:</span> {a.answers_json.experience}</p>)}
                            </>
                          )}
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
                            <VerifyActionButton aId={a.id} studentId={a.student_id} oppTitle={opp?.title} studentName={profileName(a.student_id)} />
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
      </main>
    </div>
  );
};

const VerifyActionButton: React.FC<{ aId: string; studentId: string; oppTitle?: string; studentName?: string }> = ({ aId, studentId, oppTitle, studentName }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const onSubmit = async (payload: VerifyHoursPayload) => {
    if (!user) return;
    const nowIso = new Date().toISOString();
    // Update application with verification fields
    let { error } = await supabase
      .from("applications")
      .update({
        status: "done",
        verified_hours: payload.verifiedHours,
        verified_by: user.id,
        verified_at: nowIso,
        verification_notes: payload.notes ?? null,
        star_rating: payload.starRating ?? null,
        on_time_rate: payload.onTimeRate ?? null,
        show_up_rate: payload.showUpRate ?? null,
      })
      .eq("id", aId);
    if (error) throw error;
    // Update gamification (upsert logic)
    const { data: gam } = await supabase.from("gamification").select("*").eq("student_id", studentId).maybeSingle();
    if (gam) {
      const newHours = (gam.hours_completed || 0) + payload.verifiedHours;
      const xpFromHours = Math.round(payload.verifiedHours * 10);
      const newBonusXp = (gam.bonus_xp || 0) + xpFromHours;
      const newStreak = (gam.streak || 0) + 1;
      await supabase.from("gamification").update({
        hours_completed: newHours,
        bonus_xp: newBonusXp,
        streak: newStreak,
        last_activity_at: nowIso,
      }).eq("student_id", studentId);
    } else {
      const xpFromHours = Math.round(payload.verifiedHours * 10);
      await supabase.from("gamification").insert({
        student_id: studentId,
        hours_completed: payload.verifiedHours,
        bonus_xp: xpFromHours,
        streak: 1,
        last_activity_at: nowIso,
      });
    }
    // Progress history log
    await supabase.from("user_progress_history").insert({
      user_id: studentId,
      title: oppTitle ?? "Volunteering",
      organization: null,
      hours_worked: payload.verifiedHours,
      date_worked: nowIso.slice(0, 10),
      notes: payload.notes ? `Verified by organizer. ${payload.notes}` : "Verified by organizer.",
    });
    qc.invalidateQueries({ queryKey: ["applications"] });
  };
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Verify Hours</Button>
      <VerifyHoursDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={onSubmit}
        studentName={studentName}
        opportunityTitle={oppTitle}
      />
    </>
  );
};

export default OrgJobs;


