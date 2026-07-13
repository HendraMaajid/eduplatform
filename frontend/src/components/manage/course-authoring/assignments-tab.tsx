"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import type { Assignment } from "@/lib/types";
import type { AssignmentDraft } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";

type AssignmentsTabProps = {
  courseId: string;
  assignments: Assignment[];
  draft: AssignmentDraft;
  onDraftChange: (draft: AssignmentDraft) => void;
  onSubmit: (event: React.FormEvent) => void;
  onTogglePublished: (assignmentId: string, published: boolean) => void;
  onRemove: (assignmentId: string) => void;
};

const PAGE_SIZE = 6;

export function AssignmentsTab({
  courseId,
  assignments,
  onTogglePublished,
  onRemove,
}: AssignmentsTabProps) {
  const t = useTranslations("authoringAssignments");
  const format = useFormatter();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(assignments.length / PAGE_SIZE));
  const visibleAssignments = assignments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <TabsContent value="assignments" className="mt-5 flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-extrabold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/teacher/materials/create?courseId=${courseId}&type=assignment`}>
            <Plus data-icon="inline-start" /> {t("addAssignment")}
          </Link>
        </Button>
      </div>
      {visibleAssignments.map((assignment) => (
        <Card key={assignment.id}>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <Badge variant={assignment.isPublished ? "secondary" : "outline"}>
                {assignment.isPublished ? t("published") : t("draft")}
              </Badge>
              <CardTitle className="mt-2">{assignment.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("deadline", {
                  date: format.dateTime(new Date(assignment.deadline), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                })}
              </p>
            </div>
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => onRemove(assignment.id)}
              aria-label={t("deleteAria", { title: assignment.title })}
            >
              <Trash2 />
            </Button>
          </CardHeader>
          <CardContent className="flex items-center justify-between border-t pt-4">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardList /> {t("showToStudents")}
            </span>
            <Switch
              checked={assignment.isPublished}
              onCheckedChange={(checked) => onTogglePublished(assignment.id, checked)}
            />
          </CardContent>
        </Card>
      ))}
      {assignments.length > PAGE_SIZE ? (
        <div className="flex justify-end">
          <PaginationControl currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ) : null}
    </TabsContent>
  );
}
