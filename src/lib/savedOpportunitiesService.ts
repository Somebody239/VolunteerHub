import { supabase } from "@/lib/supabaseClient";

export type SavedOpportunity = {
  id: string;
  user_id: string;
  opportunity_id: string;
  title: string;
  organization: string;
  date?: string;
  location?: string;
  category: string;
  external_url?: string;
  contact_email?: string;
  saved_at: string;
};

export type CreateSavedOpportunityPayload = Omit<SavedOpportunity, 'id' | 'user_id' | 'saved_at'>;

export class SavedOpportunitiesService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getSavedOpportunities(): Promise<SavedOpportunity[]> {
    const { data, error } = await supabase
      .from('saved_opportunities')
      .select('*')
      .eq('user_id', this.userId)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved opportunities:', error);
      return [];
    }
    return data as SavedOpportunity[];
  }

  async saveOpportunity(payload: CreateSavedOpportunityPayload): Promise<boolean> {
    const { error } = await supabase
      .from('saved_opportunities')
      .upsert({ ...payload, user_id: this.userId }, { onConflict: 'user_id,opportunity_id' });

    if (error) {
      console.error('Error saving opportunity:', error);
      return false;
    }
    return true;
  }

  async unsaveOpportunity(opportunityId: string): Promise<boolean> {
    const { error } = await supabase
      .from('saved_opportunities')
      .delete()
      .eq('user_id', this.userId)
      .eq('opportunity_id', opportunityId);

    if (error) {
      console.error('Error unsaving opportunity:', error);
      return false;
    }
    return true;
  }

  async isOpportunitySaved(opportunityId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('saved_opportunities')
      .select('id')
      .eq('user_id', this.userId)
      .eq('opportunity_id', opportunityId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking if opportunity is saved:', error);
      return false;
    }
    return !!data;
  }

  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Migrate saved items from localStorage
      const savedItemsRaw = localStorage.getItem('vp_saved_items');
      if (savedItemsRaw) {
        const savedItems = JSON.parse(savedItemsRaw);
        if (Array.isArray(savedItems) && savedItems.length > 0) {
          const opportunitiesToMigrate = savedItems.map((item: any) => ({
            opportunity_id: item.id,
            title: item.title || 'Unknown Title',
            organization: item.organization || 'Unknown Organization',
            date: item.date || null,
            location: item.location || null,
            category: item.category || 'General',
            external_url: item.externalUrl || null,
            contact_email: item.contactEmail || null,
          }));

          // Insert opportunities (ignore duplicates)
          for (const opportunity of opportunitiesToMigrate) {
            await supabase
              .from('saved_opportunities')
              .upsert({ ...opportunity, user_id: this.userId }, { onConflict: 'user_id,opportunity_id' });
          }

          // Clear localStorage
          localStorage.removeItem('vp_saved_items');
          localStorage.removeItem('vp_saved'); // Also clear the IDs array
          console.log('Saved opportunities migrated from localStorage.');
        }
      }
    } catch (error) {
      console.error('Error migrating saved opportunities from localStorage:', error);
    }
  }
}
