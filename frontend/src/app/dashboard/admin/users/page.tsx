"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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

const roleConfig: Record<string, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  admin: { label: "Admin", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  teacher: { label: "Pengajar", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  student: { label: "Siswa", className: "bg-green-500/10 text-green-500 border-green-500/20" },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "student" });

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedSearch, roleFilter]);

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: debouncedSearch,
        role: roleFilter !== "all" ? roleFilter : ""
      }).toString();

      const response = await api.get(`/users?${query}`);
      setUsers(response.data || []);
      if (response.meta) setMeta(response.meta);
    } catch (error) {
      if (!silent) toast.error("Gagal mengambil data pengguna");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post("/users", createForm);
      toast.success("Pengguna berhasil ditambahkan");
      setIsCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "student" });
      fetchUsers(true);
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan pengguna");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
    setIsEditOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setIsSubmitting(true);
      await api.put(`/users/${editingUser.id}`, editForm);
      toast.success("Pengguna berhasil diperbarui");
      setIsEditOpen(false);
      setEditingUser(null);
      fetchUsers(true);
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui pengguna");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Pengguna berhasil dihapus");
      fetchUsers(true);
    } catch (error: any) {
      toast.error("Gagal menghapus pengguna");
    }
  };

  const paginatedUsers = users;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Pengguna</h1>
          <p className="text-muted-foreground">Kelola semua pengguna platform</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gradient-primary text-white shadow-lg shadow-primary/25 gap-2">
          <UserPlus className="h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari nama atau email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={(v) => v && setRoleFilter(v)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <span>
                  {roleFilter === "all" ? "Semua Role" :
                   roleConfig[roleFilter]?.label || roleFilter}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Pengajar</SelectItem>
                <SelectItem value="student">Siswa</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Bergabung</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada pengguna ditemukan</TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => {
                      const role = roleConfig[user.role] || roleConfig.student;
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatar || ""} />
                                <AvatarFallback className="gradient-primary text-white text-xs">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <p className="font-medium text-sm">{user.name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={role.className}>{role.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(user)}>
                                  <Pencil className="h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteUser(user.id)}>
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

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} pengguna
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

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>Masukkan detail pengguna yang akan ditambahkan ke platform.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-4">
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
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({...createForm, role: v ?? "student"})}>
                <SelectTrigger>
                  <span>{roleConfig[createForm.role]?.label || "Pilih Role"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Siswa</SelectItem>
                  <SelectItem value="teacher">Pengajar</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>Ubah detail pengguna.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input required value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({...editForm, role: v ?? "student"})}>
                <SelectTrigger>
                  <span>{roleConfig[editForm.role]?.label || "Pilih Role"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Siswa</SelectItem>
                  <SelectItem value="teacher">Pengajar</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
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
