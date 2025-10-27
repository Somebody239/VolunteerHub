import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useHeaderInfo } from "@/hooks/use-header-info";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Navigation } from "@/components/Navigation";

type Props = {
  activeTab: "org" | "org_jobs" | "profile";
};

export const OrgHeader: React.FC<Props> = ({ activeTab }) => {
  const { user, signOut } = useAuth();
  const header = useHeaderInfo();

  const orgInfoQuery = useQuery({
    queryKey: ["organizations", user?.id, "header:unified"],
    queryFn: async (): Promise<{ name?: string; verified?: boolean } | null> => {
      if (!user) return null;
      const { data } = await supabase.from("organizations").select("name, verified").eq("id", user.id).maybeSingle();
      return (data as any) ?? null;
    },
    enabled: !!user,
  });

  return (
    <header className="grid grid-cols-[1fr,auto,1fr] items-center p-3 md:p-4 border-b border-border/50 gap-4 md:gap-8">
      <div className="justify-self-start hidden md:block">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><ShieldCheck size={16} /></div>
          <div>
            <div className="text-sm font-medium truncate">{orgInfoQuery.data?.name || 'Organization'}</div>
            <div className={`text-xs ${orgInfoQuery.data?.verified ? 'text-status-confirmed' : 'text-muted-foreground'}`}>{orgInfoQuery.data?.verified ? 'Verified' : 'Unverified'}</div>
          </div>
        </div>
      </div>
      <div className="justify-self-center">
        <Navigation activeTab={activeTab} />
      </div>
      <div className="justify-self-end hidden sm:flex items-center gap-2">
        <span className="px-2 py-0.5 text-xs rounded-full border border-border text-muted-foreground">{header.role === 'organizer' ? 'Organizer' : 'Student'}</span>
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
  );
};

export default OrgHeader;


