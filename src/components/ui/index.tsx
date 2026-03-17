// src/components/ui/index.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'warn' | 'danger' | 'info' | 'orange' | 'muted';

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-white/8 text-[#B8C6E0] border border-white/10',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  warn:    'bg-amber-500/15  text-amber-400  border border-amber-500/20',
  danger:  'bg-red-500/15    text-red-400    border border-red-500/20',
  info:    'bg-blue-500/15   text-blue-400   border border-blue-500/20',
  orange:  'bg-[#EE7436]/15  text-[#EE7436]  border border-[#EE7436]/25',
  muted:   'bg-white/5       text-[#8A9BC4]  border border-white/8',
};

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-600', badgeVariants[variant], className)}>
      {children}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'orange' | 'info';
type BtnSize = 'sm' | 'md' | 'lg';

const btnVariants: Record<BtnVariant, string> = {
  primary:   'bg-[#EE7436] hover:bg-[#D45E20] text-white shadow-lg shadow-[#EE7436]/20 border border-[#EE7436]/50',
  secondary: 'bg-white/8 hover:bg-white/12 text-[#B8C6E0] border border-white/10',
  ghost:     'bg-transparent hover:bg-white/6 text-[#8A9BC4] hover:text-[#B8C6E0]',
  danger:    'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20',
  success:   'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20',
  orange:    'bg-[#EE7436]/15 hover:bg-[#EE7436]/25 text-[#EE7436] border border-[#EE7436]/25',
  info:      'bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20',
};

const btnSizes: Record<BtnSize, string> = {
  sm: 'h-8  px-3 text-xs  gap-1.5 rounded-lg',
  md: 'h-9  px-4 text-sm  gap-2   rounded-xl',
  lg: 'h-11 px-6 text-sm  gap-2   rounded-xl',
};

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className,
  onClick,
  type = 'button',
}: {
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-600 transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
        btnVariants[variant],
        btnSizes[size],
        className,
      )}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/8 bg-[#162040]',
        padding && 'p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  color = 'orange',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  color?: 'orange' | 'blue' | 'green' | 'amber';
}) {
  const colors = {
    orange: 'bg-[#EE7436]/12 text-[#EE7436]',
    blue:   'bg-blue-500/12  text-blue-400',
    green:  'bg-emerald-500/12 text-emerald-400',
    amber:  'bg-amber-500/12 text-amber-400',
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', colors[color])}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-500 text-[#8A9BC4] uppercase tracking-wide">{label}</p>
        <p className="mt-0.5 text-2xl font-800 text-[#F0F4FF]">{value}</p>
        {sub && <p className="text-xs text-[#8A9BC4] mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-[#EE7436]" />;
}

export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function Empty({ message = 'Veri bulunamadı', icon: Icon }: { message?: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#8A9BC4]">
      {Icon && <Icon size={36} className="opacity-40" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-600 text-[#8A9BC4] uppercase tracking-wide">{label}</label>}
      <input
        {...props}
        className={cn(
          'h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-[#F0F4FF] outline-none',
          'placeholder:text-[#8A9BC4]/60 transition-all',
          'focus:border-[#EE7436]/50 focus:ring-2 focus:ring-[#EE7436]/10',
          error && 'border-red-500/50',
          className,
        )}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({
  label,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-600 text-[#8A9BC4] uppercase tracking-wide">{label}</label>}
      <select
        {...props}
        className={cn(
          'h-10 rounded-xl border border-white/10 bg-[#162040] px-4 text-sm text-[#F0F4FF] outline-none',
          'focus:border-[#EE7436]/50 focus:ring-2 focus:ring-[#EE7436]/10',
          'transition-all cursor-pointer',
          className,
        )}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full rounded-2xl border border-white/10 bg-[#162040] shadow-2xl', width)}>
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h3 className="text-base font-700 text-[#F0F4FF]">{title}</h3>
          <button onClick={onClose} className="text-[#8A9BC4] hover:text-[#F0F4FF] transition-colors text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('border-b border-white/8 px-4 py-3 text-left text-xs font-700 uppercase tracking-wider text-[#8A9BC4]', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <td onClick={onClick} className={cn('border-b border-white/5 px-4 py-3 text-[#B8C6E0]', className)}>
      {children}
    </td>
  );
}
