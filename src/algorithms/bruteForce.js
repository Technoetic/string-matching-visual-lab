// @MX:NOTE: Brute-force(Naive) 문자열 매칭. 모든 시작 위치에서 패턴을 처음부터 비교.
// 교육 목적상 "이미 본 칸을 또 본다"가 드러나도록 모든 비교를 steps로 기록한다.
// 출처: step016_조사결과_chunk1 (Wikipedia String-searching, GFG naive).

/**
 * @MX:ANCHOR 모든 알고리즘이 따르는 공통 반환 계약 (fan_in: Visualizer/Player/App/tests ≥ 3).
 * @MX:REASON Visualizer가 알고리즘 종류와 무관하게 steps를 재생하려면 형식이 불변이어야 함.
 * @param {string} text    검색 대상(haystack)
 * @param {string} pattern 찾을 패턴(needle)
 * @returns {{matches:number[], steps:object[], comparisons:number, shifts:number, meta:object}}
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
      note: '패턴이 비어 있습니다. 찾을 글자를 입력해 주세요.',
    })
    return { matches, steps, comparisons, shifts, meta: {} }
  }

  for (let s = 0; s + m <= n; s++) {
    shifts++
    let j = 0
    for (; j < m; j++) {
      comparisons++
      const equal = text[s + j] === pattern[j]
      steps.push({
        type: equal ? 'match' : 'mismatch',
        textIndex: s + j,
        patIndex: j,
        alignStart: s,
        note: `text[${s + j}]='${text[s + j]}' ${equal ? '=' : '≠'} pat[${j}]='${pattern[j]}' → ${equal ? '일치' : '불일치'}`,
      })
      if (!equal) break
    }
    if (j === m) {
      matches.push(s)
      steps.push({
        type: 'found',
        textIndex: s,
        patIndex: null,
        alignStart: s,
        note: `위치 ${s}에서 패턴을 찾았습니다!`,
      })
    } else {
      // @MX:NOTE: 불일치 시 단 한 칸만 전진 — Brute-force의 비효율(이미 본 칸 재검사)을 시각화.
      steps.push({
        type: 'shift',
        textIndex: null,
        patIndex: null,
        alignStart: s + 1,
        shift: 1,
        note: '한 칸 옆으로 밀어 처음부터 다시 비교합니다.',
      })
    }
  }

  return { matches, steps, comparisons, shifts, meta: {} }
}
