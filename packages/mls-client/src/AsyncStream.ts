type Value<T, V> = V extends undefined ? T : V

type ResolveValue<T, V> = {
  value: Value<T, V> | undefined
  done: boolean
}

type ResolveNext<T, V> = (resolveValue: ResolveValue<T, V>) => void

type TransformValue<T, V> = (value: T) => Value<T, V>

export class AsyncStream<T, V = undefined> {
  #done = false
  #resolveNext: ResolveNext<T, V> | null
  #queue: Value<T, V>[]
  #transformValue?: TransformValue<T, V>

  stopCallback: (() => void) | undefined = undefined

  constructor(
    transformValue: V extends undefined ? undefined : TransformValue<T, V>
  ) {
    this.#queue = []
    this.#resolveNext = null
    this.#done = false
    this.#transformValue = transformValue
  }

  callback = (err: Error | null, value: T) => {
    if (err) {
      console.error('stream error', err)
      this.stop()
      return
    }

    if (this.#done) {
      return
    }

    const newValue = this.#transformValue
      ? this.#transformValue(value)
      : // must assert type because TypeScript can't infer that T is assignable
        // to Value<T, V> when this.#transformValue is undefined
        (value as unknown as Value<T, V>)

    if (this.#resolveNext) {
      this.#resolveNext({ value: newValue, done: false })
      this.#resolveNext = null
    } else {
      this.#queue.push(newValue)
    }
  }

  stop = () => {
    this.#done = true
    if (this.#resolveNext) {
      this.#resolveNext({ value: undefined, done: true })
    }
    this.stopCallback?.()
  }

  next = (): Promise<ResolveValue<T, V>> => {
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
