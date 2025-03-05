// src/components/Layout.tsx
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useChat } from "../hooks/useChat";
import { useNavigate } from "@tanstack/react-router";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  sessionId?: number;
}

export function Layout({
  children,
  showSidebar = true,
  sessionId,
}: LayoutProps) {
  const navigate = useNavigate();

  const {
    sessions,
    createSession,
    deleteSession,
    renameSession,
    sessionId: activeSessionId,
  } = useChat(sessionId);

  const handleCreateSession = async () => {
    const session = await createSession();
    if (session) {
      navigate({ to: `/chat/${session.id}` });
    }
  };

  return (
    <div className="flex h-screen text-slate-100 bg-[#191a1a]">
      {showSidebar && (
        <Sidebar
          sessions={sessions}
          onCreateSession={handleCreateSession}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
          currentSessionId={activeSessionId}
        />
      )}
      <main className="relative mx-auto flex h-full w-full flex-1 flex-col md:px-2">
        {children}
      </main>
    </div>
  );
}
