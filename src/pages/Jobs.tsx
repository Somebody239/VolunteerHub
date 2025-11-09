import { ProfileCard } from "@/components/ProfileCard";
import { Navigation } from "@/components/Navigation";
import { ExternalOpportunityCard } from "@/components/ExternalOpportunityCard";
import {
  Search,
  Filter,
  Settings,
  Bell,
  UserPlus,
  Tag,
  MapPin,
  CalendarDays,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import React, { useMemo, useState, lazy, Suspense, useEffect } from "react";
import { ExternalOpportunityDialog } from "@/components/ExternalOpportunityDialog";
import { toast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useHeaderInfo } from "@/hooks/use-header-info";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNotifications } from "@/context/NotificationsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { geocodeLocation, calculateDistance } from "@/lib/volunteerConnector";
import { JobDetailsDialog, type JobDetails } from "@/components/JobDetailsDialog";
import { ExternalApplicationsService, type ExternalApplication } from "@/lib/externalApplicationsService";

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

const Jobs = () => {
  const qc = useQueryClient();
  const { push: pushNotification } = useNotifications();
  const { user, signOut } = useAuth();
  const header = useHeaderInfo();



  // Removed organizer check side-effect; header already reflects role

  const { name, school, level, xpInLevel, maxXp, totalHours, streak, addBonusXp } =
    useUser();
  const [externalAppsService, setExternalAppsService] = useState<ExternalApplicationsService | null>(null);
  const [externalApplications, setExternalApplications] = useState<any[]>([]);
  const [extRefresh, setExtRefresh] = useState(0);

  // Initialize external applications service
  useEffect(() => {
    if (user?.id) {
      setExternalAppsService(new ExternalApplicationsService(user.id));
    }
  }, [user?.id]);

  // Load external applications
  useEffect(() => {
    const loadExternalApplications = async () => {
      if (!externalAppsService) return;
      const apps = await externalAppsService.getActiveApplications();
      setExternalApplications(apps);
    };
    loadExternalApplications();
  }, [externalAppsService, extRefresh]);

  // Query internal applications
  const applicationsQuery = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("id, opportunity_id, student_id, status, created_at")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Check if user has already applied to an opportunity
  const hasApplied = React.useCallback((opportunityId: string) => {
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
  const [externalOpen, setExternalOpen] = useState(false);
  const [selectedExternal, setSelectedExternal] = useState<any>(null);
  const [detailsOpen2, setDetailsOpen2] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobDetails | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<{ stars?: number; xp?: number }>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"soonest" | "slots" | "stars" | "xp">("soonest");
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch user's profile location
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("location, interests")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Geocode user's location when profile loads
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

  // Geolocation query (fallback to GPS)

  // Volunteer opportunities query (always enabled)
  const opportunitiesQuery = useQuery({
    queryKey: ["opportunities", "jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*") // You can replace * with your specific columns if desired
        .eq("is_deleted", false) // Add other filters as you need
        .order("start_dt", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
  const categories = useMemo<string[]>(
    () => Array.from(new Set((opportunitiesQuery.data ?? []).map((o) => String(o.category)))) as string[],
    [opportunitiesQuery.data],
  );
  const tagUniverse = useMemo<string[]>(
    () =>
      Array.from(
        new Set(
          (opportunitiesQuery.data ?? []).flatMap((o) => (o.tags ?? []) as string[]),
        ),
      ) as string[],
    [opportunitiesQuery.data],
  );
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [limit, setLimit] = useState<number>(50);
  const isMobile = useIsMobile();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [overlapActive, setOverlapActive] = useState<boolean>(true);
  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");

  // Listen to window scroll instead of container scroll
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      // Calculate trigger point based on viewport - stack should be visible first
      const triggerPoint = windowHeight * 0.3; // Trigger when scrolled 40% of viewport height
      setOverlapActive(scrollTop < triggerPoint);
    };

    if (isMobile) {
      window.addEventListener('scroll', handleScroll);
      handleScroll(); // Call once to set initial state
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile]);

  // Listen for external application updates
  React.useEffect(() => {
    const handleExternalUpdate = () => {
      setExtRefresh((r) => r + 1);
    };
    
    window.addEventListener('external-updated', handleExternalUpdate);
    return () => window.removeEventListener('external-updated', handleExternalUpdate);
  }, []);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState<{
    opportunityId: string;
    title: string;
    organization: string;
    xp: number;
    score: number;
  } | null>(null);
  const [formDate, setFormDate] = useState<string>("");
  const [formHours, setFormHours] = useState<string>("");
  const [formStatus, setFormStatus] = useState<"applied" | "done" | "cancelled">("applied");
  // Volunteer opportunities filtering
  const filtered = useMemo(() => {
    const opportunities = opportunitiesQuery.data ?? [];
    return opportunities
      .filter((o) => {
        const matchesQuery = [o.title, o.organization, o.location, o.category]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(query.toLowerCase()));
        const matchesCat =
          activeCategories.length === 0 ||
          activeCategories.includes(o.category);
        const matchesTags =
          activeTags.length === 0 ||
          (o.tags ?? []).some((t) => activeTags.includes(t));
        const locOk =
          !locationQuery ||
          (o.location ?? "")
            .toLowerCase()
            .includes(locationQuery.toLowerCase());
        // Age range overlap if filters provided
        const minA = typeof o.min_age === "number" ? o.min_age : null;
        const maxA = typeof o.max_age === "number" ? o.max_age : null;
        const selMin = ageMin ? parseInt(ageMin, 10) : null;
        const selMax = ageMax ? parseInt(ageMax, 10) : null;
        const ageOk =
          selMin === null && selMax === null
            ? true
            : ((selMin === null || maxA === null || maxA >= selMin) &&
               (selMax === null || minA === null || minA <= selMax));
        return (
          matchesQuery &&
          matchesCat &&
          matchesTags &&
          locOk &&
          ageOk
        );
      })
      .map((o) => ({
        title: o.title,
        organization: o.organization || "Unknown",
        date: o.start_dt ? new Date(o.start_dt).toLocaleDateString() : "TBD",
        location: o.location,
        duration: o.start_dt && o.end_dt 
          ? `${Math.max(0, (new Date(o.end_dt).getTime() - new Date(o.start_dt).getTime()) / 3600000).toFixed(1)} hours`
          : undefined,
        spots: o.slots,
        category: o.category,
        tags: o.tags as string[] | undefined,
        opportunityId: o.id,
        applyUrl: o.apply_url,
        contactEmail: o.contact_email,
        isExternal: false,
        externalUrl: o.apply_url || "",
        description: o.description || "",
        activities: [],
        isRemote: false,
        coordinates: undefined,
        minAge: o.min_age,
        maxAge: o.max_age,
        applicationForm: o.application_form,
      }));
  }, [
    opportunitiesQuery.data,
    query,
    activeCategories,
    activeTags,
    locationQuery,
    ageMin,
    ageMax,
  ]);

  // Handle location permission
  const requestLocationPermission = async () => {
    try {
      setLocationPermission("granted");
      toast({ title: "Location access granted" });
    } catch (error) {
      setLocationPermission("denied");
      toast({
        title: "Location access denied",
        description: "External opportunities will show all results",
        variant: "destructive"
      });
    }
  };

  // Track application clicks
  const trackApplication = useMutation({
    mutationFn: async (payload: { opportunityId: string; opportunityTitle: string }) => {
      if (!user) throw new Error("Please sign in to track applications");
      const { opportunityId, opportunityTitle } = payload;
      const { error} = await supabase
        .from("external_applications")
        .insert({
          user_id: user.id,
          opportunity_id: opportunityId,
          title: opportunityTitle,
          organization: "External",
          date_applied: new Date().toISOString().split('T')[0],
          hours_worked: 0,
          status: "applied",
          is_external: true,
          xp_reward: 0,
          score: 0,
          contacted: false,
          interview: false,
          rejected: false,
          notes: "",
          credited_xp: false,
          planned_hours: 0
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Application tracked" });
      pushNotification({
        kind: "success",
        text: "Your application has been tracked in your profile.",
      });
    },
    onError: (e: any) => {
      console.error("Failed to track application:", e);
      // Don't show error to user since the main action (opening Volunteer Connector) still works
    }
  });

  const interestTokens = useMemo(() => {
    const csv = (profileQuery.data as any)?.interests as string | undefined;
    return new Set(
      (csv || "")
        .split(/[,;]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );
  }, [profileQuery.data]);

  const computeScoreAndXp = (item: any): { score: number; xp: number; stars: number } => {
    let score = 0;
    const titleTokens = item.title.toLowerCase().split(/\s+/);
    if (interestTokens.size > 0) {
      if (item.category && interestTokens.has(String(item.category).toLowerCase())) score += 12;
      if ((item.tags || []).some((t: string) => interestTokens.has(String(t).toLowerCase()))) score += 8;
      if (titleTokens.some((t: string) => interestTokens.has(t))) score += 6;
    }
    if (item.isRemote) score += 4;
    // Hours for XP
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
    const xp = Math.round(Math.max(0, hours) * 2); // Changed from 10x to 2x for more reasonable rewards
    const stars = hours >= 16 ? 5 : hours >= 8 ? 4 : hours > 0 ? 3 : 3; // Default to 3 stars
    return { score, xp, stars };
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center p-3 md:p-4 border-b border-border/50 gap-3 md:gap-8">
        <div className="justify-self-start min-w-0 w-full pr-0 md:pr-8">
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
        </div>
        <div className="justify-self-center">
          <Navigation activeTab="jobs" />
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
            <Settings size={16} />
          </button>
          <button
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell size={16} />
          </button>
          <button
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Invite Friend"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus size={16} />
          </button>
          {user && (
            <>
              <span
                className="text-xs text-muted-foreground truncate max-w-[140px]"
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
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-3 md:p-6 space-y-3 md:space-y-6">
        {/* Header Section - Compact on mobile */}
        <section className="text-center space-y-2 md:space-y-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Volunteer Opportunities
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto hidden sm:block">
            Discover meaningful volunteer opportunities across Canada. Find causes you care about and make a difference in your community.
          </p>
        </section>
        {/* Search + Filters - Compact layout */}
        <section className="flex items-center justify-center gap-3">
          <div className="flex-1 max-w-2xl relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full glass-card text-base focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-3 rounded-full glass-card transition-all hover:bg-muted/20 relative flex-shrink-0"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-label={filtersOpen ? "Close filters" : "Open filters"}
          >
            <Filter size={18} />
            <span className="text-sm">
              Filters
              {(activeCategories.length > 0 ||
                activeTags.length > 0 ||
                dateFrom ||
                dateTo ||
                locationQuery) && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  {[activeCategories.length, activeTags.length, dateFrom ? 1 : 0, dateTo ? 1 : 0, locationQuery ? 1 : 0].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </span>
            {(activeCategories.length > 0 ||
              activeTags.length > 0 ||
              dateFrom ||
              dateTo ||
              locationQuery) && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-background"></span>
              )}
          </button>
        </section>

        {/* Location Status and Loading */}
        <section className="flex items-center justify-center gap-4 w-full max-w-4xl">
          {userLocation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2">
              <MapPin size={14} />
              Showing opportunities near your location
            </div>
          )}

          {!userLocation && locationPermission === "prompt" && (
            <Button
              size="sm"
              variant="outline"
              onClick={requestLocationPermission}
              className="flex items-center gap-2 px-4 py-2"
            >
              <MapPin size={14} />
              Enable location-based search
            </Button>
          )}

          {opportunitiesQuery.isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2">
              <RefreshCw size={14} className="animate-spin" />
              Loading volunteer opportunities...
            </div>
          )}
        </section>

        {/* Filters Panel */}
        {filtersOpen && (
          <section className="glass-card p-4 md:p-6 rounded-2xl shadow-lg border border-border/50 animate-fade-in mx-2 md:mx-0">
            <div className="grid gap-6">
              {/* Sort */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground/80">Sort</div>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "soonest", label: "Soonest" },
                    { key: "slots", label: "Slots" },
                    { key: "stars", label: "Stars" },
                    { key: "xp", label: "+XP" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${sortBy === opt.key ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Date Range */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-muted-foreground" />
                    Date Range
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      to
                    </div>
                    <div className="flex-1">
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        min={dateFrom}
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
                    <MapPin size={14} className="text-muted-foreground" />
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, state, or remote"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Age Range */}
              <div className="space-y-2 md:col-span-2">
                <div className="text-sm font-medium text-foreground/80">Age Range</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Min age</label>
                    <input
                      type="number"
                      min="0"
                      value={ageMin}
                      onChange={(e) => setAgeMin(e.target.value)}
                      placeholder="Any"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max age</label>
                    <input
                      type="number"
                      min="0"
                      value={ageMax}
                      onChange={(e) => setAgeMax(e.target.value)}
                      placeholder="Any"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground/80">
                  Categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const active = activeCategories.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() =>
                          setActiveCategories((prev) =>
                            active ? prev.filter((x) => x !== c) : [...prev, c],
                          )
                        }
                        className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                          }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              {tagUniverse.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
                    <Tag size={14} className="text-muted-foreground" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tagUniverse.map((t) => {
                      const active = activeTags.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() =>
                            setActiveTags((prev) =>
                              active
                                ? prev.filter((x) => x !== t)
                                : [...prev, t],
                            )
                          }
                          className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${active
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                            }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-2">
                <button
                  onClick={() => {
                    setActiveCategories([]);
                    setActiveTags([]);
                    setDateFrom("");
                    setDateTo("");
                    setLocationQuery("");
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full sm:w-auto"
                >
                  Clear all filters
                </button>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto"
                >
                  Show results
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Removed category and tag chips from under the search bar */}

        {/* Results */}
        <section>
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <h2 className="text-base md:text-lg font-semibold">Volunteer Opportunities</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs md:text-sm text-muted-foreground">
                {opportunitiesQuery.isLoading
                  ? "Loading..."
                  : `${filtered.length} ${filtered.length === 1 ? "opportunity" : "opportunities"}`}
              </span>
            </div>
          </div>
          {isMobile ? (
            <div className="px-2 -mx-3 md:mx-0">
              <div className="relative min-h-[75vh] transition-all duration-500 ease-in-out">
                {overlapActive ? (
                  // Stacked mode - only show first 8 cards stacked
                  filtered
                    .filter((it) => !dismissedIds.includes(it.opportunityId))
                    .slice(0, 8)
                    .map((it) => ({ it, m: computeScoreAndXp(it) }))
                    .map(({ it: item, m: metrics }, idx) => {
                      const enableSwipe = idx === 0;
                      
                      return (
                        <div 
                          key={`${item.opportunityId}-stacked-${idx}`} 
                          className="absolute top-0 left-0 right-0 flex justify-center animate-in fade-in zoom-in-95 duration-300"
                          style={{ 
                            transform: `translateY(${idx * 8}px) scale(${1 - idx * 0.02})`,
                            zIndex: 100 - idx,
                            animationDelay: `${idx * 50}ms`
                          }}
                        >
                          <div
                            className={`glass-card p-4 rounded-2xl border border-border shadow-md select-none flex flex-col max-w-md sm:max-w-lg w-full transition-all duration-200 ${idx > 0 ? 'pointer-events-none' : ''}`}
                        onClick={() => {
                          setSelectedJob({
                            title: item.title,
                            organization: item.organization,
                            date: item.date,
                            location: item.location,
                            duration: item.duration,
                            spots: item.spots,
                            category: item.category,
                            opportunityId: item.opportunityId,
                            applyUrl: item.externalUrl,
                            contactEmail: item.contactEmail,
                          });
                          setSelectedMetrics({ stars: Math.max(0, Math.min(5, Math.round((metrics.score || 0) / 10))), xp: metrics.xp });
                          setDetailsOpen2(true);
                        }}
                        onTouchStart={(e) => {
                          if (!enableSwipe) return;
                          e.preventDefault();
                          (e.currentTarget as any)._x = e.touches[0].clientX;
                          (e.currentTarget as any)._y = e.touches[0].clientY;
                          (e.currentTarget as any)._dx = 0;
                          (e.currentTarget as any)._dy = 0;
                        }}
                        onTouchMove={(e) => {
                          if (!enableSwipe) return;
                          const startX = (e.currentTarget as any)._x || 0;
                          const startY = (e.currentTarget as any)._y || 0;
                          const curX = e.touches[0].clientX;
                          const curY = e.touches[0].clientY;
                          const dx = curX - startX;
                          const dy = curY - startY;
                          (e.currentTarget as any)._dx = dx;
                          (e.currentTarget as any)._dy = dy;
                          
                          // Only handle horizontal swipes when movement is primarily horizontal
                          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
                            e.preventDefault();
                            const el = e.currentTarget as HTMLElement;
                            el.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
                            el.style.backgroundColor = dx < 0 ? 'rgba(255,0,0,0.1)' : 'rgba(128,128,128,0.1)';
                          }
                        }}
                        onTouchEnd={(e) => {
                          if (!enableSwipe) return;
                          const dx = (e.currentTarget as any)._dx || 0;
                          const dy = (e.currentTarget as any)._dy || 0;
                          const el = e.currentTarget as HTMLElement;
                          const threshold = (window.innerWidth || 360) * 0.25;
                          
                          // Only dismiss if horizontal movement was significant
                          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
                            setDismissedIds((prev) => Array.from(new Set([...prev, item.opportunityId])));
                            el.style.transition = 'transform 300ms ease-out, opacity 300ms, background-color 300ms';
                            el.style.transform = dx > 0 ? 'translateX(120%) rotate(15deg)' : 'translateX(-120%) rotate(-15deg)';
                            el.style.opacity = '0';
                            el.style.backgroundColor = '';
                          } else {
                            el.style.transition = 'transform 200ms ease-out, background-color 200ms';
                            el.style.transform = '';
                            el.style.backgroundColor = '';
                          }
                        }}
                      >
                        <div className="text-base font-semibold text-foreground truncate" title={item.title}>{item.title}</div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] whitespace-nowrap overflow-x-auto">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={i < Math.max(0, Math.min(5, Math.round((metrics.score || 0) / 10))) ? 'text-yellow-500' : 'text-muted-foreground'}>★</span>
                            ))}
                          </div>
                          <span className="text-[11px] font-medium text-green-600">+{metrics.xp} XP</span>
                          <span className="px-2 py-0.5 rounded-full border text-[10px]">External</span>
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border w-max"><CalendarDays size={12} />{item.date}</div>
                        <div className="mt-1 text-xs text-muted-foreground truncate">{item.organization}</div>
                        <div className="mt-2 text-xs text-muted-foreground line-clamp-4">{(item as any).description?.replace?.(/<[^>]*>/g, '') || ''}</div>
                            {enableSwipe && <div className="mt-3 text-center text-[11px] text-muted-foreground">Swipe left to decline • right to skip • tap for details</div>}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  // Carousel mode - show all cards in a scrollable list with animation
                  filtered
                    .filter((it) => !dismissedIds.includes(it.opportunityId))
                    .map((it) => ({ it, m: computeScoreAndXp(it) }))
                    .map(({ it: item, m: metrics }, idx) => (
                      <div 
                        key={`${item.opportunityId}-carousel-${idx}`} 
                        className="flex justify-center mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div
                          className="glass-card p-3 sm:p-4 rounded-2xl border border-border shadow-md select-none flex flex-col max-w-md sm:max-w-lg w-full"
                          onClick={() => {
                            setSelectedJob({
                              title: item.title,
                              organization: item.organization,
                              date: item.date,
                              location: item.location,
                              duration: item.duration,
                              spots: item.spots,
                              category: item.category,
                              opportunityId: item.opportunityId,
                              applyUrl: item.externalUrl,
                              contactEmail: item.contactEmail,
                            });
                            setSelectedMetrics({ stars: Math.max(0, Math.min(5, Math.round((metrics.score || 0) / 10))), xp: metrics.xp });
                            setDetailsOpen2(true);
                          }}
                        >
                          <div className="text-sm sm:text-base font-semibold text-foreground line-clamp-2" title={item.title}>{item.title}</div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] whitespace-nowrap overflow-x-auto">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={i < Math.max(0, Math.min(5, Math.round((metrics.score || 0) / 10))) ? 'text-yellow-500' : 'text-muted-foreground'}>★</span>
                              ))}
                            </div>
                            <span className="text-[11px] font-medium text-green-600">+{metrics.xp} XP</span>
                            <span className="px-2 py-0.5 rounded-full border text-[10px]">External</span>
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border w-max"><CalendarDays size={12} />{item.date}</div>
                          <div className="mt-1 text-xs text-muted-foreground truncate">{item.organization}</div>
                          <div className="mt-2 text-xs text-muted-foreground line-clamp-3">{(item as any).description?.replace?.(/<[^>]*>/g, '') || ''}</div>
                        </div>
                      </div>
                    ))
                )}
                {/* Add spacer for scroll space when stacked */}
                {overlapActive && <div className="h-[10vh]"></div>}
              </div>
            </div>
          ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr items-stretch">
            {filtered
              .map((it) => ({ it, m: computeScoreAndXp(it) }))
              .sort((a, b) => {
                if (sortBy === "xp") return b.m.xp - a.m.xp;
                if (sortBy === "stars") return b.m.stars - a.m.stars;
                return 0;
              })
              .slice(0, limit)
              .map(({ it: item, m: metrics }, idx) => {
              return (
              <div key={idx} className="h-full w-full">
                <ExternalOpportunityCard
                  key={`${item.opportunityId}-${extRefresh}`}
                  {...item}
                  score={metrics.score}
                  xpReward={metrics.xp}
                  applied={hasApplied(item.opportunityId)}
                  onClick={() => {
                    setSelectedJob({
                      title: item.title,
                      organization: item.organization,
                      date: item.date,
                      location: item.location,
                      duration: item.duration,
                      spots: item.spots,
                      category: item.category,
                      opportunityId: item.opportunityId,
                      applyUrl: item.externalUrl,
                      contactEmail: item.contactEmail,
                    });
                    setSelectedMetrics({ stars: Math.max(0, Math.min(5, Math.round((metrics.score || 0) / 10))), xp: metrics.xp });
                    setDetailsOpen2(true);
                  }}
                  onApply={async (opportunityId, title) => {
                    if (!externalAppsService) return;
                    
                    try {
                      const success = await externalAppsService.createApplication({
                        opportunity_id: opportunityId,
                        title,
                        organization: item.organization,
                        date_applied: new Date().toISOString().slice(0,10),
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
                        // Trigger refresh
                        window.dispatchEvent(new Event('external-updated'));
                        trackApplication.mutate({ opportunityId, opportunityTitle: title });
                      }
                    } catch (error) {
                      console.error('Error creating external application:', error);
                    }
                   }}
                />
              </div>
              );
            })}
          </div>
          )}
          {(!isMobile && filtered.length > limit) && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => setLimit((l) => l + 20)}>
                Load more
              </Button>
            </div>
          )}
          <JobDetailsDialog
            open={detailsOpen2}
            onOpenChange={setDetailsOpen2}
            job={selectedJob}
            stars={selectedMetrics.stars}
            xp={selectedMetrics.xp}
            onApply={async (id) => {
              if (!selectedJob || !externalAppsService) return;
              
              try {
                const success = await externalAppsService.createApplication({
                  opportunity_id: id || selectedJob.opportunityId,
                  title: selectedJob.title,
                  organization: selectedJob.organization,
                  date_applied: new Date().toISOString().slice(0,10),
                  hours_worked: 0,
                  status: "applied",
                  is_external: true,
                  xp_reward: selectedMetrics.xp || 0,
                  score: (selectedMetrics.stars || 0) * 10,
                  contacted: false,
                  interview: false,
                  rejected: false,
                  notes: "",
                  credited_xp: false,
                  planned_hours: 0,
                });
                
                if (success) {
                  toast({ title: "Application recorded" });
                }
              } catch (error) {
                console.error('Error creating external application:', error);
                toast({ title: "Error recording application", variant: "destructive" });
              }
            }}
          />
          <Suspense fallback={<div className="hidden" />}>
            <SettingsDialog
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
            />
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
        </section>
        {/* External application details dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record application details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="text-foreground font-medium">
                {detailsDraft?.title}
                <div className="text-xs text-muted-foreground">{detailsDraft?.organization}</div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">Hours completed</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                >
                  <option value="applied">Applied</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!externalAppsService || !detailsDraft) return;
                    
                    try {
                      const success = await externalAppsService.createApplication({
                        opportunity_id: detailsDraft.opportunityId,
                        title: detailsDraft.title,
                        organization: detailsDraft.organization,
                        date_applied: formDate || new Date().toISOString().slice(0,10),
                        hours_worked: Math.max(0, parseFloat(formHours || "0")) || 0,
                        status: formStatus,
                        is_external: true,
                        xp_reward: detailsDraft.xp ?? 0,
                        score: detailsDraft.score ?? 0,
                        contacted: false,
                        interview: false,
                        rejected: false,
                        notes: "",
                        credited_xp: false,
                        planned_hours: 0,
                      });
                      
                      if (success) {
                        // Award XP for applying regardless of outcome
                        if (detailsDraft.xp) addBonusXp(detailsDraft.xp);
                        // If marked done, award hours-based XP too
                        const h = Math.max(0, parseFloat(formHours || "0")) || 0;
                        if (formStatus === "done" && h > 0) {
                          addBonusXp(Math.round(h * 10));
                        }
                        toast({ title: "Application recorded" });
                        setDetailsOpen(false);
                      }
                    } catch (error) {
                      console.error('Error creating external application:', error);
                      toast({ title: "Error recording application", variant: "destructive" });
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Jobs;
