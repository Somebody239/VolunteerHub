import { supabase } from "@/lib/supabaseClient";

export interface ExternalApplication {
  id: string;
  user_id?: string;
  opportunity_id: string;
  title: string;
  organization: string;
  date_applied: string;
  hours_worked: number;
  status: 'applied' | 'accepted' | 'done' | 'rejected' | 'cancelled' | 'verify';
  is_external: boolean;
  xp_reward: number;
  score: number;
  contacted: boolean;
  interview: boolean;
  rejected: boolean;
  notes?: string;
  start_date?: string;
  verification_link?: string;
  verification_id?: string;
  credited_xp: boolean;
  planned_hours: number;
  created_at: string;
  updated_at: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  verification_id: string;
  job_title: string;
  job_date: string;
  student_hours: number;
  student_name: string;
  organization: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export class ExternalApplicationsService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Get all external applications for a user
  async getApplications(): Promise<ExternalApplication[]> {
    try {
      const { data, error } = await supabase
        .from('external_applications')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading external applications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getApplications:', error);
      return [];
    }
  }

  // Get active applications (exclude completed, rejected, cancelled)
  async getActiveApplications(): Promise<ExternalApplication[]> {
    try {
      const { data, error } = await supabase
        .from('external_applications')
        .select('*')
        .eq('user_id', this.userId)
        .not('status', 'in', '(done,rejected,cancelled)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading active applications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveApplications:', error);
      return [];
    }
  }

