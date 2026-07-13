"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ClipboardList, FileQuestion, Layers3, Users } from "lucide-react";
import { toast } from "sonner";
import { CourseEditor } from "@/components/manage/course-editor";
import { AssignmentsTab } from "@/components/manage/course-authoring/assignments-tab";
import { LearnersTab } from "@/components/manage/course-authoring/learners-tab";
import { ModulesTab } from "@/components/manage/course-authoring/modules-tab";
import { QuizzesTab } from "@/components/manage/course-authoring/quizzes-tab";
import {
  EMPTY_ASSIGNMENT,
  EMPTY_MODULE,
  EMPTY_QUIZ,
} from "@/components/manage/course-authoring/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/navigation/back-button";
import { api } from "@/lib/api";
import type { Assignment, Attachment, LearningProgress, Module, Quiz } from "@/lib/types";
import { formatModuleDuration } from "@/lib/duration";

type PublishableResource = "modules" | "quizzes" | "assignments";

type AuthoringWorkspace = {
  modules: Module[];
  quizzes: Quiz[];
  assignments: Assignment[];
  learners: LearningProgress[];
};

async function fetchWorkspace(courseId: string): Promise<AuthoringWorkspace> {
  const [modules, quizzes, assignments, learners] = await Promise.all([
    api.get<Module[]>(`/manage/courses/${courseId}/modules`),
    api.get<Quiz[]>(`/manage/courses/${courseId}/quizzes`),
    api.get<Assignment[]>(`/manage/courses/${courseId}/assignments`),
    api.get<LearningProgress[]>(`/manage/courses/${courseId}/learners`),
  ]);

  return { modules, quizzes, assignments, learners };
}

