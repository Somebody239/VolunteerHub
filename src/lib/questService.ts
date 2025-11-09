import { supabase } from "@/lib/supabaseClient";
import { Quest, QuestData } from "./questUtils";

export class QuestService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Get all quests for a user with their claimed status
  async getQuests(questData: QuestData): Promise<Quest[]> {
    try {
      // Get claimed quests from database
      const { data: claimedQuests, error } = await supabase
        .from('user_quests')
        .select('quest_key, claimed, claimed_at')
        .eq('user_id', this.userId)
        .eq('claimed', true);

      if (error) {
        console.error('Error loading quests:', error);
        return [];
      }

      const claimedKeys = new Set(claimedQuests?.map(q => q.quest_key) || []);

      // Generate quests and mark claimed ones
      const quests = this.generateQuests(questData);
      return quests.map(quest => ({
        ...quest,
        claimed: claimedKeys.has(quest.claimKey)
      }));
    } catch (error) {
      console.error('Error in getQuests:', error);
      return [];
    }
  }

  // Claim a quest
  async claimQuest(quest: Quest): Promise<boolean> {
    if (!quest.done || quest.claimed) return false;

    try {
      // Insert or update quest claim in database
      const { error } = await supabase
        .from('user_quests')
        .upsert({
          user_id: this.userId,
          quest_key: quest.claimKey,
          claimed: true,
          claimed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,quest_key'
        });

      if (error) {
        console.error('Error claiming quest:', error);
        return false;
      }

      // If quest awards a badge, save it
      if (quest.badgeIfClaimed) {
        await this.earnBadge(quest.badgeIfClaimed.key, quest.badgeIfClaimed.label);
      }

      return true;
    } catch (error) {
      console.error('Error claiming quest:', error);
      return false;
    }
  }

  // Earn a badge
  async earnBadge(badgeKey: string, badgeLabel: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: this.userId,
          badge_key: badgeKey,
          earned_at: new Date().toISOString()
        });

      if (error && error.code !== '23505') { // 23505 = unique constraint violation (already earned)
        console.error('Error earning badge:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error earning badge:', error);
      return false;
    }
  }

  // Get earned badges
  async getEarnedBadges(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_key')
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error loading badges:', error);
        return [];
      }

      return data?.map(b => b.badge_key) || [];
    } catch (error) {
      console.error('Error loading badges:', error);
      return [];
    }
  }

  // Migrate localStorage quest data to database
  async migrateFromLocalStorage(): Promise<void> {
    try {
      const questKeys = [
        'quest_v2_basics_claimed',
        'quest_v2_interests_claimed',
        'quest_v2_applied_claimed',
        'quest_v2_verify_email_claimed',
        'quest_v2_log_hours_claimed',
        'quest_v2_availability_claimed',
        'quest_v2_save_any_claimed',
        'quest_l1_about_claimed',
        'quest_l1_location_claimed',
        'quest_l1_applied2_claimed',
        'quest_l1_hours5_claimed',
        'quest_l1_saved3_claimed'
      ];

      const claimedQuests = questKeys.filter(key => 
        localStorage.getItem(key) === "1"
      );

      if (claimedQuests.length > 0) {
        const questRecords = claimedQuests.map(key => ({
          user_id: this.userId,
          quest_key: key,
          claimed: true,
          claimed_at: new Date().toISOString()
        }));

        await supabase
          .from('user_quests')
          .upsert(questRecords, { onConflict: 'user_id,quest_key' });

        // Clear localStorage
        claimedQuests.forEach(key => localStorage.removeItem(key));
      }

      // Migrate badges
      const earnedBadgesRaw = localStorage.getItem('earned_badges');
      if (earnedBadgesRaw) {
        try {
          const earnedBadges = JSON.parse(earnedBadgesRaw);
          if (Array.isArray(earnedBadges) && earnedBadges.length > 0) {
            const badgeRecords = earnedBadges.map((badgeKey: string) => ({
              user_id: this.userId,
              badge_key: badgeKey,
              earned_at: new Date().toISOString()
            }));

            await supabase
              .from('user_badges')
              .upsert(badgeRecords, { onConflict: 'user_id,badge_key' });

            localStorage.removeItem('earned_badges');
          }
        } catch (e) {
          console.error('Error migrating badges:', e);
        }
      }
    } catch (error) {
      console.error('Error migrating quest data:', error);
    }
  }

  // Generate quests (moved from questUtils)
  private generateQuests(data: QuestData): Quest[] {
    const {
      fullName,
      interests,
      emailVerified,
      totalHours,
      availability,
      appliedCount,
      savedCount,
      location,
      about,
      level
    } = data;

    const basicsDone = fullName.trim().length > 0;
    const interestsDone = interests.trim().length > 0;
    const hoursLogged = totalHours > 0;
    const hoursAtLeast5 = totalHours >= 5;
    const availabilitySet = availability.trim().length > 0;
    const appliedDone = appliedCount > 0;
    const appliedAtLeast2 = appliedCount >= 2;
    const savedAny = savedCount > 0;
    const savedAtLeast3 = savedCount >= 3;
    const locationSet = location.trim().length > 0;
    const aboutSet = about.trim().length > 0;

    const level0Quests: Quest[] = [
      {
        key: "basics",
        title: "Complete your basics",
        xp: 15,
        done: basicsDone,
        claimKey: "quest_v2_basics_claimed",
        badgeIfClaimed: {
          key: "badge_profile_ready",
          label: "Profile Ready",
          icon: "Award",
        },
      },
      {
        key: "interests",
        title: "Set your interests",
        xp: 20,
        done: interestsDone,
        claimKey: "quest_v2_interests_claimed",
      },
      {
        key: "applied",
        title: "Apply to your first role",
        xp: 25,
        done: appliedDone,
        claimKey: "quest_v2_applied_claimed",
        badgeIfClaimed: {
          key: "badge_first_application",
          label: "First Application",
          icon: "Trophy",
        },
      },
      {
        key: "verify_email",
        title: "Verify your email",
        xp: 15,
        done: emailVerified,
        claimKey: "quest_v2_verify_email_claimed",
        badgeIfClaimed: {
          key: "badge_verified",
          label: "Verified",
          icon: "ShieldCheck",
        },
      },
      {
        key: "availability",
        title: "Set your availability",
        xp: 10,
        done: availabilitySet,
        claimKey: "quest_v2_availability_claimed",
      },
      {
        key: "save_any",
        title: "Save an opportunity",
        xp: 20,
        done: savedAny,
        claimKey: "quest_v2_save_any_claimed",
      },
    ];

    const level1Quests: Quest[] = [
      {
        key: "about",
        title: "Write your About section",
        xp: 10,
        done: aboutSet,
        claimKey: "quest_l1_about_claimed",
        badgeIfClaimed: {
          key: "badge_profile_complete",
          label: "Profile Complete",
          icon: "Medal",
        },
      },
      {
        key: "location",
        title: "Set your location",
        xp: 10,
        done: locationSet,
        claimKey: "quest_l1_location_claimed",
      },
      {
        key: "applied2",
        title: "Apply to your second role",
        xp: 35,
        done: appliedAtLeast2,
        claimKey: "quest_l1_applied2_claimed",
        badgeIfClaimed: {
          key: "badge_second_application",
          label: "Second Application",
          icon: "Trophy",
        },
      },
      {
        key: "hours5",
        title: "Reach 5 total hours",
        xp: 30,
        done: hoursAtLeast5,
        claimKey: "quest_l1_hours5_claimed",
      },
      {
        key: "saved3",
        title: "Save 3 opportunities",
        xp: 20,
        done: savedAtLeast3,
        claimKey: "quest_l1_saved3_claimed",
        badgeIfClaimed: {
          key: "badge_scout",
          label: "Scout",
          icon: "Crown",
        },
      },
    ];

    // Return all quests (both level 0 and level 1) so both pages show the same quests
    const allQuests = [...level0Quests, ...level1Quests];
    
    // Sort: completed unclaimed first, incomplete middle, claimed last (same as questUtils)
    return allQuests.sort((a, b) => {
      const aPri = a.done && !a.claimed ? 3 : a.claimed ? 0 : 1;
      const bPri = b.done && !b.claimed ? 3 : b.claimed ? 0 : 1;
      if (aPri !== bPri) return bPri - aPri;
      return a.key.localeCompare(b.key); // stable sort by key
    });
  }
}
