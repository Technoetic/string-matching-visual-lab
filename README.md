# 문자열 매칭 비주얼 랩 (String Matching Visual Lab)

긴 글에서 패턴을 찾는 **4대 문자열 매칭 알고리즘**을 글자 칸이 움직이는 애니메이션으로
직접 조작하며 배우는 초보자용 인터랙티브 웹 튜토리얼입니다.

- **Brute-force** — 한 칸씩 밀며 매번 처음부터 비교
- **KMP** — 실패함수(LPS)로 불일치가 나도 텍스트를 되돌리지 않음
- **Boyer-Moore** — 패턴 끝부터 비교하고 여러 칸을 껑충 건너뜀
- **Rabin-Karp** — 윈도우를 해시로 바꿔 비교하고, 해시가 같을 때만 글자 확인

브라우저에서 `Ctrl+F`를 누르는 순간 컴퓨터 안에서 일어나는 일을 단계별로 따라가 보세요.
카카오톡 검색, 코드 에디터의 찾기, `grep`, 자동완성, DNA 서열 분석까지 — 모두 같은 "문자열 매칭" 문제입니다.

## 주요 기능

- 텍스트·패턴 직접 입력 + 예시 프리셋
- 단계 재생 컨트롤 (▶ 재생 / ⏸ 일시정지 / ⏭ 다음 / ⏮ 처음 / 속도 슬라이더)
- 알고리즘 전환 시 비교 횟수 대비 ("Brute-force 32회 → KMP 18회")
- 알고리즘별 보조 시각화: LPS 테이블 / bad-character 표 / 롤링 해시 배지
- 키보드 단축키: `Space` 재생, `←/→` 단계 이동, `1~4` 알고리즘 전환
- 반응형(데스크톱/태블릿/모바일), WCAG AA 접근성, Lighthouse Performance 100

## 개발

```bash
npm install
npm run dev       # 개발 서버
npm run build     # dist/index.html (단일 HTML 파일) 빌드
npm run test      # 유닛 테스트 (Vitest)
npm run lint      # Biome 린트
```

빌드 결과 `dist/index.html`은 **외부 의존성 없는 단일 파일**이라, 서버 없이 더블클릭(file://)으로 바로 열 수 있습니다.

## 기술 스택

바닐라 JavaScript (ES modules) + Vite. 런타임 의존성 0. 빌드는 `vite-plugin-singlefile`로 모든 JS/CSS를 인라인합니다.

## 배포

`main` 브랜치 푸시 시 GitHub Actions가 빌드 후 GitHub Pages로 자동 배포합니다.

## 라이선스

MIT

---
학습용 단순화 구현. 출처: Wikipedia(String-searching / KMP / Boyer–Moore / Rabin–Karp), GeeksforGeeks.
