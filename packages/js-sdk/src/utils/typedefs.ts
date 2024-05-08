export type Flatten<T> = {
  [K in keyof T]: T[K]
}

export type WithoutUndefined<T> = { [P in keyof T]: NonNullable<T[P]> }