  // Create a new external application
  async createApplication(application: Omit<ExternalApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ExternalApplication | null> {
    try {
      // Filter out empty strings for optional fields, convert them to null
      const cleanedApplication: any = {};
      Object.keys(application).forEach(key => {
        const value = application[key];
        
        // Skip undefined values
        if (value === undefined) {
          return;
        }
        
        // For optional date and link fields, convert empty strings to null
        if (key === 'start_date' || key === 'verification_link' || key === 'verification_id') {
          cleanedApplication[key] = (value === '' || value === null) ? null : value;
        }
        // For all other fields, include them as-is (allow empty strings)
        else {
          cleanedApplication[key] = value;
        }
      });

      const { data, error } = await supabase
        .from('external_applications')
        .insert({
          ...cleanedApplication,
          user_id: this.userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating application:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createApplication:', error);
      return null;
    }
  }

  // Update an existing application
  async updateApplication(id: string, updates: Partial<ExternalApplication>): Promise<boolean> {
    try {
      // Filter out empty strings for optional fields, convert them to null
      const cleanedUpdates: any = {};
      Object.keys(updates).forEach(key => {
        const value = updates[key];
        
        // Skip undefined values
        if (value === undefined) {
          return;
        }
        
        // For optional date and link fields, convert empty strings to null
        if (key === 'start_date' || key === 'verification_link' || key === 'verification_id') {
          cleanedUpdates[key] = (value === '' || value === null) ? null : value;
        }
        // For notes field, allow empty string
        else if (key === 'notes') {
          cleanedUpdates[key] = value;
        }
        // For all other fields, only include non-empty values
        else if (value !== '' && value !== null) {
          cleanedUpdates[key] = value;
        }
      });
      
      const { error } = await supabase
        .from('external_applications')
        .update({
          ...cleanedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error updating application:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateApplication:', error);
      return false;
    }
  }

  // Delete an application
  async deleteApplication(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('external_applications')
        .delete()
        .eq('id', id)
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error deleting application:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteApplication:', error);
      return false;
    }
  }

  // Get an application by verification_id (public, no user filtering)
  async getApplicationByVerificationId(verificationId: string): Promise<ExternalApplication | null> {
    try {
      const { data, error } = await supabase
        .from('external_applications')
        .select('*')
        .eq('verification_id', verificationId)
        .single();

      if (error) {
        console.error('Error loading application by verification ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getApplicationByVerificationId:', error);
      return null;
    }
  }

  // Static method to get application by verification_id without user context
  static async getApplicationByVerificationIdPublic(verificationId: string): Promise<ExternalApplication | null> {
    try {
      const { data, error } = await supabase
        .from('external_applications')
        .select('*')
        .eq('verification_id', verificationId)
        .single();

      if (error) {
        console.error('Error loading application by verification ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getApplicationByVerificationIdPublic:', error);
      return null;
    }
  }

  // Update application with verification results (public, no user filtering)
  static async updateApplicationByVerificationId(
    verificationId: string,
    updates: Partial<ExternalApplication>
  ): Promise<boolean> {
    try {
      // Filter out empty strings for optional fields, convert them to null
      const cleanedUpdates: any = {};
      Object.keys(updates).forEach(key => {
        const value = updates[key];
        
        // Skip undefined values
        if (value === undefined) {
          return;
        }
        
        // For optional date and link fields, convert empty strings to null
        if (key === 'start_date' || key === 'verification_link' || key === 'verification_id') {
          cleanedUpdates[key] = (value === '' || value === null) ? null : value;
        }
        // For notes field, allow empty string
        else if (key === 'notes') {
          cleanedUpdates[key] = value;
        }
        // For all other fields, only include non-empty values
        else if (value !== '' && value !== null) {
          cleanedUpdates[key] = value;
        }
      });
      
      const { error } = await supabase
        .from('external_applications')
        .update({
          ...cleanedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('verification_id', verificationId);

      if (error) {
        console.error('Error updating application by verification ID:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateApplicationByVerificationId:', error);
      return false;
    }
  }

  // Create verification request
  async createVerificationRequest(request: Omit<VerificationRequest, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<VerificationRequest | null> {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .insert({
          ...request,
          user_id: this.userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating verification request:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createVerificationRequest:', error);
      return null;
    }
  }

  // Get verification requests
  async getVerificationRequests(): Promise<VerificationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading verification requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVerificationRequests:', error);
      return [];
    }
  }

  // Migrate from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    try {
      // Migrate external applications
      const applicationsRaw = localStorage.getItem('my_external_applications');
      if (applicationsRaw) {
        try {
          const applications = JSON.parse(applicationsRaw);
          if (Array.isArray(applications) && applications.length > 0) {
            const applicationRecords = applications.map((app: any) => ({
              opportunity_id: app.opportunity_id || app.id || '',
              title: app.title || '',
              organization: app.organization || '',
              date_applied: app.date || new Date().toISOString().split('T')[0],
              hours_worked: app.hours || 0,
              status: app.status || 'applied',
              is_external: true,
              xp_reward: app.xp || 0,
              score: app.score || 0,
              contacted: app.contacted || false,
              interview: app.interview || false,
              rejected: app.rejected || false,
              notes: app.notes || '',
              start_date: app.startDate || null,
              verification_link: app.verificationLink || null,
              verification_id: app.verificationId || null,
              credited_xp: app.creditedXp || false,
              planned_hours: app.plannedHours || 0
            }));

            // Insert applications (ignore duplicates)
            for (const record of applicationRecords) {
              await supabase
                .from('external_applications')
                .upsert(record, { onConflict: 'user_id,opportunity_id,title' });
            }

            // Clear localStorage
            localStorage.removeItem('my_external_applications');
          }
        } catch (e) {
          console.error('Error migrating applications:', e);
        }
      }

      // Migrate verification requests
      const verificationRaw = localStorage.getItem('verification_requests');
      if (verificationRaw) {
        try {
          const requests = JSON.parse(verificationRaw);
          if (Array.isArray(requests) && requests.length > 0) {
            const requestRecords = requests.map((req: any) => ({
              verification_id: req.verificationId || '',
              job_title: req.jobTitle || '',
              job_date: req.jobDate || new Date().toISOString().split('T')[0],
              student_hours: req.studentHours || 0,
              student_name: req.studentName || '',
              organization: req.organization || '',
              status: req.status || 'pending'
            }));

            // Insert verification requests (ignore duplicates)
            for (const record of requestRecords) {
              await supabase
                .from('verification_requests')
                .upsert(record, { onConflict: 'verification_id' });
            }

            // Clear localStorage
            localStorage.removeItem('verification_requests');
          }
        } catch (e) {
          console.error('Error migrating verification requests:', e);
        }
      }
    } catch (error) {
      console.error('Error during external applications migration:', error);
    }
  }
}

