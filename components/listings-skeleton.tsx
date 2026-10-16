import { Skeleton } from "@/components/ui/skeleton";

export function FiltersSkeleton() {
  return <Skeleton className="h-44 w-full rounded-lg sm:h-32" />;
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading stays"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border p-0 pb-4">
          <Skeleton className="h-36 w-full rounded-b-none" />
          <div className="space-y-2 px-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
