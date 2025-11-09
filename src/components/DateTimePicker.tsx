import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

type Props = {
  value?: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
};

function toLocalDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function toLocalDateTimeInputValue(d?: Date): string {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromLocalDateTimeInputValue(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// Store as local datetime string "YYYY-MM-DDTHH:mm" for compatibility with existing payloads
export const DateTimePicker: React.FC<Props> = ({ value, onChange, label, placeholder }) => {
  const date = toLocalDate(value);
  const [open, setOpen] = React.useState(false);
  const [tmpDate, setTmpDate] = React.useState<Date | undefined>(date);
  const [time, setTime] = React.useState<string>(() => toLocalDateTimeInputValue(date ?? undefined).split("T")[1] || "09:00");

  React.useEffect(() => {
    const d = toLocalDate(value);
    setTmpDate(d);
    setTime(toLocalDateTimeInputValue(d).split("T")[1] || "09:00");
  }, [value]);

  const commit = () => {
    if (!tmpDate) { onChange(null); setOpen(false); return; }
    const [hh, mm] = (time || "00:00").split(":");
    const committed = new Date(tmpDate);
    committed.setHours(parseInt(hh || "0", 10), parseInt(mm || "0", 10), 0, 0);
    onChange(toLocalDateTimeInputValue(committed));
    setOpen(false);
  };

  return (
    <div className="grid gap-1">
      {label && <label className="text-xs text-muted-foreground">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start font-normal w-full">
            {value ? toLocalDateTimeInputValue(toLocalDate(value)) : (placeholder || "Pick date & time")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <div className="grid gap-2">
            <Calendar
              mode="single"
              selected={tmpDate}
              onSelect={(d) => setTmpDate(d ?? undefined)}
              initialFocus
            />
            <div className="grid gap-1">
              <label className="text-xs text-muted-foreground">Time</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={commit}>Apply</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateTimePicker;


