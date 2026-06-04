// @MX:NOTE: 오케스트레이션. 입력/탭/재생/키보드 이벤트를 받아 엔진 호출 → Player/Visualizer 연결.
// 합성: App이 MatchSession/Visualizer/PlayerController 인스턴스를 생성·주입한다(전역 상태 없음).

import { ALGORITHM_ORDER, ALGORITHMS } from '../algorithms/index.js'
import { algoTabs, inputBox, playControls, presets, statBadges } from '../ui/components.js'
import { el } from '../ui/dom.js'
import { MatchSession } from './MatchSession.js'
import { PlayerController } from './PlayerController.js'
import { Visualizer } from './Visualizer.js'

// @MX:NOTE: 대중 앱 사례 기반 프리셋(step016 real_world_apps). 초보자 진입장벽↓.
const PRESETS = [
  { label: '기본 예시 (ABAB…)', text: 'ABABABCABABABCAB', pattern: 'ABABCAB' },
  { label: '문장에서 단어 찾기', text: 'the cat sat on the mat', pattern: 'the' },
  { label: 'DNA 서열 (A C G T)', text: 'ACGTACGTGACGTACG', pattern: 'GACG' },
  { label: '반복 글자 (최악의 경우)', text: 'AAAAAAAAAB', pattern: 'AAAB' },
]

const TEXT_HARD_CAP = 500

export class App {
  #mount
  #session
  #viz
  #player
  #els = {}
  #lastComparisons = {} // 알고리즘별 직전 비교 횟수(비교 학습용)

  constructor(mountEl) {
    this.#mount = mountEl
    this.#session = new MatchSession(PRESETS[0].text, PRESETS[0].pattern)
    this.#player = new PlayerController({ stepMs: 600 })
  }

