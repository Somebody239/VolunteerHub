import { Home, Briefcase, User, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface NavigationProps {
  activeTab: 'home' | 'jobs' | 'profile' | 'org';
}

export const Navigation = ({ activeTab }: NavigationProps) => {
  const { user } = useAuth();
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) { setIsOrganizer(false); return; }
      // Simple check: if an organization row exists for this user, show Org tab
      const { data, error } = await supabase.from('organizations').select('id').eq('id', user.id).maybeSingle();
      if (!cancelled) setIsOrganizer(!!data && !error);
    };
    void run();
    return () => { cancelled = true; };
  }, [user?.id]);

  const navItems = isOrganizer
    ? [
        { id: 'org', icon: Building2, label: 'Org', to: '/org' } as const,
        { id: 'profile', icon: User, label: 'Profile', to: '/profile' } as const,
      ]
    : [
        { id: 'home', icon: Home, label: 'Home', to: '/' } as const,
        { id: 'jobs', icon: Briefcase, label: 'Jobs', to: '/jobs' } as const,
        { id: 'profile', icon: User, label: 'Profile', to: '/profile' } as const,
      ];

  return (
    <nav className="flex items-center justify-center gap-1 bg-nav-bg rounded-full p-2 mx-auto w-fit">
      {navItems.map(({ id, icon: Icon, label, to }) => (
        <Link
          key={id}
          to={to}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-200
            ${activeTab === id 
              ? 'bg-foreground text-background' 
              : 'text-nav-inactive hover:text-nav-active'
            }
          `}
          aria-current={activeTab === id ? 'page' : undefined}
        >
          <Icon size={16} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
};