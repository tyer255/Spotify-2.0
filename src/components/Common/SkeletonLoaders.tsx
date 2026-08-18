import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="flex-shrink-0 w-40 sm:w-44 p-3 rounded-2xl bg-neutral-900/40 border border-white/5 flex flex-col space-y-3">
    <div className="aspect-square w-full rounded-xl skeleton-shimmer" />
    <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
    <div className="h-3 w-1/2 rounded-md skeleton-shimmer" />
  </div>
);

export const RowSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-2 rounded-xl">
    <div className="flex items-center gap-3 flex-1">
      <div className="w-10 h-10 rounded-lg skeleton-shimmer flex-shrink-0" />
      <div className="space-y-1.5 flex-1 max-w-xs">
        <div className="h-3.5 w-40 rounded skeleton-shimmer" />
        <div className="h-2.5 w-24 rounded skeleton-shimmer" />
      </div>
    </div>
    <div className="h-3 w-12 rounded skeleton-shimmer" />
  </div>
);

export const HeroSkeleton: React.FC = () => (
  <div className="p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-neutral-900/60 rounded-3xl mb-6">
    <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl skeleton-shimmer flex-shrink-0" />
    <div className="space-y-3 flex-1 w-full text-center sm:text-left">
      <div className="h-4 w-20 rounded skeleton-shimmer mx-auto sm:mx-0" />
      <div className="h-8 sm:h-12 w-3/4 rounded-lg skeleton-shimmer mx-auto sm:mx-0" />
      <div className="h-4 w-1/2 rounded skeleton-shimmer mx-auto sm:mx-0" />
    </div>
  </div>
);
