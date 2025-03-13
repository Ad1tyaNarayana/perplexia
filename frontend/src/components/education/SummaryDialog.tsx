import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { eduApi } from "../../lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface SummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfId: number;
  pdfTitle: string;
  summary?: string;
}

export function SummaryDialog({
  open,
  onOpenChange,
  pdfId,
  pdfTitle,
  summary,
}: SummaryDialogProps) {
  const [loadedSummary, setLoadedSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      if (summary) {
        // If summary was already provided, use it
        setLoadedSummary(summary);
        setLoading(false);
      } else {
        // Otherwise, load it (fallback for direct access)
        fetchSummary();
      }
    }
  }, [open, pdfId, summary]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const { data } = await eduApi.getPdfSummary(pdfId);
      setLoadedSummary(data.summary || "No summary available");
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      toast.error("Failed to load summary");
      setLoadedSummary("Failed to load summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#202222] text-slate-100 border-slate-900">
        <DialogHeader>
          <DialogTitle>Summary: {pdfTitle}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {loadedSummary}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
