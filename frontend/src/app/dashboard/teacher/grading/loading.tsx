import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function GradingLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-52" />
      </div>
      <Skeleton className="h-9 w-72" />
      <div className="space-y-4 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-3">
                    <Skeleton className="h-5 w-28 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
