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
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  location: z.string().min(2, "Please enter your city or area"),
  interests: z.string().optional(),
  availability: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const OnboardingVolunteer: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { fullName: "", location: "", interests: "", availability: "" } });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    const payload = {
      id: user.id, // profile id matches auth user id
      full_name: values.fullName,
      location: values.location,
      interests: values.interests,
      availability: values.availability,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      toast({ title: "Could not save profile", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profile saved" });
    try { localStorage.setItem("skipOnboarding", "1"); } catch {}
    navigate("/");
  };

  return (
    <div className="min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-2xl glass-card p-6 md:p-8 rounded-xl">
        <h1 className="text-2xl font-semibold mb-1">Volunteer Onboarding</h1>
        <p className="text-sm text-muted-foreground mb-6">Tell us a bit about you so we can match opportunities.</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField name="fullName" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Alex Johnson" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="location" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <LocationAutocomplete value={field.value} onChange={(v) => field.onChange(v)} placeholder="Search your city or address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="interests" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Interests</FormLabel>
                <FormControl>
                  <Textarea placeholder="Education, Environment, Food Banks" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="availability" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Availability</FormLabel>
                <FormControl>
                  <Input placeholder="Weeknights, 2-4 hrs/week" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  try { localStorage.setItem("skipOnboarding", "1"); } catch {}
                  navigate("/");
                }}
              >
                Skip for now
              </Button>
              <Button type="submit">Save and continue</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default OnboardingVolunteer;
