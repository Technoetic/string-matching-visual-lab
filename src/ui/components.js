// @MX:NOTE: 순수 컴포넌트 빌더(클래스 아님). 디자인 토큰 클래스만 사용 — 임의 인라인 스타일 금지.
// step023_chunk2 컴포넌트 인벤토리: Cell/PlayControls/AlgoTab/StatBadge/InputBox/...

import { ALGORITHM_ORDER, ALGORITHMS } from '../algorithms/index.js'
import { el } from './dom.js'

/** 글자 셀 1개. row='text'|'pattern'. */
export function cell(ch, index, row) {
  return el(
    'span',
    {
      className: `cell cell--${row}`,
      'data-index': index,
      'aria-hidden': 'true',
    },
    [ch === ' ' ? '␣' : ch],
  )
}

/** 입력 박스(라벨 + input). */
export function inputBox(id, label, value, onInput) {
  const input = el('input', {
    id,
    className: 'input',
    type: 'text',
    value,
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-label': label,
    oninput: (e) => onInput(e.target.value),
  })
  return el('label', { className: 'field' }, [
    el('span', { className: 'field__label', text: label }),
    input,
  ])
}

/** 알고리즘 탭 버튼 묶음. */
export function algoTabs(activeKey, onSelect) {
  const tabs = ALGORITHM_ORDER.map((key) => {
    const a = ALGORITHMS[key]
    return el(
      'button',
      {
        className: `tab${key === activeKey ? ' tab--active' : ''}`,
        type: 'button',
        role: 'tab',
        'aria-selected': key === activeKey ? 'true' : 'false',
        'data-key': key,
        title: `${a.name} — ${a.short}`,
        onclick: () => onSelect(key),
      },
      [
        el('span', { className: 'tab__name', text: a.name }),
        el('span', { className: 'tab__hint', text: a.short }),
      ],
    )
  })
  return el('div', { className: 'tabs', role: 'tablist', 'aria-label': '알고리즘 선택' }, tabs)
}

/** 재생 컨트롤(⏮ ▶/⏸ ⏭ + 속도). */
export function playControls(handlers) {
  const btn = (cls, label, on, txt) =>
    el(
      'button',
      {
        className: `pbtn ${cls}`,
        type: 'button',
        'aria-label': label,
        title: label,
        onclick: on,
      },
      [txt],
    )

  const playBtn = btn('pbtn--play', '재생/일시정지', handlers.toggle, '▶')
  const speed = el('input', {
    className: 'speed',
    type: 'range',
    min: '100',
    max: '1500',
    step: '100',
    value: '600',
    'aria-label': '재생 속도(밀리초)',
    oninput: (e) => handlers.speed(Number(e.target.value)),
  })

  return el('div', { className: 'player' }, [
    btn('', '처음으로', handlers.first, '⏮'),
    btn('', '이전 단계', handlers.prev, '◀'),
    playBtn,
    btn('', '다음 단계', handlers.next, '▶|'),
    el('label', { className: 'speed__wrap' }, [
      el('span', { className: 'speed__label', text: '속도' }),
      speed,
    ]),
    el('div', { className: 'progress', 'aria-hidden': 'true' }, [
      el('div', { className: 'progress__bar' }),
    ]),
  ])
}

/** 통계 배지(비교/이동). */
export function statBadges() {
  return el('div', { className: 'stats' }, [
    el('span', { className: 'stat' }, [
      el('b', { 'data-stat': 'comparisons', text: '0' }),
      ' 비교',
    ]),
    el('span', { className: 'stat' }, [el('b', { 'data-stat': 'shifts', text: '0' }), ' 이동']),
    el('span', { className: 'stat stat--compare', 'data-stat': 'compareNote', text: '' }),
  ])
}

/** 프리셋 드롭다운. */
export function presets(options, onPick) {
  const select = el(
    'select',
    {
      className: 'preset',
      'aria-label': '예시 선택',
      onchange: (e) => {
        if (e.target.value !== '') onPick(Number(e.target.value))
      },
    },
    [
      el('option', { value: '', text: '예시 불러오기…' }),
      ...options.map((o, i) => el('option', { value: i, text: o.label })),
    ],
  )
  return select
}
