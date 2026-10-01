export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export interface EarningSplit {
  gross: number;
  commissionRate: number;
  commission: number;
  net: number;
}

/** The only place net is computed, so gross = commission + net always holds. */
export function splitEarning(grossInput: number, commissionRate: number): EarningSplit {
  if (!Number.isFinite(grossInput) || grossInput < 0) throw new RangeError('gross must be a non-negative number');
  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
    throw new RangeError('commissionRate must be between 0 and 1');
  }
  const gross = round2(grossInput);
  const commission = round2(gross * commissionRate);
  return { gross, commissionRate, commission, net: round2(gross - commission) };
}