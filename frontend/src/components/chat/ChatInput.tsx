// src/components/ChatInput.tsx
import { useState, KeyboardEvent, FormEvent } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Loader2, BookOpen } from "lucide-react";
import { PDFUploader } from "../PDFUploader";
import { ChatMessage } from "@/types";

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
      className={`p-4 pt-2 w-full max-w-3xl backdrop-blur-xs md:backdrop-blur-none  ${
        messages.length ? "fixed bottom-0" : ""
      }`}
    >
      <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex flex-col gap-2">
            <PDFUploader sessionId={sessionId} />
            <Button
              size="icon"
              variant="blue_button_GB"
              style={{ borderRadius: "50%" }}
              onClick={toggleSearchMode}
              className={`hover:cursor-pointer w-9 h-9 min-md:w-10 min-md:h-10 ${
                isSearchMode
                  ? "bg-sky-600 ring-2 ring-emerald-300 hover:bg-sky-600/70 scale-105"
                  : "hover:bg-sky-600"
              }`}
            >
              <img src="/world.svg" className="w-7 h-7 min-md:w-8 min-md:h-8" />
            </Button>
          </div>

          <div className="relative flex-1 max-w-2xl">
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="max-h-44 h-full resize-none pr-12 text-black"
              disabled={isLoading}
            />
            <Button
              size="icon"
              type="submit"
              variant="ghost"
              disabled={isLoading || !message.trim()}
              className="absolute bottom-1 right-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div
                  style={{
                    backgroundImage: `url(${window.location.origin}/arrow_button_GB.png)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  className="h-9 w-9"
                ></div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
