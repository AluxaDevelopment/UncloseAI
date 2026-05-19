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
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
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
    <div className="px-4 pb-6 pt-2 shrink-0">
      <div className="max-w-3xl mx-auto">
        <div
          className={cn(
            "relative bg-card rounded-2xl border transition-all duration-150",
            isFocused
              ? "border-border/80 ring-2 ring-ring/10"
              : "border-border",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent px-4 pt-4 pb-12 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[56px] max-h-[200px] leading-relaxed"
          />

          {/* Bottom bar inside the input */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2.5 border-t border-border/50">
            <p className="text-[11px] text-muted-foreground/40 select-none pl-1">
              Shift+Enter for new line
            </p>
            <div className="flex items-center gap-2">
              {message.trim().length > 0 && (
                <span className="text-[11px] text-muted-foreground/40 tabular-nums">
                  {message.length}
                </span>
              )}
              {isLoading ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                  aria-label="Stop generating"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSend}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150",
                    canSend
                      ? "bg-foreground text-background hover:opacity-80 scale-100"
                      : "bg-muted text-muted-foreground/40 cursor-not-allowed scale-95"
                  )}
                  aria-label="Send message"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/30 text-center mt-3 select-none">
          AI responses may be inaccurate. Always verify important information.
        </p>
      </div>
    </div>
  );
}
