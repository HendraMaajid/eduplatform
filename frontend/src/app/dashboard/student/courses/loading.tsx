import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentCoursesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-md overflow-hidden">
            <Skeleton className="h-32 w-full" />
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <Skeleton className="h-7 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
