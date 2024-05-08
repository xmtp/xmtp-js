// Fully in-memory polyfill for the browser storage API.
// Borrowed from https://github.com/MitchellCash/node-storage-polyfill but implemented as a ponyfill instead of a polyfill

export default class LocalStoragePonyfill implements Storage {
  store: Map<string, string>
  constructor() {
    this.store = new Map()
  }

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store = new Map()
  }

  getItem(key: string): string | null {
    this.validateString(key)

    if (this.store.has(key)) {
      return String(this.store.get(key))
    }

    return null
  }

  key(index: number): string | null {
    if (index === undefined) {
      // This is the TypeError implemented in Chrome, Firefox throws "Storage.key: At least 1
      // argument required, but only 0 passed".
      throw new TypeError(
        "Failed to execute 'key' on 'Storage': 1 argument required, but only 0 present."
      )
    }

    const keys = [...this.store.keys()]

    if (index >= keys.length) {
      return null
    }

    return keys[index]
  }

  removeItem(key: string): void {
    this.validateString(key)
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.validateString(key)
    this.validateString(value)
    this.store.set(String(key), String(value))
  }

  private validateString(val: string): void {
    if (!(typeof val === 'string')) {
      throw new TypeError('Key must be a string')
    }
  }
}
