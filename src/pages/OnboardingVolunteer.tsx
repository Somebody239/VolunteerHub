import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TagEditor } from "@/components/TagEditor";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { MapPin, Tags, Clock3, User as UserIcon, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { OnboardingService } from "@/lib/onboardingService";

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name").max(80, "Keep it under 80 characters"),
  school: z.string().min(2, "Please enter your school").max(120, "Too long"),
  location: z.string().min(2, "Please enter your city or area").max(120, "Too long"),
  onboarding_tags: z.string().optional(), // onboarding tags (comma-separated)
  age: z.coerce.number().optional(),
  availability: z.string().max(4000, "Too long").optional(), // JSON from ScheduleEditor
});

type FormValues = z.infer<typeof schema>;

const OnboardingVolunteer: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { fullName: "", school: "", location: "", onboarding_tags: "", age: undefined, availability: "" } });
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);

  const next = () => setStep((s) => (s < 4 ? ((s + 1) as 0 | 1 | 2 | 3 | 4) : s));
  const prev = () => setStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2 | 3 | 4) : s));

  const steps = useMemo(() => [
    { key: 'basics', label: 'Basics', icon: UserIcon },
    { key: 'school', label: 'School', icon: GraduationCap },
    { key: 'location', label: 'Location', icon: MapPin },
    { key: 'interests', label: 'Interests', icon: Tags },
    { key: 'availability', label: 'Availability', icon: Clock3 },
  ] as const, []);

  // Suggest interests from existing opportunity tags
  const tagUniverseQuery = useQuery({
    queryKey: ["opportunities", "tags-universe"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from("opportunities").select("tags").limit(500);
      if (error) throw error;
      const set = new Set<string>();
      (data ?? []).forEach((row: any) => ((row?.tags ?? []) as string[]).forEach((t) => set.add(t)));
      return Array.from(set).sort();
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    const tagsCsv = values.onboarding_tags ?? "";
    const tagsArray = Array.from(new Set(tagsCsv.split(",").map((s) => s.trim()).filter(Boolean)));

    const payload = {
      id: user.id, // profile id matches auth user id
      user_id: user.id,
      full_name: values.fullName,
      school: values.school,
      location: values.location,
      interests: tagsArray.join(", "),
      availability: values.availability,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      toast({ title: "Could not save profile", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profile saved" });
    
    // Mark onboarding as completed in database
    if (user.id) {
      const onboardingService = new OnboardingService(user.id);
      // Try to update onboarding status with new fields; fallback to create if needed
      const updateResult = await onboardingService.updateOnboardingStatus({
        onboarding_completed: true,
        onboarding_skipped: false,
        tags: tagsArray,
        min_age: values.age ?? undefined,
        max_age: values.age ?? undefined,
      });
      if (!updateResult) {
        await onboardingService.createOnboardingStatus({
          intended_role: "student",
          onboarding_completed: true,
          onboarding_skipped: false,
          tags: tagsArray,
          min_age: values.age ?? undefined,
          max_age: values.age ?? undefined,
        });
      }
    }
    
    navigate("/");
  };

  return (
    <div className="min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-2xl glass-card p-6 md:p-8 rounded-xl">
        <h1 className="text-2xl font-semibold mb-1">Volunteer Onboarding</h1>
        <p className="text-sm text-muted-foreground mb-6">Tell us a bit about you so we can match opportunities.</p>

        {/* Stepper */}
        <div className="flex items-center gap-3 mb-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const active = idx === step;
            const done = idx < step;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? 'bg-primary text-primary-foreground' : done ? 'bg-muted text-foreground' : 'bg-muted/60 text-muted-foreground'}`}>
                  <Icon size={14} />
                </div>
                {idx < steps.length - 1 && <div className={`w-10 h-0.5 ${done ? 'bg-primary' : 'bg-muted/60'}`} />}
              </div>
            );
          })}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            {step === 0 && (
              <>
                <FormField name="fullName" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Alex Johnson" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            {step === 1 && (
              <>
                <FormField name="school" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>School</FormLabel>
                    <FormControl>
                      <Input placeholder="Your school" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            {step === 2 && (
              <>
                <FormField name="location" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <LocationAutocomplete value={field.value} onChange={(v) => field.onChange(v)} placeholder="Search your city or address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            {step === 3 && (
              <>
                <FormField name="onboarding_tags" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Onboarding Tags</FormLabel>
                    <FormControl>
                      <TagEditor value={field.value ?? ''} onChange={(csv) => field.onChange(csv)} />
                    </FormControl>
                    <FormMessage />
                    {tagUniverseQuery.data && tagUniverseQuery.data.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">Suggestions</div>
                        <div className="flex flex-wrap gap-2">
                          {tagUniverseQuery.data.slice(0, 30).map((t) => (
                            <button
                              key={t}
                              type="button"
                              className="px-2 py-1 rounded-full text-xs bg-muted/40 hover:bg-muted/60"
                              onClick={() => {
                                const current = (field.value ?? '').split(',').map(s => s.trim()).filter(Boolean);
                                if (!current.includes(t)) {
                                  field.onChange([...current, t].join(', '));
                                }
                              }}
                            >{t}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </FormItem>
                )} />
                <FormField name="age" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            {step === 4 && (
              <>
                <FormField name="availability" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability</FormLabel>
                    <FormControl>
                      <ScheduleEditor value={field.value ?? ''} onChange={(json) => field.onChange(json)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            <div className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  if (step === 0) {
                    // Mark onboarding as skipped in database
                    if (user?.id) {
                      const onboardingService = new OnboardingService(user.id);
                      await onboardingService.skipOnboarding();
                    }
                    navigate("/");
                  } else {
                    prev();
                  }
                }}
              >
                {step === 0 ? 'Skip for now' : 'Back'}
              </Button>
              {step < 4 ? (
                <Button type="button" onClick={() => {
                  // basic validation per step
                  if (step === 0) {
                    void form.trigger('fullName').then((ok) => ok && next());
                  } else if (step === 1) {
                    void form.trigger('school').then((ok) => ok && next());
                  } else if (step === 2) {
                    void form.trigger('location').then((ok) => ok && next());
                  } else {
                    next();
                  }
                }}>Next</Button>
              ) : (
                <Button type="submit">Save and finish</Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default OnboardingVolunteer;
