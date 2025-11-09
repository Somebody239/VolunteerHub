import { ProfileCard } from "@/components/ProfileCard";
import { Navigation } from "@/components/Navigation";
import { OpportunityCard } from "@/components/OpportunityCard";
import { ExternalOpportunityCard } from "@/components/ExternalOpportunityCard";
import {
  Search,
  Settings,
  Bell,
  UserPlus,
  MapPin,
  Clock,
  PlayCircle,
  CheckCircle2,
  Award,
  Trophy,
  ShieldCheck,
  Medal,
  Crown,
  ChevronDown,
  ChevronUp,
  Calendar,
  Save,
  RotateCcw,
  X,
  Phone,
  Briefcase,
  XCircle,
  Minus,
  Plus,
  Copy,
  RefreshCw,
} from "lucide-react";
import { QuickLogHoursDialog } from "@/components/QuickLogHoursDialog";
import { VerificationDialog } from "@/components/VerificationDialog";
import { useUser } from "@/context/UserContext";
import React, { useMemo, useState, lazy, Suspense, useEffect, useCallback } from "react";
import {
  JobDetailsDialog,
  type JobDetails,
} from "@/components/JobDetailsDialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useHeaderInfo } from "@/hooks/use-header-info";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useNotifications } from "@/context/NotificationsContext";
// import { useVolunteerOpportunities, useGeolocation } from "@/hooks/use-volunteer-opportunities";
import { useIsMobile } from "@/hooks/use-mobile";
import { geocodeLocation, calculateDistance } from "@/lib/volunteerConnector";
import { generateQuests, claimQuest, type Quest, type QuestData } from "@/lib/questUtils";
import { QuestService } from "@/lib/questService";
import { ExternalApplicationsService, type ExternalApplication } from "@/lib/externalApplicationsService";
import { SavedOpportunitiesService, type SavedOpportunity } from "@/lib/savedOpportunitiesService";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestDialog } from "@/components/QuestDialog";

// Lazy load heavy dialogs
const SettingsDialog = lazy(() =>
  import("@/components/SettingsDialog").then((m) => ({
    default: m.SettingsDialog,
  })),
);
const NotificationsDialog = lazy(() =>
  import("@/components/NotificationsDialog").then((m) => ({
    default: m.NotificationsDialog,
  })),
);
const InviteDialog = lazy(() =>
  import("@/components/InviteDialog").then((m) => ({
    default: m.InviteDialog,
  })),
);
const SignInDialog = lazy(() =>
  import("@/components/SignInDialog").then((m) => ({
    default: m.SignInDialog,
  })),
);

