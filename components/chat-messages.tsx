"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessagesProps {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            How can I help you today?
          </h2>
          <p className="text-muted-foreground text-sm">
            Start a conversation by typing a message below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isStreaming && streamingContent && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-primary">AI</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="prose prose-invert prose-sm max-w-none">
                <MessageContent content={streamingContent} />
              </div>
            </div>
          </div>
        )}
        {isStreaming && !streamingContent && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-primary">AI</span>
            </div>
            <div className="flex items-center gap-1 py-2">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse [animation-delay:150ms]" />
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-4", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-primary text-primary-foreground" : "bg-primary/10"
        )}
      >
        <span className="text-xs font-medium">
          {isUser ? "You" : "AI"}
        </span>
      </div>
      <div
        className={cn(
          "flex-1 min-w-0",
          isUser && "flex justify-end"
        )}
      >
        <div
          className={cn(
            "inline-block max-w-full",
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-2"
              : ""
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <MessageContent content={message.content} />
              <CopyButton text={message.content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like rendering for code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const language = lines[0]?.trim() || "";
          const code = lines.slice(language ? 1 : 0).join("\n");
          return (
            <div key={index} className="relative group my-4">
              <div className="bg-card rounded-lg overflow-hidden border border-border">
                {language && (
                  <div className="px-4 py-2 bg-muted/50 border-b border-border text-xs text-muted-foreground">
                    {language}
                  </div>
                )}
                <pre className="p-4 overflow-x-auto">
                  <code className="text-sm font-mono">{code}</code>
                </pre>
              </div>
              <CopyButton text={code} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        }
        return (
          <span key={index} className="whitespace-pre-wrap break-words">
            {part}
          </span>
        );
      })}
    </>
  );
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", className)}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
}
