import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function BrowseLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Filter bar */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-[150px]" />
          </div>
        </CardContent>
      </Card>

      {/* Course cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-md overflow-hidden">
            <Skeleton className="h-44 w-full" />
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
