import React, { useEffect, useState } from "react";

// Stores availability as JSON string like:
// { mon: [{ start: "18:00", end: "20:00" }], tue: [], ... }
export type WeeklySchedule = {
  mon: Array<{ start: string; end: string }>;
  tue: Array<{ start: string; end: string }>;
  wed: Array<{ start: string; end: string }>;
  thu: Array<{ start: string; end: string }>;
  fri: Array<{ start: string; end: string }>;
  sat: Array<{ start: string; end: string }>;
  sun: Array<{ start: string; end: string }>;
};

const emptySchedule: WeeklySchedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

type Props = {
  value?: string; // JSON string
  onChange: (json: string) => Promise<void> | void;
};

export const ScheduleEditor: React.FC<Props> = ({ value, onChange }) => {
  const [sched, setSched] = useState<WeeklySchedule>(emptySchedule);

  useEffect(() => {
    try {
      if (!value) { setSched(emptySchedule); return; }
      const parsed = JSON.parse(value);
      setSched({ ...emptySchedule, ...parsed });
    } catch {
      setSched(emptySchedule);
    }
  }, [value]);

  const commit = async (next: WeeklySchedule) => {
    setSched(next);
    await Promise.resolve(onChange(JSON.stringify(next)));
  };

  const days: Array<{ key: keyof WeeklySchedule; label: string }> = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
  ];

  return (
    <div className="space-y-3">
      {days.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3">
          <div className="w-12 text-xs text-muted-foreground">{label}</div>
          <div className="flex-1 flex flex-wrap gap-2">
            {(sched[key] ?? []).map((slot, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <input type="time" value={slot.start} onChange={(e) => {
                  const next = { ...sched, [key]: sched[key].map((s, i) => i === idx ? { ...s, start: e.target.value } : s) };
                  void commit(next);
                }} className="h-8 px-2 rounded border border-input bg-background text-foreground text-xs" />
                <span className="text-xs text-muted-foreground">to</span>
                <input type="time" value={slot.end} onChange={(e) => {
                  const next = { ...sched, [key]: sched[key].map((s, i) => i === idx ? { ...s, end: e.target.value } : s) };
                  void commit(next);
                }} className="h-8 px-2 rounded border border-input bg-background text-foreground text-xs" />
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground px-2" onClick={() => {
                  const next = { ...sched, [key]: sched[key].filter((_, i) => i !== idx) };
                  void commit(next);
                }}>Remove</button>
              </div>
            ))}
            <button type="button" className="text-xs px-2 py-1 rounded border border-border hover:bg-muted/40" onClick={() => {
              const next = { ...sched, [key]: [...sched[key], { start: "18:00", end: "20:00" }] };
              void commit(next);
            }}>+ Add</button>
          </div>
        </div>
      ))}
    </div>
  );
};
