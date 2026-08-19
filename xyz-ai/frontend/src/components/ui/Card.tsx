import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
}