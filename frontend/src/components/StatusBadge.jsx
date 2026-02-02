import React from 'react';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-100 text-green-800',
  VERIFIED: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PENDING_TENANT_CONFIRMATION: 'bg-yellow-100 text-yellow-800',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  DRAFT: 'bg-gray-100 text-gray-600',
  TERMINATED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-100 text-red-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status, size = 'medium' }) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';
  const sizeClass = size === 'small'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  const formattedStatus = status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}>
      {formattedStatus}
    </span>
  );
}
