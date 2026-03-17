// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('tr-TR', opts ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export function formatTime(iso: string | undefined): string {
  if (!iso) return '—';
  // "09:00" veya ISO datetime
  if (iso.length <= 5) return iso;
  return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'şimdi';
  if (mins < 60) return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}sa önce`;
  return formatDate(iso);
}

export function initials(firstName?: string, lastName?: string): string {
  return `${(firstName?.[0] ?? '').toUpperCase()}${(lastName?.[0] ?? '').toUpperCase()}`;
}
