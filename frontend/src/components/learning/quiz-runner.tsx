"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Loader2,
  RotateCcw,
  Send,
  Trophy,
  XCircle,
} from "lucide-react";
import { RichContent } from "@/lib/html-utils";
import type { Question, Quiz, QuizAnswer, QuizAttempt } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

type QuizPhase = "taking" | "result";

type QuestionPanelProps = {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  answer: string;
  onAnswer: (answer: string) => void;
};

function QuestionPanel({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswer,
}: QuestionPanelProps) {
  const t = useTranslations("quizRunner");
  return (
    <Card id="quiz-question" className="min-w-0 [--card-spacing:--spacing(6)]">
      <CardHeader className="border-b">
        <CardDescription>
          {t("questionPosition", {
            current: questionNumber,
            total: totalQuestions,
            points: question.points,
          })}
        </CardDescription>
        <CardTitle className="mt-1 text-xl leading-relaxed sm:text-2xl">{question.text}</CardTitle>
      </CardHeader>
      <CardContent>
        {question.type === "multiple_choice" ? (
          <FieldSet>
            <FieldLegend className="sr-only">{t("chooseOne")}</FieldLegend>
            <RadioGroup
              name={question.id}
              value={answer}
              onValueChange={(value) => onAnswer(String(value))}
              required
              className="gap-3"
            >
              {(question.options || []).map((option, index) => {
                const selected = answer === option;
                return (
                  <FieldLabel
                    key={option}
                    className={cn(
                      "cursor-pointer rounded-xl border p-0 transition-colors hover:bg-muted/60",
                      selected && "border-primary bg-primary/5 ring-1 ring-primary/20",
                    )}
                  >
                    <Field orientation="horizontal" className="items-center gap-3 p-4">
                      <RadioGroupItem value={option} />
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg border bg-background text-sm font-bold",
                          selected && "border-primary bg-primary text-primary-foreground",
                        )}
                        aria-hidden="true"
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <FieldContent>
                        <FieldTitle className="text-base font-semibold">{option}</FieldTitle>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                );
              })}
            </RadioGroup>
          </FieldSet>
        ) : (
          <Field>
            <FieldLabel htmlFor={`answer-${question.id}`}>{t("yourAnswer")}</FieldLabel>
            <Textarea
              id={`answer-${question.id}`}
              value={answer}
              onChange={(event) => onAnswer(event.target.value)}
              placeholder={t("answerPlaceholder")}
              rows={7}
              required
            />
          </Field>
        )}
      </CardContent>
    </Card>
  );
}

type QuizResultProps = {
  attempt: QuizAttempt;
  passingScore: number;
  courseHref: string;
  onRetry: () => void;
};

