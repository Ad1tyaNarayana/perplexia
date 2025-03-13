import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { File, FileUp, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import api, { pdfApi } from "../lib/api";
import { PdfDocument } from "../types";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";

interface PDFUploaderProps {
  sessionId?: number;
}

export function PDFUploader({ sessionId }: PDFUploaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPdfs, setUploadedPdfs] = useState<PdfDocument[]>([]);
  const [sessionPdfs, setSessionPdfs] = useState<PdfDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch PDFs when dialog opens
  const handleOpenDialog = async () => {
    setIsDialogOpen(true);
    setError(null);
    await fetchPdfs();
  };

  const fetchPdfs = async () => {
    try {
      // Fetch all user PDFs
      const { data: pdfs } = await pdfApi.listPdfs();
      setUploadedPdfs(pdfs || []);

      // If there's a session ID, fetch PDFs attached to this session
      if (sessionId) {
        const { data: sessionPdfs } = await pdfApi.listSessionPdfs(sessionId);
        setSessionPdfs(sessionPdfs || []);
      }
    } catch (error) {
      console.error("Failed to fetch PDFs:", error);
      setError("Failed to load PDFs. Please try again.");
      toast("Failed to load PDFs");
    }
  };

  const validatePdf = (file: File): boolean => {
    // Check file type
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed");
      toast("Only PDF files are allowed");
      return false;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB)");
      toast("Maximum file size is 10MB");
      return false;
    }

    return true;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!validatePdf(file)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const { data } = await pdfApi.uploadPdf(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!data || !data.id) {
        throw new Error("Invalid response from server");
      }

      setUploadedPdfs((prev) => [...prev, data]);
      toast("PDF uploaded successfully");

      // If session ID is provided, automatically attach the PDF to session
      if (sessionId) {
        await pdfApi.addPdfToSession(sessionId, data.id);
        setSessionPdfs((prev) => [...prev, data]);
        toast(`${file.name} is now available for this chat session`);
      } else {
        // Create a new session if user is authenticated but no session exists
        try {
          if (isAuthenticated) {
            // Create a new session with a name based on the PDF
            const sessionName = `Chat about ${file.name}`;
            const { data: newSession } = await api.post("/chat/sessions", {
              name: sessionName,
            });

            if (newSession?.id) {
              // Associate PDF with the new session
              await pdfApi.addPdfToSession(newSession.id, data.id);

              // Navigate to the new session
              navigate({
                to: "/chat/$sessionId",
                params: { sessionId: newSession.id },
              });

              toast(`Created new chat session with ${file.name}`);
            }
          } else {
            // User is not authenticated, prompt for login
            toast(`Sign in to create a chat session with this PDF`);

            // Optionally, redirect to login page
            // navigate({ to: '/login' });
          }
        } catch (error) {
          console.error("Failed to create session for PDF:", error);
          toast("Couldn't create a new chat session");
        }
      }
    } catch (error: any) {
      console.error("Failed to upload PDF:", error);
      const errorMessage =
        error?.response?.data?.detail ||
        "There was an error uploading your PDF.";
      setError(errorMessage);
      toast(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const togglePdfInSession = async (pdf: PdfDocument) => {
    if (!sessionId) return;

    const isPdfInSession = sessionPdfs.some((p) => p.id === pdf.id);
    setError(null);

    try {
      if (isPdfInSession) {
        await pdfApi.removePdfFromSession(sessionId, pdf.id);
        setSessionPdfs((prev) => prev.filter((p) => p.id !== pdf.id));
        toast(`${pdf.filename} is no longer used in this chat`);
      } else {
        await pdfApi.addPdfToSession(sessionId, pdf.id);
        setSessionPdfs((prev) => [...prev, pdf]);
        toast(`${pdf.filename} is now available for this chat`);
      }
    } catch (error: any) {
      console.error("Failed to update PDF in session:", error);
      const errorMessage = error?.response?.data?.detail || "Operation failed";
      setError(errorMessage);
      toast(errorMessage);
    }
  };

  // Clear error when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setError(null);
    }
  }, [isDialogOpen]);

  return (
    <>
      <Button
        size="icon"
        type="button"
        onClick={handleOpenDialog}
        title="Manage PDFs"
        variant="outline"
        style={{ borderRadius: "50%" }}
        className="hover:bg-neutral-700 hover:cursor-pointer"
      >
        <FileUp className="h-4 w-4" />
      </Button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf"
        className="hidden"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-[#202222] text-slate-100 border-slate-900">
          <DialogHeader>
            <DialogTitle>Manage PDFs</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full relative hover:bg-neutral-700 hover:cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading... {uploadProgress}%
                  <div
                    className="absolute left-0 bottom-0 h-1 bg-primary"
                    style={{
                      width: `${uploadProgress}%`,
                      transition: "width 0.3s ease-in-out",
                    }}
                  />
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload New PDF
                </>
              )}
            </Button>

            <div className="max-h-72 overflow-y-auto space-y-2">
              <h3 className="text-sm font-medium mb-2">Your PDFs</h3>

              {uploadedPdfs.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No PDFs uploaded yet
                </p>
              ) : (
                uploadedPdfs.map((pdf) => {
                  const isInSession = sessionPdfs.some((p) => p.id === pdf.id);
                  return (
                    <div
                      key={pdf.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-accent/50 "
                    >
                      <div className="flex items-center overflow-hidden">
                        <File className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span
                          className="text-sm truncate max-w-[10rem]"
                          title={pdf.filename}
                        >
                          {pdf.filename}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {sessionId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePdfInSession(pdf)}
                            className={
                              isInSession
                                ? "bg-green-800 hover:bg-green-900 border-none"
                                : "hover:border-green-700"
                            }
                          >
                            {isInSession ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <FileUp className="h-3 w-3 mr-1" />
                                Use
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
