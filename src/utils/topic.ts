export const buildContentTopic = (name: string): string =>
  `/xmtp/0/${name}/proto`

export const buildDirectMessageTopic = (
  sender: string,
  recipient: string
): string => {
  const members = [sender, recipient]
  members.sort()
  return buildContentTopic(`dm-${members.join('-')}`)
}

export const buildDirectMessageTopicV2 = (randomString: string): string => {
  return buildContentTopic(`m-${randomString}`)
}

export const buildUserContactTopic = (walletAddr: string): string => {
  return buildContentTopic(`contact-${walletAddr}`)
}

export const buildUserIntroTopic = (walletAddr: string): string => {
  return buildContentTopic(`intro-${walletAddr}`)
}

export const buildUserInviteTopic = (walletAddr: string): string => {
  return buildContentTopic(`invite-${walletAddr}`)
}
export const buildUserPrivateStoreTopic = (walletAddr: string): string => {
  return buildContentTopic(`privatestore-${walletAddr}`)
}
