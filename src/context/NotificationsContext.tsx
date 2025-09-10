import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type NotificationItem = {
  id: string;
  kind: "info" | "success" | "warning";
  text: string;
  createdAt: string;
  read?: boolean;
};

type Ctx = {
  items: NotificationItem[];
  unreadCount: number;
  push: (n: Omit<NotificationItem, "id" | "createdAt" | "read">) => void;
  markAllRead: () => void;
};

const NotificationsContext = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "vp_notifications";

export const NotificationsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const push = useCallback((n: Omit<NotificationItem, "id" | "createdAt" | "read">) => {
    setItems((prev) => [{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), read: false, ...n }, ...prev].slice(0, 100));
  }, []);

  const markAllRead = useCallback(() => setItems((prev) => prev.map((i) => ({ ...i, read: true }))), []);

  const value = useMemo<Ctx>(() => ({ items, unreadCount: items.filter((i) => !i.read).length, push, markAllRead }), [items, push, markAllRead]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
};
