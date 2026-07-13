"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControl({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlProps) {
  const t = useTranslations("pagination");
  const getPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages - 1, totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, 2, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
      <Button
        variant="outline"
        size="icon"
        className="size-8 shrink-0"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label={t("previous")}
      >
        <ChevronLeft />
      </Button>

      {getPages().map((page, i) => {
        if (page === "...") {
          return (
            <div
              key={`ellipsis-${i}`}
              className="flex size-8 shrink-0 items-center justify-center text-muted-foreground"
            >
              <MoreHorizontal />
            </div>
          );
        }
        return (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            className="size-8 shrink-0"
            onClick={() => onPageChange(page as number)}
            aria-label={t("openPage", { page })}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="icon"
        className="size-8 shrink-0"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label={t("next")}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
