import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";
import { QuestService } from "@/lib/questService";
import { ExternalApplicationsService } from "@/lib/externalApplicationsService";
import { SavedOpportunitiesService } from "@/lib/savedOpportunitiesService";
import { OnboardingService } from "@/lib/onboardingService";

type UserState = {
  name: string;
  school?: string;
  totalHours: number; // total verified hours
  streak: number; // day streak
};

type UserComputed = {
  xp: number; // XP derived from hours (10 xp per hour)
  level: number;
  xpInLevel: number;
  maxXp: number;
};

type UserReputation = {
  avgRating: number; // 1-5
  onTimeRate: number; // 0-100 (%)
  showUpRate: number; // 0-100 (%)
};

type UserContextValue = UserState & UserComputed & UserReputation & {
  logHours: (hours: number, title?: string, organization?: string, notes?: string) => void;
  setSchool: (school?: string) => void;
  setName: (name: string) => void;
  addBonusXp: (xp: number) => void;
  updateReputation: (newRating: number, newOnTimeRate: number, newShowUpRate: number) => void;
  isLoading: boolean;
  migrateFromLocalStorage: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [school, setSchool] = useState<string | undefined>(undefined);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [onTimeRate, setOnTimeRate] = useState<number>(0);
  const [showUpRate, setShowUpRate] = useState<number>(0);
  const [bonusXp, setBonusXp] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load user progress from database
  useEffect(() => {
    const loadUserProgress = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Load from gamification table
        const { data: gamificationData, error: gamError } = await supabase
          .from('gamification')
          .select('*')
          .eq('student_id', user.id)
          .single();

        if (gamError && gamError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading gamification data:', gamError);
        }

        if (gamificationData) {
          setTotalHours(gamificationData.hours_completed || 0);
          setStreak(gamificationData.streak || 0);
          setBonusXp(gamificationData.bonus_xp || 0);
          setAvgRating(gamificationData.avg_rating || 0);
          setOnTimeRate(gamificationData.on_time_rate || 0);
          setShowUpRate(gamificationData.show_up_rate || 0);
        } else {
          // Create initial gamification record
          const { error: insertError } = await supabase
            .from('gamification')
            .insert({
              student_id: user.id,
              hours_completed: 0,
              bonus_xp: 0,
              streak: 0,
              avg_rating: 0.0,
              on_time_rate: 0,
              show_up_rate: 0,
              reputation_score: 0,
              badges_unlocked: []
            });

          if (insertError) {
            console.error('Error creating gamification record:', insertError);
          }
        }

        // Load from profiles table for name and school
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, school')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setName(profileData.full_name || '');
          setSchool(profileData.school || undefined);
        }

        // Check if we need to migrate from localStorage
        await migrateFromLocalStorage();
        
        // Migrate quest data
        if (user.id) {
          const questService = new QuestService(user.id);
          await questService.migrateFromLocalStorage();
        }

        // Migrate external applications data
        if (user.id) {
          const externalAppsService = new ExternalApplicationsService(user.id);
          await externalAppsService.migrateFromLocalStorage();
        }

        // Migrate saved opportunities data
        if (user.id) {
          const savedOpportunitiesService = new SavedOpportunitiesService(user.id);
          await savedOpportunitiesService.migrateFromLocalStorage();
        }

        // Migrate onboarding data
        if (user.id) {
          const onboardingService = new OnboardingService(user.id);
          await onboardingService.migrateFromLocalStorage();
        }

      } catch (error) {
        console.error('Error loading user progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProgress();
  }, [user?.id]);

  // Migration function to move localStorage data to database
  const migrateFromLocalStorage = async () => {
    if (!user?.id) return;

    try {
      // Check if migration is needed
      const { data: existingData } = await supabase
        .from('gamification')
        .select('*')
        .eq('student_id', user.id)
        .single();

      if (existingData) {
        // Check if we have localStorage data that's newer
        const localHours = parseFloat(localStorage.getItem('vp_total_hours') || '0') || 0;
        const localBonusXp = parseInt(localStorage.getItem('vp_bonus_xp') || '0', 10) || 0;
        const localRep = JSON.parse(localStorage.getItem('vp_reputation') || '{}');

        if (localHours > 0 || localBonusXp > 0 || localRep.avgRating > 0) {
          // Migrate localStorage data to database
          const { error: updateError } = await supabase
            .from('gamification')
            .update({
              hours_completed: Math.max(existingData.hours_completed || 0, localHours),
              bonus_xp: Math.max(existingData.bonus_xp || 0, localBonusXp),
              avg_rating: Math.max(existingData.avg_rating || 0, localRep.avgRating || 0),
              on_time_rate: Math.max(existingData.on_time_rate || 0, localRep.onTimeRate || 0),
              show_up_rate: Math.max(existingData.show_up_rate || 0, localRep.showUpRate || 0),
              last_activity_at: new Date().toISOString()
            })
            .eq('student_id', user.id);

          if (updateError) {
            console.error('Error migrating localStorage data:', updateError);
          } else {
            // Clear migrated data from localStorage
            localStorage.removeItem('vp_total_hours');
            localStorage.removeItem('vp_bonus_xp');
            localStorage.removeItem('vp_reputation');
            
            // Reload the data from database
            const { data: updatedData } = await supabase
              .from('gamification')
              .select('*')
              .eq('student_id', user.id)
              .single();
              
            if (updatedData) {
              setTotalHours(updatedData.hours_completed || 0);
              setBonusXp(updatedData.bonus_xp || 0);
              setAvgRating(updatedData.avg_rating || 0);
              setOnTimeRate(updatedData.on_time_rate || 0);
              setShowUpRate(updatedData.show_up_rate || 0);
            }
          }
        }
      }

      // Migrate volunteer history
      const historyRaw = localStorage.getItem('vp_history');
      if (historyRaw) {
        try {
          const history = JSON.parse(historyRaw);
          if (Array.isArray(history) && history.length > 0) {
            const historyRecords = history.map((item: any) => ({
              user_id: user.id,
              title: item.title || 'Volunteer Work',
              organization: item.org || 'Unknown Organization',
              hours_worked: parseFloat(item.hours) || 0,
              date_worked: item.date || new Date().toISOString().split('T')[0],
              notes: item.notes || ''
            }));

            const { error: historyError } = await supabase
              .from('user_progress_history')
              .upsert(historyRecords, { onConflict: 'user_id,title,date_worked' });

            if (!historyError) {
              localStorage.removeItem('vp_history');
            }
          }
        } catch (e) {
          console.error('Error migrating history:', e);
        }
      }

    } catch (error) {
      console.error('Error during migration:', error);
    }
  };

  const computed: UserComputed = useMemo(() => {
    const xp = Math.floor(totalHours * 10) + Math.max(0, bonusXp);
    const level = Math.floor(xp / 100); // start at level 0
    const xpInLevel = xp % 100;
    const maxXp = 100;
    return { xp, level, xpInLevel, maxXp };
  }, [totalHours, bonusXp]);

  const logHours = async (hours: number, title?: string, organization?: string, notes?: string) => {
    if (!user?.id) return;

    const newTotalHours = Math.max(0, totalHours + hours);
    setTotalHours(newTotalHours);
    
    if (hours > 0) {
      setStreak((s) => s + 1);
      
      // Add to history
      if (title || organization) {
        try {
          const { error } = await supabase
            .from('user_progress_history')
            .insert({
              user_id: user.id,
              title: title || 'Volunteer Work',
              organization: organization || 'Unknown Organization',
              hours_worked: hours,
              date_worked: new Date().toISOString().split('T')[0],
              notes: notes || ''
            });

          if (error) {
            console.error('Error saving history:', error);
          }
        } catch (error) {
          console.error('Error saving history:', error);
        }
      }
    }

    // Update database
    try {
      const { error } = await supabase
        .from('gamification')
        .update({
          hours_completed: newTotalHours,
          streak: hours > 0 ? streak + 1 : streak,
          last_activity_at: new Date().toISOString()
        })
        .eq('student_id', user.id);

      if (error) {
        console.error('Error updating gamification:', error);
      }
    } catch (error) {
      console.error('Error updating gamification:', error);
    }
  };

  const addBonusXp = async (xp: number) => {
    if (!user?.id) return;

    const newBonusXp = Math.max(0, bonusXp + xp);
    setBonusXp(newBonusXp);

    try {
      const { error } = await supabase
        .from('gamification')
        .update({
          bonus_xp: newBonusXp,
          last_activity_at: new Date().toISOString()
        })
        .eq('student_id', user.id);

      if (error) {
        console.error('Error updating bonus XP:', error);
      }
    } catch (error) {
      console.error('Error updating bonus XP:', error);
    }
  };

  const updateReputation = async (newRating: number, newOnTimeRate: number, newShowUpRate: number) => {
    if (!user?.id) return;

    setAvgRating(newRating);
    setOnTimeRate(newOnTimeRate);
    setShowUpRate(newShowUpRate);
    
    try {
      const { error } = await supabase
        .from('gamification')
        .update({
          avg_rating: newRating,
          on_time_rate: newOnTimeRate,
          show_up_rate: newShowUpRate,
          last_activity_at: new Date().toISOString()
        })
        .eq('student_id', user.id);

      if (error) {
        console.error('Error updating reputation:', error);
      }
    } catch (error) {
      console.error('Error updating reputation:', error);
    }
  };

  // Listen for reputation updates from verification
  useEffect(() => {
    const handleReputationUpdate = () => {
      // This will be handled by the database now
      // But we can still listen for events if needed
    };

    window.addEventListener('reputation-updated', handleReputationUpdate);
    return () => window.removeEventListener('reputation-updated', handleReputationUpdate);
  }, []);

  const value: UserContextValue = {
    name,
    school,
    totalHours,
    streak,
    xp: computed.xp,
    level: computed.level,
    xpInLevel: computed.xpInLevel,
    maxXp: computed.maxXp,
    avgRating,
    onTimeRate,
    showUpRate,
    logHours,
    addBonusXp,
    setSchool,
    setName,
    updateReputation,
    isLoading,
    migrateFromLocalStorage,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    console.error("useUser must be used within UserProvider");
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
};
