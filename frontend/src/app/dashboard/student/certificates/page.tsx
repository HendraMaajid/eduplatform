"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Download, Award, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

function generateCertificatePDF(cert: any, studentName: string) {
  const courseTitle = cert.course?.title || "Kursus";
  const certNumber = cert.certificateNumber;
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Create a canvas to draw the certificate
  const canvas = document.createElement("canvas");
  const width = 1200;
  const height = 850;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#fefce8");
  bgGrad.addColorStop(0.5, "#fffbeb");
  bgGrad.addColorStop(1, "#fef3c7");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Golden border
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 8;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Inner border
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2;
  ctx.strokeRect(45, 45, width - 90, height - 90);

  // Decorative corners
  const cornerSize = 40;
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 4;
  // Top-left
  ctx.beginPath(); ctx.moveTo(30, 30 + cornerSize); ctx.lineTo(30, 30); ctx.lineTo(30 + cornerSize, 30); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(width - 30 - cornerSize, 30); ctx.lineTo(width - 30, 30); ctx.lineTo(width - 30, 30 + cornerSize); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(30, height - 30 - cornerSize); ctx.lineTo(30, height - 30); ctx.lineTo(30 + cornerSize, height - 30); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(width - 30 - cornerSize, height - 30); ctx.lineTo(width - 30, height - 30); ctx.lineTo(width - 30, height - 30 - cornerSize); ctx.stroke();

  // Header: "SERTIFIKAT"
  ctx.textAlign = "center";
  ctx.fillStyle = "#92400e";
  ctx.font = "bold 18px 'Segoe UI', sans-serif";
  ctx.fillText("EDUPLATFORM", width / 2, 110);

  // Trophy icon (simple circle badge)
  ctx.beginPath();
  ctx.arc(width / 2, 175, 35, 0, Math.PI * 2);
  const badgeGrad = ctx.createRadialGradient(width / 2, 175, 5, width / 2, 175, 35);
  badgeGrad.addColorStop(0, "#fbbf24");
  badgeGrad.addColorStop(1, "#d97706");
  ctx.fillStyle = badgeGrad;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("★", width / 2, 184);

  // Title
  ctx.fillStyle = "#78350f";
  ctx.font = "bold 44px 'Georgia', serif";
  ctx.fillText("SERTIFIKAT", width / 2, 260);

  // Subtitle
  ctx.fillStyle = "#92400e";
  ctx.font = "18px 'Segoe UI', sans-serif";
  ctx.fillText("Dengan ini menerangkan bahwa", width / 2, 310);

  // Student name
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 38px 'Georgia', serif";
  ctx.fillText(studentName, width / 2, 370);

  // Underline under name
  const nameWidth = ctx.measureText(studentName).width;
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo((width - nameWidth) / 2 - 20, 380);
  ctx.lineTo((width + nameWidth) / 2 + 20, 380);
  ctx.stroke();

  // Description
  ctx.fillStyle = "#44403c";
  ctx.font = "18px 'Segoe UI', sans-serif";
  ctx.fillText("Telah berhasil menyelesaikan kursus", width / 2, 430);

  // Course title
  ctx.fillStyle = "#1e40af";
  ctx.font = "bold 30px 'Georgia', serif";

  // Word-wrap course title if too long
  const maxWidth = width - 200;
  if (ctx.measureText(courseTitle).width > maxWidth) {
    const words = courseTitle.split(" ");
    let line = "";
    let lines: string[] = [];
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxWidth && line !== "") {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = test;
      }
    }
    lines.push(line.trim());
    const startY = 475;
    lines.forEach((l, i) => {
      ctx.fillText(l, width / 2, startY + i * 38);
    });
  } else {
    ctx.fillText(courseTitle, width / 2, 480);
  }

  // Description 2
  ctx.fillStyle = "#44403c";
  ctx.font = "16px 'Segoe UI', sans-serif";
  ctx.fillText("dengan hasil yang memenuhi standar kelulusan yang ditetapkan.", width / 2, 540);

  // Divider
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, 580);
  ctx.lineTo(width - 200, 580);
  ctx.stroke();

  // Date & Certificate number
  ctx.fillStyle = "#78716c";
  ctx.font = "16px 'Segoe UI', sans-serif";
  ctx.fillText(`Diterbitkan pada ${issuedDate}`, width / 2, 620);
  ctx.font = "14px 'Segoe UI', sans-serif";
  ctx.fillText(`No. Sertifikat: ${certNumber}`, width / 2, 650);

  // Signature area
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 16px 'Segoe UI', sans-serif";
  ctx.fillText("EduPlatform", width / 2, 740);
  ctx.fillStyle = "#78716c";
  ctx.font = "14px 'Segoe UI', sans-serif";
  ctx.fillText("Platform Pembelajaran Online", width / 2, 762);

  // Signature line
  ctx.strokeStyle = "#a8a29e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 100, 720);
  ctx.lineTo(width / 2 + 100, 720);
  ctx.stroke();

  // Convert canvas to blob and download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sertifikat_${certNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}

export default function StudentCertificatesPage() {
  const { data: session } = useSession();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const data = await api.get("/certificates");
        setCertificates(data || []);
      } catch (error) {
        toast.error("Gagal mengambil sertifikat");
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  const handleDownload = (cert: any) => {
    const studentName = session?.user?.name || "Siswa";
    generateCertificatePDF(cert, studentName);
    toast.success(`Mengunduh sertifikat ${cert.certificateNumber}...`);
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
        <h1 className="text-2xl font-bold tracking-tight">Sertifikat Saya</h1>
        <p className="text-muted-foreground">Sertifikat yang telah Anda dapatkan</p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden group">
              {/* Certificate visual */}
              <div className="relative h-48 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 flex items-center justify-center">
                <div className="text-center text-white space-y-2">
                  <Award className="h-12 w-12 mx-auto drop-shadow-lg" />
                  <p className="text-lg font-bold drop-shadow-md">Sertifikat</p>
                  <p className="text-sm opacity-80">{cert.certificateNumber}</p>
                </div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h40v40H0z%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%2040L40%200%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.08)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')]" />
              </div>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold">{cert.course?.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Diterbitkan {new Date(cert.issuedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <Button size="sm" className="w-full gap-2" onClick={() => handleDownload(cert)}>
                  <Download className="h-3 w-3" /> Unduh Sertifikat
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium">Belum Ada Sertifikat</h3>
            <p className="text-sm mt-1 max-w-md mx-auto">Silahkan klik tombol "Klaim Sertifikat" pada halaman detail kursus yang sudah Anda selesaikan secara 100% untuk memunculkan sertifikat di sini.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
