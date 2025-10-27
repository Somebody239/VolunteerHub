import React, { useEffect, useState } from "react";

type Props = {
  value?: string;
  onChange: (value: string) => Promise<void> | void;
};

// Minimal availability editor: choose common time windows, stores as CSV
export const AvailabilityEditor: React.FC<Props> = ({ value, onChange }) => {
  const presets = [
    { id: "wknd_mornings", label: "Weekends AM" },
    { id: "wknd_afternoons", label: "Weekends PM" },
    { id: "weeknights", label: "Weeknights" },
    { id: "monday_pm", label: "Mon PM" },
    { id: "tuesday_pm", label: "Tue PM" },
    { id: "wednesday_pm", label: "Wed PM" },
    { id: "thursday_pm", label: "Thu PM" },
    { id: "friday_pm", label: "Fri PM" },
  ];
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => {
    const list = (value ?? "").split(",").map((t) => t.trim()).filter(Boolean);
    setChosen(list);
  }, [value]);

  const toggle = async (id: string) => {
    const next = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id];
    setChosen(next);
    await Promise.resolve(onChange(next.join(", ")));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => void toggle(p.id)}
          className={`px-2 py-1 text-xs rounded-full border ${chosen.includes(p.id) ? 'bg-foreground text-background' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};
