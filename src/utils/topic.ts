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

// validate that a topic only contains ASCII characters
export const isValidTopic = (topic: string): boolean => {
  // eslint-disable-next-line no-control-regex
  const regex = /^[\x00-\x7F]+$/
  const index = topic.indexOf('0/')
  if (index !== -1) {
    const unwrappedTopic = topic.substring(
      index + 2,
      topic.lastIndexOf('/proto')
    )
    return regex.test(unwrappedTopic)
  }
  return false
}
