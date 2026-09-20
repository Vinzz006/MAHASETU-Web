import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="w-full animate-pulse space-y-3 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
      <div className="h-8 bg-slate-800/80 rounded-lg w-full mb-4" />
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div key={cIdx} className="h-6 bg-slate-800/50 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-4">
          <div className="w-12 h-12 bg-slate-800 rounded-xl" />
          <div className="h-5 bg-slate-800 rounded-md w-3/4" />
          <div className="h-4 bg-slate-800/60 rounded-md w-full" />
          <div className="h-4 bg-slate-800/60 rounded-md w-1/2" />
        </div>
      ))}
    </div>
  );
};

export const StatsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-2">
          <div className="h-4 bg-slate-800 rounded w-1/2" />
          <div className="h-8 bg-slate-800/80 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
};
