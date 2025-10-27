export interface Quest {
  key: string;
  title: string;
  xp: number;
  done: boolean;
  claimKey: string;
  badgeIfClaimed?: {
    key: string;
    label: string;
    icon: string;
  };
  claimed?: boolean;
}

export interface QuestData {
  fullName: string;
  interests: string;
  emailVerified: boolean;
  totalHours: number;
  availability: string;
  appliedCount: number;
  savedCount: number;
  location: string;
  about: string;
  level: number;
}

export const generateQuests = (data: QuestData): Quest[] => {
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

  const base = level <= 0 ? level0Quests : level1Quests;
  const quests = base.map((q) => ({
    ...q,
    claimed: (() => {
      try {
        return localStorage.getItem(q.claimKey) === "1";
      } catch {
        return false;
      }
    })(),
  }));

  // Sort: completed unclaimed first, incomplete middle, claimed last
  return quests.sort((a, b) => {
    const aPri = a.done && !a.claimed ? 3 : a.claimed ? 0 : 1;
    const bPri = b.done && !b.claimed ? 3 : b.claimed ? 0 : 1;
    if (aPri !== bPri) return bPri - aPri;
    return a.key.localeCompare(b.key); // stable sort by key
  });
};

export const claimQuest = (quest: Quest): boolean => {
  if (!quest.done || quest.claimed) return false;
  
  try {
    localStorage.setItem(quest.claimKey, "1");
    return true;
  } catch {
    return false;
  }
};
