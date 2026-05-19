"use client";

import { AuthProvider } from "@/lib/auth-context";
import { ChatLayout } from "@/components/chat-layout";

export default function Home() {
  return (
    <AuthProvider>
      <ChatLayout />
    </AuthProvider>
  );
}
