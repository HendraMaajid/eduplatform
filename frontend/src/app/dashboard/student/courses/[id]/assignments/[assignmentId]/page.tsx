"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  MessageSquareText,
  Send,
  Trophy,
} from "lucide-react";
import { api } from "@/lib/api";
import { RichContent } from "@/lib/html-utils";
import type { Assignment, Submission } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

function SubmissionStatus({ submission }: { submission: Submission }) {
  const t = useTranslations("assignmentPage");
  const isWaiting = submission.status === "submitted";
  const isFailed = submission.status === "failed";
  return (
    <Alert variant={isFailed ? "destructive" : "default"}>
      {isWaiting ? <ClipboardCheck /> : isFailed ? <FileText /> : <Trophy />}
      <AlertTitle>
        {isWaiting
          ? t("submitted")
          : isFailed
            ? t("revisionNeeded", { score: submission.score ?? 0 })
            : t("graded", { score: submission.score ?? 0 })}
      </AlertTitle>
      <AlertDescription>
        {isWaiting ? t("waitingDescription") : submission.feedback || t("noFeedback")}
      </AlertDescription>
    </Alert>
  );
}

export default function AssignmentPage() {
  const t = useTranslations("assignmentPage");
  const format = useFormatter();
  const { id, assignmentId } = useParams<{ id: string; assignmentId: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.get<Assignment[]>(`/learning/courses/${id}/assignments`),
      api.get<Submission[]>("/learning/submissions"),
    ])
      .then(([assignments, submissions]) => {
        if (!active) return;
        const selectedAssignment = assignments.find((item) => item.id === assignmentId) || null;
        if (!selectedAssignment) {
          throw new Error(t("notFound"));
        }
        setAssignment(selectedAssignment);
        const existing = submissions.find((item) => item.assignmentId === assignmentId) || null;
        setSubmission(existing);
        if (existing) {
          setFileUrl(existing.fileUrl);
          setFileName(existing.fileName);
          setDescription(existing.description);
        }
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
  }, [id, assignmentId, t]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await api.post<Submission>(`/learning/assignments/${assignmentId}/submit`, {
        fileUrl: fileUrl.trim(),
        fileName: fileName.trim(),
        description: description.trim(),
      });
      setSubmission(saved);
      toast.success(t("submitSuccess"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("submitError"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="mx-auto h-[75vh] max-w-6xl" />;

  if (error || !assignment) {
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

  const deadline = new Date(assignment.deadline);
  const deadlineLabel =
    assignment.deadline && !Number.isNaN(deadline.getTime())
      ? format.dateTime(deadline, { dateStyle: "medium", timeStyle: "short" })
      : t("noDeadline");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Button className="w-fit" variant="ghost" asChild>
        <Link href={`/dashboard/student/courses/${id}`}>
          <ArrowLeft data-icon="inline-start" /> {t("backToCourse")}
        </Link>
      </Button>

      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{assignment.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {assignment.description || t("defaultDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            <CalendarDays data-icon="inline-start" /> {deadlineLabel}
          </Badge>
          <Badge variant="outline">
            <Trophy data-icon="inline-start" />
            {t("maximumScore", { score: assignment.maxScore })}
          </Badge>
        </div>
      </header>

      {submission ? <SubmissionStatus submission={submission} /> : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <Card className="min-w-0 [--card-spacing:--spacing(6)]">
          <CardHeader className="border-b">
            <CardDescription>{t("workRequired")}</CardDescription>
            <CardTitle className="text-2xl">{t("briefTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {assignment.instructions ? (
              <RichContent html={assignment.instructions} />
            ) : (
              <p className="text-muted-foreground">{t("noInstructions")}</p>
            )}
          </CardContent>
        </Card>

        <form onSubmit={submit} className="lg:sticky lg:top-24">
          <Card className="[--card-spacing:--spacing(5)]">
            <CardHeader className="border-b">
              <CardDescription>
                {submission ? t("updateProject") : t("sendProject")}
              </CardDescription>
              <CardTitle className="text-xl">{t("submissionDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel
                    htmlFor="file-url"
                    className="[&_svg]:size-4 [&_svg]:text-muted-foreground"
                  >
                    <Link2 /> {t("projectUrl")}
                  </FieldLabel>
                  <Input
                    id="file-url"
                    type="url"
                    value={fileUrl}
                    onChange={(event) => setFileUrl(event.target.value)}
                    placeholder="https://github.com/nama/proyek"
                    required
                  />
                  <FieldDescription>{t("projectUrlDescription")}</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel
                    htmlFor="file-name"
                    className="[&_svg]:size-4 [&_svg]:text-muted-foreground"
                  >
                    <FileText /> {t("projectName")}
                  </FieldLabel>
                  <Input
                    id="file-name"
                    value={fileName}
                    onChange={(event) => setFileName(event.target.value)}
                    placeholder={t("projectNamePlaceholder")}
                    maxLength={255}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel
                    htmlFor="submission-description"
                    className="[&_svg]:size-4 [&_svg]:text-muted-foreground"
                  >
                    <MessageSquareText /> {t("teacherNote")}
                  </FieldLabel>
                  <Textarea
                    id="submission-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t("teacherNotePlaceholder")}
                    rows={6}
                    maxLength={5000}
                  />
                </Field>
                {submission?.fileUrl ? (
                  <Button type="button" variant="outline" asChild>
                    <a href={submission.fileUrl} target="_blank" rel="noreferrer">
                      <ExternalLink data-icon="inline-start" /> {t("openCurrentSubmission")}
                    </a>
                  </Button>
                ) : null}
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <Button type="submit" size="lg" className="w-full" disabled={saving}>
                {saving ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : submission ? (
                  <CheckCircle2 data-icon="inline-start" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                {saving ? t("sending") : submission ? t("updateSubmission") : t("submitProject")}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
