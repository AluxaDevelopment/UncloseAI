"use client";

import { useState } from "react";
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

const models: { value: Model; label: string; description: string }[] = [
  {
    value: "hermes",
    label: "Hermes",
    description: "Fast, general purpose",
  },
  {
    value: "qwen",
    label: "Qwen Coder",
    description: "Better at code",
  },
];

export function ModelSelector({
  value,
  onChange,
  className,
}: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "w-[140px] bg-transparent border-0 hover:bg-accent focus:ring-0",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model.value} value={model.value}>
            <div className="flex flex-col">
              <span>{model.label}</span>
              <span className="text-xs text-muted-foreground">
                {model.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