const Index = () => {
  const qc = useQueryClient();
  const userCtx = useUser();
  const { user, signOut } = useAuth();
  const header = useHeaderInfo();
  const { push: pushNotification } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Check if user is an organization
  const orgQuery = useQuery({
    queryKey: ["organizations", user?.id, "exists"],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("organizations").select("id").eq("id", user.id).
      maybeSingle();
      console.log("Supabase data:", data); // Data should contain your expected records
      return !!data;
    },
    enabled: !!user,
  });

  // All other hooks must be called before any conditional returns
  const opportunitiesQuery = useQuery({
    queryKey: ["opportunities", "home"],
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await supabase
        .from("opportunities")
        .select(
          "id, organizer_id, title, description, category, location, start_dt, end_dt, slots, tags, apply_url, contact_email, is_deleted, application_form, min_age, max_age, internal_application_enabled",
        )
        .eq("is_deleted", false)
        .order("start_dt", { ascending: true, nullsFirst: false })
      if (error) {
        console.error("Supabase opportunities query error:", error);
        throw error;
      }
      console.log("Supabase opportunities fetched:", data?.length || 0, "opportunities");
      return data ?? [];
    },
    staleTime: 30 * 1000, // 30 seconds - reduced for faster updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  const profileQuery = useQuery({
    queryKey: ["profiles", user?.id],
    queryFn: async (): Promise<any> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, interests, availability, about, location")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!user, // Always enable if user exists
    staleTime: 5 * 60 * 1000, // 5 minutes - profiles change infrequently
  });

  const organizationsQuery = useQuery({
    queryKey: ["organizations", "all"],
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - organizations change very infrequently
  });

  const applicationsQuery = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async (): Promise<any[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("id, opportunity_id, student_id, status, created_at, answers_json")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user, // Always enable if user exists
  });

  // Ratings aggregation from the opportunity_ratings view
  const ratingsQuery = useQuery({
    queryKey: ["opportunity_ratings"],
    queryFn: async (): Promise<Array<{ opportunity_id: string; avg_rating: number; ratings_count: number }>> => {
      const { data, error} = await supabase
        .from("opportunity_ratings")
        .select("opportunity_id, avg_rating, ratings_count");
      if (error) {
        console.warn("Could not fetch opportunity_ratings view:", error);
        return [];
      }
      return data as any[];
    },
    staleTime: 60 * 1000,
  });

  // All state variables
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [allQuestsOpen, setAllQuestsOpen] = useState(false);
  const [adminResetOpen, setAdminResetOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    jobTitle: string;
    jobDate: string;
    studentHours: number;
    studentName: string;
    applicationId: string;
    isExternal: boolean;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [questRefresh, setQuestRefresh] = useState(0);
  const [extRefresh, setExtRefresh] = useState(0);
  const [questService, setQuestService] = useState<any>(null);
  const [quests, setQuests] = useState<any[]>([]);
  const [externalAppsService, setExternalAppsService] = useState<any>(null);
  const [externalApplications, setExternalApplications] = useState<any[]>([]);
  const [savedOpportunitiesService, setSavedOpportunitiesService] = useState<any>(null);
  const [savedOpportunities, setSavedOpportunities] = useState<any[]>([]);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [extFormStatus, setExtFormStatus] = useState<string>("applied");
  const [extFormDate, setExtFormDate] = useState<string>("");
  const [extFormStartDate, setExtFormStartDate] = useState<string>("");
  const [extFormHours, setExtFormHours] = useState<string>("0");
  const [extFormNotes, setExtFormNotes] = useState<string>("");
  const [extFormContacted, setExtFormContacted] = useState<boolean>(false);
  const [extFormInterview, setExtFormInterview] = useState<boolean>(false);
  const [extFormRejected, setExtFormRejected] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Other hooks - must be called after all state is defined but before conditional returns
  // const geolocationQuery = useGeolocation();

  // // Disable volunteer opportunities query temporarily to prevent crashes
  // // TODO: Fix external API integration
  // // Use stable values when disabled to prevent re-render issues
  // const volunteerOpportunitiesQuery = useVolunteerOpportunities({
  //   searchTerm: undefined,
  //   latitude: undefined,
  //   longitude: undefined,
  //   radiusKm: undefined,
  //   maxDistanceKm: undefined,
  //   postalCode: undefined,
  //   enabled: false // Disabled to prevent 404 errors from crashing the app
  // });

  // Extract user data from userCtx (defined at the top)
  const { name, school, level, xpInLevel, maxXp, totalHours, streak, isLoading: userLoading } = userCtx;

  // Move all hooks before conditional returns to fix Rules of Hooks violations

  // Handle verification confirmation
  const handleVerificationConfirm = async (verificationLink: string) => {
    if (!verificationData || !externalAppsService) return;

    try {
      // Update the application in the database
      const success = await externalAppsService.updateApplication(verificationData.applicationId, {
        status: 'verify',
        verification_link: verificationLink,
        verification_id: verificationLink.split('/').pop(),
        start_date: extFormStartDate,
        hours_worked: verificationData.studentHours,
        contacted: extFormContacted,
        interview: extFormInterview,
        rejected: extFormRejected,
        notes: extFormNotes,
      });

      if (success) {
        setExtFormStatus('verify');
        setExtRefresh((r) => r + 1);

        toast({
          title: "Verification Required",
          description: "Status changed to 'Verify'. Share the link with your mentor/supervisor."
        });
      } else {
        throw new Error('Failed to update application');
      }
    } catch (err: any) {
      console.error('Error saving verification data:', err);
      toast({
        title: "Error",
        description: "Failed to save verification data",
        variant: "destructive"
      });
    }
  };

  // Initialize services
  useEffect(() => {
    if (user?.id) {
      const questService = new QuestService(user.id);
      const externalAppsService = new ExternalApplicationsService(user.id);
      const savedOpportunitiesService = new SavedOpportunitiesService(user.id);
      setQuestService(questService);
      setExternalAppsService(externalAppsService);
      setSavedOpportunitiesService(savedOpportunitiesService);
    }
  }, [user?.id]);

  // Saved (bookmarked) opportunities from database
  const savedIds = useMemo(() => {
    return savedOpportunities.map(opp => opp.opportunity_id);
  }, [savedOpportunities]);

  // Load quests when quest data changes
  useEffect(() => {
    const loadQuests = async () => {
      if (!questService || !profileQuery.data) return;

      const questData: QuestData = {
        fullName: profileQuery.data.full_name || "",
        interests: profileQuery.data.interests || "",
        emailVerified: !!(user as any)?.email_confirmed_at,
        totalHours: userCtx.totalHours,
        availability: profileQuery.data.availability || "",
        appliedCount: (applicationsQuery.data ?? []).length,
        savedCount: savedIds.length,
        location: (profileQuery.data as any)?.location || "",
        about: (profileQuery.data as any)?.about || "",
        level: userCtx.level
      };

      const loadedQuests = await questService.getQuests(questData);
      setQuests(loadedQuests);
    };

    loadQuests();
  }, [questService, profileQuery.data, userCtx.totalHours, userCtx.level, applicationsQuery.data, savedIds, questRefresh, user]);

  // Load external applications
  useEffect(() => {
    const loadExternalApplications = async () => {
      if (!externalAppsService) return;

      const apps = await externalAppsService.getActiveApplications();
      setExternalApplications(apps);
    };

    loadExternalApplications();
  }, [externalAppsService, extRefresh]);

  // Load saved opportunities
  useEffect(() => {
    const loadSavedOpportunities = async () => {
      if (!savedOpportunitiesService) return;

      const saved = await savedOpportunitiesService.getSavedOpportunities();
      setSavedOpportunities(saved);
    };
    loadSavedOpportunities();
  }, [savedOpportunitiesService]);

  // Listen for quest updates to sync between pages
  useEffect(() => {
    const handleQuestUpdate = () => setQuestRefresh((prev) => prev + 1);
    window.addEventListener("quest-claimed", handleQuestUpdate);
    return () => window.removeEventListener("quest-claimed", handleQuestUpdate);
  }, []);

  // Convert saved opportunities to the format expected by the UI
  const savedItemsLite = useMemo(() => {
    return savedOpportunities.map(opp => ({
      id: opp.opportunity_id,
      title: opp.title,
      organization: opp.organization,
      date: opp.date,
      location: opp.location,
      category: opp.category,
      externalUrl: opp.external_url,
      contactEmail: opp.contact_email,
    }));
  }, [savedOpportunities]);

  const filtered = useMemo(() => {
    const orgMap = new Map(
      (organizationsQuery.data ?? []).map((o) => [o.id, o.name] as const),
    );
    const list = (opportunitiesQuery.data ?? [])
      .filter((o: any) => !o.is_deleted)
      .map<JobDetails & { opportunityId: string; tags?: string[]; applicationForm?: any[]; min_age?: number | null; max_age?: number | null; isExternal?: boolean }>((o) => {
        // Determine if internal or external based on internal_application_enabled
        // Internal: internal_application_enabled = TRUE
        // External: internal_application_enabled = FALSE
        const isInternal = o.internal_application_enabled === true;
        const isExternal = !isInternal;
        
        return {
          title: o.title,
          organization: orgMap.get(o.organizer_id) ?? "Organizer",
          date: o.start_dt ? new Date(o.start_dt).toLocaleString() : "TBD",
          location: o.location ?? undefined,
          duration:
            o.start_dt && o.end_dt
              ? `${Math.max(0, (new Date(o.end_dt).getTime() - new Date(o.start_dt).getTime()) / 3600000)} hours`
              : undefined,
          spots: o.slots ?? undefined,
          category: o.category,
          tags: (o.tags ?? undefined) as unknown as string[] | undefined,
          opportunityId: o.id,
          applyUrl: o.apply_url ?? undefined,
          contactEmail: o.contact_email ?? undefined,
          applicationForm: (o.application_form ?? undefined) as any[] | undefined,
          min_age: o.min_age ?? null,
          max_age: o.max_age ?? null,
          isExternal: isExternal,
        };
      });
    const qFiltered = list.filter((o) => {
      const matchesQuery = [o.title, o.organization, o.location, o.category]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(query.toLowerCase()));
      return matchesQuery;
    });
    // Simple tag-based ranking: if user's interests include the category keyword, rank higher
    const interestsCsv = profileQuery.data?.interests ?? "";
    const interestTokens = new Set(
      interestsCsv
        .split(/[,;]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );
    const scored = qFiltered
      .map((o) => {
        const cat = (o.category ?? "").toLowerCase();
        const titleTokens = o.title.toLowerCase().split(/\s+/);
        let score = 0;
        if (interestTokens.size > 0) {
          if (cat && interestTokens.has(cat)) score += 5;
          // bonus if any word in title matches an interest token
          if (titleTokens.some((t) => interestTokens.has(t))) score += 3;
        }
        return { item: o, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item);
    return scored;
  }, [
    organizationsQuery.data,
    opportunitiesQuery.data,
    profileQuery.data?.interests,
    query,
  ]);

  // Auto-prune saved IDs that no longer exist or are ended when opening the dialog
  useEffect(() => {
    if (!open) return;
    try {
      const ids = new Set(savedIds);
      const valid = new Set(filtered.map((f) => f.opportunityId));
      const pruned = Array.from(ids).filter((id) => valid.has(id));
      localStorage.setItem("vp_saved", JSON.stringify(pruned));
    } catch {}
  }, [open, savedIds, filtered]);

  // Geocode user's location when profile loads - MUST be before conditional returns
  React.useEffect(() => {
    const geocodeUserLocation = async () => {
      if (profileQuery.data?.location) {
        const coords = await geocodeLocation(profileQuery.data.location);
        if (coords) {
          setUserLocation(coords);
          setLocationPermission("granted");
        }
      }
    };

    if (profileQuery.data?.location) {
      geocodeUserLocation();
    }
  }, [profileQuery.data?.location]);

  const applyMutation = useMutation({
    mutationFn: async (payloadIn: {
      id?: string;
      answers?: Record<string, any>;
    }) => {
      if (!user) throw new Error("Please sign in to apply");
      if (!payloadIn.id) throw new Error("Missing opportunity id");
      
      // Get the opportunity to find the organizer_id for query invalidation
      const { data: opportunity, error: oppError } = await supabase
        .from("opportunities")
        .select("organizer_id")
        .eq("id", payloadIn.id)
        .single();
      
      if (oppError) throw oppError;
      
      const payload = {
        opportunity_id: payloadIn.id,
        student_id: user.id,
        status: "applied",
        answers_json: payloadIn.answers ?? null,
        created_at: new Date().toISOString(),
      };
      const { data: created, error } = await supabase
        .from("applications")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      
      // Return organizer_id for query invalidation
      return { organizer_id: opportunity?.organizer_id };
    },
    onSuccess: (data) => {
      toast({ title: "Application submitted" });
      // Invalidate student's own applications
      qc.invalidateQueries({ queryKey: ["applications", user?.id] });
      // Invalidate opportunities query to refresh stats
      qc.invalidateQueries({ queryKey: ["opportunities", "home"] });
      // Invalidate org dashboard queries if organizer_id exists
      if (data?.organizer_id) {
        // Invalidate all application queries for this organizer (regardless of opportunity IDs in key)
        qc.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && 
                   key[0] === "applications" && 
                   key[1] === data.organizer_id;
          }
        });
        // Invalidate opportunities query to trigger applications query refetch
        qc.invalidateQueries({ queryKey: ["opportunities", data.organizer_id] });
      }
      pushNotification({
        kind: "success",
        text: "Your application was submitted.",
      });
    },
    onError: (e: any) =>
      toast({
        title: "Could not apply",
        description: e.message ?? String(e),
        variant: "destructive",
      }),
  });

  // Precompute ratings map from the view
  const ratingsMap = useMemo(() => {
    const map = new Map<string, { avg: number; count: number }>();
    const rows = ratingsQuery.data ?? [];
    for (const r of rows) {
      if (!r || !r.opportunity_id) continue;
      map.set(r.opportunity_id, {
        avg: Number(r.avg_rating) || 0,
        count: Number(r.ratings_count) || 0
      });
    }
    return map;
  }, [ratingsQuery.data]);

  const computeScoreAndXp = (item: any): { score: number; xp: number; stars: number } => {
    let score = 0;
    const titleTokens = item.title.toLowerCase().split(/\s+/);
    const interestsCsv = profileQuery.data?.interests ?? "";
    const interestTokens = new Set(
      interestsCsv
        .split(/[,;]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );
    if (interestTokens.size > 0) {
      if (item.category && interestTokens.has(String(item.category).toLowerCase())) score += 12;
      if ((item.tags || []).some((t: string) => interestTokens.has(String(t).toLowerCase()))) score += 8;
      if (titleTokens.some((t: string) => interestTokens.has(t))) score += 6;
    }
    if (item.isRemote) score += 4;
    // Hours for XP (parse from duration or estimated_hours)
    let hours = 0;
    if (item.duration) {
      const m = String(item.duration).match(/(\d+(?:\.\d+)?)(?=\s*hour)/i);
      if (m) hours = parseFloat(m[1]);
    }
    if (!hours && typeof item.estimated_hours === "number") {
      hours = Math.max(0, Number(item.estimated_hours) || 0);
    }
    if (userLocation && item.coordinates) {
      const dist = calculateDistance(userLocation.lat, userLocation.lng, item.coordinates.lat, item.coordinates.lng);
      if (!isNaN(dist)) score += dist < 5 ? 10 : dist < 20 ? 6 : dist < 50 ? 3 : 0;
    }
    // XP is based on hours - reduced multiplier for more reasonable rewards
    const xp = Math.round(Math.max(0, hours) * 2); // Changed from 10x to 2x
    // Stars from aggregated ratings if available; fallback to hours-based heuristic
    let stars = 0;
    if (item.opportunityId && ratingsMap.has(item.opportunityId)) {
      const r = ratingsMap.get(item.opportunityId)!;
      stars = Math.max(1, Math.min(5, Math.round(r.avg)));
    } else {
      stars = hours >= 16 ? 5 : hours >= 8 ? 4 : hours > 0 ? 3 : 3; // Default to 3 stars
    }
    return { score, xp, stars };
  };

  // Check if user has already applied to an opportunity
  const hasApplied = useCallback((opportunityId: string) => {
    // Check internal applications
    const hasInternalApp = (applicationsQuery.data ?? []).some(
      (app) => app.opportunity_id === opportunityId
    );
    if (hasInternalApp) return true;

    // Check external applications
    const hasExternalApp = externalApplications.some(
      (app) => app.opportunity_id === opportunityId
    );
    return hasExternalApp;
  }, [applicationsQuery.data, externalApplications]);

  // Memoize sorted quests for display (moved outside JSX to fix hooks error)
  const sortedQuests = useMemo(() => {
    return [...quests].sort((a, b) => {
      const aPri = a.done && !a.claimed ? 3 : a.claimed ? 0 : 1;
      const bPri = b.done && !b.claimed ? 3 : b.claimed ? 0 : 1;
      if (aPri !== bPri) return bPri - aPri;
      return a.key.localeCompare(b.key);
    });
  }, [quests, questRefresh, profileQuery.data?.full_name, profileQuery.data?.interests, profileQuery.data?.availability, applicationsQuery.data?.length, savedIds.length, userCtx.totalHours, user?.email_confirmed_at]);

  // Memoize first 3 quests for display
  const displayQuests = useMemo(() => {
    return sortedQuests.slice(0, 3);
  }, [sortedQuests]);

  // Now we can do conditional returns
  if (orgQuery.isLoading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (orgQuery.data) {
    return <Navigate to="/org" replace />;
  }


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
    tags?: string[] | null;
    apply_url?: string | null;
    contact_email?: string | null;
  };

  type ProfileRow = {
    id: string;
    full_name?: string | null;
    interests: string | null;
    availability: string | null;
    location?: string | null;
  };

  type OrganizationRow = {
    id: string; // owner id matches auth user id for now
    name: string;
  };

  type ApplicationRow = {
    id: string;
    opportunity_id: string;
    student_id: string;
    status: "applied" | "accepted" | "declined" | "waitlisted" | "withdrawn" | "done" | "verify";
    created_at: string | null;
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center p-3 md:p-4 border-b border-border/50 gap-3 md:gap-8">
        <div className="justify-self-start min-w-0 w-full pr-0 md:pr-8">
          {userLoading ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted/40"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted/40 rounded"></div>
                <div className="h-3 w-16 bg-muted/40 rounded"></div>
              </div>
            </div>
          ) : (
            <ProfileCard
              name={header.displayName || (user?.email ?? "")}
              level={level}
              xp={xpInLevel}
              maxXp={maxXp}
              totalHours={totalHours}
              streak={streak}
              school={header.school || header.location || undefined}
              variant="plain"
            />
          )}
        </div>
        {/* Center: Navigation */}
        <div className="justify-self-center">
          <Navigation activeTab="home" />
        </div>
        <div className="justify-self-end hidden sm:flex items-center gap-2">
          {user && (
            <span className="px-2 py-0.5 text-xs rounded-full border border-border text-muted-foreground hidden md:inline">
              {header.role === "organizer" ? "Organizer" : "Student"}
            </span>
          )}
          <button
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={16} className="text-foreground" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell size={16} className="text-foreground" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Invite Friend"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus size={16} className="text-foreground" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Refresh opportunities"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["opportunities", "home"] });
              opportunitiesQuery.refetch();
              toast({ title: "Refreshing opportunities..." });
            }}
            disabled={opportunitiesQuery.isFetching}
          >
            <RefreshCw 
              size={16} 
              className={`text-foreground ${opportunitiesQuery.isFetching ? 'animate-spin' : ''}`} 
            />
          </button>
          {/* Auth controls */}
          {user ? (
            <div className="flex items-center gap-2 ml-1">
              <span
                className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[140px]"
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { error } = await signOut();
                  if (error) {
                    toast({
                      title: "Sign out failed",
                      description: error.message,
                      variant: "destructive",
                    });
                  } else {
                    toast({ title: "Signed out" });
                  }
                }}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <SignInDialog />
          )}
        </div>
      </header>

      {/* Main Content - Dashboard layout */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Search at top */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-3xl relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full glass-card text-base focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid gap-2 sm:grid-cols-4">
          <QuickLogHoursDialog
            onLogged={(h, title, organization, notes) => {
              userCtx.logHours(h, title, organization, notes);
              userCtx.addBonusXp(Math.round(h * 10));
              toast({
                title: "Hours logged",
                description: `Added ${h}h and XP awarded.`,
              });
            }}
            trigger={
              <button className="glass-card p-4 rounded-xl text-left hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={14} /> Log Hours
                </div>
                <div className="mt-1 text-sm font-medium">
                  Add verified hours
                </div>
              </button>
            }
          />
          <button
            className="glass-card p-4 rounded-xl text-left hover:bg-muted/40 transition-colors"
            onClick={() => {
              toast({
                title: "Find Nearby",
                description:
                  "Use the search bar to filter by location. (Geo filters coming soon)",
              });
              const el = document.querySelector(
                'input[placeholder="Search opportunities..."]',
              ) as HTMLInputElement | null;
              el?.focus();
            }}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={14} /> Find Nearby
            </div>
            <div className="mt-1 text-sm font-medium">
              Opportunities near you
            </div>
          </button>
          <button
            className="glass-card p-4 rounded-xl text-left hover:bg-muted/40 transition-colors"
            onClick={() => {
              navigate("/jobs");
            }}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <PlayCircle size={14} /> Continue
            </div>
            <div className="mt-1 text-sm font-medium">Continue browsing</div>
          </button>
          <button
            className="glass-card p-4 rounded-xl text-left hover:bg-muted/40 transition-colors"
            onClick={() => setInviteOpen(true)}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserPlus size={14} /> Invite
            </div>
            <div className="mt-1 text-sm font-medium">Invite a friend</div>
          </button>
        </section>

        {/* Quests */}
        <section className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground">Quests</h2>
            <div className="flex items-center gap-3">
              <button
                className="text-xs underline underline-offset-2"
                onClick={() => setAllQuestsOpen(true)}
              >
                View all
              </button>
              {header.isAdmin && (
                <button
                  className="text-xs underline underline-offset-2 text-destructive"
                  onClick={() => setAdminResetOpen(true)}
                >
                  Reset progress
                </button>
              )}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {displayQuests.map((q) => (
              <div
                key={q.claimKey}
                className={`p-4 rounded-xl border ${q.done ? "bg-muted/40" : "hover:bg-muted/30"} transition-colors ${q.done && q.claimed ? "opacity-60 grayscale" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <span>{q.title}</span>
                    {q.badgeIfClaimed && (() => {
                      const badge = q.badgeIfClaimed as { label: string; icon?: string };
                      const Icon = badge.icon === "Trophy" ? Trophy : badge.icon === "ShieldCheck" ? ShieldCheck : badge.icon === "Medal" ? Medal : Award;
                      return (
                      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-muted/60 text-foreground/80 border whitespace-nowrap">
                          <Icon size={10} aria-hidden />
                          {badge.label}
                      </span>
                      );
                    })()}
                  </div>
                  {q.done && (
                    <CheckCircle2 size={16} className="text-green-500" />
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {q.xp} XP
                </div>
                <div className="mt-2">
                  {q.done ? (
                    q.claimed ? (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Claimed
                      </span>
                    ) : (
                      <button
                        className="text-xs px-2 py-1 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors"
                        onClick={async () => {
                          if (questService && await questService.claimQuest(q)) {
                            userCtx.addBonusXp(q.xp);
                            toast({ title: `+${q.xp} XP claimed` });
                            if (q.badgeIfClaimed) {
                              toast({ title: `Badge earned: ${q.badgeIfClaimed.label}` });
                            }
                            // Force re-render to update quest order
                            window.dispatchEvent(new Event("quest-claimed"));
                            setQuestRefresh((prev) => prev + 1);
                          }
                        }}
                      >
                        Claim {q.xp} XP
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Complete to claim
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        <QuestDialog
          open={allQuestsOpen}
          onOpenChange={setAllQuestsOpen}
            quests={quests}
            onClaimQuest={async (quest) => {
              if (questService) {
                const success = await questService.claimQuest(quest);
                if (success) {
                  setQuestRefresh((prev) => prev + 1);
                }
                return success;
              }
              return false;
            }}
            onAddBonusXp={userCtx.addBonusXp}
          />
        <Dialog open={adminResetOpen} onOpenChange={setAdminResetOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Reset demo progress</DialogTitle>
              </DialogHeader>
              <div className="text-sm text-muted-foreground">
                This clears local XP quest flags only.
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setAdminResetOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    try {
                      [
                        "quest_v2_basics_claimed",
                        "quest_v2_interests_claimed",
                        "quest_v2_applied_claimed",
                        "quest_v2_verify_email_claimed",
                        "quest_v2_log_hours_claimed",
                        "quest_v2_availability_claimed",
                        "quest_v2_save_any_claimed",
                        "quest_applied",
                        "quest_l1_about_claimed",
                        "quest_l1_location_claimed",
                        "quest_l1_applied2_claimed",
                        "quest_l1_hours5_claimed",
                        "quest_l1_saved3_claimed",
                        "earned_badges",
                      ].forEach((k) => localStorage.removeItem(k));
                    } catch {}
                    toast({ title: "Progress reset" });
                    setAdminResetOpen(false);
                  }}
                >
                  Reset
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>
        {/* Removed duplicate search section below; top search remains */}

        {/* Recommended (External Opportunities) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              Recommended
            </h2>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr items-stretch">
            {(opportunitiesQuery.data ?? [])
              .slice(0, 6)
              .map((item, index) => {
                // Map raw opportunity data to the format expected by ExternalOpportunityCard
                const orgMap = new Map(
                  (organizationsQuery.data ?? []).map((o) => [o.id, o.name] as const),
                );
                const orgName = orgMap.get(item.organizer_id) ?? "Organizer";
                
                // Determine if internal or external based on internal_application_enabled
                // Internal: internal_application_enabled = TRUE
                // External: internal_application_enabled = FALSE
                const isInternal = item.internal_application_enabled === true;
                const isExternal = !isInternal;
                
                // Calculate duration from start_dt and end_dt
                let duration: string | undefined = undefined;
                if (item.start_dt && item.end_dt) {
                  const start = new Date(item.start_dt);
                  const end = new Date(item.end_dt);
                  const hours = Math.max(0, (end.getTime() - start.getTime()) / 3600000);
                  if (hours > 0) {
                    duration = `${hours.toFixed(1)} hours`;
                  }
                }
                
                const mappedItem = {
                  title: item.title,
                  organization: orgName,
                  date: item.start_dt ? new Date(item.start_dt).toLocaleString() : "TBD",
                  location: item.location ?? undefined,
                  duration: duration,
                  spots: item.slots ?? undefined,
                  category: item.category,
                  tags: (item.tags ?? []) as string[] | undefined,
                  opportunityId: item.id,
                  applyUrl: item.apply_url ?? undefined,
                  contactEmail: item.contact_email ?? undefined,
                  isExternal: isExternal,
                  externalUrl: item.apply_url || "",
                  description: item.description || "",
                  activities: [],
                  isRemote: false,
                  coordinates: undefined,
                  minAge: item.min_age ?? undefined,
                  maxAge: item.max_age ?? undefined,
                  applicationForm: (item.application_form ?? []) as any[] | undefined,
                };
                
                const metrics = computeScoreAndXp(mappedItem);
              return (
              <div key={index} className="h-full w-full">
                    <ExternalOpportunityCard
                      {...mappedItem}
                      isExternal={isExternal}
                      score={metrics.score}
                      xpReward={metrics.xp}
                      minAge={mappedItem.minAge}
                      maxAge={mappedItem.maxAge}
                      applicationForm={mappedItem.applicationForm}
                      applied={hasApplied(item.id)}
                  onClick={() => {
                        setSelected({
                          title: mappedItem.title,
                          organization: mappedItem.organization,
                          date: mappedItem.date,
                          location: mappedItem.location,
                          duration: mappedItem.duration,
                          spots: mappedItem.spots,
                          category: mappedItem.category,
                          opportunityId: mappedItem.opportunityId,
                          applyUrl: mappedItem.applyUrl,
                          contactEmail: mappedItem.contactEmail,
                          applicationForm: mappedItem.applicationForm,
                          isExternal: isExternal,
                        });
                    setOpen(true);
                  }}
                      onApply={async (opportunityId, title) => {
                        // Only handle external applications here
                        // Internal applications are handled by the dialog's onApply which uses applyMutation
                        if (!isExternal || !externalAppsService) return;
                        
                        try {
                          const success = await externalAppsService.createApplication({
                            opportunity_id: opportunityId,
                            title,
                            organization: mappedItem.organization,
                            date_applied: new Date().toISOString().split('T')[0],
                            hours_worked: 0,
                            status: "applied",
                            is_external: true,
                            xp_reward: metrics.xp,
                            score: metrics.score,
                            contacted: false,
                            interview: false,
                            rejected: false,
                            notes: "",
                            credited_xp: false,
                            planned_hours: 0,
                          });
                          
                          if (success) {
                            toast({ title: "External application recorded" });
                            pushNotification({
                              kind: "success",
                              text: "Your external application has been recorded.",
                            });
                            setExtRefresh((r) => r + 1);
                          } else {
                            throw new Error('Failed to create application');
                          }
                        } catch (error) {
                          console.error('Error creating external application:', error);
                          toast({ 
                            title: "Error", 
                            description: "Failed to record external application", 
                            variant: "destructive" 
                          });
                        }
                      }}
                />
              </div>
              );
            })}
            {!opportunitiesQuery.isLoading &&
              (opportunitiesQuery.data ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground">
                No opportunities found.
              </div>
            )}
          </div>
        </section>

        {/* Saved */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Saved</h2>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr items-stretch">
            {/* Show saved external opportunities from localStorage */}
            {savedItemsLite.slice(0, 6).map((lite) => {
              const metrics = computeScoreAndXp(lite);
                return (
                <div key={lite.id} className="h-full w-full">
                  <ExternalOpportunityCard
                    title={lite.title}
                    organization={lite.organization}
                    date={lite.date ?? "TBD"}
                    location={lite.location}
                    duration={undefined}
                    spots={undefined}
                    category={lite.category}
                    tags={[]}
                    isExternal={true}
                    externalUrl={lite.externalUrl || ""}
                    description="Saved opportunity"
                    activities={[]}
                    isRemote={false}
                    opportunityId={lite.id}
                    score={metrics.score}
                    xpReward={metrics.xp}
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
                        applyUrl: lite.externalUrl,
                        contactEmail: lite.contactEmail,
                      });
                      setOpen(true);
                    }}
                    onApply={async (opportunityId, title) => {
                      if (!externalAppsService) return;
                      
                      try {
                        const success = await externalAppsService.createApplication({
                          opportunity_id: opportunityId,
                          title,
                          organization: lite.organization,
                          date_applied: new Date().toISOString().split('T')[0],
                          hours_worked: 0,
                          status: "applied",
                          is_external: true,
                          xp_reward: metrics.xp,
                          score: metrics.score,
                          contacted: false,
                          interview: false,
                          rejected: false,
                          notes: "",
                          credited_xp: false,
                          planned_hours: 0,
                        });
                        
                        if (success) {
                          toast({ title: "External application recorded" });
                          pushNotification({
                            kind: "success",
                            text: "Your external application has been recorded.",
                          });
                          setExtRefresh((r) => r + 1);
                        } else {
                          throw new Error('Failed to create application');
                        }
                      } catch (error) {
                        console.error('Error creating external application:', error);
                        toast({ 
                          title: "Error", 
                          description: "Failed to record external application", 
                          variant: "destructive" 
                        });
                      }
                    }}
                  />
                </div>
              );
              })}
            {savedItemsLite.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No saved opportunities yet.
              </div>
            )}
          </div>
        </section>

        <JobDetailsDialog
          open={open}
          onOpenChange={setOpen}
          job={selected}
          // Provide stars/xp using computeScoreAndXp function
          stars={selected ? computeScoreAndXp(selected).stars : undefined}
          xp={selected ? computeScoreAndXp(selected).xp : undefined}
          applied={selected?.opportunityId ? hasApplied(selected.opportunityId) : false}
          savedOpportunitiesService={savedOpportunitiesService}
          onSaveChange={() => {
            // Refresh saved opportunities when a save/unsave happens
            if (savedOpportunitiesService) {
              savedOpportunitiesService.getSavedOpportunities().then(setSavedOpportunities);
            }
          }}
          onApply={async (id, answers) => {
            if (!selected) return;
            
            // Determine if this is an internal (organizer-created) or external opportunity
            // Use isExternal from the item (based on internal_application_enabled from database)
            // Internal: internal_application_enabled = TRUE
            // External: internal_application_enabled = FALSE
            const isExternal = selected.isExternal ?? false;
            const isInternal = !isExternal;
            
            if (isExternal) {
              // Handle external application (has applyUrl, no internal form)
              if (!externalAppsService) return;
              
              try {
                // Calculate XP and score
                let score = 0;
                const titleTokens = selected.title.toLowerCase().split(/\s+/);
                const interestsCsv = profileQuery.data?.interests ?? "";
                const interestTokens = new Set(
                  interestsCsv
                    .split(/[,;]/)
                    .map((s) => s.trim().toLowerCase())
                    .filter(Boolean),
                );
                if (interestTokens.size > 0) {
                  if (selected.category && interestTokens.has(selected.category.toLowerCase())) score += 12;
                  if ((selected as any).tags && (selected as any).tags.some((t: string) => interestTokens.has(String(t).toLowerCase()))) score += 8;
                  if (titleTokens.some((t) => interestTokens.has(t))) score += 6;
                }
                if (selected.duration) {
                  const m = String(selected.duration).match(/(\d+)(?=\s*hour)/i);
                  if (m) score += Math.min(10, parseInt(m[1], 10));
                }
                
                const xp = Math.max(5, Math.min(40, 5 + Math.round(score / 2)));
                
                const success = await externalAppsService.createApplication({
                  opportunity_id: id || selected.opportunityId,
                  title: selected.title,
                  organization: selected.organization,
                  date_applied: new Date().toISOString().split('T')[0],
                  hours_worked: 0,
                  status: "applied",
                  is_external: true,
                  xp_reward: xp,
                  score: score,
                  contacted: false,
                  interview: false,
                  rejected: false,
                  notes: "",
                  credited_xp: false,
                  planned_hours: 0,
                });
                
                if (success) {
                  toast({ title: "External application recorded" });
                  pushNotification({
                    kind: "success",
                    text: "Your external application has been recorded.",
                  });
                  setExtRefresh((r) => r + 1);
                } else {
                  throw new Error('Failed to create application');
                }
              } catch (error) {
                console.error('Error creating external application:', error);
                toast({
                  title: "Could not record external application",
                  description: "Please try again",
                  variant: "destructive",
                });
              }
            } else {
              // Handle internal application (organizer-created opportunity)
              // This goes to the applications table, not external_applications
              applyMutation.mutate({ id, answers });
            }
          }}
        />
        <Suspense fallback={<div className="hidden" />}>
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </Suspense>
        <Suspense fallback={<div className="hidden" />}>
          <NotificationsDialog
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}
          />
        </Suspense>
        <Suspense fallback={<div className="hidden" />}>
          <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
        </Suspense>
        
        {/* Verification Dialog */}
        {verificationData && (
          <VerificationDialog
            open={verificationOpen}
            onOpenChange={setVerificationOpen}
            onConfirm={handleVerificationConfirm}
            jobTitle={verificationData.jobTitle}
            jobDate={verificationData.jobDate}
            studentHours={verificationData.studentHours}
            studentName={verificationData.studentName}
          />
        )}

        {/* My Applications - Improved Design */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              My Applications
            </h2>
            <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {applicationsQuery.isLoading
                ? "Loading..."
                  : `${(applicationsQuery.data?.length ?? 0) + externalApplications.length} total`}
            </span>
              {externalApplications.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-muted/40 text-muted-foreground">
                  {externalApplications.length} external
                </span>
              )}
          </div>
          </div>
          
          <div className="grid gap-3">
            {/* External applications - Compact cards */}
            {externalApplications.map((e) => {
              const isExpanded = expandedAppId === `ext:${e.id}`;
              const statusConfig = {
                applied: { color: "text-yellow-300", bg: "bg-yellow-900/30", dot: "bg-yellow-500", border: "border-yellow-600/50", glow: "shadow-yellow-500/30" },
                accepted: { color: "text-green-300", bg: "bg-green-900/30", dot: "bg-green-500", border: "border-green-600/50", glow: "shadow-green-500/30" },
                done: { color: "text-blue-300", bg: "bg-blue-900/30", dot: "bg-blue-500", border: "border-blue-600/50", glow: "shadow-blue-500/30" },
                verify: { color: "text-amber-300", bg: "bg-amber-900/30", dot: "bg-amber-500", border: "border-amber-600/50", glow: "shadow-amber-500/30" },
                rejected: { color: "text-red-300", bg: "bg-red-900/30", dot: "bg-red-500", border: "border-red-600/50", glow: "shadow-red-500/30" },
                cancelled: { color: "text-gray-300", bg: "bg-gray-900/30", dot: "bg-gray-500", border: "border-gray-600/50", glow: "shadow-gray-500/30" }
              };
              const status = e.status;
              const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.applied;
              
              return (
                <div key={e.id} className="glass-card overflow-hidden transition-all duration-200 hover:shadow-lg">
                  {/* Compact header */}
                  <div
                    className="p-4 cursor-pointer transition-colors hover:bg-muted/20"
                    onClick={() => {
                      const id = `ext:${e.id}`;
                      if (isExpanded) {
                        setExpandedAppId(null);
                        return;
                      }
                      setExpandedAppId(id);
                      // Load form state for this external entry
                      setExtFormStatus(e.status);
                      setExtFormDate(e.date_applied);
                      setExtFormStartDate(e.start_date || "");
                      setExtFormHours(String(e.hours_worked));
                      setExtFormNotes(e.notes || "");
                      setExtFormContacted(e.contacted);
                      setExtFormInterview(e.interview);
                      setExtFormRejected(e.rejected);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-3 h-3 rounded-full ${config.dot} flex-shrink-0`}></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground truncate">{e.title}</h3>
                            <span className="px-2 py-0.5 rounded-full bg-muted/60 text-[10px] text-muted-foreground flex-shrink-0">
                              External
                            </span>
                      </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="capitalize">{e.organization}</span>
                            <span>Applied: {e.date_applied}</span>
                            {e.hours_worked > 0 && (
                              <span>{e.hours_worked}h</span>
                            )}
                            {e.xp_reward > 0 && (
                              <span className="text-green-600">+{e.xp_reward} XP</span>
                            )}
                            {e.status === 'verify' && (
                              <span className="text-amber-600 text-xs">⏳ Pending Verification</span>
                            )}
                    </div>
                  </div>
                  </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all duration-300 ${config.bg} ${config.color} ${config.border} ${config.glow} hover:shadow-md`}>
                          {status}
                        </span>
                        <div className="flex items-center gap-1">
                          {(e.contacted || e.interview || e.rejected) && (
                            <div className="flex items-center gap-1">
                              {e.contacted && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Contacted" />}
                              {e.interview && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Interview" />}
                              {e.rejected && <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Rejected" />}
                        </div>
                          )}
                          {e.status === 'verify' && (
                            <button
                              onClick={async () => {
                                if (!externalAppsService) return;
                                
                                // If we have a verification link, copy it
                                if (e.verification_link) {
                                  try {
                                    await navigator.clipboard.writeText(e.verification_link);
                                    toast({ title: "Verification link copied to clipboard" });
                                  } catch (err) {
                                    toast({ 
                                      title: "Failed to copy link", 
                                      description: "Please copy the link manually",
                                      variant: "destructive" 
                                    });
                                  }
                                } else {
                                  // Generate new verification link
                                  const baseUrl = window.location.origin;
                                  const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                                  const newLink = `${baseUrl}/verify/${verificationId}`;
                                  
                                  try {
                                    // Update the application with new verification link
                                    await externalAppsService.updateApplication(e.id, {
                                      verification_link: newLink,
                                      verification_id: verificationId
                                    });
                                    
                                    // Create verification request
                                    await externalAppsService.createVerificationRequest({
                                      verification_id: verificationId,
                                      job_title: e.title,
                                      job_date: e.date_applied,
                                      student_hours: e.hours_worked,
                                      student_name: userCtx.name || user?.email?.split('@')[0] || 'Student',
                                      organization: e.organization,
                                      status: 'pending'
                                    });
                                    
                                    // Copy the new link
                                    await navigator.clipboard.writeText(newLink);
                                    toast({ title: "New verification link generated and copied" });
                                    setExtRefresh((r) => r + 1);
                                  } catch (err) {
                                    console.error('Error generating verification link:', err);
                                    toast({ 
                                      title: "Failed to generate link", 
                                      description: "Please try again",
                                      variant: "destructive" 
                                    });
                                  }
                                }
                              }}
                              className="p-1 rounded hover:bg-muted/50 transition-colors"
                              title={e.verification_link ? "Copy verification link" : "Generate verification link"}
                            >
                              <Copy size={12} className="text-amber-500" />
                            </button>
                          )}
                          <div className={`w-4 h-4 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details - Condensed App Theme */}
                  {isExpanded && (
                    <div className="border-t border-border/50 bg-muted/10">
                      <div className="p-3 space-y-3">
                        {/* Status Selection - Dark Theme with Glowing Borders */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {[
                            { 
                              key: 'applied', 
                              label: 'Applied', 
                              baseColor: 'bg-yellow-900/30 hover:bg-yellow-800/40 text-yellow-300 border-yellow-600/50',
                              activeColor: 'bg-yellow-800/50 text-yellow-200 border-yellow-500 shadow-yellow-500/20',
                              glowColor: 'shadow-yellow-500/30'
                            },
                            { 
                              key: 'accepted', 
                              label: 'Accepted', 
                              baseColor: 'bg-green-900/30 hover:bg-green-800/40 text-green-300 border-green-600/50',
                              activeColor: 'bg-green-800/50 text-green-200 border-green-500 shadow-green-500/20',
                              glowColor: 'shadow-green-500/30'
                            },
                            { 
                              key: 'rejected', 
                              label: 'Rejected', 
                              baseColor: 'bg-red-900/30 hover:bg-red-800/40 text-red-300 border-red-600/50',
                              activeColor: 'bg-red-800/50 text-red-200 border-red-500 shadow-red-500/20',
                              glowColor: 'shadow-red-500/30'
                            },
                            { 
                              key: 'done', 
                              label: 'Completed', 
                              baseColor: 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border-blue-600/50',
                              activeColor: 'bg-blue-800/50 text-blue-200 border-blue-500 shadow-blue-500/20',
                              glowColor: 'shadow-blue-500/30'
                            },
                            { 
                              key: 'cancelled', 
                              label: 'Cancelled', 
                              baseColor: 'bg-gray-900/30 hover:bg-gray-800/40 text-gray-300 border-gray-600/50',
                              activeColor: 'bg-gray-800/50 text-gray-200 border-gray-500 shadow-gray-500/20',
                              glowColor: 'shadow-gray-500/30'
                            }
                          ].map((status) => (
                            <button
                              key={status.key}
                              onClick={() => {
                                const newStatus = status.key as any;
                                
                                // If changing to "done", show verification dialog first
                                if (newStatus === 'done') {
                                  setVerificationData({
                                    jobTitle: e.title,
                                    jobDate: e.date_applied,
                                    studentHours: Math.max(0, parseFloat(extFormHours || '0')) || 0,
                                    studentName: userCtx.name || user?.email?.split('@')[0] || 'Student',
                                    applicationId: e.id,
                                    isExternal: true
                                  });
                                  setVerificationOpen(true);
                                  return;
                                }
                                
                                setExtFormStatus(newStatus);
                                // Auto-save when status changes
                                try {
                                  const raw = localStorage.getItem('my_external_applications');
                                  const list: any[] = raw ? JSON.parse(raw) : [];
                                  const idx = list.findIndex((x: any) => x.id === e.id);
                                  if (idx >= 0) {
                                    list[idx] = {
                                      ...list[idx],
                                      status: newStatus,
                                      startDate: extFormStartDate,
                                      hours: Math.max(0, parseFloat(extFormHours || '0')) || 0,
                                      contacted: extFormContacted,
                                      interview: extFormInterview,
                                      rejected: extFormRejected,
                                      notes: extFormNotes,
                                    };
                                    
                                    localStorage.setItem('my_external_applications', JSON.stringify(list));
                                    setExtRefresh((r) => r + 1);
                                  }
                                } catch (err: any) {
                                  console.error('Error saving status:', err);
                                }
                              }}
                              className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all duration-300 ${
                                extFormStatus === status.key
                                  ? `${status.activeColor} ring-2 ring-opacity-50 shadow-lg ${status.glowColor}` 
                                  : `${status.baseColor} hover:shadow-md`
                              } hover:${status.glowColor}`}
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>

                        {/* Main Content Row - Hours/Date Left, Notes Right */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Left Column - Hours and Date */}
                          <div className="space-y-3">
                            {/* Hours Worked */}
                            <div className="bg-muted/20 border border-border/50 rounded-xl p-3 hover:bg-muted/30 transition-all duration-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">Hours Worked</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setExtFormHours(String(Math.max(0, parseFloat(extFormHours || '0') - 0.5)))}
                                    className="p-1.5 rounded-lg bg-background/50 hover:bg-background/80 text-muted-foreground border border-border/30 hover:border-border/60 transition-all duration-200"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="0.5" 
                                    value={extFormHours} 
                                    onChange={(e) => setExtFormHours(e.target.value)} 
                                    className="w-16 px-3 py-1.5 text-center text-sm font-medium border border-border/30 bg-background/50 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200" 
                                  />
                                  <button
                                    onClick={() => setExtFormHours(String(parseFloat(extFormHours || '0') + 0.5))}
                                    className="p-1.5 rounded-lg bg-background/50 hover:bg-background/80 text-muted-foreground border border-border/30 hover:border-border/60 transition-all duration-200"
                                  >
                                    <Plus size={12} />
                                  </button>
                      </div>
                      </div>
                      </div>

                            {/* Start Date */}
                            <div className="bg-muted/20 border border-border/50 rounded-xl p-3 hover:bg-muted/30 transition-all duration-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">Start Date</span>
                                <button
                                  onClick={() => setExtFormStartDate(new Date().toISOString().slice(0,10))}
                                  className="p-1.5 rounded-lg bg-background/50 hover:bg-background/80 text-muted-foreground border border-border/30 hover:border-border/60 transition-all duration-200"
                                >
                                  <Calendar size={12} />
                                </button>
                              </div>
                              <input 
                                type="date" 
                                value={extFormStartDate} 
                                onChange={(e2) => setExtFormStartDate(e2.target.value)} 
                                className="w-full px-3 py-2 text-sm font-medium border border-border/30 bg-background/50 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200" 
                              />
                            </div>
                          </div>

                          {/* Right Column - Notes */}
                          <div className="bg-muted/20 border border-border/50 rounded-xl p-3 hover:bg-muted/30 transition-all duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground">Notes</span>
                            </div>
                            <textarea 
                              value={extFormNotes} 
                              onChange={(e2) => setExtFormNotes(e2.target.value)} 
                              placeholder="Add notes about this application..."
                              className="w-full min-h-[120px] px-3 py-2 text-sm font-medium border border-border/30 bg-background/50 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 resize-none" 
                            />
                          </div>
                        </div>

                        {/* Action Buttons - Compact Design */}
                        <div className="flex justify-between items-center pt-3 border-t border-border/30">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setExpandedAppId(null)}
                              className="flex items-center px-3 py-2 rounded-xl text-xs font-medium bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/30 hover:border-border/60 transition-all duration-200"
                            >
                              <X size={12} className="mr-1" />
                              Close
                            </button>
                            <button
                              onClick={() => {
                                setExtFormStatus(e.status);
                                setExtFormDate(e.date_applied);
                                setExtFormStartDate(e.start_date || "");
                                setExtFormHours(String(e.hours_worked));
                                setExtFormNotes(e.notes || "");
                                setExtFormContacted(e.contacted);
                                setExtFormInterview(e.interview);
                                setExtFormRejected(e.rejected);
                              }}
                              className="flex items-center px-3 py-2 rounded-xl text-xs font-medium bg-muted/20 hover:bg-muted/40 text-muted-foreground border border-border/30 hover:border-border/60 transition-all duration-200"
                            >
                              <RotateCcw size={12} className="mr-1" />
                              Reset
                            </button>
                          </div>
                          <button
                            onClick={async () => {
                              if (!externalAppsService) return;
                              
                              try {
                                if (extFormStatus === 'cancelled') {
                                  const success = await externalAppsService.deleteApplication(e.id);
                                  if (success) {
                                    setExtRefresh((r) => r + 1);
                                    setExpandedAppId(null);
                                    toast({ title: 'Application cancelled and removed' });
                                  } else {
                                    throw new Error('Failed to delete application');
                                  }
                                  return;
                                }
                                
                                const hours = Math.max(0, parseFloat(extFormHours || '0')) || 0;
                                const success = await externalAppsService.updateApplication(e.id, {
                                  status: extFormStatus as any,
                                  start_date: extFormStartDate,
                                  hours_worked: hours,
                                  contacted: extFormContacted,
                                  interview: extFormInterview,
                                  rejected: extFormRejected,
                                  notes: extFormNotes,
                                });
                                
                                if (success) {
                                  // Handle XP and hours crediting for completed applications
                                  if (extFormStatus === 'done' && !e.credited_xp) {
                                    if (e.xp_reward > 0) {
                                      try { userCtx.addBonusXp(e.xp_reward); } catch {}
                                    }
                                    if (hours > 0) {
                                      try { userCtx.logHours(hours, e.title, e.organization); } catch {}
                                    }
                                    // Mark as credited
                                    await externalAppsService.updateApplication(e.id, {
                                      credited_xp: true
                                    });
                                  }
                                  
                                  setExtRefresh((r) => r + 1);
                                  toast({ title: 'Changes saved successfully!' });
                                } else {
                                  throw new Error('Failed to update application');
                                }
                              } catch (err: any) {
                                console.error('Error saving application:', err);
                                toast({ title: 'Save failed', description: err?.message ?? String(err), variant: 'destructive' });
                              }
                            }}
                            className="flex items-center px-4 py-2 rounded-xl text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20 hover:border-primary/40 shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Save size={12} className="mr-1" />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Applications from applications table - Check database for internal/external */}
            {applicationsQuery.data?.filter(a => !['declined', 'withdrawn'].includes(a.status)).map((a) => {
              const opp = (opportunitiesQuery.data ?? []).find(
                (o) => o.id === a.opportunity_id,
              );
              const orgName = opp ? (organizationsQuery.data ?? []).find(org => org.id === opp.organizer_id)?.name : null;
              
              // Check database value for internal_application_enabled from opportunities table
              // Match the exact logic used in filtered list (line 383) and recommended section (line 996)
              // Internal: internal_application_enabled === true
              // External: internal_application_enabled !== true (false, null, undefined)
              // If opp not found, skip this application (shouldn't happen but handle gracefully)
              if (!opp) {
                console.warn(`Opportunity not found for application ${a.id}, opportunity_id: ${a.opportunity_id}`);
                return null;
              }
              
              // Debug: Log the opportunity data to see what we're checking
              console.log(`Application ${a.id} - Opportunity ${opp.id}:`, {
                title: opp.title,
                internal_application_enabled: opp.internal_application_enabled,
                type: typeof opp.internal_application_enabled,
                organizer_id: opp.organizer_id
              });
              
              // Check internal_application_enabled the same way as everywhere else
              // Internal: internal_application_enabled === true
              // External: !isInternal (false, null, undefined)
              const isInternal = opp.internal_application_enabled === true;
              const isExternal = !isInternal;
              
              // Debug: Log the result
              console.log(`Application ${a.id} - isInternal: ${isInternal}, isExternal: ${isExternal}`);
              const isExpanded = expandedAppId === `int:${a.id}`;
              const statusConfig = {
                applied: { color: "text-yellow-300", bg: "bg-yellow-900/30", dot: "bg-yellow-500", border: "border-yellow-600/50", glow: "shadow-yellow-500/30", label: "In Review" },
                accepted: { color: "text-green-300", bg: "bg-green-900/30", dot: "bg-green-500", border: "border-green-600/50", glow: "shadow-green-500/30", label: "Accepted" },
                declined: { color: "text-red-300", bg: "bg-red-900/30", dot: "bg-red-500", border: "border-red-600/50", glow: "shadow-red-500/30", label: "Declined" },
                withdrawn: { color: "text-gray-300", bg: "bg-gray-900/30", dot: "bg-gray-500", border: "border-gray-600/50", glow: "shadow-gray-500/30", label: "Withdrawn" },
                waitlisted: { color: "text-blue-300", bg: "bg-blue-900/30", dot: "bg-blue-500", border: "border-blue-600/50", glow: "shadow-blue-500/30", label: "Waitlisted" },
                done: { color: "text-blue-300", bg: "bg-blue-900/30", dot: "bg-blue-500", border: "border-blue-600/50", glow: "shadow-blue-500/30", label: "Completed" },
                verify: { color: "text-amber-300", bg: "bg-amber-900/30", dot: "bg-amber-500", border: "border-amber-600/50", glow: "shadow-amber-500/30", label: "Verify" }
              };
              const config = statusConfig[a.status as keyof typeof statusConfig] || statusConfig.applied;
              
              return (
                <div key={a.id} className="glass-card overflow-hidden transition-all duration-200 hover:shadow-lg">
                  {/* View-only header - clickable to expand details */}
                  <div
                    className="p-4 cursor-pointer transition-colors hover:bg-muted/20"
                    onClick={() => {
                      const id = `int:${a.id}`;
                      setExpandedAppId(isExpanded ? null : id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-3 h-3 rounded-full ${config.dot} flex-shrink-0`}></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground truncate" title={opp?.title ?? "Opportunity"}>
                              {opp?.title ?? "Opportunity"}
                            </h3>
                            {/* Show badge based on database value */}
                            {isInternal ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-medium flex-shrink-0">
                                Internal
                              </span>
                            ) : isExternal ? (
                              <span className="px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground text-[10px] font-medium flex-shrink-0">
                                External
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {orgName && <span>{orgName}</span>}
                            <span>Applied: {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all duration-300 ${config.bg} ${config.color} ${config.border} ${config.glow} hover:shadow-md`}>
                          {config.label}
                        </span>
                        {(a.status === "applied" || a.status === "accepted") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const { error } = await supabase
                                .from("applications")
                                .update({ status: "withdrawn" })
                                .eq("id", a.id);
                              if (error) {
                                toast({
                                  title: "Withdraw failed",
                                  description: error.message,
                                  variant: "destructive",
                                });
                                return;
                              }
                              qc.invalidateQueries({
                                queryKey: ["applications", user?.id],
                              });
                              toast({ title: "Application withdrawn" });
                            }}
                            className="text-xs px-3 py-1"
                          >
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable details section - Editable if external, View-only if internal */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/50 pt-3 bg-muted/10">
                      {isExternal ? (
                        // External - Editable (update status in applications table)
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {[
                              { key: 'applied', label: 'Applied', baseColor: 'bg-yellow-900/30 hover:bg-yellow-800/40 text-yellow-300 border-yellow-600/50', activeColor: 'bg-yellow-800/50 text-yellow-200 border-yellow-500 shadow-yellow-500/20', glowColor: 'shadow-yellow-500/30' },
                              { key: 'accepted', label: 'Accepted', baseColor: 'bg-green-900/30 hover:bg-green-800/40 text-green-300 border-green-600/50', activeColor: 'bg-green-800/50 text-green-200 border-green-500 shadow-green-500/20', glowColor: 'shadow-green-500/30' },
                              { key: 'rejected', label: 'Rejected', baseColor: 'bg-red-900/30 hover:bg-red-800/40 text-red-300 border-red-600/50', activeColor: 'bg-red-800/50 text-red-200 border-red-500 shadow-red-500/20', glowColor: 'shadow-red-500/30' },
                              { key: 'done', label: 'Completed', baseColor: 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border-blue-600/50', activeColor: 'bg-blue-800/50 text-blue-200 border-blue-500 shadow-blue-500/20', glowColor: 'shadow-blue-500/30' },
                              { key: 'cancelled', label: 'Cancelled', baseColor: 'bg-gray-900/30 hover:bg-gray-800/40 text-gray-300 border-gray-600/50', activeColor: 'bg-gray-800/50 text-gray-200 border-gray-500 shadow-gray-500/20', glowColor: 'shadow-gray-500/30' }
                            ].map((status) => (
                              <button
                                key={status.key}
                                onClick={async () => {
                                  const newStatus = status.key as any;
                                  try {
                                    const { error } = await supabase
                                      .from("applications")
                                      .update({ status: newStatus })
                                      .eq("id", a.id);
                                    if (error) {
                                      toast({
                                        title: "Status update failed",
                                        description: error.message,
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    qc.invalidateQueries({
                                      queryKey: ["applications", user?.id],
                                    });
                                    toast({ title: "Status updated successfully" });
                                  } catch (err: any) {
                                    console.error('Error updating status:', err);
                                    toast({
                                      title: "Error",
                                      description: "Failed to update status",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all duration-200 ${
                                  a.status === status.key ? status.activeColor : status.baseColor
                                } ${a.status === status.key ? status.glowColor : ''}`}
                              >
                                {status.label}
                              </button>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>External application - You can edit the status. The organizer may also update it.</p>
                          </div>
                        </div>
                      ) : (
                        // Internal - View-only (managed by organizer)
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-foreground mb-1">Application Details</p>
                              <p className="text-[11px] text-muted-foreground">
                                This is an internal application managed by the organizer. You cannot edit the status or hours.
                              </p>
                            </div>
                          </div>

                          {a.answers_json && (
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-foreground mb-2">Your Responses</p>
                                <div className="space-y-2 text-[11px]">
                                  {typeof a.answers_json === 'object' && Object.entries(a.answers_json as Record<string, any>).map(([key, value]) => (
                                    <div key={key} className="bg-background/50 p-2 rounded">
                                      <p className="font-medium text-foreground mb-0.5">{key}</p>
                                      <p className="text-muted-foreground">{String(value)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {opp && (
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-foreground mb-1">Opportunity Info</p>
                                <div className="text-[11px] text-muted-foreground space-y-1">
                                  {opp.location && <p>📍 {opp.location}</p>}
                                  {opp.start_dt && <p>📅 {new Date(opp.start_dt).toLocaleDateString()}</p>}
                                  {opp.contact_email && <p>✉️ {opp.contact_email}</p>}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-border/30">
                            <p className="text-[10px] text-muted-foreground italic">
                              💡 The organizer will review your application and update the status. You'll be notified of any changes.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {!applicationsQuery.isLoading &&
              (applicationsQuery.data ?? []).length === 0 &&
              externalApplications.length === 0 && (
                <div className="glass-card p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/40 flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No applications yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start applying to opportunities to see them here
                  </p>
                  <Button onClick={() => navigate('/jobs')} className="px-6">
                    Browse Opportunities
                  </Button>
                </div>
              )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
