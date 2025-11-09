import React, { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { TagEditor } from "@/components/TagEditor";
import { OpportunityQuestionBuilder } from "./OpportunityQuestionBuilder";
import { OpportunityDetails, OpportunityQuestion } from "@/types/opportunities";
import { cn } from "@/lib/utils";

type DraftQuestion = ReturnType<typeof draftFromQuestion>;

const makeTempId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const draftFromQuestion = (question?: OpportunityQuestion, index = 0) => ({
  tempId: makeTempId(),
  prompt: "",
  field_type: "short_text" as OpportunityQuestion["field_type"],
  is_required: true,
  help_text: "",
  options: [],
  position: index,
  ...question,
});

const schema = z
  .object({
    title: z.string().min(3, "Title is required"),
    summary: z.string().min(10, "Please provide a short summary"),
    description: z.string().min(20, "Describe what volunteers will do"),
    category: z.string().min(2, "Pick a category"),
    location_label: z.string().optional(),
    slots: z.coerce.number().int().min(1, "At least one slot"),
    fcfs: z.boolean().default(false),
    tagsCsv: z.string().optional(),
    skillsCsv: z.string().optional(),
    requirementsCsv: z.string().optional(),
    apply_url: z.string().url("Use a valid URL").optional().or(z.literal("")),
    contact_email: z.string().email("Enter a valid email"),
    contact_phone: z.string().optional(),
    contact_name: z.string().optional(),
    min_age: z.coerce.number().int().min(0).max(120).optional(),
    max_age: z.coerce.number().int().min(0).max(120).optional(),
    estimated_hours: z.coerce.number().min(0).max(1000).optional(),
    application_deadline: z.string().optional(),
    start_dt: z.string().optional(),
    end_dt: z.string().optional(),
    is_virtual: z.boolean().default(false),
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    scheduleNotes: z.string().optional(),
    benefits: z.string().optional(),
    supportNotes: z.string().optional(),
    additionalNotes: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.is_virtual) {
      if (!val.address_line1 && !val.location_label) {
        ctx.addIssue({
          path: ["address_line1"],
          code: z.ZodIssueCode.custom,
          message: "Provide an address or meeting point",
        });
      }
      if (!val.city) {
        ctx.addIssue({ path: ["city"], code: z.ZodIssueCode.custom, message: "City is required" });
      }
      if (!val.state) {
        ctx.addIssue({ path: ["state"], code: z.ZodIssueCode.custom, message: "State is required" });
      }
    }
    if (val.min_age && val.max_age && val.min_age > val.max_age) {
      ctx.addIssue({
        path: ["max_age"],
        code: z.ZodIssueCode.custom,
        message: "Max age must be greater than min age",
      });
    }
    if (val.start_dt && val.end_dt) {
      const start = new Date(val.start_dt);
      const end = new Date(val.end_dt);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        ctx.addIssue({
          path: ["end_dt"],
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
        });
      }
    }
  });

export type OpportunityFormValues = z.infer<typeof schema>;

export interface OpportunityFormSubmit {
  values: OpportunityFormValues & {
    tags: string[];
    skills: string[];
    requirements: string[];
    details: OpportunityDetails;
  };
  questions: OpportunityQuestion[];
}

