import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'destructive';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-indigo-100 text-indigo-800',
    secondary: 'bg-blue-100 text-blue-800',
    destructive: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}