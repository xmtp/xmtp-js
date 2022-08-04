if (
  typeof window !== 'object' ||
  typeof navigator !== 'object' ||
  navigator.userAgent.includes('jsdom')
) {
  require('@stardazed/streams-polyfill')
}
