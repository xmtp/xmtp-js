export const nsToDate = (ns: bigint): Date => {
  return new Date(Number(ns / 1_000_000n));
};

export const dateToNs = (date: Date): bigint => {
  const ms = date.getTime();
  if (Number.isNaN(ms)) {
    throw new Error("Invalid date");
  }
  return BigInt(ms) * 1_000_000n;
};
