// @MX:NOTE: 단일 상태 소스. text/pattern/result/stepIndex를 한 곳에 모아 상태 충돌을 줄인다.
// (설계 대안 A + B의 '단일 상태 소스' 부분 차용 — step030_설계선택.)

export class MatchSession {
  #text = ''
  #pattern = ''
  #result = null
  #stepIndex = 0
  #algoKey = 'bruteForce'

  constructor(text = '', pattern = '') {
    this.#text = text
    this.#pattern = pattern
  }

  get text() {
    return this.#text
  }
  get pattern() {
    return this.#pattern
  }
  get result() {
    return this.#result
  }
  get stepIndex() {
    return this.#stepIndex
  }
  get algoKey() {
    return this.#algoKey
  }

  setInput(text, pattern) {
    this.#text = text
    this.#pattern = pattern
    this.#result = null
    this.#stepIndex = 0
  }

  setAlgo(algoKey) {
    this.#algoKey = algoKey
    this.#result = null
    this.#stepIndex = 0
  }

  setResult(result) {
    this.#result = result
    this.#stepIndex = 0
  }

  setStepIndex(i) {
    this.#stepIndex = i
  }

  reset() {
    this.#result = null
    this.#stepIndex = 0
  }
}
