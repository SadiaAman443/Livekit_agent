import { HTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function getStatusBadgeVariant(status: string): BadgeProps['variant'] {
  const s = status.toUpperCase();
  if (s === 'NEW' || s === 'CONTACTED') return 'info';
  if (s === 'COMPLETED' || s === 'INTERESTED') return 'success';
  if (s === 'CALLBACK_REQUESTED' || s === 'PENDING') return 'warning';
  if (s === 'NOT_INTERESTED' || s === 'FAILED' || s === 'ERROR') return 'danger';
  return 'default';
}
