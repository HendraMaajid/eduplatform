"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, FileText, Download, Clock, CheckCircle2, XCircle, Star, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{className?: string}> }> = {
  submitted: { label: "Menunggu", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  graded: { label: "Dinilai", className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Star },
  passed: { label: "Lulus", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  failed: { label: "Tidak Lulus", className: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
};

export default function TeacherGradingPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [gradingOpen, setGradingOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  const fetchSubmissions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.get("/submissions/teacher");
      setSubmissions(data || []);
    } catch (error) {
      console.error("Failed to fetch teacher submissions", error);
      toast.error("Gagal memuat data penilaian");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleGrade = async () => {
    if (!score) { toast.error("Masukkan skor!"); return; }
    try {
      await api.post(`/submissions/${selectedSubmission?.id}/grade`, {
        score: Number(score),
        feedback: feedback
      });
      toast.success(`Berhasil menilai tugas ${selectedSubmission?.student?.name} dengan skor ${score}`);
      setGradingOpen(false);
      setScore("");
      setFeedback("");
      fetchSubmissions(true);
    } catch (error) {
      console.error("Failed to grade", error);
      toast.error("Gagal mengirim penilaian");
    }
  };

  const openGrading = (sub: any) => {
    setSelectedSubmission(sub);
    setScore(sub.score?.toString() || "");
    setFeedback(sub.feedback || "");
    setGradingOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.status === "submitted");
  const gradedSubmissions = submissions.filter(s => s.status !== "submitted");

  const groupSubmissionsByCourse = (subs: any[]) => {
    return subs.reduce((acc, sub) => {
      const courseTitle = sub.assignment?.course?.title || "Lainnya";
      if (!acc[courseTitle]) acc[courseTitle] = [];
      acc[courseTitle].push(sub);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const pendingByCourse = groupSubmissionsByCourse(pendingSubmissions);
  const gradedByCourse = groupSubmissionsByCourse(gradedSubmissions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Penilaian</h1>
        <p className="text-muted-foreground">Nilai tugas dan project siswa</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-3 w-3" /> Menunggu
            <Badge variant="secondary" className="h-5 min-w-5 text-xs">{pendingSubmissions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="graded" className="gap-2">
            <CheckCircle2 className="h-3 w-3" /> Sudah Dinilai
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6 mt-4">
          {Object.keys(pendingByCourse).length > 0 ? (Object.entries(pendingByCourse) as [string, any[]][]).map(([courseName, subs]) => (
            <div key={courseName} className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> {courseName}
              </h2>
              {subs.map((sub) => (
                <Card key={sub.id} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={sub.student?.avatar} />
                        <AvatarFallback className="gradient-primary text-white">{sub.student?.name?.slice(0, 2).toUpperCase() || "S"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{sub.student?.name || "Siswa"}</h3>
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            <Clock className="h-3 w-3 mr-1" /> Menunggu Penilaian
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">Tugas: {sub.assignment?.title}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Dikumpulkan {new Date(sub.createdAt).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        {sub.description && (
                          <p className="text-sm text-muted-foreground mt-2 bg-accent/50 p-3 rounded-lg">{sub.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button size="sm" className="gap-1" onClick={() => openGrading(sub)}>
                        <ClipboardCheck className="h-3 w-3" /> Nilai
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada tugas yang menunggu penilaian.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="graded" className="space-y-6 mt-4">
          {Object.keys(gradedByCourse).length > 0 ? (Object.entries(gradedByCourse) as [string, any[]][]).map(([courseName, subs]) => (
            <div key={courseName} className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> {courseName}
              </h2>
              {subs.map((sub) => {
                const status = statusConfig[sub.status] || statusConfig.graded;
                const StatusIcon = status.icon;
                return (
                  <Card key={sub.id} className="border-0 shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={sub.student?.avatar} />
                          <AvatarFallback className="gradient-primary text-white">{sub.student?.name?.slice(0, 2).toUpperCase() || "S"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{sub.student?.name || "Siswa"}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-primary">{sub.score}/{sub.assignment?.maxScore || 100}</span>
                              <Badge variant="outline" className={status.className}>
                                <StatusIcon className="h-3 w-3 mr-1" /> {status.label}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">Tugas: {sub.assignment?.title}</p>
                          {sub.feedback && (
                            <p className="text-sm mt-2 bg-accent/50 p-3 rounded-lg">{sub.feedback}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada tugas yang dinilai.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Grading Dialog */}
      <Dialog open={gradingOpen} onOpenChange={setGradingOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nilai Tugas</DialogTitle>
            <DialogDescription>Berikan penilaian untuk {selectedSubmission?.student?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-accent/50 p-3">
              <p className="text-sm font-medium">Link Tautan Tugas</p>
              <a href={selectedSubmission?.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline font-medium truncate block mt-1">
                {selectedSubmission?.fileUrl}
              </a>
              {selectedSubmission?.description && (
                <p className="text-xs text-muted-foreground mt-1">{selectedSubmission.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Skor (0-{selectedSubmission?.assignment?.maxScore || 100})</Label>
              <Input type="number" min="0" max={selectedSubmission?.assignment?.maxScore || 100} value={score} onChange={(e) => setScore(e.target.value)} placeholder="Masukkan skor..." />
            </div>
            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Berikan feedback untuk siswa..." rows={4} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setGradingOpen(false)}>Batal</Button>
            <Button onClick={handleGrade} className="gradient-primary text-white">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Simpan Nilai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
