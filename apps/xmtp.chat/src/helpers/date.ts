export const nsToDate = (ns: bigint): Date => {
  return new Date(Number(ns / 1_000_000n));
};

export const dateToNs = (date: Date): bigint => {
  return BigInt(date.getTime() * 1_000_000);
};
