// @MX:NOTE 통합 테스트: 알고리즘 → PlayerController 연결 + Step 스키마 계약(모듈 간 인터페이스).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ALGORITHMS, ALGORITHM_ORDER } from '../src/algorithms/index.js'
import { PlayerController } from '../src/core/PlayerController.js'
import { MatchSession } from '../src/core/MatchSession.js'

const VALID_TYPES = new Set(['build', 'compare', 'match', 'mismatch', 'shift', 'found', 'hash'])

describe('통합: Step 이벤트 스키마 계약 (모든 알고리즘 공통)', () => {
  for (const key of ALGORITHM_ORDER) {
    it(`${ALGORITHMS[key].name}: 모든 step이 계약(type/note/alignStart)을 만족한다`, () => {
      const r = ALGORITHMS[key].search('ABABABCABABABCAB', 'ABABCAB')
      for (const s of r.steps) {
        expect(VALID_TYPES.has(s.type)).toBe(true)
        expect(typeof s.note).toBe('string')
        expect(s.note.length).toBeGreaterThan(0)
        expect(typeof s.alignStart).toBe('number')
        // textIndex/patIndex는 number 또는 null
        expect(s.textIndex === null || typeof s.textIndex === 'number').toBe(true)
        expect(s.patIndex === null || typeof s.patIndex === 'number').toBe(true)
      }
    })
  }
})

describe('통합: 알고리즘 결과 → PlayerController 소비', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  for (const key of ALGORITHM_ORDER) {
    it(`${ALGORITHMS[key].name}: search().steps를 Player가 끝까지 재생한다`, async () => {
      const result = ALGORITHMS[key].search('ABABABCABABABCAB', 'ABABCAB')
      const player = new PlayerController({ stepMs: 10 })
      player.load(result.steps)
      const emitted = []
      let ended = false
      player.addEventListener('step', (e) => emitted.push(e.detail.step))
      player.addEventListener('end', () => { ended = true })
      const playing = player.play()
      await vi.advanceTimersByTimeAsync(result.steps.length * 10 + 50)
      await playing
      expect(emitted.length).toBe(result.steps.length)
      expect(ended).toBe(true)
      // 마지막 emit된 step이 결과의 마지막 step과 동일(연결 무결성)
      expect(emitted[emitted.length - 1]).toBe(result.steps[result.steps.length - 1])
    })
  }
})

describe('통합: MatchSession ↔ 알고리즘 결과 연동', () => {
  it('session에 결과를 담고 알고리즘 전환 시 리셋된다', () => {
    const session = new MatchSession('ABABCAB', 'ABC')
    const r1 = ALGORITHMS.bruteForce.search(session.text, session.pattern)
    session.setResult(r1)
    expect(session.result.matches).toEqual(r1.matches)
    expect(session.stepIndex).toBe(0)

    session.setAlgo('kmp')
    expect(session.result).toBe(null) // 알고리즘 전환 시 결과 리셋(재계산 유도)
    expect(session.algoKey).toBe('kmp')
  })
})
