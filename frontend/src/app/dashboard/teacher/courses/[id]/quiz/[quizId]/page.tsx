"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, HelpCircle, CheckCircle2, XCircle, GripVertical } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface Question {
  id: string;
  quizId: string;
  type: string;
  text: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  questions: Question[];
}

const typeLabels: Record<string, string> = {
  multiple_choice: "Pilihan Ganda",
  true_false: "Benar / Salah",
  short_answer: "Jawaban Singkat",
};

const typeColors: Record<string, string> = {
  multiple_choice: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  true_false: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  short_answer: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const defaultForm = {
  type: "multiple_choice",
  text: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 10,
  order: 1,
};

export default function QuizQuestionsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState({ ...defaultForm });

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [quizData, questionsData] = await Promise.all([
        api.get(`/courses/${courseId}/quizzes`),
        api.get(`/quizzes/${quizId}/questions`),
      ]);

      const currentQuiz = Array.isArray(quizData)
        ? quizData.find((q: Quiz) => q.id === quizId)
        : quizData;
      setQuiz(currentQuiz || null);
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      if (!silent) toast.error("Gagal memuat data kuis");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [quizId]);

  const handleSave = async () => {
    if (!form.text.trim()) {
      toast.error("Pertanyaan tidak boleh kosong");
      return;
    }
    if (!form.correctAnswer.trim()) {
      toast.error("Jawaban benar harus diisi");
      return;
    }
    if (form.type === "multiple_choice") {
      const validOptions = form.options.filter((o) => o.trim() !== "");
      if (validOptions.length < 2) {
        toast.error("Minimal 2 opsi jawaban harus diisi");
        return;
      }
    }

    try {
      const payload = {
        type: form.type,
        text: form.text,
        options: form.type === "multiple_choice" ? form.options.filter((o) => o.trim() !== "") : form.type === "true_false" ? ["Benar", "Salah"] : [],
        correctAnswer: form.correctAnswer,
        points: Number(form.points),
        order: Number(form.order),
      };

      if (editing) {
        await api.put(`/questions/${editing.id}`, payload);
        toast.success("Soal berhasil diubah");
      } else {
        await api.post(`/quizzes/${quizId}/questions`, payload);
        toast.success("Soal berhasil ditambahkan");
      }
      setIsOpen(false);
      fetchData(true);
    } catch (error) {
      toast.error("Gagal menyimpan soal");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus soal ini?")) {
      try {
        await api.delete(`/questions/${id}`);
        toast.success("Soal berhasil dihapus");
        fetchData(true);
      } catch (error) {
        toast.error("Gagal menghapus soal");
      }
    }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({ ...defaultForm, order: questions.length + 1 });
    setIsOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditing(q);
    const opts = q.options && q.options.length > 0 ? [...q.options] : ["", "", "", ""];
    while (opts.length < 2) opts.push("");
    setForm({
      type: q.type,
      text: q.text,
      options: opts,
      correctAnswer: q.correctAnswer || "",
      points: q.points,
      order: q.order,
    });
    setIsOpen(true);
  };

  const addOption = () => {
    setForm({ ...form, options: [...form.options, ""] });
  };

  const removeOption = (index: number) => {
    if (form.options.length <= 2) return;
    const newOptions = form.options.filter((_, i) => i !== index);
    setForm({ ...form, options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm({ ...form, options: newOptions });
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/teacher/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Kelola Soal</h1>
            <p className="text-muted-foreground text-sm">
              {quiz?.title || "Kuis"}
            </p>
          </div>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={openAddModal}>
          <Plus className="h-4 w-4" /> Tambah Soal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{questions.length}</p>
            <p className="text-xs text-muted-foreground">Total Soal</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{totalPoints}</p>
            <p className="text-xs text-muted-foreground">Total Poin</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{quiz?.passingScore || 0}%</p>
            <p className="text-xs text-muted-foreground">Passing Score</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{quiz?.timeLimit || 0}</p>
            <p className="text-xs text-muted-foreground">Menit</p>
          </CardContent>
        </Card>
      </div>

      {/* Question List */}
      <div className="space-y-3">
        {questions.map((q, index) => (
          <Card key={q.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={typeColors[q.type] || ""}>
                      {typeLabels[q.type] || q.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {q.points} poin
                    </Badge>
                  </div>

                  <div
                    className="text-sm mb-3 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: q.text }}
                  />

                  {/* Options display */}
                  {q.type === "multiple_choice" && q.options && (
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${
                            opt === q.correctAnswer
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                              : "bg-accent/30 border-transparent"
                          }`}
                        >
                          {opt === q.correctAnswer ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                          )}
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "true_false" && (
                    <div className="flex gap-3">
                      {["Benar", "Salah"].map((opt) => (
                        <div
                          key={opt}
                          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm border ${
                            opt === q.correctAnswer
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                              : "bg-accent/30 border-transparent"
                          }`}
                        >
                          {opt === q.correctAnswer ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                          )}
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "short_answer" && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Jawaban: {q.correctAnswer}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openEditModal(q)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(q.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-accent/50 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Belum Ada Soal</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Tambahkan soal pertama untuk kuis ini
            </p>
            <Button className="gradient-primary text-white gap-2" onClick={openAddModal}>
              <Plus className="h-4 w-4" /> Tambah Soal Pertama
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Question Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Soal" : "Tambah Soal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Type & Points */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipe Soal</Label>
                <Select value={form.type} onValueChange={(val) => {
                  const newType = val ?? "multiple_choice";
                  const newForm = { ...form, type: newType, correctAnswer: "" };
                  if (newType === "true_false") {
                    newForm.options = ["Benar", "Salah"];
                  } else if (newType === "multiple_choice" && form.options.length < 2) {
                    newForm.options = ["", "", "", ""];
                  }
                  setForm(newForm);
                }}>
                  <SelectTrigger>
                    <SelectValue>
                      {typeLabels[form.type]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                    <SelectItem value="true_false">Benar / Salah</SelectItem>
                    <SelectItem value="short_answer">Jawaban Singkat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Poin</Label>
                <Input type="number" min="1" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input type="number" min="1" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <Label>Pertanyaan</Label>
              <ReactQuill theme="snow" value={form.text} onChange={(val) => setForm({ ...form, text: val })} />
            </div>

            {/* Multiple Choice Options */}
            {form.type === "multiple_choice" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Opsi Jawaban</Label>
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addOption}>
                    <Plus className="h-3 w-3" /> Tambah Opsi
                  </Button>
                </div>
                {form.options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium shrink-0">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Opsi ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant={opt && form.correctAnswer === opt ? "default" : "outline"}
                      size="sm"
                      className={`shrink-0 gap-1 ${opt && form.correctAnswer === opt ? "gradient-primary text-white" : ""}`}
                      onClick={() => { if (opt.trim()) setForm({ ...form, correctAnswer: opt }); }}
                      disabled={!opt.trim()}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {opt && form.correctAnswer === opt ? "Benar" : "Tandai"}
                    </Button>
                    {form.options.length > 2 && (
                      <Button type="button" variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => removeOption(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {form.correctAnswer && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Jawaban benar: {form.correctAnswer}
                  </p>
                )}
              </div>
            )}

            {/* True/False */}
            {form.type === "true_false" && (
              <div className="space-y-2">
                <Label>Jawaban Benar</Label>
                <div className="flex gap-3">
                  {["Benar", "Salah"].map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      variant={form.correctAnswer === opt ? "default" : "outline"}
                      className={`flex-1 gap-2 ${form.correctAnswer === opt ? "gradient-primary text-white" : ""}`}
                      onClick={() => setForm({ ...form, correctAnswer: opt })}
                    >
                      {form.correctAnswer === opt && <CheckCircle2 className="h-4 w-4" />}
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Short Answer */}
            {form.type === "short_answer" && (
              <div className="space-y-2">
                <Label>Jawaban Benar</Label>
                <Input
                  value={form.correctAnswer}
                  onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                  placeholder="Ketik jawaban yang benar..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button onClick={handleSave} className="gradient-primary text-white">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
