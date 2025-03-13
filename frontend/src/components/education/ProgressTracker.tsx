import { useEffect, useState } from "react";
import { eduApi } from "../../lib/api";
import { ProgressCard } from "./ProgressCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Loader2 } from "lucide-react";
import { Progress } from "../ui/progress";

interface ProgressTrackerProps {
  sessionId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProgressTracker({
  sessionId,
  isOpen,
  onOpenChange,
}: ProgressTrackerProps) {
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionProgress, setSessionProgress] = useState(0);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const { data } = await eduApi.getSessionProgress(sessionId);
      setProgressData(data || []);

      // Calculate overall session progress (average of all PDFs)
      if (data && data.length > 0) {
        const totalProgress = data.reduce(
          (sum: any, pdf: { progress_percentage: any }) =>
            sum + pdf.progress_percentage,
          0
        );
        setSessionProgress(totalProgress / data.length);
      } else {
        setSessionProgress(0);
      }
    } catch (error) {
      console.error("Failed to fetch progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId && isOpen) {
      fetchProgress();
    }
  }, [sessionId, isOpen]);

  if (!sessionId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#202222] text-slate-100 border-slate-900">
        <DialogHeader>
          <DialogTitle>Learning Progress</DialogTitle>

          {/* Session-wide progress bar */}
          <div className="mt-2 px-2">
            <div className="text-xs text-gray-400 flex justify-between mb-1">
              <span>Overall Progress</span>
              <span>{Math.round(sessionProgress)}%</span>
            </div>
            <Progress value={sessionProgress} className="h-4 " />
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : progressData.length > 0 ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto px-2">
            {progressData.map((pdf) => (
              <ProgressCard
                key={pdf.id}
                pdf={pdf}
                sessionId={sessionId}
                onProgressUpdate={fetchProgress}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            No PDFs associated with this session.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
