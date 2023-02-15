// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseObjectToUint8Array = (obj: any): Uint8Array => {
  if (typeof obj === 'object' && obj !== null) {
    if (obj instanceof Uint8Array) {
      return obj
    }
    if (obj instanceof ArrayBuffer) {
      return new Uint8Array(obj)
    }
    if (Array.isArray(obj)) {
      return new Uint8Array(obj)
    }
    if (obj instanceof Object) {
      if ('type' in obj && obj.type === 'Buffer') {
        return new Uint8Array(obj.data)
      }
      return new Uint8Array(Object.values(obj))
    }
    throw new Error('We could not parse the object to Uint8Array')
  } else {
    throw new Error('We could not parse the object to Uint8Array')
  }
}
