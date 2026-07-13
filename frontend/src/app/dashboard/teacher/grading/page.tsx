"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CheckCircle2, ClipboardCheck, ExternalLink, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { Submission, SubmissionStatus } from "@/lib/types";

type StatusFilter = "all" | SubmissionStatus;

const PAGE_SIZE = 8;

export default function GradingPage() {
  const t = useTranslations("grading");
  const format = useFormatter();
  const [items, setItems] = useState<Submission[] | null>(null);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [score, setScore] = useState(80);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<Submission[]>("/manage/submissions"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("loadError"));
      setItems([]);
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    api
      .get<Submission[]>("/manage/submissions")
      .then((submissions) => {
        if (active) setItems(submissions);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        toast.error(cause instanceof Error ? cause.message : t("loadError"));
        setItems([]);
      });
    return () => {
      active = false;
    };
  }, [t]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return (items ?? []).filter((submission) => {
      const matchesStatus = status === "all" || submission.status === status;
      const matchesSearch =
        !term ||
        submission.student?.name.toLocaleLowerCase().includes(term) ||
        submission.student?.email.toLocaleLowerCase().includes(term) ||
        submission.assignment?.title.toLocaleLowerCase().includes(term) ||
        submission.assignment?.course?.title.toLocaleLowerCase().includes(term) ||
        submission.fileName?.toLocaleLowerCase().includes(term);
      return matchesStatus && Boolean(matchesSearch);
    });
  }, [items, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const visibleItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function grade(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try {
      await api.post<Submission>(`/manage/submissions/${selected.id}/grade`, {
        score,
        feedback,
      });
      toast.success(t("saved"));
      setSelected(null);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("saveError"));
    }
  }

  function openGrading(submission: Submission) {
    setSelected(submission);
    setScore(submission.score ?? 80);
    setFeedback(submission.feedback ?? "");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus((value || "all") as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("filterStatus")}>
            <SelectValue>{t(`statuses.${status}`)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">{t("statuses.all")}</SelectItem>
              <SelectItem value="submitted">{t("statuses.submitted")}</SelectItem>
              <SelectItem value="graded">{t("statuses.graded")}</SelectItem>
              <SelectItem value="passed">{t("statuses.passed")}</SelectItem>
              <SelectItem value="failed">{t("statuses.failed")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {selected ? (
        <Card className="border-2 border-primary/40 shadow-sm">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>
                {t("gradeStudent", { name: selected.student?.name || t("student") })}
              </CardTitle>
              <CardDescription className="mt-1">
                {selected.assignment?.title} · {selected.assignment?.course?.title || t("course")}
              </CardDescription>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}>
              {t("close")}
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={grade}>
              <FieldGroup>
                <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-end">
                  <Field>
                    <FieldLabel htmlFor="score">{t("score")}</FieldLabel>
                    <Input
                      id="score"
                      type="number"
                      min={0}
                      max={100}
                      value={score}
                      onChange={(event) => setScore(Number(event.target.value))}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="feedback">{t("feedback")}</FieldLabel>
                    <Textarea
                      id="feedback"
                      rows={3}
                      placeholder={t("feedbackPlaceholder")}
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                    />
                  </Field>
                  <Button type="submit">
                    <CheckCircle2 data-icon="inline-start" />
                    {t("saveGrade")}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {items === null ? (
        <Skeleton className="h-80" />
      ) : (
        <Card className="overflow-hidden border-2">
          <CardContent className="p-0">
            <Table className="min-w-[980px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-5">{t("student")}</TableHead>
                  <TableHead>{t("assignment")}</TableHead>
                  <TableHead>{t("submittedAt")}</TableHead>
                  <TableHead>{t("submission")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="pr-5 text-right">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleItems.length ? (
                  visibleItems.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="pl-5">
                        <p className="max-w-52 truncate font-semibold">
                          {submission.student?.name || t("student")}
                        </p>
                        <p className="max-w-52 truncate text-xs text-muted-foreground">
                          {submission.student?.email}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-64 truncate font-medium">
                          {submission.assignment?.title || "—"}
                        </p>
                        <p className="max-w-64 truncate text-xs text-muted-foreground">
                          {submission.assignment?.course?.title || t("course")}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format.dateTime(new Date(submission.submittedAt), {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        {submission.fileUrl ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={submission.fileUrl} target="_blank" rel="noreferrer">
                              <FileText data-icon="inline-start" />
                              <span className="max-w-36 truncate">
                                {submission.fileName || t("openFile")}
                              </span>
                              <ExternalLink data-icon="inline-end" />
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={submission.status === "submitted" ? "secondary" : "outline"}
                        >
                          {t(`statuses.${submission.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button
                          variant={selected?.id === submission.id ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => openGrading(submission)}
                        >
                          {t(submission.score === undefined ? "grade" : "editGrade")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-52 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                        <ClipboardCheck className="size-9" />
                        <p className="font-semibold text-foreground">{t("emptyTitle")}</p>
                        <p className="text-xs">{t("emptyDescription")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {items !== null ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t("resultCount", { count: filteredItems.length })}
          </p>
          {totalPages > 1 ? (
            <PaginationControl currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
