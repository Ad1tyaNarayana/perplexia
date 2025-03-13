import { useEffect, useState } from "react";
import { eduApi } from "../../lib/api";
import { ProgressCard } from "./ProgressCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Loader2 } from "lucide-react";

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

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const { data } = await eduApi.getSessionProgress(sessionId);
      setProgressData(data || []);
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
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : progressData.length > 0 ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
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
