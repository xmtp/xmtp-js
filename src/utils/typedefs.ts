export type Flatten<T> = {
  [K in keyof T]: T[K]
}
