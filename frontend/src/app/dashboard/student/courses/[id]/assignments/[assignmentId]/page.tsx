"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Loader2,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { stripHtml, RichContent } from "@/lib/html-utils";

export default function AssignmentSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const assignmentId = params.assignmentId as string;

  const [course, setCourse] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fileUrl, setFileUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, assignmentsData, submissionsData] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/courses/${courseId}/assignments`),
          api.get(`/submissions`).catch(() => [])
        ]);

        setCourse(courseData);
        
        const currentAssignment = assignmentsData?.find((a: any) => a.id === assignmentId);
        setAssignment(currentAssignment || null);

        // Find if already submitted
        if (submissionsData && Array.isArray(submissionsData)) {
          const existingSubmission = submissionsData.find((s: any) => s.assignmentId === assignmentId);
          if (existingSubmission) {
            setSubmission(existingSubmission);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data tugas", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) {
      toast.error("Tautan file tidak boleh kosong");
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.post(`/assignments/${assignmentId}/submit`, {
        fileUrl,
        description,
      });
      setSubmission(result);
      toast.success("Tugas berhasil dikumpulkan!");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengumpulkan tugas");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course || !assignment) {
    return (
      <div className="text-center py-16">
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Tugas tidak ditemukan</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={`/dashboard/student/courses/${courseId}`}>Kembali ke Kursus</Link>
        </Button>
      </div>
    );
  }

  const isGraded = submission && submission.status === "passed" || submission?.status === "failed" || submission?.score > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">{course.title}</p>
          <h1 className="text-xl font-bold">{assignment.title}</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Detail Tugas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Deskripsi</h3>
                <p className="text-sm text-muted-foreground">{stripHtml(assignment.description)}</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-1">Instruksi</h3>
                <RichContent html={assignment.instructions || ""} />
              </div>
            </CardContent>
          </Card>

          {submission ? (
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  <div>
                    <CardTitle className="text-emerald-700 dark:text-emerald-400">Tugas Telah Dikumpulkan</CardTitle>
                    <CardDescription className="text-emerald-600/80 dark:text-emerald-400/80">
                      Disubmit pada {new Date(submission.submittedAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-muted-foreground">Tautan Tugas</Label>
                  <div className="flex items-center gap-2 mt-1 p-3 rounded-lg bg-accent/50">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline font-medium truncate">
                      {submission.fileUrl}
                    </a>
                  </div>
                </div>

                {submission.description && (
                  <div>
                    <Label className="text-muted-foreground">Catatan Tambahan</Label>
                    <div className="mt-1 p-3 rounded-lg bg-accent/50">
                      <p className="text-sm">{submission.description}</p>
                    </div>
                  </div>
                )}

                {isGraded && (
                  <div className="mt-6 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                    <h3 className="font-semibold text-lg flex items-center justify-between">
                      Nilai Tugas
                      <span className="text-2xl font-bold text-primary">{submission.score || 0}/{assignment.maxScore || 100}</span>
                    </h3>
                    {submission.feedback && (
                      <div className="mt-3 pt-3 border-t border-primary/10">
                        <p className="text-sm font-medium mb-1">Komentar Pengajar:</p>
                        <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Kumpulkan Tugas</CardTitle>
                <CardDescription>Masukkan tautan hasil kerja Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fileUrl">Tautan File (Google Drive, Github, dll) <span className="text-red-500">*</span></Label>
                    <Input 
                      id="fileUrl" 
                      placeholder="https://..." 
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      required
                    />
                  </div>
                  

                  <div className="space-y-2">
                    <Label htmlFor="description">Catatan Tambahan (Opsional)</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Tambahkan pesan untuk pengajar..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2 gradient-primary" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Kumpulkan Tugas
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informasi Tenggat Waktu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-500">
                    Batas Pengumpulan
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {new Date(assignment.deadline).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(assignment.deadline).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Nilai Maksimal</span>
                  <span className="font-bold">{assignment.maxScore || 100} Poin</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  {submission ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">Disubmit</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600">Belum Disubmit</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
