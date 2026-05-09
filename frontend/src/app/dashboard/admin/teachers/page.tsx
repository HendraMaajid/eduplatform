"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, MoreHorizontal, Pencil, Trash2, UserPlus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { PaginationMeta } from "@/lib/types";
import { PaginationControl } from "@/components/ui/pagination-control";
export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "teacher" });

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "teacher" });

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);

  useEffect(() => {
    fetchTeachers();
  }, [currentPage, debouncedSearch]);

  const fetchTeachers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: debouncedSearch,
        role: "teacher"
      }).toString();

      const response = await api.get(`/users?${query}`);
      setTeachers(response.data || []);
      if (response.meta) setMeta(response.meta);
    } catch (error) {
      if (!silent) toast.error("Gagal mengambil data pengajar");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post("/users", createForm);
      toast.success("Pengajar berhasil ditambahkan");
      setIsCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "teacher" });
      fetchTeachers(true);
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan pengajar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (teacher: any) => {
    setEditingTeacher(teacher);
    setEditForm({ name: teacher.name, email: teacher.email, role: teacher.role });
    setIsEditOpen(true);
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      setIsSubmitting(true);
      await api.put(`/users/${editingTeacher.id}`, editForm);
      toast.success("Pengajar berhasil diperbarui");
      setIsEditOpen(false);
      setEditingTeacher(null);
      fetchTeachers(true);
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui pengajar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengajar ini?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Pengajar berhasil dihapus");
      fetchTeachers(true);
    } catch (error: any) {
      toast.error("Gagal menghapus pengajar");
    }
  };

  const paginatedTeachers = teachers;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Pengajar</h1>
          <p className="text-muted-foreground">Kelola daftar pengajar di platform</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gradient-primary text-white shadow-lg shadow-primary/25 gap-2">
          <UserPlus className="h-4 w-4" /> Tambah Pengajar
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari nama atau email pengajar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengajar</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bergabung</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTeachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada pengajar ditemukan</TableCell>
                    </TableRow>
                  ) : (
                    paginatedTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={teacher.avatar || ""} />
                              <AvatarFallback className="gradient-primary text-white text-xs">{teacher.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{teacher.name}</p>
                              <p className="text-xs text-muted-foreground">{teacher.bio || "Belum ada bio"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{teacher.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Aktif</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(teacher.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(teacher)}>
                                <Pencil className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteTeacher(teacher.id)}>
                                <Trash2 className="h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} pengajar
                  </p>
                  <PaginationControl 
                    currentPage={currentPage} 
                    totalPages={meta.totalPages} 
                    onPageChange={setCurrentPage} 
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Teacher Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengajar Baru</DialogTitle>
            <DialogDescription>Masukkan detail pengajar yang akan ditambahkan ke platform.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTeacher} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input required value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})} placeholder="Misal: Budi Santoso" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})} placeholder="budi@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" required value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})} placeholder="Minimal 6 karakter" />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengajar</DialogTitle>
            <DialogDescription>Ubah detail pengajar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTeacher} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input required value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
