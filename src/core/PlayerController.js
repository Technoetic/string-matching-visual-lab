// @MX:NOTE: 재생 상태머신. steps 배열을 setTimeout 체인으로 소비하며 'step'/'end' 이벤트를 emit.
// EventTarget을 상속해 App이 구독한다(상속은 EventTarget 하나만 — 합성 우선 원칙).

export class PlayerController extends EventTarget {
  #steps = []
  #i = 0
  #ms = 600
  #isPlaying = false
  #timer = null
  // @MX:NOTE: 대기 중인 #sleep의 resolver. pause 시 이를 호출해야 await가 풀린다.
  // @MX:REASON clearTimeout만 하면 setTimeout 콜백(resolve)이 호출되지 않아 play()의 await가 영구 정지(dangling promise).
  #sleepResolve = null

  constructor({ stepMs = 600 } = {}) {
    super()
    this.#ms = stepMs
  }

  get index() {
    return this.#i
  }
  get total() {
    return this.#steps.length
  }
  get isPlaying() {
    return this.#isPlaying
  }
  get speed() {
    return this.#ms
  }

  load(steps) {
    this.pause()
    this.#steps = Array.isArray(steps) ? steps : []
    this.#i = 0
  }

  // @MX:WARN: 재생 중 입력/탭 변경 시 반드시 pause() 후 load()로 교체할 것.
  // @MX:REASON 진행 중 steps가 바뀌면 인덱스가 새 배열 범위를 벗어나 잘못된 step을 렌더할 수 있음.
  async play() {
    if (this.#isPlaying || this.#steps.length === 0) return
    if (this.#i >= this.#steps.length) this.#i = 0
    this.#isPlaying = true
    this.dispatchEvent(new Event('playstate'))
    while (this.#isPlaying && this.#i < this.#steps.length) {
      this.#emitCurrent()
      this.#i++
      if (this.#i >= this.#steps.length) break
      await this.#sleep(this.#ms)
    }
    this.#isPlaying = false
    this.dispatchEvent(new Event('playstate'))
    if (this.#i >= this.#steps.length && this.#steps.length > 0) {
      this.dispatchEvent(new Event('end'))
    }
  }

  pause() {
    this.#isPlaying = false
    if (this.#timer) {
      clearTimeout(this.#timer)
      this.#timer = null
    }
    // @MX:NOTE: 대기 중이던 #sleep을 즉시 resolve해 play()의 await가 풀리고 루프가 정상 종료되게 한다.
    if (this.#sleepResolve) {
      const resolve = this.#sleepResolve
      this.#sleepResolve = null
      resolve()
    }
    this.dispatchEvent(new Event('playstate'))
  }

  next() {
    this.pause()
    if (this.#i < this.#steps.length) {
      this.#emitCurrent()
      this.#i++
    }
  }

  prev() {
    this.pause()
    if (this.#i > 0) {
      this.#i--
    }
    if (this.#i >= 0 && this.#steps.length) {
      this.dispatchEvent(
        new CustomEvent('step', { detail: { step: this.#steps[this.#i], index: this.#i } }),
      )
    }
  }

  seek(i) {
    this.pause()
    this.#i = Math.max(0, Math.min(i, this.#steps.length - 1))
    if (this.#steps.length) {
      this.dispatchEvent(
        new CustomEvent('step', { detail: { step: this.#steps[this.#i], index: this.#i } }),
      )
    }
  }

  setSpeed(ms) {
    this.#ms = ms
  }

  #emitCurrent() {
    const step = this.#steps[this.#i]
    this.dispatchEvent(new CustomEvent('step', { detail: { step, index: this.#i } }))
  }

  #sleep(ms) {
    return new Promise((resolve) => {
      this.#sleepResolve = resolve
      this.#timer = setTimeout(() => {
        this.#sleepResolve = null
        resolve()
      }, ms)
    })
  }
}
