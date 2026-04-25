"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await api.get("/enrollments");
        setPayments(data || []);
      } catch (error) {
        toast.error("Gagal mengambil riwayat pembayaran");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const totalPaid = payments.reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

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
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Pembayaran</h1>
        <p className="text-muted-foreground">Riwayat transaksi pembayaran kursus Anda</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="bg-primary/10 rounded-xl p-3">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-2xl font-bold mt-1">{payments.length}</p>
              </div>
              <div className="bg-emerald-500/10 rounded-xl p-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kursus</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Belum ada riwayat pembayaran
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.course?.title}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatCurrency(payment.paymentAmount || 0)}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Lunas
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(payment.enrolledAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
