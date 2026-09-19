import { UnitNarasi } from '../../types';
import { prologUnit } from './prolog';
import { bab11Unit } from './bab-1-1';
import { bab12Unit } from './bab-1-2';
import { bab13Unit } from './bab-1-3';
import { bab14Unit } from './bab-1-4';
import { bab15Unit } from './bab-1-5';
import { bab16Unit } from './bab-1-6';
import { bab17Unit } from './bab-1-7';

/**
 * Daftar resmi unit narasi Bagian I yang sudah tuntas sesuai PRD
 */
export function countWords(unit: UnitNarasi): number {
  let count = 0;
  for (const adegan of unit.adegan) {
    for (const p of adegan.paragraf) {
      const words = p.trim().split(/\s+/).filter(Boolean);
      count += words.length;
    }
  }
  return count;
}

export const DEFAULT_UNITS: UnitNarasi[] = [
  { ...prologUnit, jumlah_kata: countWords(prologUnit) },
  { ...bab11Unit, jumlah_kata: countWords(bab11Unit) },
  { ...bab12Unit, jumlah_kata: countWords(bab12Unit) },
  { ...bab13Unit, jumlah_kata: countWords(bab13Unit) },
  { ...bab14Unit, jumlah_kata: countWords(bab14Unit) },
  { ...bab15Unit, jumlah_kata: countWords(bab15Unit) },
  { ...bab16Unit, jumlah_kata: countWords(bab16Unit) },
  { ...bab17Unit, jumlah_kata: countWords(bab17Unit) },
];

export function getAllUnits(): UnitNarasi[] {
  // Cek apakah ada naskah yang disimpan di storage lokal pengguna
  try {
    const saved = localStorage.getItem('lorong_pena_custom_units');
    if (saved) {
      const parsed = JSON.parse(saved) as UnitNarasi[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.urutan_global - b.urutan_global);
      }
    }
  } catch {
    // Abaikan kegagalan parsing, gunakan default
  }
  return DEFAULT_UNITS.sort((a, b) => a.urutan_global - b.urutan_global);
}

export function getUnitById(id: string): UnitNarasi | undefined {
  const units = getAllUnits();
  return units.find((u) => u.id === id);
}

export function getPreviousUnit(currentId: string): UnitNarasi | undefined {
  const units = getAllUnits();
  const index = units.findIndex((u) => u.id === currentId);
  if (index > 0) {
    return units[index - 1];
  }
  return undefined;
}

export function getNextUnit(currentId: string): UnitNarasi | undefined {
  const units = getAllUnits();
  const index = units.findIndex((u) => u.id === currentId);
  if (index >= 0 && index < units.length - 1) {
    return units[index + 1];
  }
  return undefined;
}
