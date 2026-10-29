import React from 'react';
import { Skeleton } from '@/components/ui/SkeletonLoaders';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in" aria-busy="true" aria-label="Loading page content">
      {/* Hero / Header Skeleton */}
      <div className="space-y-4 rounded-3xl border border-border/40 bg-card/40 p-6 md:p-10">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-10 w-3/4 max-w-xl" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-11 w-36 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/40 bg-card/40 p-5 space-y-4">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="pt-2">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
