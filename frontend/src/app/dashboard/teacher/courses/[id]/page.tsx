"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  BookOpen, FileText, HelpCircle, FolderGit2,
  Users, Plus, ArrowLeft, Pencil, Eye, Trash2,
  Clock, MoreHorizontal, GripVertical, Loader2
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  // Modals state
  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  // Form states
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", content: "", duration: "", order: 1, isPublished: false });
  const [quizForm, setQuizForm] = useState({ title: "", description: "", passingScore: 70, timeLimit: 30 });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", description: "", instructions: "", deadline: "", maxScore: 100 });

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [courseData, modulesData, quizzesData, assignmentsData, enrollmentsData] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/modules`),
        api.get(`/courses/${courseId}/quizzes`),
        api.get(`/courses/${courseId}/assignments`),
        api.get(`/courses/${courseId}/enrollments`)
      ]);
      setCourse(courseData);
      setModules(modulesData);
      setQuizzes(quizzesData);
      setAssignments(assignmentsData);
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error("Error fetching course details:", error);
      if (!silent) toast.error("Gagal memuat detail kursus");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  // MODULE HANDLERS
  const handleSaveModule = async () => {
    try {
      if (editingModule) {
        await api.put(`/modules/${editingModule.id}`, moduleForm);
        toast.success("Modul berhasil diubah");
      } else {
        await api.post(`/courses/${courseId}/modules`, moduleForm);
        toast.success("Modul berhasil ditambahkan");
      }
      setIsModuleOpen(false);
      fetchData(true);
    } catch (error) {
      toast.error("Gagal menyimpan modul");
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus modul ini?")) {
      try {
        await api.delete(`/modules/${id}`);
        toast.success("Modul dihapus");
        fetchData(true);
      } catch (error) {
        toast.error("Gagal menghapus modul");
      }
    }
  };

  // QUIZ HANDLERS
  const handleSaveQuiz = async () => {
    try {
      if (editingQuiz) {
        await api.put(`/quizzes/${editingQuiz.id}`, { ...quizForm, passingScore: Number(quizForm.passingScore), timeLimit: Number(quizForm.timeLimit) });
        toast.success("Kuis berhasil diubah");
      } else {
        await api.post(`/courses/${courseId}/quizzes`, { ...quizForm, passingScore: Number(quizForm.passingScore), timeLimit: Number(quizForm.timeLimit) });
        toast.success("Kuis berhasil ditambahkan");
      }
      setIsQuizOpen(false);
      fetchData(true);
    } catch (error) {
      toast.error("Gagal menyimpan kuis");
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kuis ini?")) {
      try {
        await api.delete(`/quizzes/${id}`);
        toast.success("Kuis dihapus");
        fetchData(true);
      } catch (error) {
        toast.error("Gagal menghapus kuis");
      }
    }
  };

  // ASSIGNMENT HANDLERS
  const handleSaveAssignment = async () => {
    try {
      if (editingAssignment) {
        await api.put(`/assignments/${editingAssignment.id}`, { ...assignmentForm, maxScore: Number(assignmentForm.maxScore) });
        toast.success("Tugas berhasil diubah");
      } else {
        await api.post(`/courses/${courseId}/assignments`, { ...assignmentForm, maxScore: Number(assignmentForm.maxScore) });
        toast.success("Tugas berhasil ditambahkan");
      }
      setIsAssignmentOpen(false);
      fetchData(true);
    } catch (error) {
      toast.error("Gagal menyimpan tugas");
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
      try {
        await api.delete(`/assignments/${id}`);
        toast.success("Tugas dihapus");
        fetchData(true);
      } catch (error) {
        toast.error("Gagal menghapus tugas");
      }
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!course) return <div className="text-center py-16 text-muted-foreground">Kursus tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/teacher/courses"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{course.title}</h1>
          <p className="text-sm text-muted-foreground">{course.category || "Umum"} • {course.duration || "Bebas"}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Modul", value: modules.length, icon: FileText, color: "text-indigo-500" },
          { label: "Kuis", value: quizzes.length, icon: HelpCircle, color: "text-violet-500" },
          { label: "Tugas", value: assignments.length, icon: FolderGit2, color: "text-purple-500" },
          { label: "Siswa", value: enrollments.length, icon: Users, color: "text-emerald-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules" className="gap-1.5"><FileText className="h-3 w-3" /> Modul</TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-1.5"><HelpCircle className="h-3 w-3" /> Kuis</TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1.5"><FolderGit2 className="h-3 w-3" /> Tugas</TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5"><Users className="h-3 w-3" /> Siswa</TabsTrigger>
        </TabsList>

        {/* Modules */}
        <TabsContent value="modules" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-primary text-white gap-2" size="sm" onClick={() => {
              setEditingModule(null);
              setModuleForm({ title: "", description: "", content: "", duration: "", order: modules.length + 1, isPublished: false });
              setIsModuleOpen(true);
            }}>
              <Plus className="h-4 w-4" /> Tambah Modul
            </Button>
          </div>
          {modules.sort((a, b) => a.order - b.order).map((mod) => (
            <Card key={mod.id} className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab shrink-0" />
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-primary">{mod.order}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{mod.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <Clock className="h-3 w-3" /> {mod.duration || "Bebas"}
                  </p>
                </div>
                <Badge variant={mod.isPublished ? "default" : "secondary"}>
                  {mod.isPublished ? "Aktif" : "Draft"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2" onClick={() => {
                      setEditingModule(mod);
                      setModuleForm({ title: mod.title, description: mod.description || "", content: mod.content || "", duration: mod.duration || "", order: mod.order, isPublished: mod.isPublished });
                      setIsModuleOpen(true);
                    }}>
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteModule(mod.id)}>
                      <Trash2 className="h-4 w-4" /> Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
          {modules.length === 0 && <div className="text-center py-8 text-muted-foreground">Belum ada modul</div>}
        </TabsContent>

        {/* Quizzes */}
        <TabsContent value="quizzes" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-primary text-white gap-2" size="sm" onClick={() => {
              setEditingQuiz(null);
              setQuizForm({ title: "", description: "", passingScore: 70, timeLimit: 30 });
              setIsQuizOpen(true);
            }}>
              <Plus className="h-4 w-4" /> Tambah Kuis
            </Button>
          </div>
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="border-0 shadow-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{quiz.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{quiz.questions?.length || 0} soal</span>
                    <span>{quiz.timeLimit} menit</span>
                    <span>Min. skor: {quiz.passingScore}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" asChild>
                    <Link href={`/dashboard/teacher/courses/${courseId}/quiz/${quiz.id}`}>
                      <HelpCircle className="h-3 w-3" /> Kelola Soal
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                    setEditingQuiz(quiz);
                    setQuizForm({ title: quiz.title, description: quiz.description || "", passingScore: quiz.passingScore, timeLimit: quiz.timeLimit });
                    setIsQuizOpen(true);
                  }}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteQuiz(quiz.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {quizzes.length === 0 && <div className="text-center py-8 text-muted-foreground">Belum ada kuis</div>}
        </TabsContent>

        {/* Assignments */}
        <TabsContent value="assignments" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button className="gradient-primary text-white gap-2" size="sm" onClick={() => {
              setEditingAssignment(null);
              setAssignmentForm({ title: "", description: "", instructions: "", deadline: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0], maxScore: 100 });
              setIsAssignmentOpen(true);
            }}>
              <Plus className="h-4 w-4" /> Tambah Tugas
            </Button>
          </div>
          {assignments.map((a) => (
            <Card key={a.id} className="border-0 shadow-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{a.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>Deadline: {new Date(a.deadline).toLocaleDateString("id-ID")}</span>
                    <span>Maks skor: {a.maxScore}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                    setEditingAssignment(a);
                    setAssignmentForm({ title: a.title, description: a.description || "", instructions: a.instructions || "", deadline: new Date(a.deadline).toISOString().split('T')[0], maxScore: a.maxScore });
                    setIsAssignmentOpen(true);
                  }}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAssignment(a.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {assignments.length === 0 && <div className="text-center py-8 text-muted-foreground">Belum ada tugas</div>}
        </TabsContent>

        {/* Students */}
        <TabsContent value="students" className="mt-4 space-y-4">
          {enrollments.map((e) => (
            <Card key={e.id} className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={e.student?.avatar} />
                  <AvatarFallback className="gradient-primary text-white text-xs">{e.student?.name?.slice(0, 2).toUpperCase() || "S"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{e.student?.name || "Siswa"}</p>
                  <p className="text-xs text-muted-foreground">{e.student?.email || "Email"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{e.progress || 0}%</p>
                    <Progress value={e.progress || 0} className="w-20 h-1.5" />
                  </div>
                  <Badge variant="outline" className={
                    e.status === "certified" ? "bg-amber-500/10 text-amber-600" :
                    e.status === "completed" ? "bg-emerald-500/10 text-emerald-600" :
                    "bg-blue-500/10 text-blue-600"
                  }>
                    {e.status === "certified" ? "Bersertifikat" : e.status === "completed" ? "Selesai" : "Aktif"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {enrollments.length === 0 && <div className="text-center py-8 text-muted-foreground">Belum ada siswa terdaftar</div>}
        </TabsContent>
      </Tabs>

      {/* Module Modal */}
      <Dialog open={isModuleOpen} onOpenChange={setIsModuleOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Modul" : "Tambah Modul"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Judul Modul</Label>
              <Input value={moduleForm.title} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} placeholder="Judul Modul" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Singkat</Label>
              <Input value={moduleForm.description} onChange={e => setModuleForm({...moduleForm, description: e.target.value})} placeholder="Deskripsi" />
            </div>
            <div className="space-y-2">
              <Label>Konten</Label>
              <ReactQuill theme="snow" value={moduleForm.content} onChange={val => setModuleForm({...moduleForm, content: val})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durasi (mis: 10 menit)</Label>
                <Input value={moduleForm.duration} onChange={e => setModuleForm({...moduleForm, duration: e.target.value})} placeholder="Durasi" />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input type="number" value={moduleForm.order} onChange={e => setModuleForm({...moduleForm, order: Number(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status Modul</Label>
              <Select value={moduleForm.isPublished ? "true" : "false"} onValueChange={(val) => setModuleForm({ ...moduleForm, isPublished: val === "true" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status">
                    {moduleForm.isPublished ? "Aktif (Published)" : "Draft"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false" aria-label="Draft">Draft</SelectItem>
                  <SelectItem value="true" aria-label="Aktif (Published)">Aktif (Published)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModuleOpen(false)}>Batal</Button>
            <Button onClick={handleSaveModule} className="gradient-primary text-white">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Modal */}
      <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Edit Kuis" : "Tambah Kuis"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Judul Kuis</Label>
              <Input value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} placeholder="Judul Kuis" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <ReactQuill theme="snow" value={quizForm.description} onChange={val => setQuizForm({...quizForm, description: val})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Passing Score (%)</Label>
                <Input type="number" min="0" max="100" value={quizForm.passingScore} onChange={e => setQuizForm({...quizForm, passingScore: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Batas Waktu (Menit)</Label>
                <Input type="number" value={quizForm.timeLimit} onChange={e => setQuizForm({...quizForm, timeLimit: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuizOpen(false)}>Batal</Button>
            <Button onClick={handleSaveQuiz} className="gradient-primary text-white">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Modal */}
      <Dialog open={isAssignmentOpen} onOpenChange={setIsAssignmentOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Edit Tugas" : "Tambah Tugas"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Judul Tugas</Label>
              <Input value={assignmentForm.title} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} placeholder="Judul Tugas" />
            </div>
            <div className="space-y-2">
              <Label>Instruksi</Label>
              <ReactQuill theme="snow" value={assignmentForm.instructions} onChange={val => setAssignmentForm({...assignmentForm, instructions: val})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={assignmentForm.deadline} onChange={e => setAssignmentForm({...assignmentForm, deadline: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Skor Maksimal</Label>
                <Input type="number" value={assignmentForm.maxScore} onChange={e => setAssignmentForm({...assignmentForm, maxScore: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignmentOpen(false)}>Batal</Button>
            <Button onClick={handleSaveAssignment} className="gradient-primary text-white">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
