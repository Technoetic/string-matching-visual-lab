// @MX:NOTE: 명령형 시각화 렌더러. steps를 1개씩 받아 셀/포인터/보조패널/설명을 갱신한다.
// renderStep은 idempotent(같은 step을 다시 줘도 동일 결과) — Player의 seek/prev에 안전.

import { ALGORITHMS } from '../algorithms/index.js'
import { cell } from '../ui/components.js'
import { el } from '../ui/dom.js'

export class Visualizer {
  #gridEl
  #auxEl
  #noteEl
  #pattern = ''
  #algoKey = 'bruteForce'

  constructor({ gridEl, auxEl, noteEl }) {
    this.#gridEl = gridEl
    this.#auxEl = auxEl
    this.#noteEl = noteEl
  }

  setAlgo(algoKey) {
    this.#algoKey = algoKey
  }

  /** 입력으로 셀 그리드를 새로 그린다. */
  setInput(text, pattern) {
    this.#pattern = pattern
    this.#gridEl.replaceChildren()

    if (!text) {
      this.#gridEl.append(el('p', { className: 'empty', text: '검색할 텍스트를 입력해 주세요.' }))
      this.#renderAuxEmpty()
      this.setNote('')
      return
    }

    const textRow = el(
      'div',
      { className: 'row row--text', role: 'list', 'aria-label': '텍스트' },
      [...text].map((ch, i) => cell(ch, i, 'text')),
    )
    const patternRow = el(
      'div',
      { className: 'row row--pattern', role: 'list', 'aria-label': '패턴' },
      pattern ? [...pattern].map((ch, i) => cell(ch, i, 'pattern')) : [],
    )

    // pattern 행을 alignStart=0에 정렬
    this.#gridEl.append(
      el('div', { className: 'rowwrap' }, [
        el('span', { className: 'rowwrap__tag', text: 'T' }),
        textRow,
      ]),
      el('div', { className: 'rowwrap' }, [
        el('span', { className: 'rowwrap__tag', text: 'P' }),
        patternRow,
      ]),
    )
    this.#patternRow = patternRow
    this.#alignPattern(0)
    if (!pattern) {
      this.#renderAuxEmpty()
      this.setNote('찾을 패턴을 입력해 주세요.')
    }
  }

  #patternRow = null

  #alignPattern(alignStart) {
    if (this.#patternRow) {
      // 셀 폭(--cell-w) + gap(--cell-gap) 단위로 이동
      this.#patternRow.style.transform = `translateX(calc((var(--cell-w) + var(--cell-gap)) * ${alignStart}))`
    }
  }

  /** 단일 step 반영. */
  renderStep(step) {
    if (!step) return
    // 모든 text 셀 상태 초기화(active/match/mismatch는 매 step 재계산 → idempotent)
    const textCells = this.#gridEl.querySelectorAll('.cell--text')
    const patCells = this.#gridEl.querySelectorAll('.cell--pattern')

    // alignStart 반영(패턴 위치 이동)
    if (typeof step.alignStart === 'number') this.#alignPattern(step.alignStart)

    // 이전 active만 제거(visited는 누적 유지)
    for (const c of textCells) {
      c.classList.remove('cell--active', 'cell--match', 'cell--mismatch', 'cell--found')
    }
    for (const c of patCells) {
      c.classList.remove('cell--active', 'cell--match', 'cell--mismatch')
    }

    if (typeof step.textIndex === 'number' && textCells[step.textIndex]) {
      const cls =
        step.type === 'match'
          ? 'cell--match'
          : step.type === 'mismatch'
            ? 'cell--mismatch'
            : step.type === 'found'
              ? 'cell--found'
              : 'cell--active'
      textCells[step.textIndex].classList.add(cls)
      if (step.type === 'match' || step.type === 'mismatch')
        textCells[step.textIndex].classList.add('cell--visited')
    }
    if (typeof step.patIndex === 'number' && patCells[step.patIndex]) {
      const cls =
        step.type === 'match'
          ? 'cell--match'
          : step.type === 'mismatch'
            ? 'cell--mismatch'
            : 'cell--active'
      patCells[step.patIndex].classList.add(cls)
    }
    if (step.type === 'found') {
      for (let k = 0; k < this.#pattern.length; k++) {
        textCells[step.textIndex + k]?.classList.add('cell--found')
      }
    }

    this.#renderAux(step)
    this.setNote(step.note || '')
  }

  setNote(text) {
    this.#noteEl.textContent = text
  }

  #renderAuxEmpty() {
    this.#auxEl.replaceChildren(
      el('p', { className: 'aux__empty', text: '알고리즘을 실행하면 보조 정보가 표시됩니다.' }),
    )
  }

  /** 알고리즘별 보조 시각: failure 테이블 / bad-char / hash. */
  #renderAux(step) {
    const aux = ALGORITHMS[this.#algoKey].aux
    if (aux === 'failure' && step.table) {
      this.#auxEl.replaceChildren(this.#failureTable(step.table, step.highlight))
    } else if (aux === 'hash' && step.hash) {
      this.#auxEl.replaceChildren(this.#hashView(step.hash))
    } else if (aux === 'badChar' && step.meta) {
      this.#auxEl.replaceChildren(this.#badCharView(step.meta))
    } else if (aux === 'none') {
      // @MX:NOTE Brute-force는 보조 자료구조가 없다 — 빈 패널 대신 안내 문구로 위화감을 줄인다.
      this.#auxEl.replaceChildren(
        el('div', { className: 'aux__panel' }, [
          el('h3', { className: 'aux__title', text: '보조 자료구조' }),
          el('p', {
            className: 'aux__empty',
            text: 'Brute-force는 미리 계산하는 표 없이, 그냥 한 칸씩 비교합니다. 그래서 단순하지만 느려요.',
          }),
        ]),
      )
    }
  }

  #failureTable(table, highlight = []) {
    const wrap = el('div', { className: 'aux__panel' }, [
      el('h3', { className: 'aux__title', text: '실패함수 (LPS)' }),
    ])
    const grid = el('div', { className: 'lps' })
    table.forEach((v, i) => {
      grid.append(
        el(
          'div',
          {
            className: `lps__cell${highlight?.includes(i) ? ' lps__cell--hot' : ''}`,
          },
          [
            el('span', { className: 'lps__idx', text: String(i) }),
            el('span', { className: 'lps__val', text: String(v) }),
          ],
        ),
      )
    })
    wrap.append(grid)
    return wrap
  }

  #hashView(hash) {
    return el('div', { className: 'aux__panel' }, [
      el('h3', { className: 'aux__title', text: '롤링 해시' }),
      el('div', { className: 'hash' }, [
        el(
          'div',
          { className: `hash__badge${hash.window === hash.pattern ? ' hash__badge--hit' : ''}` },
          [
            el('span', { className: 'hash__label', text: '윈도우' }),
            el('b', { text: String(hash.window) }),
          ],
        ),
        el('div', { className: 'hash__eq', text: hash.window === hash.pattern ? '=' : '≠' }),
        el('div', { className: 'hash__badge' }, [
          el('span', { className: 'hash__label', text: '패턴' }),
          el('b', { text: String(hash.pattern) }),
        ]),
      ]),
    ])
  }

  #badCharView(meta) {
    const entries = Object.entries(meta || {})
    return el('div', { className: 'aux__panel' }, [
      el('h3', { className: 'aux__title', text: 'bad-character 표' }),
      el(
        'div',
        { className: 'badchar' },
        entries.length
          ? entries.map(([c, i]) =>
              el('div', { className: 'badchar__cell' }, [
                el('b', { text: c === ' ' ? '␣' : c }),
                el('span', { text: `→ ${i}` }),
              ]),
            )
          : [el('span', { className: 'aux__empty', text: '표 계산 대기' })],
      ),
    ])
  }

  reset() {
    this.#gridEl.replaceChildren()
    this.#renderAuxEmpty()
    this.setNote('')
  }
}
