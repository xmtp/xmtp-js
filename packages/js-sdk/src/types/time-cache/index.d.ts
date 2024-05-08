/* eslint-disable @typescript-eslint/no-explicit-any */
declare class TimeCache {
  constructor(options: any)

  put(key: string, value: any): void
  prune(): void
  has(key: string): boolean
  get(key: string): any
  clear(): void
}

declare module 'time-cache' {
  export = TimeCache
}