function QuizResult({ attempt, passingScore, courseHref, onRetry }: QuizResultProps) {
  const t = useTranslations("quizRunner");
  return (
    <Card className="mx-auto w-full max-w-4xl [--card-spacing:--spacing(7)]" aria-live="polite">
      <CardHeader className="items-center px-6 text-center sm:px-10 lg:px-16 lg:pt-8">
        <span
          className={cn(
            "grid size-16 place-items-center rounded-full",
            attempt.passed
              ? "bg-secondary text-secondary-foreground"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {attempt.passed ? <Trophy /> : <XCircle />}
        </span>
        <Badge className="mt-3" variant={attempt.passed ? "secondary" : "destructive"}>
          {attempt.passed ? (
            <CheckCircle2 data-icon="inline-start" />
          ) : (
            <XCircle data-icon="inline-start" />
          )}
          {attempt.passed ? t("completed") : t("notPassed")}
        </Badge>
        <CardTitle className="mt-3 max-w-2xl text-3xl sm:text-4xl">
          {attempt.passed ? t("greatWork") : t("almostThere")}
        </CardTitle>
        <CardDescription className="max-w-lg text-base leading-relaxed">
          {attempt.passed
            ? t("passedDescription")
            : t("failedDescription", { score: passingScore })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5 px-6 sm:px-10 lg:px-20">
        <div className="text-center">
          <p className="text-sm font-semibold text-muted-foreground">{t("bestScore")}</p>
          <p className="mt-1 text-6xl font-extrabold tracking-tight text-primary">
            {attempt.score}
            <span className="text-2xl">%</span>
          </p>
        </div>
        <Progress value={attempt.score} className="w-full max-w-md" />
        <p className="text-sm text-muted-foreground">
          {t.rich("passingTarget", {
            score: passingScore,
            strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
          })}
        </p>
      </CardContent>
      <CardFooter className="flex-col justify-center gap-2 px-6 py-5 sm:flex-row sm:px-10">
        <Button variant="outline" asChild>
          <Link href={courseHref}>
            <ArrowLeft data-icon="inline-start" /> {t("backToCourse")}
          </Link>
        </Button>
        {!attempt.passed ? (
          <Button type="button" onClick={onRetry}>
            <RotateCcw data-icon="inline-start" /> {t("retryQuiz")}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

type QuizRunnerProps = {
  quiz: Quiz;
  questions: Question[];
  initialAttempt?: QuizAttempt | null;
  courseHref: string;
  onSubmit: (answers: QuizAnswer[]) => Promise<QuizAttempt>;
};

export function QuizRunner({
  quiz,
  questions,
  initialAttempt = null,
  courseHref,
  onSubmit,
}: QuizRunnerProps) {
  const t = useTranslations("quizRunner");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(initialAttempt);
  const [phase, setPhase] = useState<QuizPhase>(initialAttempt ? "result" : "taking");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const orderedQuestions = useMemo(
    () => [...questions].sort((first, second) => first.order - second.order),
    [questions],
  );
  const currentQuestion = orderedQuestions[currentIndex] || null;
  const answeredCount = orderedQuestions.reduce(
    (total, question) => total + (answers[question.id]?.trim() ? 1 : 0),
    0,
  );

  function goToQuestion(index: number) {
    setCurrentIndex(index);
    requestAnimationFrame(() =>
      document
        .getElementById("quiz-question")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  function setAnswer(questionId: string, answer: string) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstMissingIndex = orderedQuestions.findIndex(
      (question) => !answers[question.id]?.trim(),
    );
    if (firstMissingIndex >= 0) {
      goToQuestion(firstMissingIndex);
      toast.error(t("answerRequired", { number: firstMissingIndex + 1 }));
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit(
        orderedQuestions.map((question) => ({
          questionId: question.id,
          answer: answers[question.id],
        })),
      );
      setAttempt(result);
      setPhase("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success(t("graded"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setAnswers({});
    setCurrentIndex(0);
    setPhase("taking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (phase === "result" && attempt) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Button className="w-fit" variant="ghost" asChild>
          <Link href={courseHref}>
            <ArrowLeft data-icon="inline-start" /> {t("backToCourse")}
          </Link>
        </Button>
        <QuizResult
          attempt={attempt}
          passingScore={quiz.passingScore}
          courseHref={courseHref}
          onRetry={retry}
        />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>{t("emptyTitle")}</CardTitle>
          <CardDescription>{t("emptyDescription")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Button className="w-fit" variant="ghost" asChild>
        <Link href={courseHref}>
          <ArrowLeft data-icon="inline-start" /> {t("backToCourse")}
        </Link>
      </Button>

      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{quiz.title}</h1>
          {quiz.description ? (
            <RichContent html={quiz.description} className="mt-3 text-muted-foreground" />
          ) : (
            <p className="mt-3 text-muted-foreground">{t("intro")}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            <Trophy data-icon="inline-start" /> {t("passScore", { score: quiz.passingScore })}
          </Badge>
          <Badge variant="outline">
            <Clock3 data-icon="inline-start" /> {t("minutes", { count: quiz.timeLimit })}
          </Badge>
          <Badge variant="outline">
            <HelpCircle data-icon="inline-start" />
            {t("questionCount", { count: orderedQuestions.length })}
          </Badge>
        </div>
      </header>

      <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Card className="lg:sticky lg:top-24" size="sm">
          <CardHeader>
            <CardTitle>{t("navigation")}</CardTitle>
            <CardDescription>
              {t("answered", { answered: answeredCount, total: orderedQuestions.length })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Progress value={(answeredCount / orderedQuestions.length) * 100} />
            <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
              {orderedQuestions.map((question, index) => {
                const isCurrent = index === currentIndex;
                const isAnswered = Boolean(answers[question.id]?.trim());
                return (
                  <Button
                    key={question.id}
                    type="button"
                    size="icon"
                    variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                    className="rounded-full tabular-nums"
                    aria-label={t(isAnswered ? "openAnsweredQuestion" : "openQuestion", {
                      number: index + 1,
                    })}
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={() => goToQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{t("navigationHint")}</p>
          </CardContent>
        </Card>

        <div className="min-w-0">
          <QuestionPanel
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={orderedQuestions.length}
            answer={answers[currentQuestion.id] || ""}
            onAnswer={(answer) => setAnswer(currentQuestion.id, answer)}
          />
          <div className="mt-4 flex flex-col-reverse justify-between gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(currentIndex - 1)}
            >
              <ArrowLeft data-icon="inline-start" /> {t("previous")}
            </Button>
            {currentIndex < orderedQuestions.length - 1 ? (
              <Button type="button" onClick={() => goToQuestion(currentIndex + 1)}>
                {t("next")} <ArrowRight data-icon="inline-end" />
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                {t("submit")}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
