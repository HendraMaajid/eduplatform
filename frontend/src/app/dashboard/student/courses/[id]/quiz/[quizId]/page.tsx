"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Question } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  HelpCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { stripHtml } from "@/lib/html-utils";

type QuizState = "intro" | "taking" | "result";


export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  const [course, setCourse] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [quizState, setQuizState] = useState<QuizState>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizAttempt, setQuizAttempt] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, quizzesData, attemptData] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/courses/${courseId}/quizzes`),
          api.get(`/quizzes/${quizId}/attempt`).catch(() => null), // If not taken yet, it will fail 404
        ]);
        
        setCourse(courseData);
        
        const currentQuiz = quizzesData?.find((q: any) => q.id === quizId);
        setQuiz(currentQuiz || null);

        if (attemptData) {
          setQuizAttempt(attemptData);
          setScore(attemptData.score ? Math.round((attemptData.score / attemptData.totalPoints) * 100) : 0);
          setQuizState("result");
        }
      } catch (error) {
        console.error("Gagal mengambil data kuis", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, quizId]);

  // Timer
  useEffect(() => {
    if (quizState !== "taking" || timeLeft <= 0 || submitting) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizState, timeLeft, submitting]);

  const handleSubmit = useCallback(async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    
    // Format answers for API — send the actual answer text, NOT the index
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer
    }));

    try {
      const attempt = await api.post(`/quizzes/${quizId}/submit`, {
        answers: formattedAnswers
      });
      
      setQuizAttempt(attempt);
      setScore(attempt.score ? Math.round((attempt.score / attempt.totalPoints) * 100) : 0);
      setQuizState("result");
    } catch (error) {
      console.error("Gagal mengirim kuis", error);
    } finally {
      setSubmitting(false);
    }
  }, [quiz, answers, quizId, submitting]);

  const startQuiz = () => {
    if (!quiz) return;
    setQuizState("taking");
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(quiz.timeLimit * 60);
    setQuizAttempt(null);
    setShowReview(false);
  };

  const selectAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course || !quiz) {
    return (
      <div className="text-center py-16">
        <HelpCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Kuis tidak ditemukan</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={`/dashboard/student/courses/${courseId}`}>Kembali ke Kursus</Link>
        </Button>
      </div>
    );
  }

  const questions = quiz.questions;
  const currentQ = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isPassed = score >= quiz.passingScore;

  // ===========================
  // INTRO SCREEN
  // ===========================
  if (quizState === "intro") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">{course.title}</p>
            <h1 className="text-xl font-bold">{quiz.title}</h1>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/25">
              <HelpCircle className="h-10 w-10 text-white" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">{quiz.title}</h2>
              <p className="text-muted-foreground mt-2">{stripHtml(quiz.description)}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-accent/50">
                <p className="text-2xl font-bold text-primary">{questions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Soal</p>
              </div>
              <div className="p-4 rounded-xl bg-accent/50">
                <p className="text-2xl font-bold text-primary">{quiz.timeLimit}</p>
                <p className="text-xs text-muted-foreground mt-1">Menit</p>
              </div>
              <div className="p-4 rounded-xl bg-accent/50">
                <p className="text-2xl font-bold text-primary">{quiz.passingScore}%</p>
                <p className="text-xs text-muted-foreground mt-1">Skor Minimum</p>
              </div>
            </div>

            {quizAttempt && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Anda sudah pernah mengerjakan kuis ini. Skor terakhir: {score}%
                </p>
              </div>
            )}

            <Button onClick={startQuiz} size="lg" className="w-full gradient-primary text-white shadow-lg shadow-primary/25 gap-2">
              Mulai Kuis <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===========================
  // RESULT SCREEN
  // ===========================
  if (quizState === "result") {
    // Count correct answers from the attempt data
    const correctCount = quizAttempt?.answers?.filter((a: any) => a.isCorrect).length || 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">{course.title}</p>
            <h1 className="text-xl font-bold">Hasil Kuis</h1>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center shadow-xl ${
              isPassed
                ? "bg-emerald-500/10 ring-4 ring-emerald-500/20"
                : "bg-red-500/10 ring-4 ring-red-500/20"
            }`}>
              {isPassed ? (
                <Trophy className="h-12 w-12 text-emerald-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                {isPassed ? "Selamat! Anda Lulus! 🎉" : "Belum Lulus"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {isPassed
                  ? "Anda telah berhasil menyelesaikan kuis ini"
                  : `Skor minimum adalah ${quiz.passingScore}%. Silakan coba lagi.`}
              </p>
            </div>

            {/* Score Circle */}
            <div className="relative inline-flex items-center justify-center">
              <svg className="h-40 w-40 -rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" className="text-accent" />
                <circle
                  cx="80" cy="80" r="70" fill="none"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - score / 100)}
                  strokeLinecap="round"
                  className={isPassed ? "stroke-emerald-500" : "stroke-red-500"}
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
              </svg>
              <div className="absolute">
                <p className={`text-4xl font-bold ${isPassed ? "text-emerald-500" : "text-red-500"}`}>
                  {score}%
                </p>
                <p className="text-xs text-muted-foreground">Skor Anda</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-accent/50">
                <p className="text-lg font-bold">
                  {correctCount}/{questions.length}
                </p>
                <p className="text-xs text-muted-foreground">Jawaban Benar</p>
              </div>
              <div className="p-4 rounded-xl bg-accent/50">
                <Badge className={isPassed ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-red-500/10 text-red-500 border-red-500/30"}>
                  {isPassed ? "LULUS" : "TIDAK LULUS"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Min: {quiz.passingScore}%</p>
              </div>
            </div>

            <Separator />

            {/* Review answers toggle — only show if passed */}
            {isPassed && (
              <>
                <Button variant="outline" onClick={() => setShowReview(!showReview)} className="w-full">
                  {showReview ? "Sembunyikan Review" : "Lihat Review Jawaban"}
                </Button>

                {showReview && (
                  <div className="space-y-4 text-left">
                    {questions.map((q: any, idx: number) => {
                      // Find the answer from the attempt data
                      const attemptAnswer = quizAttempt?.answers?.find((a: any) => a.questionId === q.id);
                      const isCorrect = attemptAnswer?.isCorrect || false;
                      const userAnswerText = attemptAnswer?.answer || "";

                      return (
                        <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                              {isCorrect ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Soal {idx + 1}: {stripHtml(q.text)}</p>
                              {(q.type === "multiple_choice" || q.type === "true_false") && q.options && (
                                <div className="mt-2 space-y-1">
                                  {q.options.map((opt: string, optIdx: number) => (
                                    <p key={optIdx} className={`text-sm px-3 py-1.5 rounded-lg ${
                                      opt === q.correctAnswer
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                                        : opt === userAnswerText && !isCorrect
                                        ? "bg-red-500/10 text-red-600 dark:text-red-400 line-through"
                                        : "text-muted-foreground"
                                    }`}>
                                      {q.type === "true_false" ? "" : `${String.fromCharCode(65 + optIdx)}. `}{opt}
                                      {opt === q.correctAnswer && " ✓"}
                                      {opt === userAnswerText && !isCorrect && " ✗"}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {q.type === "short_answer" && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">Jawaban Anda: </span>
                                    <span className={isCorrect ? "text-emerald-500 font-medium" : "text-red-500 line-through"}>
                                      {userAnswerText || "(tidak dijawab)"}
                                    </span>
                                  </p>
                                  {!isCorrect && (
                                    <p className="text-sm">
                                      <span className="text-muted-foreground">Jawaban Benar: </span>
                                      <span className="text-emerald-500 font-medium">{q.correctAnswer}</span>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={startQuiz}>
                <RotateCcw className="h-4 w-4" /> Coba Lagi
              </Button>
              <Button className="flex-1 gradient-primary text-white" asChild>
                <Link href={`/dashboard/student/courses/${courseId}`}>Kembali ke Kursus</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===========================
  // QUIZ TAKING SCREEN
  // ===========================
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{course.title}</p>
          <h1 className="text-lg font-bold">{quiz.title}</h1>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold ${
          timeLeft <= 60 ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-accent"
        }`}>
          <Clock className="h-5 w-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{answeredCount}/{questions.length} dijawab</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Question Navigation Dots */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q: any, idx: number) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestion(idx)}
            className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
              idx === currentQuestion
                ? "gradient-primary text-white shadow-md shadow-primary/25"
                : answers[q.id]
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                : "bg-accent hover:bg-accent/80 text-muted-foreground"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">Soal {currentQuestion + 1} / {questions.length}</Badge>
            <Badge variant="secondary">{currentQ.points} poin</Badge>
          </div>
          {/* Render question text — strip HTML */}
          <CardTitle className="text-lg mt-3">{stripHtml(currentQ.text)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Multiple Choice */}
          {currentQ.type === "multiple_choice" && currentQ.options ? (
            currentQ.options.map((option: string, idx: number) => {
              const isSelected = answers[currentQ.id] === option;
              return (
                <button
                  key={idx}
                  onClick={() => selectAnswer(currentQ.id, option)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      isSelected
                        ? "gradient-primary text-white"
                        : "bg-accent text-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className={`text-sm ${isSelected ? "font-medium" : ""}`}>{option}</span>
                  </div>
                </button>
              );
            })
          ) : currentQ.type === "true_false" ? (
            /* True/False — render as two big buttons */
            <div className="grid grid-cols-2 gap-4">
              {(currentQ.options || ["Benar", "Salah"]).map((option: string) => {
                const isSelected = answers[currentQ.id] === option;
                return (
                  <button
                    key={option}
                    onClick={() => selectAnswer(currentQ.id, option)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${
                      isSelected
                        ? option === "Benar"
                          ? "border-emerald-500 bg-emerald-500/10 shadow-md"
                          : "border-red-500 bg-red-500/10 shadow-md"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    }`}
                  >
                    <div className={`text-3xl mb-2 ${
                      isSelected
                        ? option === "Benar" ? "text-emerald-500" : "text-red-500"
                        : "text-muted-foreground"
                    }`}>
                      {option === "Benar" ? "✓" : "✗"}
                    </div>
                    <span className={`text-sm font-medium ${
                      isSelected
                        ? option === "Benar" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        : ""
                    }`}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Short Answer */
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ketik jawaban Anda:</p>
              <Input
                value={answers[currentQ.id] || ""}
                onChange={(e) => selectAnswer(currentQ.id, e.target.value)}
                placeholder="Tulis jawaban di sini..."
                className="text-base"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Sebelumnya
        </Button>

        {currentQuestion === questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gradient-primary text-white shadow-lg shadow-primary/25 gap-2"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Kirim Jawaban</>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
            className="gap-2"
          >
            Selanjutnya <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
