import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControl({ currentPage, totalPages, onPageChange }: PaginationControlProps) {
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
        className="h-8 w-8 shrink-0" 
        disabled={currentPage === 1} 
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {getPages().map((page, i) => {
        if (page === "...") {
          return (
            <div key={`ellipsis-${i}`} className="h-8 w-8 shrink-0 flex items-center justify-center text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </div>
          );
        }
        return (
          <Button 
            key={`page-${page}`} 
            variant={currentPage === page ? "default" : "outline"} 
            size="icon" 
            className="h-8 w-8 shrink-0" 
            onClick={() => onPageChange(page as number)}
          >
            {page}
          </Button>
        );
      })}
      
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8 shrink-0" 
        disabled={currentPage === totalPages} 
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
