export const normalizeSearchQuery = (value) => {
  if (typeof value !== 'string') return ''
  return value.normalize('NFC').trim()
}

const HANGUL_SYLLABLE_BASE = 0xac00
const HANGUL_SYLLABLE_END = 0xd7a3
const HANGUL_MEDIAL_COUNT = 21
const HANGUL_FINAL_COUNT = 28

const HANGUL_INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const HANGUL_MEDIALS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
const HANGUL_FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

const DUBEOLSIK_KEYS = {
  E: 'ㄸ',
  O: 'ㅒ',
  P: 'ㅖ',
  Q: 'ㅃ',
  R: 'ㄲ',
  T: 'ㅆ',
  W: 'ㅉ',
  a: 'ㅁ',
  b: 'ㅠ',
  c: 'ㅊ',
  d: 'ㅇ',
  e: 'ㄷ',
  f: 'ㄹ',
  g: 'ㅎ',
  h: 'ㅗ',
  i: 'ㅑ',
  j: 'ㅓ',
  k: 'ㅏ',
  l: 'ㅣ',
  m: 'ㅡ',
  n: 'ㅜ',
  o: 'ㅐ',
  p: 'ㅔ',
  q: 'ㅂ',
  r: 'ㄱ',
  s: 'ㄴ',
  t: 'ㅅ',
  u: 'ㅕ',
  v: 'ㅍ',
  w: 'ㅈ',
  x: 'ㅌ',
  y: 'ㅛ',
  z: 'ㅋ',
}

const COMPOUND_JAMO_KEYS = {
  ㄳ: 'ㄱㅅ',
  ㄵ: 'ㄴㅈ',
  ㄶ: 'ㄴㅎ',
  ㄺ: 'ㄹㄱ',
  ㄻ: 'ㄹㅁ',
  ㄼ: 'ㄹㅂ',
  ㄽ: 'ㄹㅅ',
  ㄾ: 'ㄹㅌ',
  ㄿ: 'ㄹㅍ',
  ㅀ: 'ㄹㅎ',
  ㅄ: 'ㅂㅅ',
  ㅘ: 'ㅗㅏ',
  ㅙ: 'ㅗㅐ',
  ㅚ: 'ㅗㅣ',
  ㅝ: 'ㅜㅓ',
  ㅞ: 'ㅜㅔ',
  ㅟ: 'ㅜㅣ',
  ㅢ: 'ㅡㅣ',
}

const decomposeHangulSyllable = (character) => {
  const codePoint = character.codePointAt(0)
  if (codePoint < HANGUL_SYLLABLE_BASE || codePoint > HANGUL_SYLLABLE_END) return character

  const syllableIndex = codePoint - HANGUL_SYLLABLE_BASE
  const initialIndex = Math.floor(syllableIndex / (HANGUL_MEDIAL_COUNT * HANGUL_FINAL_COUNT))
  const medialIndex = Math.floor((syllableIndex % (HANGUL_MEDIAL_COUNT * HANGUL_FINAL_COUNT)) / HANGUL_FINAL_COUNT)
  const finalIndex = syllableIndex % HANGUL_FINAL_COUNT

  return `${HANGUL_INITIALS[initialIndex]}${HANGUL_MEDIALS[medialIndex]}${HANGUL_FINALS[finalIndex]}`
}

const expandCompoundJamo = (value) =>
  Array.from(value)
    .map((character) => COMPOUND_JAMO_KEYS[character] ?? character)
    .join('')

const toKeyboardSequence = (value) =>
  Array.from(value)
    .map((character) => {
      const keyboardJamo = DUBEOLSIK_KEYS[character] ?? DUBEOLSIK_KEYS[character.toLowerCase()]
      return expandCompoundJamo(keyboardJamo ?? decomposeHangulSyllable(character))
    })
    .join('')

/**
 * 일반 포함 검색에 더해 초성, 완성 전 한글 음절, 두벌식 영문 오타를 허용한다.
 * 예: `ㅂ`, `부`, `부사`, `qntks` → `부산`
 */
export const matchesSearchQuery = (candidate, query) => {
  const normalizedCandidate = normalizeSearchQuery(candidate)
  const normalizedQuery = normalizeSearchQuery(query)
  const lowerCandidate = normalizedCandidate.toLocaleLowerCase('ko-KR')
  const lowerQuery = normalizedQuery.toLocaleLowerCase('ko-KR')

  if (!lowerQuery) return true
  if (!lowerCandidate) return false
  if (lowerCandidate.includes(lowerQuery)) return true

  return toKeyboardSequence(normalizedCandidate).includes(toKeyboardSequence(normalizedQuery))
}
