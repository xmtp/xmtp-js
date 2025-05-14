export function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}
