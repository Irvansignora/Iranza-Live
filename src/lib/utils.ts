import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Format currency IDR ──
export function formatIDR(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`
  return `Rp ${amount}`
}

// ── Format large numbers ──
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

// ── Format date/time ──
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy', { locale: id })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy, HH:mm', { locale: id })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm', { locale: id })
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: id })
}

// ── Duration formatter ──
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}j ${m}m`
  return `${m}m`
}

// ── Elapsed time from start ──
export function getElapsed(start: string): string {
  const diff = Math.floor((Date.now() - new Date(start).getTime()) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Platform display ──
export const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok Live',
  shopee: 'Shopee Live',
  instagram: 'Instagram Live',
  youtube: 'YouTube Live',
  tokopedia: 'Tokopedia Live',
  lazada: 'Lazada Live',
  other: 'Other',
}

export const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#00e5ff',
  shopee: '#ff3d6b',
  instagram: '#e1306c',
  youtube: '#ff0000',
  tokopedia: '#a3ff6b',
  lazada: '#ffc93c',
  other: '#5c6b7a',
}

export const PLATFORM_ICONS: Record<string, string> = {
  tiktok: '🎵',
  shopee: '🛍️',
  instagram: '📸',
  youtube: '▶️',
  tokopedia: '🟢',
  lazada: '🟡',
  other: '📡',
}
