if (
  typeof window !== 'object' ||
  typeof navigator !== 'object' ||
  navigator.userAgent.includes('jsdom') ||
  typeof fetch === 'undefined'
) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { fetch, Request, Response, Headers } = require('undici')
  global.fetch = fetch
  global.Request = Request
  global.Response = Response
  global.Headers = Headers
}
