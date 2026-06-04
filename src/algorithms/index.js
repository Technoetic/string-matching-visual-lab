// @MX:NOTE: 알고리즘 레지스트리. 탭 추가/전환을 데이터 주도로 만들기 위한 단일 진입점.
// 각 항목은 공통 계약 search(text,pattern)을 가지며, aux로 보조 시각화 종류를 선언한다.

import * as boyerMoore from './boyerMoore.js'
import * as bruteForce from './bruteForce.js'
import * as kmp from './kmp.js'
import * as rabinKarp from './rabinKarp.js'

/**
 * @MX:ANCHOR App/Visualizer/AlgoTab가 모두 의존하는 알고리즘 목록(fan_in ≥ 3).
 * @MX:REASON 키/순서/aux 종류가 UI 탭·보조패널 렌더와 직접 연결되므로 계약으로 고정.
 */
export const ALGORITHMS = {
  bruteForce: {
    key: 'bruteForce',
    name: 'Brute-force',
    short: '한 칸씩',
    search: bruteForce.search,
    aux: 'none',
    complexity: { pre: '없음', avg: 'O(n·m)', worst: 'O(n·m)' },
    idea: '텍스트의 모든 위치에서 패턴을 처음부터 한 글자씩 비교합니다. 단순하지만 이미 본 칸을 또 봅니다.',
  },
  kmp: {
    key: 'kmp',
    name: 'KMP',
    short: '안 되돌림',
    search: kmp.search,
    aux: 'failure',
    complexity: { pre: 'O(m)', avg: 'O(n)', worst: 'O(n)' },
    idea: '실패함수(LPS)를 미리 계산해, 불일치가 나도 텍스트를 되돌리지 않고 패턴 포인터만 점프합니다.',
  },
  boyerMoore: {
    key: 'boyerMoore',
    name: 'Boyer-Moore',
    short: '껑충 점프',
    search: boyerMoore.search,
    aux: 'badChar',
    complexity: { pre: 'O(m+Σ)', avg: 'sublinear', worst: 'O(n·m)' },
    idea: '패턴의 끝부터 거꾸로 비교하고, 불일치 글자를 기준으로 여러 칸을 한 번에 건너뜁니다.',
  },
  rabinKarp: {
    key: 'rabinKarp',
    name: 'Rabin-Karp',
    short: '해시 비교',
    search: rabinKarp.search,
    aux: 'hash',
    complexity: { pre: 'O(m)', avg: 'O(n+m)', worst: 'O(n·m)' },
    idea: '윈도우를 숫자(해시)로 바꿔 빠르게 비교하고, 해시가 같을 때만 실제 글자를 확인합니다.',
  },
}

export const ALGORITHM_ORDER = ['bruteForce', 'kmp', 'boyerMoore', 'rabinKarp']