export default function TeacherCourseAuthoringPage() {
  const t = useTranslations("courseAuthoring");
  const { id: courseId } = useParams<{ id: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [learners, setLearners] = useState<LearningProgress[]>([]);
  const [moduleDraft, setModuleDraft] = useState(EMPTY_MODULE);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [quizDraft, setQuizDraft] = useState(EMPTY_QUIZ);
  const [assignmentDraft, setAssignmentDraft] = useState(EMPTY_ASSIGNMENT);
  const [attachmentModuleId, setAttachmentModuleId] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const loadWorkspace = useCallback(async () => {
    const workspace = await fetchWorkspace(courseId);
    setModules(workspace.modules);
    setQuizzes(workspace.quizzes);
    setAssignments(workspace.assignments);
    setLearners(workspace.learners);
    setAttachmentModuleId((current) => current || workspace.modules[0]?.id || "");
  }, [courseId]);

  useEffect(() => {
    let active = true;

    void fetchWorkspace(courseId)
      .then((workspace) => {
        if (!active) return;
        setModules(workspace.modules);
        setQuizzes(workspace.quizzes);
        setAssignments(workspace.assignments);
        setLearners(workspace.learners);
        setAttachmentModuleId((current) => current || workspace.modules[0]?.id || "");
      })
      .catch((cause: unknown) => {
        if (active) {
          toast.error(cause instanceof Error ? cause.message : t("loadError"));
        }
      });

    return () => {
      active = false;
    };
  }, [courseId, t]);

  async function saveModule(event: React.FormEvent) {
    event.preventDefault();

    try {
      const payload = {
        ...moduleDraft,
        duration: formatModuleDuration(moduleDraft.duration),
      };
      const wasEditing = Boolean(editingModuleId);
      if (editingModuleId) {
        await api.put(`/manage/modules/${editingModuleId}`, payload);
      } else {
        await api.post(`/manage/courses/${courseId}/modules`, payload);
      }

      setModuleDraft({ ...EMPTY_MODULE, order: modules.length + 1 });
      setEditingModuleId(null);
      await loadWorkspace();
      toast.success(wasEditing ? t("moduleUpdated") : t("moduleAdded"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("moduleSaveError"));
    }
  }

  async function addQuiz(event: React.FormEvent) {
    event.preventDefault();

    try {
      await api.post(`/manage/courses/${courseId}/quizzes`, quizDraft);
      setQuizDraft(EMPTY_QUIZ);
      await loadWorkspace();
      toast.success(t("quizAdded"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("quizSaveError"));
    }
  }

  async function addAssignment(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      ...assignmentDraft,
      deadline: assignmentDraft.deadline ? new Date(assignmentDraft.deadline).toISOString() : "",
    };

    try {
      await api.post(`/manage/courses/${courseId}/assignments`, payload);
      setAssignmentDraft(EMPTY_ASSIGNMENT);
      await loadWorkspace();
      toast.success(t("assignmentAdded"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("assignmentSaveError"));
    }
  }

  async function togglePublished(
    kind: PublishableResource,
    resourceId: string,
    isPublished: boolean,
  ) {
    try {
      await api.put(`/manage/${kind}/${resourceId}`, { isPublished });
      await loadWorkspace();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("publishStatusError"));
    }
  }

  async function removeResource(kind: PublishableResource, resourceId: string) {
    if (!window.confirm(t("deleteConfirm"))) return;

    try {
      await api.delete(`/manage/${kind}/${resourceId}`);
      await loadWorkspace();
      toast.success(t("contentDeleted"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("contentDeleteError"));
    }
  }

  async function moveModule(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const reorderedModules = [...modules];
    [reorderedModules[index], reorderedModules[targetIndex]] = [
      reorderedModules[targetIndex],
      reorderedModules[index],
    ];
    setModules(reorderedModules.map((module, position) => ({ ...module, order: position + 1 })));

    try {
      await api.put<void>(`/manage/courses/${courseId}/modules/order`, {
        moduleIds: reorderedModules.map((module) => module.id),
      });
      await loadWorkspace();
    } catch (cause) {
      await loadWorkspace();
      toast.error(cause instanceof Error ? cause.message : t("reorderError"));
    }
  }

  async function addAttachment(event: React.FormEvent) {
    event.preventDefault();
    if (!attachmentModuleId) return;

    try {
      await api.post<Attachment>(`/manage/modules/${attachmentModuleId}/attachments`, {
        name: attachmentName,
        url: attachmentUrl,
        size: 0,
        type: "external/link",
      });
      setAttachmentName("");
      setAttachmentUrl("");
      await loadWorkspace();
      toast.success(t("attachmentAdded"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("attachmentAddError"));
    }
  }

  async function deleteAttachment(attachmentId: string) {
    try {
      await api.delete(`/manage/attachments/${attachmentId}`);
      await loadWorkspace();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("attachmentDeleteError"));
    }
  }

  return (
    <div className="space-y-7">
      <BackButton fallbackHref="/dashboard/teacher/courses" />
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>

      <CourseEditor courseId={courseId} />

      <Tabs defaultValue="modules">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="modules">
            <Layers3 /> {t("tabs.modules")}
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <FileQuestion /> {t("tabs.quizzes")}
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <ClipboardList /> {t("tabs.assignments")}
          </TabsTrigger>
          <TabsTrigger value="learners">
            <Users /> {t("tabs.learners")}
          </TabsTrigger>
        </TabsList>

        <ModulesTab
          courseId={courseId}
          modules={modules}
          draft={moduleDraft}
          editingModuleId={editingModuleId}
          attachmentModuleId={attachmentModuleId}
          attachmentName={attachmentName}
          attachmentUrl={attachmentUrl}
          onDraftChange={setModuleDraft}
          onEditingModuleIdChange={setEditingModuleId}
          onAttachmentModuleIdChange={setAttachmentModuleId}
          onAttachmentNameChange={setAttachmentName}
          onAttachmentUrlChange={setAttachmentUrl}
          onSaveModule={(event) => void saveModule(event)}
          onAddAttachment={(event) => void addAttachment(event)}
          onMoveModule={(index, direction) => void moveModule(index, direction)}
          onTogglePublished={(moduleId, published) =>
            void togglePublished("modules", moduleId, published)
          }
          onRemoveModule={(moduleId) => void removeResource("modules", moduleId)}
          onDeleteAttachment={(attachmentId) => void deleteAttachment(attachmentId)}
        />
        <QuizzesTab
          courseId={courseId}
          quizzes={quizzes}
          draft={quizDraft}
          onDraftChange={setQuizDraft}
          onSubmit={(event) => void addQuiz(event)}
          onTogglePublished={(quizId, published) =>
            void togglePublished("quizzes", quizId, published)
          }
          onRemove={(quizId) => void removeResource("quizzes", quizId)}
        />
        <AssignmentsTab
          courseId={courseId}
          assignments={assignments}
          draft={assignmentDraft}
          onDraftChange={setAssignmentDraft}
          onSubmit={(event) => void addAssignment(event)}
          onTogglePublished={(assignmentId, published) =>
            void togglePublished("assignments", assignmentId, published)
          }
          onRemove={(assignmentId) => void removeResource("assignments", assignmentId)}
        />
        <LearnersTab learners={learners} />
      </Tabs>
    </div>
  );
}
