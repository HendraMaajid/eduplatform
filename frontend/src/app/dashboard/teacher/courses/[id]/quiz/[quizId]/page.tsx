"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Question, QuestionType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2 } from "lucide-react";
type Draft = {
  type: QuestionType;
  text: string;
  options: string;
  correctAnswer: string;
  points: number;
  order: number;
};
const empty: Draft = {
  type: "multiple_choice",
  text: "",
  options: "",
  correctAnswer: "",
  points: 10,
  order: 1,
};
export default function QuizQuestionsPage() {
  const t = useTranslations("quizBuilder");
  const { id, quizId } = useParams<{ id: string; quizId: string }>();
  const [items, setItems] = useState<Question[]>([]);
  const [form, setForm] = useState(empty);
  function load() {
    api.get<Question[]>(`/manage/quizzes/${quizId}/questions/full`).then(setItems);
  }
  useEffect(load, [quizId]);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/manage/quizzes/${quizId}/questions`, {
      ...form,
      options:
        form.type === "multiple_choice"
          ? form.options
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
    });
    setForm({ ...empty, order: items.length + 2 });
    load();
    toast.success(t("questionAdded"));
  }
  async function remove(questionId: string) {
    await api.delete(`/manage/questions/${questionId}`);
    load();
  }
  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href={`/dashboard/teacher/courses/${id}`}>
          <ArrowLeft />
          {t("back")}
        </Link>
      </Button>
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{t("title")}</h1>
      </div>
      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        <Card className="h-fit border-2">
          <CardHeader>
            <CardTitle>{t("newQuestion")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={create}>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t("type")}</FieldLabel>
                  <select
                    className="h-10 rounded-lg border bg-background px-3"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })}
                  >
                    <option value="multiple_choice">{t("types.multiple_choice")}</option>
                    <option value="short_answer">{t("types.short_answer")}</option>
                  </select>
                </Field>
                <Field>
                  <FieldLabel>{t("question")}</FieldLabel>
                  <Textarea
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                    required
                  />
                </Field>
                {form.type === "multiple_choice" && (
                  <Field>
                    <FieldLabel>{t("options")}</FieldLabel>
                    <Textarea
                      rows={5}
                      value={form.options}
                      onChange={(e) => setForm({ ...form, options: e.target.value })}
                    />
                  </Field>
                )}
                <Field>
                  <FieldLabel>{t("correctAnswer")}</FieldLabel>
                  <Input
                    value={form.correctAnswer}
                    onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>{t("points")}</FieldLabel>
                    <Input
                      type="number"
                      value={form.points}
                      onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t("order")}</FieldLabel>
                    <Input
                      type="number"
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                    />
                  </Field>
                </div>
                <Button type="submit">{t("addQuestion")}</Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-3">
          {items.map((q, index) => (
            <Card key={q.id} className="border-2">
              <CardContent className="flex justify-between gap-4">
                <div>
                  <Badge variant="outline">{t(`types.${q.type}`)}</Badge>
                  <h2 className="mt-2 font-bold">
                    {index + 1}. {q.text}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("answerDetails", { answer: q.correctAnswer || "—", points: q.points })}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => void remove(q.id)}
                  aria-label={t("deleteAria", { question: q.text })}
                >
                  <Trash2 />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
