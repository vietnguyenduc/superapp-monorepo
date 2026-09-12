export function calculateDaysOnHand(stock: number, dailyOutput: number): number | null {
  return dailyOutput > 0 ? Math.round(stock / dailyOutput) : null;
}

export function isSignificantVariance(percentage: number, threshold = 5): boolean {
  return Math.abs(percentage) > threshold;
}

export function calculateMovementStock(
  records: Array<{ inputQuantity?: number; outputQuantity?: number }>,
): number {
  return records.reduce(
    (stock, record) => stock + (record.inputQuantity || 0) - (record.outputQuantity || 0),
    0,
  );
}
