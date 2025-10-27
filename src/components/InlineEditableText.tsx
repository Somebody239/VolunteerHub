import React, { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (val: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
};

export const InlineEditableText: React.FC<Props> = ({ value, onChange, placeholder = "Click to edit", className = "", maxLength }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => setVal(value ?? ""), [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = async () => {
    setEditing(false);
    const v = val.trim();
    if (v === (value ?? "")) return;
    await Promise.resolve(onChange(v));
  };

  if (!editing) {
    return (
      <button type="button" className={`text-left underline-offset-2 hover:underline ${className}`} onClick={() => setEditing(true)}>
        {value?.trim() ? value : <span className="text-muted-foreground">{placeholder}</span>}
      </button>
    );
  }

  return (
    <input
      ref={ref}
      value={val}
      maxLength={maxLength}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(value ?? ''); setEditing(false); } }}
      className={`h-8 px-2 rounded border border-input bg-background text-foreground ${className}`}
      placeholder={placeholder}
    />
  );
};
