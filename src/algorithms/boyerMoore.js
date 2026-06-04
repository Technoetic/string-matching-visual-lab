// @MX:NOTE: Boyer–Moore(bad-character 규칙 단순화판). 패턴의 '끝'부터 거꾸로 비교하고,
// 불일치 시 여러 칸을 건너뛴다. v1은 초보자용으로 bad-character 규칙만 구현(good-suffix 생략).
// 출처: step016_조사결과_chunk1 (Wikipedia Boyer–Moore — tail부터 비교, jump).

/**
 * bad-character 테이블: 각 문자가 패턴에서 마지막으로 등장하는 인덱스.
 * @param {string} pattern
 * @returns {Map<string, number>}
 */
export function buildBadChar(pattern) {
  const table = new Map()
  for (let i = 0; i < pattern.length; i++) {
    table.set(pattern[i], i)
  }
  return table
}

/**
 * @MX:ANCHOR 공통 반환 계약 준수. @MX:REASON Visualizer 재사용.
 */
export function search(text, pattern) {
  const steps = []
  const matches = []
  const n = text.length
  const m = pattern.length
  let comparisons = 0
  let shifts = 0

  if (m === 0) {
    steps.push({
      type: 'build',
      textIndex: null,
      patIndex: null,
      alignStart: 0,
      note: '패턴이 비어 있습니다.',
    })
    return { matches, steps, comparisons, shifts, meta: { badChar: {} } }
  }

  const badChar = buildBadChar(pattern)
  const tableObj = Object.fromEntries(badChar)
  steps.push({
    type: 'build',
    textIndex: null,
    patIndex: null,
    alignStart: 0,
    meta: tableObj,
    note: '각 글자가 패턴에서 마지막으로 나오는 위치(bad-character 표)를 계산했습니다.',
  })

  let s = 0 // 현재 정렬(패턴 시작 위치)
  while (s + m <= n) {
    shifts++
    let j = m - 1
    // @MX:NOTE: 끝(j=m-1)에서 시작 — Boyer-Moore의 핵심(tail부터 비교).
    while (j >= 0) {
      comparisons++
      const tc = text[s + j]
      const equal = tc === pattern[j]
      steps.push({
        type: equal ? 'match' : 'mismatch',
        textIndex: s + j,
        patIndex: j,
        alignStart: s,
        note: `(끝→앞) text[${s + j}]='${tc}' ${equal ? '=' : '≠'} pat[${j}]='${pattern[j]}'`,
      })
      if (!equal) break
      j--
    }

    if (j < 0) {
      matches.push(s)
      steps.push({
        type: 'found',
        textIndex: s,
        patIndex: null,
        alignStart: s,
        note: `위치 ${s}에서 패턴을 찾았습니다!`,
      })
      s += 1
    } else {
      const tc = text[s + j]
      const last = badChar.has(tc) ? badChar.get(tc) : -1
      // bad-character 점프량 (최소 1칸 보장)
      const jump = Math.max(1, j - last)
      steps.push({
        type: 'shift',
        textIndex: null,
        patIndex: null,
        alignStart: s + jump,
        shift: jump,
        note: `불일치 글자 '${tc}' 기준으로 ${jump}칸 건너뜁니다(한 칸씩이 아니라 껑충!).`,
      })
      s += jump
    }
  }

  return { matches, steps, comparisons, shifts, meta: { badChar: tableObj } }
}
