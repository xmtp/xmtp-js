export interface Persistence {
  getItem(key: string): Promise<Uint8Array | null>
  setItem(key: string, value: Uint8Array): Promise<void>
}
