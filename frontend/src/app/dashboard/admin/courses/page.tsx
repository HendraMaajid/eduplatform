"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Users, BookOpen, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string }> = {
  published: { label: "Aktif", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  draft: { label: "Draft", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  archived: { label: "Arsip", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

const levelLabels: Record<string, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Lanjutan",
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.get("/courses");
      setCourses(data || []);
    } catch (error) {
      if (!silent) toast.error("Gagal mengambil data kursus");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kursus ini? Semua modul terkait juga akan dihapus.")) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success("Kursus berhasil dihapus");
      fetchCourses(true);
    } catch (error: any) {
      toast.error("Gagal menghapus kursus");
    }
  };

  const categories = [...new Set(courses.map((c) => c.category || "General"))];

  const filteredCourses = courses.filter((course) => {
    const matchSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.teacher?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || course.status === statusFilter;
    const matchCategory = categoryFilter === "all" || course.category === categoryFilter || (categoryFilter === "General" && !course.category);
    return matchSearch && matchStatus && matchCategory;
  });

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Kursus</h1>
          <p className="text-muted-foreground">Buat dan kelola kursus platform</p>
        </div>
        <Button className="gradient-primary text-white shadow-lg shadow-primary/25 gap-2" asChild>
          <Link href="/dashboard/admin/courses/create">
            <Plus className="h-4 w-4" />
            Buat Kursus Baru
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kursus atau pengajar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <span>
                  {statusFilter === "all" ? "Semua Status" :
                   statusFilter === "published" ? "Aktif" :
                   statusFilter === "draft" ? "Draft" :
                   statusFilter === "archived" ? "Arsip" : "Status"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="published">Aktif</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Arsip</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <span>
                  {categoryFilter === "all" ? "Semua Kategori" : categoryFilter}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kursus</TableHead>
                  <TableHead>Pengajar</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Tidak ada kursus ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCourses.map((course) => {
                    const status = statusConfig[course.status] || statusConfig.draft;
                    return (
                      <TableRow key={course.id} className="hover:bg-accent/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {course.thumbnail ? (
                              <img 
                                src={course.thumbnail.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${course.thumbnail}` : course.thumbnail} 
                                alt={course.title} 
                                className="h-10 w-10 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                                <BookOpen className="h-5 w-5 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{course.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {course.totalModules || 0} modul • {levelLabels[course.level] || course.level}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={course.teacher?.avatar} />
                              <AvatarFallback className="text-[10px] gradient-primary text-white">
                                {course.teacher?.name?.slice(0, 2).toUpperCase() || "T"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{course.teacher?.name || "Pengajar"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{course.category || "General"}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {formatCurrency(course.price || 0)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {course.enrolledStudents || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.className}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => window.location.href = `/dashboard/admin/courses/${course.id}`}>
                                <Eye className="h-4 w-4" /> Lihat Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteCourse(course.id)}>
                                <Trash2 className="h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length)} dari {filteredCourses.length} kursus
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button key={page} variant={currentPage === page ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setCurrentPage(page)}>
                      {page}
                    </Button>
                  ))}
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            </div>)}
        </CardContent>
      </Card>
    </div>
  );
}
