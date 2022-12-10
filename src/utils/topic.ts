import { utils } from 'ethers'

export const buildContentTopic = (name: string): string =>
  `/xmtp/0/${name}/proto`

export const buildDirectMessageTopic = (
  sender: string,
  recipient: string
): string => {
  // EIP55 normalize the address case.
  const members = [utils.getAddress(sender), utils.getAddress(recipient)]
  members.sort()
  return buildContentTopic(`dm-${members.join('-')}`)
}

export const buildDirectMessageTopicV2 = (randomString: string): string => {
  return buildContentTopic(`m-${randomString}`)
}

export const buildUserContactTopic = (walletAddr: string): string => {
  // EIP55 normalize the address case.
  return buildContentTopic(`contact-${utils.getAddress(walletAddr)}`)
}

export const buildUserIntroTopic = (walletAddr: string): string => {
  // EIP55 normalize the address case.
  return buildContentTopic(`intro-${utils.getAddress(walletAddr)}`)
}

export const buildUserInviteTopic = (walletAddr: string): string => {
  // EIP55 normalize the address case.
  return buildContentTopic(`invite-${utils.getAddress(walletAddr)}`)
}
export const buildUserPrivateStoreTopic = (addrPrefixedKey: string): string => {
  // e.g. "0x1111111111222222222233333333334444444444/key_bundle"
  return buildContentTopic(`privatestore-${addrPrefixedKey}`)
}
