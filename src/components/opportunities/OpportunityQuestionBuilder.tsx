import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { OpportunityQuestion, OpportunityQuestionType } from "@/types/opportunities";

type DraftQuestion = OpportunityQuestion & { tempId: string };

interface OpportunityQuestionBuilderProps {
  value: DraftQuestion[];
  onChange: (next: DraftQuestion[]) => void;
}

const QUESTION_TYPE_LABELS: Record<OpportunityQuestionType, string> = {
  short_text: "Short answer",
  long_text: "Long answer",
  single_select: "Multiple choice",
  multi_select: "Checkboxes",
};

const makeNewQuestion = (position: number): DraftQuestion => ({
  tempId: crypto.randomUUID(),
  prompt: "",
  field_type: "short_text",
  is_required: true,
  help_text: "",
  options: [],
  position,
});

export const OpportunityQuestionBuilder: React.FC<OpportunityQuestionBuilderProps> = ({ value, onChange }) => {
  const updateQuestion = useCallback(
    (tempId: string, updater: (prev: DraftQuestion) => DraftQuestion) => {
      onChange(
        value
          .map((q) => (q.tempId === tempId ? updater(q) : q))
          .sort((a, b) => a.position - b.position),
      );
    },
    [onChange, value],
  );

  const handleAddOption = (tempId: string) => {
    updateQuestion(tempId, (prev) => ({
      ...prev,
      options: [...(prev.options ?? []), ""],
    }));
  };

  const handleOptionChange = (tempId: string, idx: number, text: string) => {
    updateQuestion(tempId, (prev) => {
      const options = [...(prev.options ?? [])];
      options[idx] = text;
      return { ...prev, options };
    });
  };

  const handleDeleteOption = (tempId: string, idx: number) => {
    updateQuestion(tempId, (prev) => {
      const options = (prev.options ?? []).filter((_, i) => i !== idx);
      return { ...prev, options };
    });
  };

  const handleTypeChange = (tempId: string, type: OpportunityQuestionType) => {
    updateQuestion(tempId, (prev) => ({
      ...prev,
      field_type: type,
      options: type === "single_select" || type === "multi_select" ? prev.options ?? [""] : undefined,
    }));
  };

  const handleAddQuestion = () => {
    onChange([...value, makeNewQuestion(value.length)]);
  };

  const handleDeleteQuestion = (tempId: string) => {
    onChange(
      value
        .filter((q) => q.tempId !== tempId)
        .map((q, idx) => ({ ...q, position: idx })),
    );
  };

  const handlePromptChange = (tempId: string, prompt: string) => {
    updateQuestion(tempId, (prev) => ({ ...prev, prompt }));
  };

  const handleHelpTextChange = (tempId: string, help_text: string) => {
    updateQuestion(tempId, (prev) => ({ ...prev, help_text }));
  };

  const handleRequiredChange = (tempId: string, isRequired: boolean) => {
    updateQuestion(tempId, (prev) => ({ ...prev, is_required: isRequired }));
  };

  const handleDrag = useCallback(
    (fromIdx: number, toIdx: number) => {
      const copy = [...value];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      onChange(copy.map((q, idx) => ({ ...q, position: idx })));
    },
    [onChange, value],
  );

  return (
    <div className="space-y-4">
      {value.map((q, index) => (
        <div key={q.tempId} className="border border-border rounded-xl bg-card/80">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/40 rounded-t-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <GripVertical size={14} className="cursor-grab active:cursor-grabbing" onMouseDown={(event) => event.preventDefault()} />
              Question {index + 1}
            </div>
            <div className="flex items-center gap-3">
              <select
                className="bg-background border border-border rounded-md px-2 py-1 text-xs"
                value={q.field_type}
                onChange={(e) => handleTypeChange(q.tempId, e.target.value as OpportunityQuestionType)}
              >
                {Object.entries(QUESTION_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={q.is_required}
                  onChange={(e) => handleRequiredChange(q.tempId, e.target.checked)}
                />
                Required
              </label>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.tempId)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Prompt</label>
              <Input
                value={q.prompt}
                placeholder="What should applicants share?"
                onChange={(e) => handlePromptChange(q.tempId, e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Helper text (optional)</label>
              <Textarea
                value={q.help_text ?? ""}
                placeholder="Let applicants know how to answer"
                onChange={(e) => handleHelpTextChange(q.tempId, e.target.value)}
                rows={2}
              />
            </div>

            {(q.field_type === "single_select" || q.field_type === "multi_select") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Options</span>
                  <Button variant="ghost" size="sm" type="button" onClick={() => handleAddOption(q.tempId)}>
                    <Plus size={14} className="mr-1" />
                    Add option
                  </Button>
                </div>
                <div className="space-y-2">
                  {(q.options ?? []).map((opt, idx) => (
                    <div key={`${q.tempId}-opt-${idx}`} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => handleOptionChange(q.tempId, idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteOption(q.tempId, idx)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  {(q.options ?? []).length === 0 && (
                    <div className="text-xs text-muted-foreground">Add at least one option for applicants to choose from.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      <div className="flex justify-start">
        <Button type="button" variant="outline" onClick={handleAddQuestion}>
          <Plus size={14} className="mr-1" />
          Add question
        </Button>
      </div>
    </div>
  );
};

export default OpportunityQuestionBuilder;

