// @MX:NOTE core 클래스(DOM 무관 부분) 단위 테스트. MatchSession 상태 + PlayerController 재생 로직.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MatchSession } from '../src/core/MatchSession.js'
import { PlayerController } from '../src/core/PlayerController.js'

describe('MatchSession 상태 관리', () => {
  it('초기 text/pattern을 보관한다', () => {
    const s = new MatchSession('abc', 'b')
    expect(s.text).toBe('abc')
    expect(s.pattern).toBe('b')
    expect(s.stepIndex).toBe(0)
    expect(s.result).toBe(null)
  })

  it('setInput 시 result/stepIndex를 리셋한다', () => {
    const s = new MatchSession('abc', 'b')
    s.setResult({ matches: [1], steps: [], comparisons: 1, shifts: 0 })
    s.setStepIndex(5)
    s.setInput('xyz', 'z')
    expect(s.text).toBe('xyz')
    expect(s.pattern).toBe('z')
    expect(s.result).toBe(null)
    expect(s.stepIndex).toBe(0)
  })

  it('setAlgo 시 result를 리셋하고 algoKey를 바꾼다', () => {
    const s = new MatchSession('abc', 'b')
    s.setResult({ matches: [], steps: [] })
    s.setAlgo('kmp')
    expect(s.algoKey).toBe('kmp')
    expect(s.result).toBe(null)
  })

  it('reset은 result/stepIndex만 비우고 입력은 보존한다', () => {
    const s = new MatchSession('abc', 'b')
    s.setResult({ matches: [1], steps: [] })
    s.reset()
    expect(s.text).toBe('abc')
    expect(s.result).toBe(null)
    expect(s.stepIndex).toBe(0)
  })
})

describe('PlayerController 재생 로직', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const STEPS = [{ note: 'a' }, { note: 'b' }, { note: 'c' }]

  it('load 후 total/index가 올바르다', () => {
    const p = new PlayerController({ stepMs: 100 })
    p.load(STEPS)
    expect(p.total).toBe(3)
    expect(p.index).toBe(0)
    expect(p.isPlaying).toBe(false)
  })

  it('next는 step 이벤트를 emit하고 인덱스를 전진한다', () => {
    const p = new PlayerController({ stepMs: 100 })
    p.load(STEPS)
    const seen = []
    p.addEventListener('step', (e) => seen.push(e.detail.index))
    p.next()
    p.next()
    expect(seen).toEqual([0, 1])
  })

  it('prev는 인덱스를 되돌린다', () => {
    const p = new PlayerController({ stepMs: 100 })
    p.load(STEPS)
    p.next()
    p.next()
    const seen = []
    p.addEventListener('step', (e) => seen.push(e.detail.index))
    p.prev()
    expect(seen[seen.length - 1]).toBe(1)
  })

  it('seek는 범위를 클램프한다', () => {
    const p = new PlayerController({ stepMs: 100 })
    p.load(STEPS)
    const seen = []
    p.addEventListener('step', (e) => seen.push(e.detail.index))
    p.seek(99)
    expect(seen[seen.length - 1]).toBe(2) // total-1로 클램프
  })

  it('play는 모든 step을 순서대로 emit하고 end로 끝난다', async () => {
    const p = new PlayerController({ stepMs: 100 })
    p.load(STEPS)
    const seen = []
    let ended = false
    p.addEventListener('step', (e) => seen.push(e.detail.index))
    p.addEventListener('end', () => { ended = true })
    const playing = p.play()
    await vi.advanceTimersByTimeAsync(500)
    await playing
    expect(seen).toEqual([0, 1, 2])
    expect(ended).toBe(true)
    expect(p.isPlaying).toBe(false)
  })

  it('pause는 재생을 멈춘다', async () => {
    const p = new PlayerController({ stepMs: 100 })
    p.load(STEPS)
    const playing = p.play()
    await vi.advanceTimersByTimeAsync(100)
    p.pause()
    expect(p.isPlaying).toBe(false)
    await vi.advanceTimersByTimeAsync(500)
    await playing
  })

  it('빈 steps에서 play는 즉시 종료한다', async () => {
    const p = new PlayerController({ stepMs: 100 })
    p.load([])
    await p.play()
    expect(p.isPlaying).toBe(false)
  })

  // @MX:NOTE 회귀 테스트: pause dangling-promise 버그(step050 수정) 재발 방지.
  it('pause 직후 다시 play하면 남은 step을 이어서 재생한다', async () => {
    const p = new PlayerController({ stepMs: 100 })
    p.load(STEPS)
    const seen = []
    p.addEventListener('step', (e) => seen.push(e.detail.index))
    const first = p.play()
    await vi.advanceTimersByTimeAsync(100) // step0 emit, step1 대기 중
    p.pause()
    await first // ★ dangling promise였다면 여기서 hang → 버그 검출
    const second = p.play()
    await vi.advanceTimersByTimeAsync(500)
    await second
    expect(seen).toContain(2) // 끝까지 재생됨
    expect(p.isPlaying).toBe(false)
  })

  it('재생 중 load(입력 변경)하면 정지하고 새 steps로 교체한다', async () => {
    const p = new PlayerController({ stepMs: 100 })
    p.load(STEPS)
    const first = p.play()
    await vi.advanceTimersByTimeAsync(100)
    p.load([{ note: 'x' }, { note: 'y' }]) // load 내부에서 pause 호출
    await first // hang 없이 풀려야 함
    expect(p.isPlaying).toBe(false)
    expect(p.total).toBe(2)
    expect(p.index).toBe(0)
  })
})
