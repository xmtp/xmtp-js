export const testProviderOptions = (
  privateKeyOverride = undefined,
  persistConversations = false
) => ({
  env: 'local' as const,
  persistConversations,
  privateKeyOverride,
})