interface OpportunityFormProps {
  defaultValues?: Partial<OpportunityFormValues>;
  defaultQuestions?: OpportunityQuestion[];
  onSubmit: (payload: OpportunityFormSubmit) => Promise<void> | void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

const defaultFormValues: OpportunityFormValues = {
  title: "",
  summary: "",
  description: "",
  category: "",
  location_label: "",
  slots: 10,
  fcfs: false,
  tagsCsv: "",
  skillsCsv: "",
  requirementsCsv: "",
  apply_url: "",
  contact_email: "",
  contact_name: "",
  contact_phone: "",
  min_age: undefined,
  max_age: undefined,
  estimated_hours: undefined,
  application_deadline: "",
  start_dt: "",
  end_dt: "",
  is_virtual: false,
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  scheduleNotes: "",
  benefits: "",
  supportNotes: "",
  additionalNotes: "",
};

export const OpportunityForm: React.FC<OpportunityFormProps> = ({
  defaultValues,
  defaultQuestions,
  onSubmit,
  submitLabel = "Publish opportunity",
  isSubmitting,
  className,
}) => {
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...defaultFormValues, ...defaultValues },
  });

  const [questionDrafts, setQuestionDrafts] = useState<DraftQuestion[]>(
    (defaultQuestions ?? []).map((q, idx) => draftFromQuestion(q, idx)),
  );

  const handleSubmit = (values: OpportunityFormValues) => {
    const tags = csvToList(values.tagsCsv);
    const skills = csvToList(values.skillsCsv);
    const requirements = csvToList(values.requirementsCsv);

    const details: OpportunityDetails = {
      isVirtual: values.is_virtual,
      meetingPoint: values.location_label || undefined,
      address: values.is_virtual
        ? undefined
        : {
            line1: values.address_line1 || undefined,
            line2: values.address_line2 || undefined,
            city: values.city || undefined,
            state: values.state || undefined,
            postalCode: values.postal_code || undefined,
          },
      scheduleNotes: values.scheduleNotes || undefined,
      requirements,
      skills,
      benefits: stringOrUndefined(values.benefits),
      supportNotes: stringOrUndefined(values.supportNotes),
      additionalNotes: stringOrUndefined(values.additionalNotes),
    };

    const sanitizedQuestions: OpportunityQuestion[] = questionDrafts.map((draft, index) => ({
      id: draft.id,
      opportunity_id: draft.opportunity_id,
      prompt: draft.prompt.trim(),
      field_type: draft.field_type,
      is_required: draft.is_required,
      help_text: draft.help_text?.trim() || null,
      options:
        draft.field_type === "single_select" || draft.field_type === "multi_select"
          ? (draft.options ?? []).map((opt) => opt.trim()).filter(Boolean)
          : null,
      position: index,
    }));

    void Promise.resolve(
      onSubmit({
        values: {
          ...values,
          tags,
          skills,
          requirements,
          details,
        },
        questions: sanitizedQuestions.filter((q) => q.prompt.length > 0),
      }),
    );
  };

  const isVirtual = form.watch("is_virtual");

  const questionValue = useMemo(() => questionDrafts, [questionDrafts]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={cn("space-y-6", className)}>
        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Opportunity overview</h3>
            <p className="text-sm text-muted-foreground">
              Volunteers see this information when browsing listings.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Food pantry helper" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Community Support" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short summary</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="One sentence that captures why this matters..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full description</FormLabel>
                <FormControl>
                  <Textarea
                    rows={5}
                    placeholder="Explain the responsibilities, expectations, and impact for volunteers."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Timing & Location</h3>
            <p className="text-sm text-muted-foreground">
              Provide when and where volunteers should show up.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="start_dt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start (optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_dt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End (optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="is_virtual"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Virtual or hybrid opportunity</FormLabel>
                  <FormDescription>
                    If enabled, volunteers will see this as remote. You can still add a meeting point or fallback location.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="location_label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isVirtual ? "Default meeting point" : "Venue / meeting point"}</FormLabel>
                  <FormControl>
                    <Input placeholder="Community Center, 2nd floor, room 204" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estimated_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated hours</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={0.5} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {!isVirtual && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="text-sm font-medium">Street address</div>
              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address_line1"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Line 1</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address_line2"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Line 2 (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Suite 200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="scheduleNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule notes</FormLabel>
                <FormDescription>Share repeat schedule, arrival instructions, or check-in details.</FormDescription>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Requirements & skills</h3>
            <p className="text-sm text-muted-foreground">
              Set expectations so the right volunteers apply.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="min_age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum age</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum age</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="requirementsCsv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requirements</FormLabel>
                <FormDescription>e.g. Background check, parental consent, able to lift 25 lbs</FormDescription>
                <FormControl>
                  <TagEditor
                    value={field.value ?? ""}
                    placeholder="Type a requirement and press Enter"
                    onChange={(csv) => field.onChange(csv)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="skillsCsv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred skills</FormLabel>
                <FormControl>
                  <TagEditor
                    value={field.value ?? ""}
                    placeholder="Customer service, photography, bilingual..."
                    onChange={(csv) => field.onChange(csv)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="benefits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Volunteer benefits</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Snacks provided, service hours verification, letter of recommendation..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supportNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Support & onboarding</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Training offered, point of contact on-site..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="additionalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional notes</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Anything else volunteers should know" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Application & contact</h3>
            <p className="text-sm text-muted-foreground">
              Control how applications are routed and who reviews them.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="slots"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of slots</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fcfs"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto-accept until full</FormLabel>
                    <FormDescription>Automatically accept applicants until all slots are taken.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="application_deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application deadline (optional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="apply_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>External apply link</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.org/apply" {...field} />
                </FormControl>
                <FormDescription>Leave blank to use the built-in application form.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jordan Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact email</FormLabel>
                  <FormControl>
                    <Input placeholder="volunteers@example.org" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact phone (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Tags & discovery</h3>
            <p className="text-sm text-muted-foreground">
              Add keywords so the right students find this opportunity.
            </p>
          </div>
          <FormField
            control={form.control}
            name="tagsCsv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagEditor
                    value={field.value ?? ""}
                    onChange={(csv) => field.onChange(csv)}
                    placeholder="STEM, leadership, weekends..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Application form</h3>
            <p className="text-sm text-muted-foreground">
              Add custom questions for applicants. Leave blank to only collect basic contact info.
            </p>
          </div>
          <OpportunityQuestionBuilder value={questionValue} onChange={setQuestionDrafts} />
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};

function csvToList(csv?: string | null): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const stringOrUndefined = (value?: string | null) => (value && value.trim().length > 0 ? value : undefined);

export default OpportunityForm;

