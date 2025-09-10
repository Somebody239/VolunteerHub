import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";

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

type UserContextValue = UserState & UserComputed & {
  logHours: (hours: number) => void;
  setSchool: (school?: string) => void;
  setName: (name: string) => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [name, setName] = useState("Kishan Joshi");
  const [school, setSchool] = useState<string | undefined>("Austin High School");
  const [totalHours, setTotalHours] = useState<number>(8);
  const [streak, setStreak] = useState<number>(3);

  const computed: UserComputed = useMemo(() => {
    const xp = Math.floor(totalHours * 10);
    const level = Math.floor(xp / 100) + 1; // 100 XP per level
    const xpInLevel = xp % 100;
    const maxXp = 100;
    return { xp, level, xpInLevel, maxXp };
  }, [totalHours]);

  const logHours = (hours: number) => {
    // basic increment; future: adjust streak and validations
    setTotalHours((h) => Math.max(0, h + hours));
    // naive streak bump if logging positive hours
    if (hours > 0) setStreak((s) => s);
  };

  const value: UserContextValue = {
    name,
    school,
    totalHours,
    streak,
    xp: computed.xp,
    level: computed.level,
    xpInLevel: computed.xpInLevel,
    maxXp: computed.maxXp,
    logHours,
    setSchool,
    setName,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};
