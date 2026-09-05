import type { ReadingStatus } from '../types';

export const PALETTE = ['#5b4a7a', '#4f6650', '#7a3b3b', '#3a4a5a', '#8a6a3a', '#3a5a58', '#6b4a34'];

export const STATUS_CONFIG: Record<ReadingStatus, { label: string; ribbon: string }> = {
  TO_READ: { label: 'Por leer', ribbon: '#9c9484' },
  READING: { label: 'Leyendo', ribbon: '#c9a45c' },
  READ: { label: 'Leído', ribbon: '#4f6650' },
};

export function hashColor(str: string): string {
  let sum = 0;
  for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}

export function handwrittenSize(title: string): number {
  if (title.length <= 12) return 26;
  if (title.length <= 20) return 22;
  if (title.length <= 30) return 19;
  return 16;
}
