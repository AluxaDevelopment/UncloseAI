"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, Conversation, Message } from "@/lib/api";
import { streamChat } from "@/lib/chat";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { ModelSelector, Model } from "@/components/model-selector";
import { Loader2 } from "lucide-react";

export function ChatLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState<Model>(settings.defaultModel as Model);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    setModel(settings.defaultModel as Model);
  }, [settings.defaultModel]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (error) {
      console.error("[v0] Failed to load conversations:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoadingConversation(true);
    try {
      const data = await api.getConversation(conversationId);
      setMessages(data.messages);
      if (data.conversation.model) {
        setModel(data.conversation.model as Model);
      }
    } catch (error) {
      console.error("[v0] Failed to load conversation:", error);
    } finally {
      setIsLoadingConversation(false);
    }
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId, loadConversation]);

  const handleSelectConversation = (id: string | null) => {
    setCurrentConversationId(id);
    setStreamingContent("");
    setIsStreaming(false);
  };

  const handleSendMessage = async (content: string) => {
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversationId || "",
      user_id: "",
      role: "user",
      content,
      model: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    setStreamingContent("");
    setIsStreaming(true);

    const controller = new AbortController();
    setAbortController(controller);

    await streamChat(
      content,
      currentConversationId,
      {
        onToken: (token) => {
          setStreamingContent((prev) => prev + token);
        },
        onDone: async (fullText) => {
          setIsStreaming(false);
          setAbortController(null);
          const assistantMessage: Message = {
            id: `temp-assistant-${Date.now()}`,
            conversation_id: currentConversationId || "",
            user_id: "",
            role: "assistant",
            content: fullText,
            model,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingContent("");
          await loadConversations();
          if (!currentConversationId) {
            const convs = await api.listConversations();
            if (convs.length > 0) {
              setCurrentConversationId(convs[0].id);
            }
          }
        },
        onError: (error) => {
          console.error("[v0] Chat error:", error);
          setIsStreaming(false);
          setAbortController(null);
          setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        },
      },
      { model, temperature: settings.temperature, maxTokens: settings.maxTokens }
    );
  };

  const handleStop = () => {
    abortController?.abort();
    setIsStreaming(false);
    setAbortController(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentTitle = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId)?.title
    : null;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onConversationsChange={loadConversations}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-5 h-12 border-b border-border shrink-0 bg-background/80 backdrop-blur-sm">
          <ModelSelector value={model} onChange={setModel} />
          {currentTitle && (
            <p className="text-[13px] text-muted-foreground truncate max-w-xs font-medium">
              {currentTitle}
            </p>
          )}
          <div className="w-24" /> {/* balance the model selector width */}
        </header>

        {/* Messages */}
        {isLoadingConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChatMessages
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
          />
        )}

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          onStop={handleStop}
          isLoading={isStreaming}
        />
      </div>
    </div>
  );
}
