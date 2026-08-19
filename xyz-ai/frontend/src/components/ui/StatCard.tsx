import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  icon?: React.ComponentType<{ className?: string }>;
  bg?: string;
}

export function StatCard({ label, value, color, icon, bg }: StatCardProps) {
  const IconComponent = icon || (() => null);

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${bg || 'bg-white'} p-6`}>
      <div className="flex items-center mb-3">
        {icon && <IconComponent className={`w-5 h-5 mr-3 ${color}`} />}
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}