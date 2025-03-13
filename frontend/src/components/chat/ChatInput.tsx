// src/components/ChatInput.tsx
import { useState, KeyboardEvent, FormEvent } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send, Loader2, Globe, BookOpen } from "lucide-react";
import { PDFUploader } from "../PDFUploader";
import { ChatMessage } from "@/types";
import { ProgressTracker } from "../education/ProgressTracker";

interface ChatInputProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  sessionId?: number;
  isSearchMode: boolean;
  toggleSearchMode: () => void;
}

export function ChatInput({
  messages,
  onSendMessage,
  isLoading,
  sessionId,
  isSearchMode,
  toggleSearchMode,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div
      className={`bg-[#191a1a] p-4 pt-2 w-full max-w-3xl  ${
        messages.length ? "fixed bottom-0" : ""
      }`}
    >
      <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex flex-col gap-2">
            <PDFUploader sessionId={sessionId} />
            <Button
              size="icon"
              variant="outline"
              style={{ borderRadius: "50%" }}
              onClick={toggleSearchMode}
              className={`${
                isSearchMode
                  ? "bg-sky-600 hover:bg-sky-600/70"
                  : "hover:bg-sky-600"
              } hover:cursor-pointer`}
            >
              <Globe
                className={`h-4 w-4 ${isSearchMode ? "text-slate-100" : ""}`}
              />
            </Button>
          </div>

          <div className="relative flex-1 max-w-2xl">
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="max-h-44 h-full resize-none pr-12"
              disabled={isLoading}
            />
            <Button
              size="icon"
              type="submit"
              variant="ghost"
              disabled={isLoading || !message.trim()}
              className="absolute bottom-1 right-1 "
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {/* Progress Tracker Button */}
          {sessionId && (
            <Button
              size="icon"
              variant="outline"
              style={{ borderRadius: "50%" }}
              onClick={() => setProgressDialogOpen(true)}
              className="hover:bg-blue-800 hover:cursor-pointer"
              title="Learning Progress"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
      {/* Add the ProgressTracker dialog */}
      {sessionId && (
        <ProgressTracker
          sessionId={sessionId}
          isOpen={progressDialogOpen}
          onOpenChange={setProgressDialogOpen}
        />
      )}
    </div>
  );
}
