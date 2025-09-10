import React, { useMemo } from "react";
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
import { useNotifications } from "@/context/NotificationsContext";

const schema = z.object({
  title: z.string().min(3, "Enter a title"),
  description: z.string().min(10, "Enter a short description"),
  category: z.string().min(2, "Enter a category"),
  location: z.string().optional(),
  start_dt: z.string().optional(),
  end_dt: z.string().optional(),
  slots: z.coerce.number().int().min(1, "At least 1 slot"),
  fcfs: z.boolean().optional(),
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
};

type Application = {
  id: string;
  opportunity_id: string;
  student_id: string;
  status: "applied" | "accepted" | "declined" | "waitlisted" | "withdrawn";
  created_at: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
};

const OrgPortal: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { push: pushNotification } = useNotifications();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", category: "Community", location: "", start_dt: "", end_dt: "", slots: 10, fcfs: false },
  });

  const listQuery = useQuery({
    queryKey: ["opportunities", user?.id],
    queryFn: async (): Promise<Opportunity[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("opportunities")
        .select("id, organizer_id, title, description, category, location, start_dt, end_dt, slots, created_at, fcfs")
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
      const { data, error } = await supabase
        .from("applications")
        .select("id, opportunity_id, student_id, status, created_at, answers_json")
        .in("opportunity_id", oppIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!listQuery.data,
  });

  const studentIds = useMemo(() => Array.from(new Set((applicationsQuery.data ?? []).map((a) => a.student_id))), [applicationsQuery.data]);

  const profilesQuery = useQuery({
    queryKey: ["profiles", studentIds.join(",")],
    queryFn: async (): Promise<Profile[]> => {
      if (studentIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds)
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: studentIds.length > 0,
  });

  const profileName = (id: string) => (profilesQuery.data ?? []).find((p) => p.id === id)?.full_name ?? "Student";

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
      };
      const { error } = await supabase.from("opportunities").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Opportunity created" });
      form.reset();
      qc.invalidateQueries({ queryKey: ["opportunities", user?.id] });
    },
    onError: (e: any) => toast({ title: "Could not create", description: e.message ?? String(e), variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="grid grid-cols-[1fr,auto,1fr] items-center p-3 md:p-4 border-b border-border/50 gap-4 md:gap-8">
        <div />
        <div className="justify-self-center">
          <Navigation activeTab="org" />
        </div>
        <div className="justify-self-end hidden sm:flex items-center gap-2">
          {user && (
            <>
              <span className="text-xs text-muted-foreground truncate max-w-[160px]" title={user.email ?? undefined}>{user.email}</span>
              <Button variant="outline" size="sm" onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) toast({ title: "Sign out failed", description: error.message, variant: "destructive" });
                else toast({ title: "Signed out" });
              }}>Sign Out</Button>
            </>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Org Settings */}
        <section className="glass-card p-4 md:p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Organization Settings</h2>
          <OrgSettings />
        </section>
        <section className="glass-card p-4 md:p-6 rounded-xl">
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

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your Opportunities</h2>
          {listQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : listQuery.error ? (
            <div className="text-sm text-destructive">{(listQuery.error as any).message ?? String(listQuery.error)}</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(listQuery.data ?? []).map((o) => (
                <div key={o.id} className="glass-card p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{o.title}</p>
                      <p className="text-xs text-muted-foreground">{o.category} • {o.location || ""}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {(() => {
                        const accepted = (applicationsQuery.data ?? []).filter(a => a.opportunity_id === o.id && a.status === 'accepted').length;
                        const total = o.slots ?? 0;
                        return `${accepted}/${total} filled`;
                      })()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
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
              {(applicationsQuery.data ?? []).map((a) => {
                const opp = (listQuery.data ?? []).find((o) => o.id === a.opportunity_id);
                return (
                  <div key={a.id} className="glass-card p-4 rounded-xl flex items-center justify-between">
                    <div className="min-w-0">
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
                      <span className={`text-xs capitalize ${a.status === 'accepted' ? 'text-status-confirmed' : a.status === 'declined' ? 'text-destructive' : 'text-status-pending'}`}>{a.status}</span>
                      <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: a.id, status: "accepted" })}>Accept</Button>
                      <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: a.id, status: "declined" })}>Decline</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
        <FormLabel>Name</FormLabel>
        <Input placeholder="Your Organization" {...form.register("name", { required: true })} />
      </div>
      <div className="md:col-span-1">
        <FormLabel>Website</FormLabel>
        <Input placeholder="https://example.org" {...form.register("website")} />
      </div>
      <div className="md:col-span-2">
        <FormLabel>About</FormLabel>
        <Textarea placeholder="Mission and overview" {...form.register("about")} />
      </div>
      <div className="md:col-span-1">
        <FormLabel>Location</FormLabel>
        <Input placeholder="Austin, TX" {...form.register("location")} />
      </div>
      <div className="md:col-span-2 flex justify-end pt-2">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

export default OrgPortal;
