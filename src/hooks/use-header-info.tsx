import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export type HeaderInfo = {
  displayName: string;
  school?: string;
  role: 'student' | 'organizer' | null;
  orgName?: string;
  location?: string;
  isAdmin?: boolean;
};

export const useHeaderInfo = (): HeaderInfo => {
  const { user } = useAuth();
  const [info, setInfo] = useState<HeaderInfo>({ displayName: "", role: null, isAdmin: false });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) { setInfo({ displayName: "", role: null, isAdmin: false }); return; }
      // fetch profile name/school
      const { data: profile } = await supabase.from('profiles').select('full_name, school').eq('id', user.id).maybeSingle();
      // check organization
      const { data: org } = await supabase.from('organizations').select('name').eq('id', user.id).maybeSingle();
      const role = org ? 'organizer' as const : 'student' as const;
      const displayName = (profile?.full_name as string) || (user.email ?? '');
      let locationStr: string | undefined = undefined;
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const j = await res.json();
          const city = j.city as string | undefined;
          const region = j.region as string | undefined;
          if (city || region) locationStr = [city, region].filter(Boolean).join(', ');
        }
      } catch {}
      const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)?.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean) ?? [];
      const isAdmin = adminEmails.includes((user.email ?? '').toLowerCase()) || (user.email ?? '').toLowerCase() === 'joshi_kishan@icloud.com';
      if (!cancelled) setInfo({ displayName, school: (profile?.school as string) || undefined, role, orgName: (org?.name as string) || undefined, location: locationStr, isAdmin });
    };
    void load();
    return () => { cancelled = true; };
  }, [user?.id]);

  return info;
};


