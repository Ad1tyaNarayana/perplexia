import { useState, useEffect, useCallback } from 'react';
import { PDFDocument } from '@/types';
import { pdfApi } from '@/lib/api';
import { toast } from "sonner";

export function usePDFs(sessionId?: number) {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [sessionPdfs, setSessionPdfs] = useState<PDFDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Load all user PDFs
  const loadPDFs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await pdfApi.listPDFs();
      if (error) throw new Error(error);
      setPdfs(data);
    } catch (error) {
      console.error('Failed to load PDFs:', error);
      toast({
        title: "Error",
        description: "Failed to load your PDFs.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load PDFs for current session
  const loadSessionPDFs = useCallback(async (sessionId: number) => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await pdfApi.getSessionPDFs(sessionId);
      if (error) throw new Error(error);
      setSessionPdfs(data);
    } catch (error) {
      console.error(`Failed to load PDFs for session ${sessionId}:`, error);
      toast({
        title: "Error",
        description: "Failed to load PDFs for this chat.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Upload a new PDF
  const uploadPDF = async (file: File) => {
    setIsUploading(true);
    try {
      const { data, error } = await pdfApi.uploadPDF(file);
      if (error) throw new Error(error);
      
      toast({
        title: "PDF Uploaded",
        description: "Your PDF has been processed successfully."
      });
      
      // Refresh PDF list
      await loadPDFs();
      return data.pdf_document_id;
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload and process your PDF.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Add a PDF to current session
  const addPDFToSession = async (pdfId: number, sesId: number = sessionId!) => {
    if (!sesId) {
      toast({
        title: "Error",
        description: "No active chat selected.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data, error } = await pdfApi.addPDFToSession(sesId, pdfId);
      if (error) throw new Error(error);
      
      // Refresh session PDFs
      await loadSessionPDFs(sesId);
      
      toast({
        title: "Success",
        description: "PDF added to chat context."
      });
    } catch (error) {
      console.error('Failed to add PDF to session:', error);
      toast({
        title: "Error",
        description: "Failed to add PDF to chat.",
        variant: "destructive"
      });
    }
  };

  // Remove a PDF from current session
  const removePDFFromSession = async (pdfId: number, sesId: number = sessionId!) => {
    if (!sesId) return;
    
    try {
      const { data, error } = await pdfApi.removePDFFromSession(sesId, pdfId);
      if (error) throw new Error(error);
      
      // Update session PDFs locally
      setSessionPdfs(prev => prev.filter(pdf => pdf.id !== pdfId));
      
      toast({
        title: "Success",
        description: "PDF removed from chat context."
      });
    } catch (error) {
      console.error('Failed to remove PDF from session:', error);
      toast({
        title: "Error",
        description: "Failed to remove PDF from chat.",
        variant: "destructive"
      });
    }
  };

  // Load data on initial render if sessionId provided
  useEffect(() => {
    loadPDFs();
    if (sessionId) {
      loadSessionPDFs(sessionId);
    }
  }, [sessionId]);

  return {
    pdfs,
    sessionPdfs,
    isLoading,
    isUploading,
    loadPDFs,
    loadSessionPDFs,
    uploadPDF,
    addPDFToSession