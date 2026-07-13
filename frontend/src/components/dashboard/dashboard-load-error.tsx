"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type DashboardLoadErrorProps = {
  message?: string;
};

export function DashboardLoadError({ message }: DashboardLoadErrorProps) {
  const t = useTranslations("dashboardLoadError");
  return (
    <Alert variant="destructive" className="max-w-2xl">
      <AlertCircle />
      <AlertTitle>{t("title")}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{message || t("description")}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw />
          {t("retry")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
