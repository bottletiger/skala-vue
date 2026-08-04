const HANGUL_SYLLABLE_START = 0xac00
const HANGUL_SYLLABLE_END = 0xd7a3
const HANGUL_FINAL_CONSONANT_COUNT = 28

export const getKoreanSubjectParticle = (pronunciation) => {
  if (typeof pronunciation !== 'string') return ''

  const finalCharacter = Array.from(pronunciation.trim().normalize('NFC')).at(-1)
  if (!finalCharacter) return ''

  const codePoint = finalCharacter.codePointAt(0)
  if (codePoint < HANGUL_SYLLABLE_START || codePoint > HANGUL_SYLLABLE_END) return ''

  return (codePoint - HANGUL_SYLLABLE_START) % HANGUL_FINAL_CONSONANT_COUNT === 0 ? '가' : '이'
}

export const formatKoreanSelectionMessage = (displayName, pronunciation) => {
  const subjectParticle = getKoreanSubjectParticle(pronunciation)

  if (!subjectParticle) return `${displayName} 선택을 완료했습니다.`
  return `${displayName}${subjectParticle} 선택되었습니다.`
}
