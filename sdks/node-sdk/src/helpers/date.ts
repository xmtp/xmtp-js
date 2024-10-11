export function nsToDate(ns: number): Date {
  return new Date(ns / 1_000_000);
}
