"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileQuestion, Plus, Trash2 } from "lucide-react";
import type { Quiz } from "@/lib/types";
import type { QuizDraft } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";

type QuizzesTabProps = {
  courseId: string;
  quizzes: Quiz[];
  draft: QuizDraft;
  onDraftChange: (draft: QuizDraft) => void;
  onSubmit: (event: React.FormEvent) => void;
  onTogglePublished: (quizId: string, published: boolean) => void;
  onRemove: (quizId: string) => void;
};

const PAGE_SIZE = 6;

export function QuizzesTab({ courseId, quizzes, onTogglePublished, onRemove }: QuizzesTabProps) {
  const t = useTranslations("authoringQuizzes");
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(quizzes.length / PAGE_SIZE));
  const visibleQuizzes = quizzes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <TabsContent value="quizzes" className="mt-5 flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-extrabold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/teacher/materials/create?courseId=${courseId}&type=quiz`}>
            <Plus data-icon="inline-start" /> {t("addQuiz")}
          </Link>
        </Button>
      </div>
      {visibleQuizzes.map((quiz) => (
        <Card key={quiz.id}>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <Badge variant={quiz.isPublished ? "secondary" : "outline"}>
                {quiz.isPublished ? t("published") : t("draft")}
              </Badge>
              <CardTitle className="mt-2">
                <Link
                  href={`/dashboard/teacher/courses/${courseId}/quiz/${quiz.id}`}
                  className="hover:text-primary"
                >
                  {quiz.title}
                </Link>
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("details", { score: quiz.passingScore, minutes: quiz.timeLimit })}
              </p>
            </div>
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => onRemove(quiz.id)}
              aria-label={t("deleteAria", { title: quiz.title })}
            >
              <Trash2 />
            </Button>
          </CardHeader>
          <CardContent className="flex items-center justify-between border-t pt-4">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <FileQuestion /> {t("showToStudents")}
            </span>
            <Switch
              checked={quiz.isPublished}
              onCheckedChange={(checked) => onTogglePublished(quiz.id, checked)}
            />
          </CardContent>
        </Card>
      ))}
      {quizzes.length > PAGE_SIZE ? (
        <div className="flex justify-end">
          <PaginationControl currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ) : null}
    </TabsContent>
  );
}
