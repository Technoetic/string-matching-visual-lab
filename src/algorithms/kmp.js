// @MX:NOTE: KMP(Knuth–Morris–Pratt). 실패함수(failure/LPS)로 미스매치 시 텍스트 포인터를
// 되돌리지 않고 패턴 포인터만 점프시킨다. 핵심: "이미 일치한 부분은 다시 비교하지 않는다".
// 출처: step016_조사결과_chunk1 (Wikipedia KMP — T[i]=가장 긴 진접두사=접미사 길이).

/**
 * 실패함수(LPS: Longest Proper Prefix which is also Suffix) 테이블.
 * lps[i] = pattern[0..i] 에서 자기 자신을 제외한 "가장 긴 접두사이면서 접미사"의 길이.
 * @param {string} pattern
 * @returns {number[]}
 */
export function buildFailure(pattern) {
  const m = pattern.length
  const lps = new Array(m).fill(0)
  let len = 0
  let i = 1
  while (i < m) {
    if (pattern[i] === pattern[len]) {
      len++
      lps[i] = len
      i++
    } else if (len > 0) {
      len = lps[len - 1]
    } else {
      lps[i] = 0
      i++
    }
  }
  return lps
}

/**
 * @MX:ANCHOR 공통 반환 계약 준수. @MX:REASON Visualizer 재사용.
 * @param {string} text
 * @param {string} pattern
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
    return { matches, steps, comparisons, shifts, meta: { failure: [] } }
  }

  const lps = buildFailure(pattern)
  steps.push({
    type: 'build',
    textIndex: null,
    patIndex: null,
    alignStart: 0,
    table: lps.slice(),
    note: `실패함수(LPS)를 미리 계산했습니다: [${lps.join(', ')}]`,
  })

  let i = 0 // text 포인터 (절대 되돌아가지 않음)
  let j = 0 // pattern 포인터
  while (i < n) {
    comparisons++
    const equal = text[i] === pattern[j]
    steps.push({
      type: equal ? 'match' : 'mismatch',
      textIndex: i,
      patIndex: j,
      alignStart: i - j,
      table: lps.slice(),
      highlight: [j],
      note: `text[${i}]='${text[i]}' ${equal ? '=' : '≠'} pat[${j}]='${pattern[j]}'`,
    })
    if (equal) {
      i++
      j++
      if (j === m) {
        const start = i - j
        matches.push(start)
        steps.push({
          type: 'found',
          textIndex: start,
          patIndex: null,
          alignStart: start,
          table: lps.slice(),
          note: `위치 ${start}에서 패턴을 찾았습니다!`,
        })
        // @MX:NOTE: 매치 후에도 LPS로 다음 탐색 시작점을 잡아 텍스트를 되돌리지 않는다.
        j = lps[j - 1]
        shifts++
      }
    } else if (j > 0) {
      // @MX:NOTE: 미스매치 — text i는 고정, j만 lps[j-1]로 점프(Brute-force와의 결정적 차이).
      const nj = lps[j - 1]
      steps.push({
        type: 'shift',
        textIndex: i,
        patIndex: nj,
        alignStart: i - nj,
        table: lps.slice(),
        shift: j - nj,
        note: `불일치! 텍스트는 그대로 두고 패턴 포인터만 j=${j}→${nj}로 점프(LPS 활용).`,
      })
      j = nj
      shifts++
    } else {
      i++
      shifts++
    }
  }

  return { matches, steps, comparisons, shifts, meta: { failure: lps } }
}
