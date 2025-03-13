import { useState } from "react";
import { Button } from "../ui/button";
import { eduApi } from "../../lib/api";
import { QuizDialog } from "./QuizDialog";
import { toast } from "sonner";
import {
  BookOpenCheck,
  BrainCircuit,
  Loader2,
  FileText,
  Brain,
} from "lucide-react";
import { SummaryDialog } from "./SummaryDialog";
import { MindmapDialog } from "../MindMapDialog";

interface ProgressCardProps {
  pdf: {
    id: number;
    filename: string;
    has_quiz: boolean;
    quiz_id: number | null;
    has_read: boolean;
    quiz_completed: boolean;
    progress_percentage: number;
    quiz_score?: number;
    mindmap?: JSON;
    summary?: string;
  };
  sessionId: number;
  onProgressUpdate: () => void;
}

export function ProgressCard({
  pdf,
  sessionId,
  onProgressUpdate,
}: ProgressCardProps) {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isMindmapOpen, setIsMindmapOpen] = useState(false);

  const isPerfectScore = pdf.quiz_score === 100;

  const markAsRead = async () => {
    try {
      setMarkingAsRead(true);
      await eduApi.trackPdfRead(pdf.id, sessionId);
      toast.success(`${pdf.filename} marked as read`);
      onProgressUpdate();
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("Failed to update reading progress");
    } finally {
      setMarkingAsRead(false);
    }
  };

  return (
    <div className="bg-[#191a1a] p-3 rounded-md border border-gray-800">
      <h4 className="font-medium text-sm mb-1 truncate" title={pdf.filename}>
        {pdf.filename}
      </h4>

      <div className="text-xs text-gray-400 mb-3">
        Progress: {Math.round(pdf.progress_percentage)}%
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        {!pdf.has_read ? (
          <Button
            size="sm"
            variant="outline"
            className="text-xs col-span-2 cursor-pointer"
            onClick={markAsRead}
            disabled={markingAsRead}
          >
            {markingAsRead ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <BookOpenCheck className="h-3 w-3 mr-1" />
            )}
            Mark as Read
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-xs bg-green-900/20 border-green-800 text-green-400 col-span-2"
            disabled
          >
            <BookOpenCheck className="h-3 w-3 mr-1" />
            Read
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs cursor-pointer"
          onClick={() => setIsSummaryOpen(true)}
        >
          <FileText className="h-3 w-3 mr-1" />
          Summary
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="text-xs cursor-pointer"
          onClick={() => setIsMindmapOpen(true)}
        >
          <Brain className="h-3 w-3 mr-1" />
          Mindmap
        </Button>

        {pdf.has_quiz && (
          <Button
            size="sm"
            variant={pdf.quiz_completed ? "outline" : "default"}
            className={`text-xs col-span-2 ${
              pdf.quiz_completed
                ? "bg-blue-900/20 border-blue-800 text-blue-400"
                : ""
            } cursor-pointer`}
            onClick={() => setIsQuizOpen(true)}
            disabled={isPerfectScore}
          >
            <BrainCircuit className="h-3 w-3 mr-1" />
            {isPerfectScore ? "100%" : "Take Quiz"}
          </Button>
        )}
      </div>

      {pdf.has_quiz && pdf.quiz_id && (
        <QuizDialog
          open={isQuizOpen}
          onOpenChange={setIsQuizOpen}
          quizId={pdf.quiz_id}
          sessionId={sessionId}
          pdfTitle={pdf.filename}
          onQuizCompleted={onProgressUpdate}
        />
      )}

      <SummaryDialog
        open={isSummaryOpen}
        onOpenChange={setIsSummaryOpen}
        pdfId={pdf.id}
        pdfTitle={pdf.filename}
        summary={pdf.summary}
      />

      <MindmapDialog
        open={isMindmapOpen}
        onOpenChange={setIsMindmapOpen}
        mindmap={pdf.mindmap}
      />
    </div>
  );
}
