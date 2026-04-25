"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Globe, Bell, Shield, Palette } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Platform</h1>
        <p className="text-muted-foreground">Konfigurasi umum platform pembelajaran</p>
      </div>

      {/* General */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Globe className="h-5 w-5 text-primary" /> Umum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Platform</Label>
            <Input defaultValue="EduPlatform" />
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea defaultValue="Platform pembelajaran online terbaik dengan kursus berkualitas tinggi" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Email Support</Label>
            <Input defaultValue="support@eduplatform.id" type="email" />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5 text-primary" /> Notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Pendaftaran Baru</p>
              <p className="text-xs text-muted-foreground">Kirim email saat ada siswa baru mendaftar</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Pembayaran</p>
              <p className="text-xs text-muted-foreground">Kirim email konfirmasi pembayaran</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notifikasi Tugas Baru</p>
              <p className="text-xs text-muted-foreground">Notifikasi saat ada submission baru dari siswa</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Shield className="h-5 w-5 text-primary" /> Keamanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Wajib Google Login</p>
              <p className="text-xs text-muted-foreground">Hanya izinkan login menggunakan Google</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-approve Teacher</p>
              <p className="text-xs text-muted-foreground">Otomatis setujui pendaftaran pengajar baru</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="gradient-primary text-white shadow-lg shadow-primary/25" onClick={() => toast.success("Pengaturan berhasil disimpan!")}>
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}
