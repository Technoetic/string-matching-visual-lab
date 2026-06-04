// @MX:NOTE: Rabin–Karp. rolling hash로 윈도우 해시를 O(1)로 갱신하고, 해시가 같을 때만
// 실제 문자를 비교(spurious hit 대비). 출처: step016_조사결과_chunk1 (Wikipedia Rabin–Karp).

// @MX:NOTE: base=문자집합 크기 근사, mod=작은 소수(시각화 친화 — 해시 숫자가 작게 유지됨).
// @MX:REASON 교육용이라 큰 소수 대신 101을 써서 해시값을 한눈에 읽히게 한다(충돌은 전체 비교로 보정).
const BASE = 256
const MOD = 101

function hashOf(str, len) {
  let h = 0
  for (let i = 0; i < len; i++) {
    h = (h * BASE + str.charCodeAt(i)) % MOD
  }
  return h
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

  if (m === 0 || m > n) {
    steps.push({
      type: 'build',
      textIndex: null,
      patIndex: null,
      alignStart: 0,
      note: m === 0 ? '패턴이 비어 있습니다.' : '패턴이 텍스트보다 깁니다.',
    })
    return { matches, steps, comparisons, shifts, meta: {} }
  }

  // base^(m-1) % MOD (윈도우 앞 글자를 뺄 때 사용)
  let high = 1
  for (let i = 0; i < m - 1; i++) high = (high * BASE) % MOD

  const patHash = hashOf(pattern, m)
  let winHash = hashOf(text, m)
  steps.push({
    type: 'hash',
    textIndex: null,
    patIndex: null,
    alignStart: 0,
    hash: { window: winHash, pattern: patHash },
    note: `패턴 해시=${patHash}, 첫 윈도우 해시=${winHash} 를 계산했습니다.`,
  })

  for (let s = 0; s + m <= n; s++) {
    shifts++
    steps.push({
      type: 'hash',
      textIndex: s,
      patIndex: null,
      alignStart: s,
      hash: { window: winHash, pattern: patHash },
      note: `윈도우[${s}..${s + m - 1}] 해시=${winHash} vs 패턴 해시=${patHash}`,
    })

    if (winHash === patHash) {
      // @MX:NOTE: 해시 충돌(spurious hit) 가능 → 반드시 실제 문자 전체 비교로 확인.
      let k = 0
      for (; k < m; k++) {
        comparisons++
        const equal = text[s + k] === pattern[k]
        steps.push({
          type: equal ? 'match' : 'mismatch',
          textIndex: s + k,
          patIndex: k,
          alignStart: s,
          hash: { window: winHash, pattern: patHash },
          note: `해시가 같아 글자 확인: text[${s + k}]='${text[s + k]}' ${equal ? '=' : '≠'} pat[${k}]='${pattern[k]}'`,
        })
        if (!equal) break
      }
      if (k === m) {
        matches.push(s)
        steps.push({
          type: 'found',
          textIndex: s,
          patIndex: null,
          alignStart: s,
          hash: { window: winHash, pattern: patHash },
          note: `위치 ${s}에서 패턴을 찾았습니다!`,
        })
      }
    }

    // rolling hash: 다음 윈도우 해시 갱신 (나가는 글자 빼고, base 곱하고, 들어오는 글자 더함)
    if (s + m < n) {
      winHash = ((winHash - text.charCodeAt(s) * high) * BASE + text.charCodeAt(s + m)) % MOD
      if (winHash < 0) winHash += MOD
    }
  }

  return { matches, steps, comparisons, shifts, meta: { patHash, base: BASE, mod: MOD } }
}
