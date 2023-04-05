import { utils } from 'ethers'

export const buildContentTopic = (name: string): string =>
  `/xmtp/1/${name}/proto`

// == Voodoo demo topics ==
export const buildVoodooUserContactTopic = (walletAddr: string): string => {
  // EIP55 normalize the address case.
  return buildContentTopic(`voodoo-contact-${utils.getAddress(walletAddr)}`)
}

export const buildVoodooUserInviteTopic = (walletAddr: string): string => {
  // EIP55 normalize the address case.
  return buildContentTopic(`voodoo-invite-${utils.getAddress(walletAddr)}`)
}

export const buildVoodooDirectMessageTopic = (randomString: string): string => {
  return buildContentTopic(`m-${randomString}`)
}

export const buildVoodooUserPrivateStoreTopic = (
  addrPrefixedKey: string
): string => {
  // e.g. "0x1111111111222222222233333333334444444444/key_bundle"
  return buildContentTopic(`voodoo-privatestore-${addrPrefixedKey}`)
}
