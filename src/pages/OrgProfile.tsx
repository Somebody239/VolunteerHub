import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Navigation } from "@/components/Navigation";
import OrgHeader from "@/components/OrgHeader";
import { Building2, ShieldCheck, Globe, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const OrgProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const orgQuery = useQuery({
    queryKey: ["organizations", user?.id, "profile"],
    queryFn: async (): Promise<{ name?: string; verified?: boolean; website?: string | null; about?: string | null; location?: string | null } | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("name, verified, website, about, location")
        .eq("id", user.id)
        .maybeSingle();
      if (error) return null;
      return data as any;
    },
    enabled: !!user,
  });

  const org = orgQuery.data ?? {};

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OrgHeader activeTab="profile" />

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <section className="glass-card p-5 rounded-xl">
          <h2 className="text-lg font-semibold mb-3">Organization Profile</h2>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Name</div>
              <div className="font-medium">{org.name || "—"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Status</div>
              <div className={`font-medium flex items-center gap-2 ${org.verified ? 'text-status-confirmed' : ''}`}>
                <ShieldCheck size={14} /> {org.verified ? 'Verified' : 'Unverified'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-2"><Globe size={14} /> Website</div>
              {org.website ? (
                <a className="text-primary underline underline-offset-2" href={org.website} target="_blank" rel="noreferrer">{org.website}</a>
              ) : (
                <div className="text-muted-foreground">—</div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-2"><MapPin size={14} /> Location</div>
              <div className="font-medium">{org.location || "—"}</div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <div className="text-muted-foreground flex items-center gap-2"><Info size={14} /> About</div>
              <div className="text-foreground/90 whitespace-pre-wrap">{org.about || "—"}</div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => {
              navigate("/org");
            }}>Manage Opportunities</Button>
          </div>
        </section>

        <section className="glass-card p-5 rounded-xl">
          <h2 className="text-lg font-semibold mb-3">Tips</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Keep your About and Location up to date.</li>
            <li>Post clear opportunities with dates, slots, and expectations.</li>
            <li>Verify hours promptly to build trust with volunteers.</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default OrgProfile;


