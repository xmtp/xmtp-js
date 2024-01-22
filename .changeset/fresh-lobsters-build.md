---
"@xmtp/experimental-content-type-screen-effect": patch
"@xmtp/content-type-reaction": patch
"@xmtp/content-type-read-receipt": patch
"@xmtp/content-type-remote-attachment": patch
"@xmtp/content-type-reply": patch
---

- Updated Turbo config to remove `generate:types` command and instead rely on `build`
- Removed all `generate:types` commands from `package.json` files
- Updated shared ESLint config and local ESLint configs
- Updated `include` field of `tsconfig.json` and `tsconfig.eslint.json` files
- Replaced `tsup` with `rollup`
