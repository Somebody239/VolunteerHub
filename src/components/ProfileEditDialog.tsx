import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  location: z.string().min(2, "Please choose a location"),
  school: z.string().optional(),
  age: z.coerce.number().int().min(0).max(120).optional(),
  about: z.string().optional(),
  interests: z.string().optional(),
  availability: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ProfileEditDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { fullName: "", location: "", school: "", age: undefined, about: "", interests: "", availability: "" } });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data, error } = await supabase.from("profiles").select("full_name, location, school, age, about, interests, availability").eq("id", user.id).maybeSingle();
      if (error) return; // silent
      if (data) {
        form.reset({
          fullName: data.full_name ?? "",
          location: data.location ?? "",
          school: (data as any).school ?? "",
          age: (data as any).age ?? undefined,
          about: (data as any).about ?? "",
          interests: data.interests ?? "",
          availability: data.availability ?? "",
        });
      }
    };
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    const payload: any = {
      id: user.id,
      full_name: values.fullName,
      location: values.location,
      school: values.school ?? null,
      age: values.age ?? null,
      about: values.about ?? null,
      interests: values.interests,
      availability: values.availability,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      toast({ title: "Could not update profile", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profile updated" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your basic info so we can match better opportunities.</DialogDescription>
        </DialogHeader>
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

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
