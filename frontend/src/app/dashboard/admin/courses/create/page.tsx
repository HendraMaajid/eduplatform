"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateCoursePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    category: "",
    level: "",
    price: "",
    teacherId: "",
    thumbnail: "",
    status: "draft",
  });

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        let data = await api.get("/users?role=teacher") || [];
        
        // Add current user if not in the list (e.g. Super Admin)
        if (session?.user && !data.some((t: any) => t.id === (session.user as any).id)) {
          data = [{ id: (session.user as any).id, name: `${session.user.name} (Saya)`, email: session.user.email }, ...data];
        }
        
        setTeachers(data);
        
        // Default to current user if teacherId is empty
        if (!formData.teacherId && session?.user) {
          setFormData(prev => ({ ...prev, teacherId: (session.user as any).id }));
        }
      } catch (error) {
        toast.error("Gagal mengambil data pengajar");
      } finally {
        setLoading(false);
      }
    };
    if (session?.user) {
      fetchTeachers();
    }
  }, [session]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    try {
      setUploadingImage(true);
      const formDataObj = new FormData();
      formDataObj.append("file", file);

      const token = (session as any)?.token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataObj,
      });

      if (!res.ok) throw new Error("Gagal mengupload gambar");

      const data = await res.json();
      setFormData({ ...formData, thumbnail: data.url });
      toast.success("Gambar berhasil diupload");
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengupload gambar");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const payload = {
        title: formData.title,
        shortDescription: formData.shortDescription,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        price: parseInt(formData.price) || 0,
        thumbnail: formData.thumbnail,
        teacherId: formData.teacherId,
        status: formData.status,
      };

      await api.post("/courses", payload);
      
      toast.success("Kursus berhasil dibuat!");
      router.push("/dashboard/admin/courses");
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat kursus");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/courses"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buat Kursus Baru</h1>
          <p className="text-muted-foreground">Isi informasi kursus yang ingin dibuat</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-lg">Informasi Dasar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Kursus *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Contoh: Bootcamp React Native" required />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Singkat *</Label>
              <Input value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} placeholder="Deskripsi singkat dalam 1 kalimat" required />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Lengkap</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Jelaskan kursus ini secara detail..." rows={5} />
            </div>
            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden"
              >
                {formData.thumbnail ? (
                  <div className="absolute inset-0">
                    <img src={formData.thumbnail.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${formData.thumbnail}` : formData.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity text-white font-medium">
                      Ganti Gambar
                    </div>
                  </div>
                ) : (
                  <>
                    {uploadingImage ? (
                      <Loader2 className="h-10 w-10 mx-auto text-muted-foreground mb-2 animate-spin" />
                    ) : (
                      <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">{uploadingImage ? "Mengupload..." : "Klik untuk upload gambar thumbnail"}</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (max 2MB)</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                onChange={handleImageUpload} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-lg">Detail Kursus</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select required value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger>
                    <span className={!formData.category ? "text-muted-foreground" : ""}>
                      {formData.category === "mobile" ? "Mobile Development" :
                       formData.category === "web" ? "Web Development" :
                       formData.category === "design" ? "Design" :
                       formData.category === "data" ? "Data Science" :
                       formData.category === "devops" ? "DevOps" : "Pilih kategori"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile Development</SelectItem>
                    <SelectItem value="web">Web Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="data">Data Science</SelectItem>
                    <SelectItem value="devops">DevOps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Level *</Label>
                <Select required value={formData.level} onValueChange={(v) => setFormData({...formData, level: v})}>
                  <SelectTrigger>
                    <span className={!formData.level ? "text-muted-foreground" : ""}>
                      {formData.level === "beginner" ? "Pemula" :
                       formData.level === "intermediate" ? "Menengah" :
                       formData.level === "advanced" ? "Lanjutan" : "Pilih level"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Pemula</SelectItem>
                    <SelectItem value="intermediate">Menengah</SelectItem>
                    <SelectItem value="advanced">Lanjutan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Harga (IDR) *</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="1000000" required />
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select required value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger>
                    <span className={!formData.status ? "text-muted-foreground" : ""}>
                      {formData.status === "draft" ? "Draft" :
                       formData.status === "published" ? "Published" :
                       formData.status === "archived" ? "Archived" : "Pilih status"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-lg">Assign Pengajar</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Pengajar *</Label>
              <Select required value={formData.teacherId} onValueChange={(v) => setFormData({...formData, teacherId: v})}>
                <SelectTrigger>
                  <span className={!formData.teacherId ? "text-muted-foreground" : ""}>
                    {formData.teacherId 
                      ? teachers.find(t => t.id === formData.teacherId)?.name || formData.teacherId
                      : (loading ? "Memuat pengajar..." : "Pilih pengajar")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} — {t.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/admin/courses">Batal</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || uploadingImage} className="gradient-primary text-white shadow-lg shadow-primary/25 gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Kursus
          </Button>
        </div>
      </form>
    </div>
  );
}
