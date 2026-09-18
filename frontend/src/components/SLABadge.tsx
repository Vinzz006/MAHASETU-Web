import React from 'react';

interface SLABadgeProps {
  createdAt?: string;
  slaHours?: number;
  status?: string;
}

export const SLABadge: React.FC<SLABadgeProps> = ({
  createdAt,
  slaHours = 48,
  status = 'SUBMITTED',
}) => {
  if (!createdAt) return null;

  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const elapsedHours = (now - createdTime) / (1000 * 60 * 60);

  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        SLA Met ({Math.round(elapsedHours)}h)
      </span>
    );
  }

  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
        Closed
      </span>
    );
  }

  const remainingHours = Math.round(slaHours - elapsedHours);

  if (remainingHours <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
        SLA Breached ({Math.abs(remainingHours)}h overdue)
      </span>
    );
  }

  if (remainingHours <= 12) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        SLA Warning ({remainingHours}h left)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
      SLA ({remainingHours}h left)
    </span>
  );
};
