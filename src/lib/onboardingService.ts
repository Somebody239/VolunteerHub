import { supabase } from "@/lib/supabaseClient";

export type OnboardingStatus = {
  id: string;
  user_id: string;
  intended_role: 'student' | 'organization';
  onboarding_completed: boolean;
  onboarding_skipped: boolean;
  completed_at?: string;
  skipped_at?: string;
  created_at: string;
  updated_at: string;
};

export type CreateOnboardingStatusPayload = {
  intended_role: 'student' | 'organization';
  onboarding_completed?: boolean;
  onboarding_skipped?: boolean;
  tags?: string[];
  preferred_location?: string;
  min_age?: number;
  max_age?: number;
  max_distance_km?: number;
};

export class OnboardingService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getOnboardingStatus(): Promise<OnboardingStatus | null> {
    const { data, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', this.userId)
      .maybeSingle();

    // Gracefully handle errors - return null if table doesn't exist or query fails
    if (error) {
      // Check for "no rows" error (PGRST116) or table doesn't exist (PGRST103/404/406)
      if (error.code === 'PGRST116') {
        return null; // No rows is fine
      }
      
      // For 404/406 errors (table doesn't exist), return null gracefully
      if (error.code === '42P01' || error.message?.includes('relation "user_onboarding" does not exist')) {
        if (import.meta.env.DEV) {
          console.warn('user_onboarding table does not exist, skipping onboarding status');
        }
        return null;
      }
      
      if (import.meta.env.DEV) {
        console.error('Error fetching onboarding status:', error);
      }
      return null;
    }
    return data as OnboardingStatus | null;
  }

  async createOnboardingStatus(payload: CreateOnboardingStatusPayload): Promise<boolean> {
    const { error } = await supabase
      .from('user_onboarding')
      .insert({ ...payload, user_id: this.userId });

    if (error) {
      console.error('Error creating onboarding status:', error);
      return false;
    }
    return true;
  }

  async updateOnboardingStatus(updates: Partial<CreateOnboardingStatusPayload>): Promise<boolean> {
    const { error } = await supabase
      .from('user_onboarding')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error updating onboarding status:', error);
      return false;
    }
    return true;
  }

  async completeOnboarding(): Promise<boolean> {
    return this.updateOnboardingStatus({
      onboarding_completed: true,
      onboarding_skipped: false,
      completed_at: new Date().toISOString()
    });
  }

  async skipOnboarding(): Promise<boolean> {
    return this.updateOnboardingStatus({
      onboarding_completed: false,
      onboarding_skipped: true,
      skipped_at: new Date().toISOString()
    });
  }

  async shouldSkipOnboarding(): Promise<boolean> {
    const status = await this.getOnboardingStatus();
    return status?.onboarding_completed === true || status?.onboarding_skipped === true;
  }

  async getIntendedRole(): Promise<'student' | 'organization' | null> {
    const status = await this.getOnboardingStatus();
    return status?.intended_role || null;
  }

  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Check if user has onboarding data in localStorage
      const skipOnboarding = localStorage.getItem('skipOnboarding') === '1';
      const intendedRole = localStorage.getItem('intendedRole') as 'student' | 'organization' | null;

      if (skipOnboarding || intendedRole) {
        // Check if we already have onboarding status in database
        const existingStatus = await this.getOnboardingStatus();
        
        if (!existingStatus) {
          // Create onboarding status based on localStorage data
          const payload: CreateOnboardingStatusPayload = {
            intended_role: intendedRole || 'student', // Default to student if no role specified
            onboarding_completed: skipOnboarding,
            onboarding_skipped: skipOnboarding,
            tags: [], // placeholder for future onboarding tags
            preferred_location: undefined,
            min_age: undefined,
            max_age: undefined,
            max_distance_km: undefined
          };

          if (skipOnboarding) {
            payload.completed_at = new Date().toISOString();
            payload.skipped_at = new Date().toISOString();
          }

          await this.createOnboardingStatus(payload);
          console.log('Onboarding status migrated from localStorage.');
        }

        // Clear localStorage after successful migration
        localStorage.removeItem('skipOnboarding');
        localStorage.removeItem('intendedRole');
      }
    } catch (error) {
      console.error('Error migrating onboarding data from localStorage:', error);
    }
  }
}
