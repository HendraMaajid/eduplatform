"use client";
import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import type { Certificate } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Trophy } from "lucide-react";
import { usePlatformBrand } from "@/components/brand/platform-brand-provider";
export default function CertificatesPage() {
  const t = useTranslations("certificatesPage");
  const format = useFormatter();
  const { settings: platform } = usePlatformBrand();
  const [items, setItems] = useState<Certificate[] | null>(null);
  useEffect(() => {
    api.get<Certificate[]>("/learning/certificates").then(setItems);
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>
      {items === null ? (
        <Skeleton className="h-72" />
      ) : items.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((cert) => (
            <Card key={cert.id} className="border-2 bg-[#fff9dd] text-[#3e3510]">
              <CardContent className="flex gap-5">
                <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-[#ffed9a] text-[#3e3510]">
                  <Award className="size-8" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#776a31]">
                    {t("graduationCertificate")}
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold">{cert.course?.title}</h2>
                  <p className="mt-2 text-xs font-semibold text-[#5d5225]">
                    {t("issuedBy", { issuer: cert.issuer || platform.certificateIssuer })}
                  </p>
                  <p className="mt-3 font-mono text-xs">{cert.certificateNumber}</p>
                  <p className="mt-1 text-xs text-[#776a31]">
                    {t("issued", {
                      date: format.dateTime(new Date(cert.issuedAt), { dateStyle: "medium" }),
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="border-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
