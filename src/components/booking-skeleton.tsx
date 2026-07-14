export function BookingSkeleton() {
  return (
    <div className="card-elev flex items-center gap-3 p-4">
      <div className="grid w-16 shrink-0 gap-1">
        <div className="mx-auto h-3.5 w-10 rounded bg-muted animate-pulse" />
        <div className="mx-auto h-2.5 w-8 rounded bg-muted/60 animate-pulse" />
      </div>
      <div className="h-12 w-1 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
        <div className="h-2.5 w-1/2 rounded bg-muted/60 animate-pulse" />
      </div>
      <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
    </div>
  );
}

export function BookingSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-rise opacity-0 [animation-fill-mode:forwards]"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <BookingSkeleton />
        </div>
      ))}
    </div>
  );
}
