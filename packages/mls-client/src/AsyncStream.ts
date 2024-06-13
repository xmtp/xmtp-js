type ResolveValue<T> = {
  value: T | undefined
  done: boolean
}

type ResolveNext<T> = (resolveValue: ResolveValue<T>) => void

export type StreamCallback<T> = (err: Error | null, value: T) => void

export class AsyncStream<T> {
  #done = false
  #resolveNext: ResolveNext<T> | null
  #queue: T[]

  stopCallback: (() => void) | undefined = undefined

  constructor() {
    this.#queue = []
    this.#resolveNext = null
    this.#done = false
  }

  get isDone() {
    return this.#done
  }

  callback: StreamCallback<T> = (err, value) => {
    if (err) {
      console.error('stream error', err)
      this.stop()
      return
    }

    if (this.#done) {
      return
    }

    if (this.#resolveNext) {
      this.#resolveNext({ value, done: false })
      this.#resolveNext = null
    } else {
      this.#queue.push(value)
    }
  }

  stop = () => {
    this.#done = true
    if (this.#resolveNext) {
      this.#resolveNext({ value: undefined, done: true })
    }
    this.stopCallback?.()
  }

  next = (): Promise<ResolveValue<T>> => {
    if (this.#queue.length > 0) {
      return Promise.resolve({ value: this.#queue.shift(), done: false })
    } else if (this.#done) {
      return Promise.resolve({ value: undefined, done: true })
    } else {
      return new Promise((resolve) => {
        this.#resolveNext = resolve
      })
    }
  };

  [Symbol.asyncIterator]() {
    return this
  }
}
