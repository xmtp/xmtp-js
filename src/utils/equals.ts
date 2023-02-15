export const deepEqual = <A>(x: A, y: A): boolean => {
  if (x === y) {
    return true
  } else if (
    typeof x === 'object' &&
    x != null &&
    typeof y === 'object' &&
    y != null
  ) {
    if (Object.keys(x).length !== Object.keys(y).length) return false

    for (const prop in x) {
      if (`${prop}` in y) {
        if (!deepEqual(x[prop], y[prop])) return false
      } else return false
    }
    return true
  } else return false
}
