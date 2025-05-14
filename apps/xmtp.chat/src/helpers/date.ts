export function nsToDate(ns: bigint): Date {
  const date = new Date(Number(ns / 1_000_000n));
  return new Date(date);
}
