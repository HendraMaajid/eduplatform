"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen, FileText, HelpCircle, FolderGit2,
  CheckCircle2, Circle, Play, Clock, ArrowLeft,
  ChevronRight, Lock, Loader2, RotateCcw, Trophy, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { stripHtml, RichContent } from "@/lib/html-utils";

export default function StudentCourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizAttempts, setQuizAttempts] = useState<Record<string, any>>({});
  
  const [selectedModule, setSelectedModule] = useState("");

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const [courseData, modulesData, quizzesData, assignmentsData, submissionsData, enrollmentsData] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/courses/${courseId}/modules`),
          api.get(`/courses/${courseId}/quizzes`).catch(() => []), // Ignore error if not implemented
          api.get(`/courses/${courseId}/assignments`).catch(() => []),
          api.get(`/submissions`).catch(() => []),
          api.get(`/enrollments`).catch(() => []),
        ]);
        
        setCourse(courseData);
        setModules(modulesData || []);
        setQuizzes(quizzesData || []);
        setAssignments(assignmentsData || []);
        setSubmissions(submissionsData || []);
        
        if (enrollmentsData && Array.isArray(enrollmentsData)) {
          const courseEnrollment = enrollmentsData.find(e => e.courseId === courseId);
          setEnrollment(courseEnrollment);
        }
        
        if (modulesData && modulesData.length > 0) {
          setSelectedModule(modulesData[0].id);
        }

        // Fetch quiz attempts for each quiz
        if (quizzesData && Array.isArray(quizzesData)) {
          const attemptsMap: Record<string, any> = {};
          await Promise.all(
            quizzesData.map(async (quiz: any) => {
              try {
                const attempt = await api.get(`/quizzes/${quiz.id}/attempt`);
                if (attempt) attemptsMap[quiz.id] = attempt;
              } catch {
                // No attempt yet
              }
            })
          );
          setQuizAttempts(attemptsMap);
        }
      } catch (error) {
        console.error("Failed to fetch course details", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId]);

  const currentModule = modules.find((m) => m.id === selectedModule);
  
  const completedModules: string[] = enrollment?.completedModules || []; 
  const progress = enrollment?.progress || 0;

  const handleCompleteModule = async (moduleId: string) => {
    try {
      const updatedEnrollment = await api.post(`/courses/${courseId}/modules/${moduleId}/complete`, {});
      setEnrollment(updatedEnrollment);
    } catch (error) {
      console.error("Gagal menandai modul selesai", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Kursus tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/student/courses"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-sm text-muted-foreground">oleh {course.teacher?.name || "Pengajar"}</p>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Progress:</span>
            <Progress value={progress} className="w-32 h-2" />
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          {enrollment && enrollment.status === "active" && progress >= 100 && (
            <Button
              size="sm"
              className="gradient-primary text-white shadow-md shadow-primary/20"
              onClick={async () => {
                try {
                  await api.post(`/courses/${courseId}/certificates`, {});
                  toast.success("Sertifikat berhasil diterbitkan! 🎉");
                  // Re-fetch enrollment data silently
                  const enrollmentsData = await api.get("/enrollments");
                  if (Array.isArray(enrollmentsData)) {
                    const updated = enrollmentsData.find((e: any) => e.courseId === courseId);
                    setEnrollment(updated);
                  }
                } catch (err: any) {
                  toast.error(err.message || "Gagal menerbitkan sertifikat");
                }
              }}
            >
              Klaim Sertifikat
            </Button>
          )}
          {enrollment?.status === "certified" && (
            <Button size="sm" variant="outline" className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50" asChild>
              <Link href="/dashboard/student/certificates">
                Lihat Sertifikat
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules" className="gap-1.5"><FileText className="h-3 w-3" /> Materi ({modules.length})</TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-1.5"><HelpCircle className="h-3 w-3" /> Kuis ({quizzes.length})</TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1.5"><FolderGit2 className="h-3 w-3" /> Tugas ({assignments.length})</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="mt-4">
          <div className="grid lg:grid-cols-[300px_1fr] gap-6">
            {/* Module List Sidebar */}
            <Card className="border-0 shadow-md h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Daftar Modul</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="max-h-[500px]">
                  {modules.length === 0 && (
                    <p className="text-sm text-muted-foreground p-3 text-center">Belum ada modul</p>
                  )}
                  {modules.map((mod, idx) => {
                    const isCompleted = completedModules.includes(mod.id);
                    const isActive = selectedModule === mod.id;
                    const isLocked = false; // Mocked logic: all unlocked for now
                    return (
                      <button
                        key={mod.id}
                        onClick={() => !isLocked && setSelectedModule(mod.id)}
                        disabled={isLocked}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                          isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-accent/50"
                        } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="shrink-0">
                          {isLocked ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>
                            {idx + 1}. {mod.title}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {mod.duration || "10 menit"}
                          </p>
                        </div>
                        {isActive && <ChevronRight className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Module Content */}
            <Card className="border-0 shadow-md">
              {currentModule ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className="text-xs mb-2">
                          Modul {modules.findIndex((m) => m.id === currentModule.id) + 1}
                        </Badge>
                        <CardTitle className="text-xl">{currentModule.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{stripHtml(currentModule.description)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="py-6">
                    <RichContent html={currentModule.content || ""} />

                    {currentModule.attachments?.length > 0 && (
                      <div className="mt-6 p-4 rounded-lg bg-accent/50">
                        <p className="text-sm font-medium mb-2">Lampiran:</p>
                        {currentModule.attachments.map((att: any) => (
                          <Button key={att.id} variant="outline" size="sm" className="gap-2">
                            <FileText className="h-3 w-3" /> {att.name}
                          </Button>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" disabled={modules.findIndex(m => m.id === selectedModule) === 0}
                        onClick={() => {
                          const idx = modules.findIndex(m => m.id === selectedModule);
                          if (idx > 0) setSelectedModule(modules[idx - 1].id);
                        }}>
                        Sebelumnya
                      </Button>
                      <div className="flex gap-2">
                        {!completedModules.includes(currentModule.id) && (
                          <Button
                            variant="outline"
                            className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            onClick={() => handleCompleteModule(currentModule.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Tandai Selesai
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            if (!completedModules.includes(currentModule.id)) {
                              handleCompleteModule(currentModule.id);
                            }
                            const idx = modules.findIndex(m => m.id === selectedModule);
                            if (idx < modules.length - 1) setSelectedModule(modules[idx + 1].id);
                          }}
                          disabled={modules.findIndex(m => m.id === selectedModule) === modules.length - 1}
                          className="gradient-primary text-white">
                          Selanjutnya
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="py-16 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{modules.length > 0 ? "Pilih modul untuk mulai belajar" : "Modul belum tersedia"}</p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="mt-4 space-y-4">
          {quizzes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              <p>Belum ada kuis untuk kursus ini</p>
            </div>
          ) : (
            quizzes.map((quiz) => {
              const attempt = quizAttempts[quiz.id];
              const hasAttempt = !!attempt;
              const quizScore = hasAttempt && attempt.totalPoints > 0
                ? Math.round((attempt.score / attempt.totalPoints) * 100)
                : 0;
              const isPassed = hasAttempt && quizScore >= (quiz.passingScore || 70);

              return (
                <Card key={quiz.id} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{quiz.title}</h3>
                          {hasAttempt && (
                            <Badge
                              variant="outline"
                              className={isPassed
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : "bg-red-500/10 text-red-600 border-red-500/30"
                              }
                            >
                              {isPassed ? "Lulus" : "Belum Lulus"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{stripHtml(quiz.description)}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{quiz.questions?.length || 0} soal</span>
                          <span>Waktu: {quiz.timeLimit || 0} menit</span>
                          <span>Skor minimum: {quiz.passingScore || 0}%</span>
                        </div>
                        {hasAttempt && (
                          <div className={`flex items-center gap-2 mt-2 text-sm font-medium ${
                            isPassed ? "text-emerald-600" : "text-red-500"
                          }`}>
                            {isPassed ? (
                              <Trophy className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            Skor terakhir: {quizScore}%
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={hasAttempt ? "outline" : "default"}
                        className={`gap-1 shrink-0 ${!hasAttempt ? "gradient-primary text-white" : ""}`}
                        asChild
                      >
                        <Link href={`/dashboard/student/courses/${courseId}/quiz/${quiz.id}`}>
                          {hasAttempt ? (
                            <><RotateCcw className="h-3 w-3" /> Coba Lagi</>
                          ) : (
                            <><Play className="h-3 w-3" /> Mulai Kuis</>
                          )}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-4 space-y-4">
          {assignments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              <p>Belum ada tugas untuk kursus ini</p>
            </div>
          ) : (
            assignments.map((assignment) => {
              const submission = submissions.find(s => s.assignmentId === assignment.id);
              const isGraded = submission && (submission.status === "passed" || submission.status === "failed" || submission.status === "graded" || submission.score > 0);
              const isSubmitted = submission && submission.status === "submitted";

              return (
                <Card key={assignment.id} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {isGraded ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">Dinilai</Badge>
                          ) : isSubmitted ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600">Menunggu Penilaian</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600">Belum Disubmit</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs font-normal">
                            Deadline: {new Date(assignment.deadline).toLocaleDateString("id-ID")}
                          </Badge>
                        </div>
                        <h3 className="font-semibold">{assignment.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{stripHtml(assignment.description)}</p>
                      </div>
                      <Button size="sm" variant={isSubmitted || isGraded ? "outline" : "default"} className={`shrink-0 ${(!isSubmitted && !isGraded) ? "gradient-primary text-white" : ""}`} asChild>
                        <Link href={`/dashboard/student/courses/${courseId}/assignments/${assignment.id}`}>
                          Lihat Tugas
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
