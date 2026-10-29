import React from 'react';
import { Skeleton, CardSkeleton } from '@/components/ui/SkeletonLoaders';

export default function PortalLoading() {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy="true" aria-label="Loading member portal">
      <div className="rounded-3xl border border-border/50 bg-card p-6 space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
