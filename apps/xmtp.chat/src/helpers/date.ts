export function nsToDate(ns: bigint): Date {
  const date = new Date(Number(ns / 1_000_000n));
  const seconds = date.getSeconds();
  console.log("seconds", seconds);
  date.setSeconds(seconds + 1);
  return new Date(date);
}
