import Long from 'long'

export function dateToNs(date: Date): Long {
  return Long.fromNumber(date.valueOf()).multiply(1_000_000)
}

export function nsToDate(ns: Long): Date {
  return new Date(ns.divide(1_000_000).toNumber())
}

export const toNanoString = (d: Date | undefined): undefined | string => {
  return d && dateToNs(d).toString()
}

export const fromNanoString = (s: string | undefined): undefined | Date => {
  if (!s) {
    return undefined
  }
  return nsToDate(Long.fromString(s))
}
