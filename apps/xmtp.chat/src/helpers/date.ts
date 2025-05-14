export function nsToDate(ns: bigint): Date {
  const date = new Date(Number(ns / 1_000_000n));
  const seconds = date.getSeconds();
  date.setSeconds(seconds);
  return new Date(date);
}
