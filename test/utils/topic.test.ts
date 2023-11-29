import { buildContentTopic, isValidTopic } from '../../src/utils/topic'

describe('topic utils', () => {
  describe('isValidTopic', () => {
    it('validates topics correctly', () => {
      expect(isValidTopic(buildContentTopic('foo'))).toBe(true)
      expect(isValidTopic(buildContentTopic('123'))).toBe(true)
      expect(isValidTopic(buildContentTopic('bar987'))).toBe(true)
      expect(isValidTopic(buildContentTopic('*&+-)'))).toBe(true)
      expect(isValidTopic(buildContentTopic('%#@='))).toBe(true)
      expect(isValidTopic(buildContentTopic('<;.">'))).toBe(true)
      expect(isValidTopic(buildContentTopic(String.fromCharCode(33)))).toBe(
        true
      )
      expect(isValidTopic(buildContentTopic('∫ß'))).toBe(false)
      expect(isValidTopic(buildContentTopic('\xA9'))).toBe(false)
      expect(isValidTopic(buildContentTopic('\u2665'))).toBe(false)
      expect(isValidTopic(buildContentTopic(String.fromCharCode(1)))).toBe(
        false
      )
      expect(isValidTopic(buildContentTopic(String.fromCharCode(23)))).toBe(
        false
      )
    })
  })
})
