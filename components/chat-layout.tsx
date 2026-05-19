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
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState<Model>(settings.defaultModel as Model);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // Update model when settings change
  useEffect(() => {
    setModel(settings.defaultModel as Model);
  }, [settings.defaultModel]);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load conversations
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

  // Load conversation messages
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
    // Optimistically add user message
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

    await streamChat(content, currentConversationId, {
      onToken: (token) => {
        setStreamingContent((prev) => prev + token);
      },
      onDone: async (fullText) => {
        setIsStreaming(false);
        setAbortController(null);

        // Add assistant message
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

        // Refresh conversations to get new/updated conversation
        await loadConversations();

        // If this was a new conversation, select the latest one
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
        // Remove the temp user message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempUserMessage.id)
        );
      },
    }, { model, temperature: settings.temperature, maxTokens: settings.maxTokens });
  };

  const handleStop = () => {
    abortController?.abort();
    setIsStreaming(false);
    setAbortController(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background">
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onConversationsChange={loadConversations}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
          <ModelSelector value={model} onChange={setModel} />
          <p className="text-[13px] text-muted-foreground truncate max-w-xs">
            {currentConversationId
              ? conversations.find((c) => c.id === currentConversationId)?.title
              : "New conversation"}
          </p>
        </header>

        {isLoadingConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChatMessages
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
          />
        )}

        <ChatInput
          onSend={handleSendMessage}
          onStop={handleStop}
          isLoading={isStreaming}
        />
      </div>
    </div>
  );
}
