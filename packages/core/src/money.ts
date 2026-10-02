/** Hours in an average month, 8,760 / 12. AWS and GCP quote monthly prices on this basis. */
export const HOURS_PER_MONTH = 730;

const MICROS_PER_USD = 1_000_000;

function toMicros(usd: number): number {
  if (!Number.isFinite(usd)) throw new RangeError(`Not a dollar amount: ${usd}`);
  return Math.round(usd * MICROS_PER_USD);
}

/**
 * Adds dollar amounts in whole micro-dollars. A cost export holds thousands of sub-cent line
 * items, and adding them as floats drifts.
 */
export function sumUsd(amounts: Iterable<number>): number {
  let micros = 0;
  for (const amount of amounts) micros += toMicros(amount);
  return micros / MICROS_PER_USD;
}

export function monthlyFromHourly(hourlyUsd: number): number {
  return toMicros(hourlyUsd * HOURS_PER_MONTH) / MICROS_PER_USD;
}

/** Rounds down to the cent. A saving is an estimate, so it is never rounded up. */
export function floorToCents(usd: number): number {
  return Math.floor(toMicros(usd) / 10_000) / 100;
}
