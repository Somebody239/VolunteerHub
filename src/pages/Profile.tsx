import { ProfileCard } from "@/components/ProfileCard";
import { Navigation } from "@/components/Navigation";
import { Award, Zap, Clock3, Star, ShieldCheck, Settings, Bell, UserPlus, Medal, Crown, Trophy } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import { SettingsDialog } from "@/components/SettingsDialog";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { InviteDialog } from "@/components/InviteDialog";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { InlineEditableText } from "@/components/InlineEditableText";
import { TagEditor } from "@/components/TagEditor";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { supabase } from "@/lib/supabaseClient";

const Profile = () => {
  const badges = [
    { icon: Medal, label: "First Shift" },
    { icon: Trophy, label: "10-Hour Club" },
    { icon: Crown, label: "Weekend Warrior" },
  ];

  const history = [
    { title: "Community Garden Cleanup", org: "Green Austin", date: "Aug 24, 2025", hours: 3, rating: 5 },
    { title: "Library Storytime", org: "Austin Public Library", date: "Aug 17, 2025", hours: 2, rating: 4 },
    { title: "Food Bank Sorting", org: "Austin Food Bank", date: "Aug 10, 2025", hours: 4, rating: 5 },
  ];

  const { name, school, totalHours, streak, level, xpInLevel, maxXp } = useUser();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [schoolVal, setSchoolVal] = useState("");
  const [about, setAbout] = useState("");
  const [locationVal, setLocationVal] = useState("");
  const [interests, setInterests] = useState("");
  const [availability, setAvailability] = useState("");

  const { user, signOut } = useAuth();

  // Load profile values to bind inline editors
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, school, about, location, interests, availability")
        .eq("id", user.id)
        .maybeSingle();
      if (error) return;
      setFullName((data?.full_name as string) ?? name ?? "");
      setSchoolVal((data?.school as string) ?? school ?? "");
      setAbout((data?.about as string) ?? "");
      setLocationVal((data?.location as string) ?? "");
      setInterests((data?.interests as string) ?? "");
      setAvailability((data?.availability as string) ?? "");
    };
    void load();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="grid grid-cols-[1fr,auto,1fr] items-center p-3 md:p-4 border-b border-border/50 gap-4 md:gap-8">
        <div className="justify-self-start min-w-0 w-full pr-4 md:pr-8">
          <ProfileCard
            name={name}
            level={level}
            xp={xpInLevel}
            maxXp={maxXp}
            totalHours={totalHours}
            streak={streak}
            school={school}
            variant="plain"
          />
        </div>
        <div className="justify-self-center">
          <Navigation activeTab="profile" />
        </div>
        <div className="justify-self-end hidden sm:flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-muted/50 transition-colors" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <Settings size={16} />
          </button>
          <button className="p-2 rounded-full hover:bg-muted/50 transition-colors" aria-label="Notifications" onClick={() => setNotificationsOpen(true)}>
            <Bell size={16} />
          </button>
          <button className="p-2 rounded-full hover:bg-muted/50 transition-colors" aria-label="Invite Friend" onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} />
          </button>
          {user && (
            <>
              <span className="text-xs text-muted-foreground truncate max-w-[160px]" title={user.email ?? undefined}>{user.email}</span>
              <Button variant="outline" size="sm" onClick={async () => {
                const { error } = await signOut();
                if (error) toast({ title: "Sign out failed", description: error.message, variant: "destructive" });
                else toast({ title: "Signed out" });
              }}>Sign Out</Button>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {/* Gamified header */}
        <section className="grid gap-4 md:grid-cols-3 items-stretch">
          {/* Summary */}
          <div className="md:col-span-2 glass-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Award size={18} className="text-badge" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold truncate">{fullName || name}</h2>
                  <span className="text-xs text-muted-foreground">Lvl. {level}</span>
                </div>
                <div className="mt-2 h-2 bg-level rounded-full overflow-hidden">
                  <div className="h-full bg-xp progress-fill rounded-full" style={{ width: `${(xpInLevel / maxXp) * 100}%` }} />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{xpInLevel} / {maxXp} XP</div>
              </div>
              {/* Removed Edit Profile button: inline editing below */}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="glass-card p-3 flex items-center gap-2">
                <Clock3 size={14} />
                <div>
                  <div className="font-medium">{totalHours}h</div>
                  <div className="text-xs text-muted-foreground">Verified Hours</div>
                </div>
              </div>
              <div className="glass-card p-3 flex items-center gap-2">
                <Zap size={14} className="text-status-confirmed" />
                <div>
                  <div className="font-medium">{streak}</div>
                  <div className="text-xs text-muted-foreground">Day Streak</div>
                </div>
              </div>
              <div className="glass-card p-3 flex items-center gap-2">
                <ShieldCheck size={14} />
                <div>
                  <div className="font-medium">Top 12%</div>
                  <div className="text-xs text-muted-foreground">Leaderboard</div>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3">Badges</h3>
            <div className="flex items-center gap-3 flex-wrap">
              {badges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/40">
                  <Icon size={16} />
                  <span className="text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reputation & Settings */}
        <section className="grid gap-4 md:grid-cols-[2fr,1fr] items-stretch">
          {/* Reputation */}
          <div className="md:col-span-2 glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Reputation</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="glass-card p-3">
                <div className="flex items-center gap-2"><Star size={14} /><span className="font-medium">4.8</span></div>
                <div className="text-xs text-muted-foreground mt-1">Average Rating</div>
              </div>
              <div className="glass-card p-3">
                <div className="flex items-center gap-2"><Zap size={14} /><span className="font-medium">98%</span></div>
                <div className="text-xs text-muted-foreground mt-1">On-Time Rate</div>
              </div>
              <div className="glass-card p-3">
                <div className="flex items-center gap-2"><ShieldCheck size={14} /><span className="font-medium">96%</span></div>
                <div className="text-xs text-muted-foreground mt-1">Show-Up Rate</div>
              </div>
            </div>
          </div>

          {/* Settings - Inline editable */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3">Settings</h3>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Full Name</div>
                <InlineEditableText
                  value={fullName || name}
                  onChange={async (v) => {
                    if (!user) return;
                    const { error } = await supabase.from('profiles').upsert({ id: user.id, full_name: v, updated_at: new Date().toISOString() }, { onConflict: 'id' });
                    if (error) {
                      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
                    } else {
                      setFullName(v);
                      toast({ title: 'Saved' });
                    }
                  }}
                />
              </div>
              <div>
                <div className="text-muted-foreground mb-1">School</div>
                <InlineEditableText
                  value={schoolVal || school || ''}
                  onChange={async (v) => {
                    if (!user) return;
                    const { error } = await supabase.from('profiles').upsert({ id: user.id, school: v, updated_at: new Date().toISOString() }, { onConflict: 'id' });
                    if (error) {
                      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
                    } else {
                      setSchoolVal(v);
                      toast({ title: 'Saved' });
                    }
                  }}
                />
              </div>
              <div>
                <div className="text-muted-foreground mb-1">About</div>
                <InlineEditableText
                  value={about}
                  onChange={async (v) => {
                    if (!user) return;
                    const { error } = await supabase.from('profiles').upsert({ id: user.id, about: v, updated_at: new Date().toISOString() }, { onConflict: 'id' });
                    if (error) {
                      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
                    } else {
                      setAbout(v);
                      toast({ title: 'Saved' });
                    }
                  }}
                  placeholder="Add a short bio"
                />
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Location</div>
                <LocationAutocomplete
                  value={locationVal}
                  onChange={async (v) => {
                    if (!user) return;
                    if (!v || v.length < 2) { toast({ title: 'Invalid location', description: 'Pick a real location from suggestions.', variant: 'destructive' }); return; }
                    const { error } = await supabase.from('profiles').upsert({ id: user.id, location: v, updated_at: new Date().toISOString() }, { onConflict: 'id' });
                    if (error) {
                      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
                    } else {
                      setLocationVal(v);
                      toast({ title: 'Saved' });
                    }
                  }}
                  placeholder="Search your city or address"
                />
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Interests</div>
                <TagEditor
                  value={interests}
                  onChange={async (csv) => {
                    if (!user) return;
                    const { error } = await supabase.from('profiles').upsert({ id: user.id, interests: csv, updated_at: new Date().toISOString() }, { onConflict: 'id' });
                    if (error) {
                      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
                    } else {
                      setInterests(csv);
                      toast({ title: 'Saved' });
                    }
                  }}
                />
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Availability (weekly schedule)</div>
                <ScheduleEditor
                  value={availability}
                  onChange={async (json) => {
                    if (!user) return;
                    const { error } = await supabase.from('profiles').upsert({ id: user.id, availability: json, updated_at: new Date().toISOString() }, { onConflict: 'id' });
                    if (error) {
                      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
                    } else {
                      setAvailability(json);
                      toast({ title: 'Saved' });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* History */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">History</h3>
            <button className="text-sm text-primary hover:text-primary/80">Download Verification</button>
          </div>
          <div className="grid gap-3">
            {history.map((h, i) => (
              <div key={i} className="glass-card p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium truncate">{h.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{h.org} • {h.date}</div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-sm"><span className="text-muted-foreground">Hours:</span> {h.hours}</div>
                  <div className="flex items-center gap-1 text-sm"><Star size={14} /> {h.rating}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      {/* Removed ProfileEditDialog - now using inline editing above */}
    </div>
  );
};

export default Profile;
