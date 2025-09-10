import React, { useEffect, useMemo, useState } from "react";

type Props = {
  value?: string;
  onChange: (csv: string) => Promise<void> | void;
  placeholder?: string;
};

// Simple colored tag editor. Stores as comma-separated string (CSV)
export const TagEditor: React.FC<Props> = ({ value, onChange, placeholder = "Add a tag and press Enter" }) => {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const list = (value ?? "").split(",").map((t) => t.trim()).filter(Boolean);
    setTags(list);
  }, [value]);

  const colors = useMemo(() => [
    "bg-blue-500/20 text-blue-400",
    "bg-green-500/20 text-green-400",
    "bg-purple-500/20 text-purple-400",
    "bg-yellow-500/20 text-yellow-400",
    "bg-pink-500/20 text-pink-400",
    "bg-orange-500/20 text-orange-400",
  ], []);

  const commit = async (next: string[]) => {
    setTags(next);
    await Promise.resolve(onChange(next.join(", ")));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t, idx) => (
          <span key={`${t}-${idx}`} className={`px-2 py-1 text-xs rounded-full ${colors[idx % colors.length]}`}>
            {t}
            <button type="button" className="ml-1 text-xs opacity-70 hover:opacity-100" onClick={() => commit(tags.filter((x, i) => i !== idx))}>×</button>
          </span>
        ))}
      </div>
      <input
        className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const v = input.trim();
            if (!v) return;
            const next = Array.from(new Set([...tags, v])).slice(0, 20);
            void commit(next);
            setInput("");
          }
        }}
      />
    </div>
  );
};
