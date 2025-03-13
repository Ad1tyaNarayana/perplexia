import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { eduApi } from "../../lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface QuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: number;
  sessionId: number;
  pdfTitle: string;
  onQuizCompleted: () => void;
}

export function QuizDialog({
  open,
  onOpenChange,
  quizId,
  sessionId,
  pdfTitle,
  onQuizCompleted,
}: QuizDialogProps) {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchQuiz();
    } else {
      // Reset state when dialog closes
      setAnswers({});
      setResults(null);
    }
  }, [open, quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      // Assuming there's an API endpoint to get quiz details
      const { data } = await eduApi.getQuizForPdf(quizId);
      setQuiz(data);
    } catch (error) {
      console.error("Failed to fetch quiz:", error);
      toast.error("Failed to load quiz");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, answerId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const { data } = await eduApi.submitQuiz(quizId, sessionId, answers);
      setResults(data);
      toast.success("Quiz submitted successfully");
      onQuizCompleted();
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#202222] text-slate-100 border-slate-900">
        <DialogHeader>
          <DialogTitle>Quiz: {pdfTitle}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : quiz ? (
            <>
              {!results ? (
                <>
                  <div className="space-y-4 my-4">
                    {quiz.questions.map((question: any) => (
                      <div key={question.id} className="space-y-2">
                        <p className="font-medium">{question.text}</p>
                        <div className="space-y-1">
                          {question.answers.map((answer: any) => (
                            <div
                              key={answer.id}
                              className={`p-2 rounded-md cursor-pointer text-white border ${
                                answers[question.id] === answer.id
                                  ? "border-blue-500 bg-blue-900/20"
                                  : "border-gray-700 hover:border-gray-500"
                              }`}
                              onClick={() =>
                                handleAnswerSelect(question.id, answer.id)
                              }
                            >
                              {answer.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        submitting ||
                        Object.keys(answers).length !== quiz.questions.length
                      }
                    >
                      {submitting && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Submit Quiz
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 my-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      {Math.round(results.score)}%
                    </div>
                    <p className="text-gray-400">
                      You got {results.correct_answers} out of{" "}
                      {results.total_questions} questions correct
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center py-8 text-red-400">Failed to load quiz</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
