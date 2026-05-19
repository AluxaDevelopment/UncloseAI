"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type Model = "hermes" | "qwen";

interface ModelSelectorProps {
  value: Model;
  onChange: (value: Model) => void;
  className?: string;
}

const models: { value: Model; label: string; tag: string }[] = [
  { value: "hermes", label: "Hermes", tag: "General" },
  { value: "qwen", label: "Qwen Coder", tag: "Code" },
];

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  const current = models.find((m) => m.value === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-7 gap-1.5 bg-transparent border-0 hover:bg-accent focus:ring-0 text-[13px] font-medium text-foreground px-2 w-auto",
          className
        )}
      >
        <SelectValue>
          <span className="flex items-center gap-2">
            {current?.label}
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {current?.tag}
            </span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {models.map((model) => (
          <SelectItem
            key={model.value}
            value={model.value}
            className="text-sm cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {model.label}
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {model.tag}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
