"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import type { Module } from "@/lib/types";
import type { ModuleDraft } from "./types";
import { resourceUrl } from "@/lib/resource-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";

type ModulesTabProps = {
  courseId: string;
  modules: Module[];
  draft: ModuleDraft;
  editingModuleId: string | null;
  attachmentModuleId: string;
  attachmentName: string;
  attachmentUrl: string;
  onDraftChange: (draft: ModuleDraft) => void;
  onEditingModuleIdChange: (moduleId: string | null) => void;
  onAttachmentModuleIdChange: (moduleId: string) => void;
  onAttachmentNameChange: (name: string) => void;
  onAttachmentUrlChange: (url: string) => void;
  onSaveModule: (event: React.FormEvent) => void;
  onAddAttachment: (event: React.FormEvent) => void;
  onMoveModule: (index: number, direction: -1 | 1) => void;
  onTogglePublished: (moduleId: string, published: boolean) => void;
  onRemoveModule: (moduleId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
};

const PAGE_SIZE = 6;

export function ModulesTab({
  courseId,
  modules,
  onMoveModule,
  onTogglePublished,
  onRemoveModule,
  onDeleteAttachment,
}: ModulesTabProps) {
  const t = useTranslations("authoringModules");
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(modules.length / PAGE_SIZE));
  const visibleModules = modules.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const firstIndex = (page - 1) * PAGE_SIZE;

  return (
    <TabsContent value="modules" className="mt-5 flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-extrabold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/teacher/materials">{t("manageAll")}</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/teacher/materials/create?courseId=${courseId}`}>
              <Plus data-icon="inline-start" /> {t("addModule")}
            </Link>
          </Button>
        </div>
      </div>

      {visibleModules.map((module, visibleIndex) => {
        const index = firstIndex + visibleIndex;
        return (
          <Card key={module.id}>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={module.isPublished ? "secondary" : "outline"}>
                    {module.isPublished ? t("published") : t("draft")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("order", { order: module.order })}
                  </span>
                </div>
                <CardTitle className="mt-2 truncate">{module.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {module.duration || t("noDuration")} ·{" "}
                  {t("attachments", { count: module.attachments?.length || 0 })}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon-sm" variant="ghost" asChild>
                  <Link
                    href={`/dashboard/teacher/materials/${module.id}/edit?courseId=${courseId}`}
                    aria-label={t("editAria", { title: module.title })}
                  >
                    <Pencil />
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => onMoveModule(index, -1)}
                  aria-label={t("moveUp")}
                >
                  <ArrowUp />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={index === modules.length - 1}
                  onClick={() => onMoveModule(index, 1)}
                  aria-label={t("moveDown")}
                >
                  <ArrowDown />
                </Button>
                <Button
                  size="icon-sm"
                  variant="destructive"
                  onClick={() => onRemoveModule(module.id)}
                  aria-label={t("deleteAria", { title: module.title })}
                >
                  <Trash2 />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold">{t("showToStudents")}</span>
                <Switch
                  checked={module.isPublished}
                  onCheckedChange={(checked) => onTogglePublished(module.id, checked)}
                />
              </div>
              {module.attachments?.length ? (
                <div className="flex flex-col gap-2">
                  {module.attachments.slice(0, 3).map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 text-sm"
                    >
                      <FileText className="text-primary" />
                      <a
                        href={resourceUrl(attachment.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate font-medium hover:text-primary"
                      >
                        {attachment.name}
                      </a>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => onDeleteAttachment(attachment.id)}
                        aria-label={t("deleteAttachmentAria", { name: attachment.name })}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  {module.attachments.length > 3 ? (
                    <p className="text-xs text-muted-foreground">
                      {t("moreAttachments", { count: module.attachments.length - 3 })}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {modules.length > PAGE_SIZE ? (
        <div className="flex justify-end pt-2">
          <PaginationControl currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ) : null}
    </TabsContent>
  );
}
