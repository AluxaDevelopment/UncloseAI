"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [message]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = message.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="px-4 pb-5 pt-3">
      <div className="max-w-2xl mx-auto">
        <div
          className={cn(
            "relative bg-card border rounded-xl transition-colors",
            disabled ? "border-border/40 opacity-60" : "border-border hover:border-border/80"
          )}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent px-4 pt-3.5 pb-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[52px] max-h-[180px] leading-relaxed"
          />
          <div className="absolute right-2.5 bottom-2.5">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                aria-label="Stop generating"
              >
                <Square className="h-3 w-3 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!canSend}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-md transition-colors",
                  canSend
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                aria-label="Send message"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/50 text-center mt-2.5">
          Responses may be inaccurate. Verify important information.
        </p>
      </div>
    </div>
  );
}