  async init() {
    this.#buildDom()
    this.#viz = new Visualizer({
      gridEl: this.#els.grid,
      auxEl: this.#els.aux,
      noteEl: this.#els.note,
    })

    // Player 이벤트 → Visualizer / UI
    this.#player.addEventListener('step', (/** @type {CustomEvent} */ e) => {
      this.#viz.renderStep(e.detail.step)
      this.#updateProgress()
    })
    this.#player.addEventListener('playstate', () => this.#syncPlayButton())
    this.#player.addEventListener('end', () => this.#syncPlayButton())

    this.#bindKeyboard()
    this.run(this.#session.algoKey)
  }

  #buildDom() {
    const tabs = algoTabs(this.#session.algoKey, (key) => this.#onSelectAlgo(key))
    const player = playControls({
      toggle: () => this.#togglePlay(),
      first: () => this.#player.seek(0),
      prev: () => this.#player.prev(),
      next: () => this.#player.next(),
      speed: (ms) => this.#player.setSpeed(ms),
    })
    const stats = statBadges()

    const controls = el('section', { className: 'control', 'aria-label': '조작' }, [
      el('div', { className: 'control__inputs' }, [
        inputBox('inp-text', '텍스트(Text)', this.#session.text, (v) => this.#onInput('text', v)),
        inputBox('inp-pattern', '패턴(Pattern)', this.#session.pattern, (v) =>
          this.#onInput('pattern', v),
        ),
        presets(PRESETS, (i) => this.#applyPreset(i)),
      ]),
      tabs,
      el('div', { className: 'control__play' }, [player, stats]),
    ])

    const grid = el('div', { className: 'grid', 'aria-label': '시각화' })
    const aux = el('aside', { className: 'aux', 'aria-label': '보조 정보' })
    const note = el('p', { className: 'note', 'aria-live': 'polite' })
    const explain = el('section', { className: 'explain' })

    const viz = el('section', { className: 'viz' }, [grid])

    this.#mount.append(controls, viz, aux, note, explain)
    Object.assign(this.#els, {
      tabs,
      player,
      stats,
      grid,
      aux,
      note,
      explain,
      textInput: controls.querySelector('#inp-text'),
      patternInput: controls.querySelector('#inp-pattern'),
    })
    this.#renderExplain()
  }

  #onInput(which, value) {
    let text = which === 'text' ? value : this.#session.text
    const pattern = which === 'pattern' ? value : this.#session.pattern
    if (text.length > TEXT_HARD_CAP) text = text.slice(0, TEXT_HARD_CAP)
    this.#session.setInput(text, pattern)
    this.run(this.#session.algoKey)
  }

  #applyPreset(i) {
    const p = PRESETS[i]
    if (!p) return
    this.#session.setInput(p.text, p.pattern)
    this.#els.textInput.value = p.text
    this.#els.patternInput.value = p.pattern
    this.run(this.#session.algoKey)
  }

  #onSelectAlgo(key) {
    this.#session.setAlgo(key)
    this.#syncTabs(key)
    this.run(key)
  }

  setInput(text, pattern) {
    this.#session.setInput(text, pattern)
    this.run(this.#session.algoKey)
  }

  // @MX:WARN: run은 항상 player.pause→load 순서로 상태를 교체한다.
  // @MX:REASON 재생 중 입력/탭 변경 시 인덱스 불일치를 막기 위함.
  run(algoKey) {
    const { text, pattern } = this.#session
    // @MX:NOTE: 알 수 없는 algoKey 방어 — 잘못된 키면 기본 알고리즘으로 폴백(앱이 죽지 않게).
    const algo = ALGORITHMS[algoKey] ?? ALGORITHMS.bruteForce
    if (!ALGORITHMS[algoKey]) {
      algoKey = 'bruteForce'
      this.#session.setAlgo(algoKey)
    }
    let result
    try {
      result = algo.search(text, pattern)
    } catch (err) {
      // @MX:WARN: 알고리즘 계산 실패 시 빈 결과로 안전 폴백 + 사용자 안내(앱 중단 방지).
      // @MX:REASON 학습용 도구가 예외로 멈추면 학습 흐름이 끊긴다.
      console.error('[search]', err)
      result = { matches: [], steps: [{ type: 'build', note: '계산 중 문제가 발생했습니다. 입력을 확인해 주세요.', alignStart: 0, textIndex: null, patIndex: null }], comparisons: 0, shifts: 0, meta: {} }
    }
    this.#session.setResult(result)

    this.#viz.setAlgo(algoKey)
    this.#viz.setInput(text, pattern)
    this.#player.load(result.steps)

    // 통계 갱신 + 알고리즘 간 비교
    this.#lastComparisons[algoKey] = result.comparisons
    this.#updateStats(result, algoKey)
    this.#renderExplain()

    // 첫 step을 즉시 표시(정적 미리보기)
    if (result.steps.length) this.#player.seek(0)
  }

  #togglePlay() {
    if (this.#player.isPlaying) this.#player.pause()
    else this.#player.play()
  }

  #syncPlayButton() {
    const btn = this.#els.player.querySelector('.pbtn--play')
    if (btn) btn.textContent = this.#player.isPlaying ? '⏸' : '▶'
  }

  #syncTabs(activeKey) {
    this.#els.tabs.querySelectorAll('.tab').forEach((t) => {
      const on = t.dataset.key === activeKey
      t.classList.toggle('tab--active', on)
      t.setAttribute('aria-selected', on ? 'true' : 'false')
    })
  }

  #updateStats(result, algoKey) {
    const set = (k, v) => {
      const e = this.#els.stats.querySelector(`[data-stat="${k}"]`)
      if (e) e.textContent = v
    }
    set('comparisons', String(result.comparisons))
    set('shifts', String(result.shifts))
    // Brute-force 대비 비교 횟수 대비 메시지
    const brute = this.#lastComparisons.bruteForce
    if (algoKey !== 'bruteForce' && brute != null && result.comparisons <= brute) {
      set(
        'compareNote',
        `Brute-force ${brute}회 → ${ALGORITHMS[algoKey].name} ${result.comparisons}회`,
      )
    } else {
      set('compareNote', '')
    }
  }

  #updateProgress() {
    const bar = this.#els.player.querySelector('.progress__bar')
    if (bar && this.#player.total) {
      bar.style.width = `${((this.#player.index + 1) / this.#player.total) * 100}%`
    }
  }

  #renderExplain() {
    const a = ALGORITHMS[this.#session.algoKey]
    this.#els.explain.replaceChildren(
      el('h2', { className: 'explain__title', text: `${a.name} — ${a.short}` }),
      el('p', { className: 'explain__idea', text: a.idea }),
      el('table', { className: 'cx' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', { text: '전처리' }),
            el('th', { text: '평균' }),
            el('th', { text: '최악' }),
          ]),
        ]),
        el('tbody', {}, [
          el('tr', {}, [
            el('td', { text: a.complexity.pre }),
            el('td', { text: a.complexity.avg }),
            el('td', { text: a.complexity.worst }),
          ]),
        ]),
      ]),
    )
  }

  #bindKeyboard() {
    window.addEventListener(
      'keydown',
      (e) => {
        const target = e.target
        if (target instanceof Element && target.matches('input, select, textarea')) return
        if (e.code === 'Space') {
          e.preventDefault()
          this.#togglePlay()
        } else if (e.code === 'ArrowRight') {
          e.preventDefault()
          this.#player.next()
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault()
          this.#player.prev()
        } else if (/^Digit[1-4]$/.test(e.code)) {
          const idx = Number(e.code.slice(5)) - 1
          if (ALGORITHM_ORDER[idx]) this.#onSelectAlgo(ALGORITHM_ORDER[idx])
        }
      },
      { passive: false },
    )
  }
}
