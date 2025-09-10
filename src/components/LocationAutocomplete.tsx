import React, { useEffect, useMemo, useState } from "react";

export type LocationValue = {
  label: string;
  lat?: number;
  lon?: number;
};

type Props = {
  value?: string;
  onChange: (value: string, meta?: LocationValue) => void;
  placeholder?: string;
};

// Simple Nominatim-powered autocomplete (no API key). Debounced fetch.
export const LocationAutocomplete: React.FC<Props> = ({ value, onChange, placeholder = "Search city or address" }) => {
  const [q, setQ] = useState(value ?? "");
  const [results, setResults] = useState<LocationValue[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => setQ(value ?? ""), [value]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!q || q.length < 2) {
        setResults([]);
        return;
      }
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", q);
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("limit", "5");
        const res = await fetch(url.toString(), { headers: { "Accept": "application/json" } });
        const data = await res.json();
        const mapped: LocationValue[] = (data || []).map((d: any) => ({ label: d.display_name as string, lat: parseFloat(d.lat), lon: parseFloat(d.lon) }));
        setResults(mapped);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <div className="relative">
      <input
        className="w-full h-9 px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm"
        value={q}
        placeholder={placeholder}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-sm">
          {results.map((r, i) => (
            <button
              key={`${r.label}-${i}`}
              type="button"
              className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(r.label, r); setQ(r.label); setOpen(false); }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
