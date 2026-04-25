"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BookOpen, Users, Star, Search, ShoppingCart, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { stripHtml } from "@/lib/html-utils";

const levelLabels: Record<string, string> = { beginner: "Pemula", intermediate: "Menengah", advanced: "Lanjutan" };
const levelColors: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-600 border-green-500/20",
  intermediate: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  advanced: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function StudentBrowsePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await api.get("/courses");
        setCourses(data || []);
      } catch (error) {
        console.error("Gagal mengambil kursus", error);
        toast.error("Gagal mengambil daftar kursus");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = [...new Set(courses.map((c) => c.category || "General"))];
  const publishedCourses = courses.filter((c) => c.status === "published");

  const filteredCourses = publishedCourses.filter((course) => {
    const matchSearch = course.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || course.category === category || (category === "General" && !course.category);
    const matchLevel = level === "all" || course.level === level;
    return matchSearch && matchCategory && matchLevel;
  });

  const handlePayment = async () => {
    if (!selectedCourse) return;
    const amount = parseInt(paymentAmount.replace(/\D/g, "")) || 0;
    
    if (amount >= selectedCourse.price) {
      setPaying(true);
      try {
        await api.post(`/courses/${selectedCourse.id}/enroll`, {
          paymentAmount: amount
        });
        
        setPaymentSuccess(true);
        toast.success("Pembayaran berhasil! Anda sekarang terdaftar di kursus ini.");
        setTimeout(() => {
          setPaymentOpen(false);
          setPaymentSuccess(false);
          setPaymentAmount("");
          setSelectedCourse(null);
        }, 2000);
      } catch (error: any) {
        toast.error(error.message || "Pembayaran gagal, silakan coba lagi.");
      } finally {
        setPaying(false);
      }
    } else {
      toast.error("Nominal pembayaran kurang!");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jelajahi Kursus</h1>
        <p className="text-muted-foreground">Temukan kursus yang sesuai dengan minat Anda</p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari kursus..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={(v) => v && setLevel(v)}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Level</SelectItem>
                <SelectItem value="beginner">Pemula</SelectItem>
                <SelectItem value="intermediate">Menengah</SelectItem>
                <SelectItem value="advanced">Lanjutan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className={`relative h-44 overflow-hidden ${!course.thumbnail ? 'gradient-primary' : 'bg-muted'}`}>
              {course.thumbnail ? (
                <img 
                  src={course.thumbnail.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${course.thumbnail}` : course.thumbnail} 
                  alt={course.title} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-white/20" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <Badge variant="outline" className={`${levelColors[course.level] || levelColors.beginner} border`}>{levelLabels[course.level] || course.level}</Badge>
              </div>
              {/* Note: The backend rating is not fully implemented yet, use default for now */}
              <div className="absolute top-3 right-3">
                <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 gap-1">
                  <Star className="h-3 w-3 fill-current" /> {course.rating || "4.5"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-5">
              <Badge variant="outline" className="text-xs mb-2">{course.category || "General"}</Badge>
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{stripHtml(course.description)}</p>

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.modules?.length || 0} modul</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.enrolledStudents || 0} siswa</span>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-lg font-bold text-primary">{formatCurrency(course.price)}</span>
                <Button size="sm" className="gap-1" onClick={() => { setSelectedCourse(course); setPaymentOpen(true); }}>
                  <ShoppingCart className="h-3 w-3" /> Daftar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Tidak ada kursus ditemukan</p>
          <p className="text-sm">Coba ubah filter pencarian Anda atau periksa koneksi backend</p>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          {!paymentSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Pembayaran Kursus
                </DialogTitle>
                <DialogDescription>
                  Masukkan nominal pembayaran untuk mendaftar kursus
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-accent/50 p-4 space-y-2">
                  <p className="font-semibold">{selectedCourse?.title}</p>
                  <p className="text-2xl font-bold text-primary">{selectedCourse && formatCurrency(selectedCourse.price)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Nominal Pembayaran (IDR)</Label>
                  <Input
                    type="text"
                    placeholder="Masukkan nominal..."
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentOpen(false)} disabled={paying}>Batal</Button>
                <Button onClick={handlePayment} className="gradient-primary text-white" disabled={paying}>
                  {paying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Bayar Sekarang
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Pembayaran Berhasil!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Anda berhasil terdaftar di kursus <strong>{selectedCourse?.title}</strong>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
