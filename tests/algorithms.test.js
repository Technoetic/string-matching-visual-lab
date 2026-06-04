// @MX:NOTE 알고리즘 정확성 테스트. 모든 알고리즘이 naive 기준 결과와 동일한 matches를 내는지 검증.
import { describe, it, expect } from 'vitest'
import { ALGORITHMS, ALGORITHM_ORDER } from '../src/algorithms/index.js'
import { buildFailure } from '../src/algorithms/kmp.js'
import { buildBadChar } from '../src/algorithms/boyerMoore.js'

// 레퍼런스 naive 구현(테스트 기준)
function naive(text, pattern) {
  const r = []
  if (!pattern) return r
  for (let s = 0; s + pattern.length <= text.length; s++) {
    let ok = true
    for (let j = 0; j < pattern.length; j++) {
      if (text[s + j] !== pattern[j]) { ok = false; break }
    }
    if (ok) r.push(s)
  }
  return r
}

const CASES = [
  ['ABABABCABABABCAB', 'ABABCAB'],
  ['AAAAAA', 'AA'],
  ['hello world hello', 'hello'],
  ['abracadabra', 'abra'],
  ['xyz', 'a'],
  ['mississippi', 'issi'],
  ['the cat sat on the mat', 'the'],
  ['ACGTACGTGACGTACG', 'GACG'],
  ['aaaaab', 'aaab'],
  ['', 'a'],
  ['abc', ''],
  ['abc', 'abcd'],
  ['aabaabaaab', 'aabaaab'],
]

describe('모든 알고리즘이 naive와 동일한 matches를 반환한다', () => {
  for (const key of ALGORITHM_ORDER) {
    describe(ALGORITHMS[key].name, () => {
      for (const [text, pattern] of CASES) {
        it(`text="${text}" pattern="${pattern}"`, () => {
          const expected = naive(text, pattern)
          const got = ALGORITHMS[key].search(text, pattern).matches
          expect(got).toEqual(expected)
        })
      }
    })
  }
})

describe('반환 계약(SearchResult) 형식', () => {
  for (const key of ALGORITHM_ORDER) {
    it(`${ALGORITHMS[key].name}: matches/steps/comparisons/shifts 필드 존재`, () => {
      const r = ALGORITHMS[key].search('ABABCAB', 'ABC')
      expect(Array.isArray(r.matches)).toBe(true)
      expect(Array.isArray(r.steps)).toBe(true)
      expect(typeof r.comparisons).toBe('number')
      expect(typeof r.shifts).toBe('number')
    })
  }
})

describe('모든 step은 초보자용 note를 가진다', () => {
  for (const key of ALGORITHM_ORDER) {
    it(`${ALGORITHMS[key].name}: 모든 step.note가 비어 있지 않다`, () => {
      const r = ALGORITHMS[key].search('ABABABCABABABCAB', 'ABABCAB')
      expect(r.steps.length).toBeGreaterThan(0)
      for (const s of r.steps) expect(typeof s.note === 'string' && s.note.length > 0).toBe(true)
    })
  }
})

describe('KMP는 적절한 입력에서 Brute-force보다 비교 횟수가 적거나 같다', () => {
  it('반복 패턴 입력에서 KMP comparisons ≤ Brute-force comparisons', () => {
    const text = 'AAAAAAAAAAAAAAAAAAAB'
    const pattern = 'AAAAB'
    const brute = ALGORITHMS.bruteForce.search(text, pattern).comparisons
    const kmp = ALGORITHMS.kmp.search(text, pattern).comparisons
    expect(kmp).toBeLessThanOrEqual(brute)
  })
})

describe('엣지케이스: 빈 패턴/긴 패턴', () => {
  for (const key of ALGORITHM_ORDER) {
    it(`${ALGORITHMS[key].name}: 빈 패턴이면 matches=[]`, () => {
      expect(ALGORITHMS[key].search('abc', '').matches).toEqual([])
    })
    it(`${ALGORITHMS[key].name}: 패턴이 텍스트보다 길면 matches=[]`, () => {
      expect(ALGORITHMS[key].search('abc', 'abcd').matches).toEqual([])
    })
  }
})

describe('KMP 실패함수(LPS) buildFailure', () => {
  it('ABABCAB → [0,0,1,2,0,1,2]', () => {
    expect(buildFailure('ABABCAB')).toEqual([0, 0, 1, 2, 0, 1, 2])
  })
  it('AAAA → [0,1,2,3]', () => {
    expect(buildFailure('AAAA')).toEqual([0, 1, 2, 3])
  })
  it('ABCDE(반복 없음) → [0,0,0,0,0]', () => {
    expect(buildFailure('ABCDE')).toEqual([0, 0, 0, 0, 0])
  })
})

describe('Boyer-Moore bad-character buildBadChar', () => {
  it('각 글자가 패턴에서 마지막으로 등장하는 인덱스를 담는다', () => {
    const t = buildBadChar('ABCAB')
    expect(t.get('A')).toBe(3)
    expect(t.get('B')).toBe(4)
    expect(t.get('C')).toBe(2)
    expect(t.has('Z')).toBe(false)
  })
})

describe('Rabin-Karp 세부 경로 (해시 매치/롤링/음수 보정)', () => {
  const { search } = ALGORITHMS.rabinKarp

  it('해시 일치 후 실제 문자 비교로 매치를 찾는다', () => {
    const r = search('abracadabra', 'abra')
    expect(r.matches).toEqual([0, 7])
    // 매치 시 실제 문자 비교 step(match/mismatch)이 존재해야 함
    expect(r.steps.some((s) => s.type === 'match')).toBe(true)
    expect(r.steps.some((s) => s.type === 'found')).toBe(true)
  })

  it('해시는 같지만 글자가 다른 경우(spurious hit) mismatch 분기를 탄다', () => {
    // 다양한 입력에서 rolling hash가 음수 보정/충돌 분기를 거치도록 충분히 긴 텍스트
    const text = 'the quick brown fox jumps over the lazy dog the end'
    const r = search(text, 'the')
    // naive와 동일해야 함
    const exp = []
    for (let s = 0; s + 3 <= text.length; s++) if (text.slice(s, s + 3) === 'the') exp.push(s)
    expect(r.matches).toEqual(exp)
  })

  it('롤링 해시 음수 보정 경로: 큰 charCode가 빠지는 입력', () => {
    // 높은 코드포인트(한글)가 윈도우에서 빠질 때 winHash 음수 → +MOD 보정 경로
    const r = search('가나다라마바사', '다라마')
    expect(r.matches).toEqual([2])
  })
})
