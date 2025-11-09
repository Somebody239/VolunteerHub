import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagEditor } from "@/components/TagEditor";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { OnboardingService } from "@/lib/onboardingService";

const schema = z.object({
  orgName: z.string().min(2, "Please enter your organization name"),
  location: z.string().min(2, "Please enter your city or area"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  about: z.string().optional(),
  onboarding_tags: z.string().optional(),
  onboarding_preferred_location: z.string().optional(),
  min_age: z.coerce.number().optional(),
  max_age: z.coerce.number().optional(),
  max_distance_km: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof schema>;

const OnboardingOrganization: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  defaultValues: { orgName: "", location: "", website: "", about: "", onboarding_tags: "", onboarding_preferred_location: "", min_age: undefined, max_age: undefined, max_distance_km: undefined },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

  const payload = {
      id: user.id, // map auth user to owning org record
    name: values.orgName,
      location: values.location,
      website: values.website || null,
      about: values.about,
    updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("organizations").upsert(payload, { onConflict: "id" });
    if (error) {
      toast({ title: "Could not save organization", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Organization saved" });
    
    // Mark onboarding as completed in database
    if (user.id) {
      const onboardingService = new OnboardingService(user.id);
      const updateResult = await onboardingService.updateOnboardingStatus({
        onboarding_completed: true,
        onboarding_skipped: false,
        tags: (values.onboarding_tags ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        preferred_location: values.onboarding_preferred_location ?? undefined,
        min_age: values.min_age ?? undefined,
        max_age: values.max_age ?? undefined,
        max_distance_km: values.max_distance_km ?? undefined
      });
      if (!updateResult) {
        await onboardingService.createOnboardingStatus({
          intended_role: "organization",
          onboarding_completed: true,
          onboarding_skipped: false,
          tags: (values.onboarding_tags ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          preferred_location: values.onboarding_preferred_location ?? undefined,
          min_age: values.min_age ?? undefined,
          max_age: values.max_age ?? undefined,
          max_distance_km: values.max_distance_km ?? undefined
        });
      }
    }
    
    // Explicitly navigate to Org home to avoid wrong default landing
    navigate("/org", { replace: true });
  };

  return (
    <div className="min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-2xl glass-card p-6 md:p-8 rounded-xl">
        <h1 className="text-2xl font-semibold mb-1">Organization Onboarding</h1>
        <p className="text-sm text-muted-foreground mb-6">Tell us about your organization so volunteers can find you.</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField name="orgName" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input placeholder="Helping Hands Austin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="location" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Austin, TX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="website" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.org" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="about" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>About / Mission</FormLabel>
                <FormControl>
                  <Textarea placeholder="Our mission is..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="onboarding_tags" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Onboarding Tags</FormLabel>
                <FormControl>
                  <TagEditor value={field.value ?? ''} onChange={(csv) => field.onChange(csv)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="onboarding_preferred_location" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Onboarding Preferred Location</FormLabel>
                <FormControl>
                  <LocationAutocomplete value={field.value ?? ''} onChange={field.onChange} placeholder="Preferred location" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="min_age" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Age</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 18" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="max_age" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Age</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="max_distance_km" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Max Distance (km)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={async () => { 
                // Mark onboarding as skipped in database
                if (user?.id) {
                  const onboardingService = new OnboardingService(user.id);
                  await onboardingService.skipOnboarding();
                }
                navigate("/"); 
              }}>Skip for now</Button>
              <Button type="submit">Save and continue</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default OnboardingOrganization;
