import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { chatApi } from "../lib/api";
import { ChatMessage, ChatSession } from "../types";
import { useAuth } from "../context/AuthContext";

export function useChat(initialSessionId?: number) {
  const [sessionId, setSessionId] = useState<number | undefined>(
    initialSessionId
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const { isAuthenticated } = useAuth();

  // Use a ref for navigate to avoid the initial null issue
  const navigateRef = useRef<any>(null);

  // Try to get the navigate function, but don't fail if it's not available
  try {
    const navigate = useNavigate();
    navigateRef.current = navigate;
  } catch (e) {
    // Navigation isn't available yet, that's okay
  }

  // Add this function to safely handle navigation
  const handleNavigation = useCallback((to: string) => {
    if (navigateRef.current) {
      navigateRef.current({ to });
    } else {
      console.warn("Navigation attempted before router was available");
    }
  }, []);

  const abortController = useRef<AbortController | null>(null);

  // Derive current session from sessions array and sessionId
  const currentSession = useMemo(() => {
    return sessionId
      ? sessions.find((session) => session.id === sessionId) || null
      : null;
  }, [sessions, sessionId]);

  // Function to change the active session
  const switchSession = useCallback((id?: number) => {
    setSessionId(id);
    if (!id) {
      // Reset state for new chat
      setMessages([]);
    }
  }, []);

  // Function to fetch chat sessions
  const fetchSessions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const { data } = await chatApi.getChatSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    }
  }, [isAuthenticated]);

  // Function to fetch a specific chat session's messages
  const fetchSession = useCallback(
    async (id: number) => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        const { data } = await chatApi.getChatSession(id);
        setMessages(data.messages || []);

        // Update the session in our sessions list if needed
        setSessions((prev) => {
          const sessionIndex = prev.findIndex((s) => s.id === id);
          if (sessionIndex === -1) {
            return [
              ...prev,
              {
                id: data.id,
                name: data.name,
                created_at: data.created_at,
                message_count: data.messages?.length || 0,
              },
            ];
          }
          return prev;
        });
      } catch (error: any) {
        console.error(`Failed to fetch chat session ${id}:`, error);

        // Handle different error types
        if (error?.response?.status === 404) {
          // Session not found, redirect to the chat homepage
          handleNavigation("/chat");
        } else if (error?.response?.status === 401) {
          // Authentication error, refresh token and retry once
          try {
            // Try the request again
            const { data } = await chatApi.getChatSession(id);
            setMessages(data.messages || []);
          } catch (refreshError) {
            // If refresh fails too, navigate to login
            handleNavigation("/login");
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, handleNavigation]
  );

  // Load session data when sessionId changes
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    } else {
      setMessages([]);
    }
  }, [sessionId, fetchSession]);

  // Load sessions on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated, fetchSessions]);

  // Send a message and process streaming response
  const sendMessage = useCallback(
    async (message: string) => {
      try {
        setIsLoading(true);

        // Cancel any ongoing streaming request
        if (abortController.current) {
          abortController.current.abort();
        }

        // Create a new AbortController for this request
        abortController.current = new AbortController();

        // Add user message to the UI immediately
        const userMessage: ChatMessage = {
          id: Date.now(),
          content: message,
          is_user_message: true,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setMessageCount((prev) => prev + 1);

        // Prepare placeholder for assistant message
        const assistantMessage: ChatMessage = {
          id: Date.now() + 1,
          content: "",
          is_user_message: false,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Check if login is required (after 3 messages for non-authenticated users)
        if (!isAuthenticated && messageCount >= 2) {
          handleNavigation("/login");
          return;
        }

        // Use fetch to send request with streaming
        const response = await fetch(`http://localhost:8000/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("clerk-token")}`,
          },
          body: JSON.stringify({
            query: message,
            isSearchMode: isSearchMode,
            session_id: sessionId,
          }),
          signal: abortController.current.signal,
        });

        // Process the streaming response
        const reader = response.body?.getReader();
        let buffer = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode chunk and add to buffer
            const chunk = new TextDecoder().decode(value);
            buffer += chunk;

            // Process complete SSE messages
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim() || !line.startsWith("data: ")) continue;

              try {
                const data = JSON.parse(line.substring(6)); // Remove "data: " prefix

                if (data.type === "metadata") {
                  const newSessionId = data.data.chat_session_id;

                  if (data.data.search) {
                    let parsedSearchData;
                    try {
                      parsedSearchData =
                        typeof data.data.search === "string"
                          ? JSON.parse(data.data.search)
                          : data.data.search;
                    } catch (e) {
                      console.error("Failed to parse search data:", e);
                      parsedSearchData = { results: [] }; // Fallback
                    }

                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, searchData: parsedSearchData }
                          : msg
                      )
                    );
                  }

                  if (!sessionId && newSessionId) {
                    // Update our internal state
                    setSessionId(newSessionId);
                    // Navigate to the new session
                    handleNavigation(`/chat/${newSessionId}`);
                  }
                } else if (data.type === "content") {
                  // Update assistant message with new content
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: msg.content + data.text }
                        : msg
                    )
                  );
                } else if (data.type === "end") {
                  // Message streaming completed
                  fetchSessions();
                }
              } catch (error) {
                console.error("Error parsing SSE message:", error);
              }
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error sending message:", error);
        }
      } finally {
        setIsLoading(false);
        abortController.current = null;
      }
    },
    [
      isAuthenticated,
      messageCount,
      sessionId,
      handleNavigation,
      fetchSessions,
      isSearchMode,
    ]
  );

  // Create a new chat session
  const createSession = useCallback(
    async (name: string = "New Chat") => {
      if (!isAuthenticated) return null;

      try {
        // Reset session ID
        setSessionId(undefined);
        // Navigate to chat - sending the first message will create a session
        handleNavigation("/chat");
        return { id: null, name };
      } catch (error) {
        console.error("Failed to create chat session:", error);
        return null;
      }
    },
    [isAuthenticated, handleNavigation]
  );

  // Delete a chat session
  const deleteSession = useCallback(
    async (id: number) => {
      if (!isAuthenticated) return;

      try {
        await chatApi.deleteChatSession(id);
        setSessions((prev) => prev.filter((session) => session.id !== id));

        if (sessionId === id) {
          setSessionId(undefined);
          handleNavigation("/chat");
        }
      } catch (error) {
        console.error(`Failed to delete chat session ${id}:`, error);
      }
    },
    [isAuthenticated, sessionId, handleNavigation]
  );

  // Rename a chat session
  const renameSession = useCallback(
    async (id: number, name: string) => {
      if (!isAuthenticated) return;

      try {
        await chatApi.updateChatSession(id, { name });
        setSessions((prev) =>
          prev.map((session) =>
            session.id === id ? { ...session, name } : session
          )
        );
      } catch (error) {
        console.error(`Failed to rename chat session ${id}:`, error);
      }
    },
    [isAuthenticated]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    messages,
    sessions,
    currentSession,
    isLoading,
    messageCount,
    sessionId,
    isSearchMode,
    switchSession,
    sendMessage,
    createSession,
    deleteSession,
    renameSession,
    fetchSessions,
    fetchSession,
    toggleSearchMode: () => setIsSearchMode((prev) => !prev),
  };
}
