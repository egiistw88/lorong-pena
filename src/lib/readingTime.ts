/**
 * Perhitungan estimasi waktu baca (kecepatan baca wajar ~200 kata/menit untuk novel naratif)
 */
export function calculateReadingTimeMinutes(wordCount: number): number {
  if (!wordCount || wordCount <= 0) return 1;
  const minutes = Math.ceil(wordCount / 200);
  return Math.max(1, minutes);
}

export function formatReadingTime(wordCount: number): string {
  const minutes = calculateReadingTimeMinutes(wordCount);
  return `${minutes} menit`;
}

export function formatTotalTime(wordCount: number): string {
  const totalMinutes = calculateReadingTimeMinutes(wordCount);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} jam ${remainingMinutes} menit`;
  }
  return `${remainingMinutes} menit`;
}
