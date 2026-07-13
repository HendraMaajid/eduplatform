"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import type { Question, Quiz, QuizAnswer, QuizAttempt } from "@/lib/types";
import { QuizRunner } from "@/components/learning/quiz-runner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizPage() {
  const t = useTranslations("quizPage");
  const { id, quizId } = useParams<{ id: string; quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.get<Quiz[]>(`/learning/courses/${id}/quizzes`),
      api.get<Question[]>(`/learning/quizzes/${quizId}/questions`),
      api.get<QuizAttempt>(`/learning/quizzes/${quizId}/attempt`).catch(() => null),
    ])
      .then(([loadedQuizzes, loadedQuestions, loadedAttempt]) => {
        if (!active) return;
        const selectedQuiz = loadedQuizzes.find((item) => item.id === quizId) || null;
        if (!selectedQuiz) throw new Error(t("notFound"));
        setQuiz(selectedQuiz);
        setQuestions(loadedQuestions);
        setAttempt(loadedAttempt);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : t("loadError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, quizId, t]);

  if (loading) return <Skeleton className="mx-auto h-[70vh] max-w-5xl" />;

  if (error || !quiz) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>{t("cannotOpen")}</CardTitle>
          <CardDescription>{error || t("unavailable")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/student/courses/${id}`}>
              <ArrowLeft data-icon="inline-start" /> {t("backToCourse")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  async function submitAnswers(answers: QuizAnswer[]) {
    return api.post<QuizAttempt>(`/learning/quizzes/${quizId}/submit`, { answers });
  }

  return (
    <QuizRunner
      key={quiz.id}
      quiz={quiz}
      questions={questions}
      initialAttempt={attempt}
      courseHref={`/dashboard/student/courses/${id}`}
      onSubmit={submitAnswers}
    />
  );
}
