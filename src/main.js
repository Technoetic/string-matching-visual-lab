// @MX:NOTE: 엔트리 포인트. 생성자는 가볍게, 무거운 초기화는 await init()로 분리(비동기 라이프사이클).
// 부트스트랩 패턴 + 에러 처리: unhandled rejection을 막고 실패 시 사용자에게 표시한다.
import { App } from './core/App.js'
import './styles/tokens.css'
import './styles/base.css'
import './styles/controls.css'
import './styles/viz.css'

// @MX:NOTE 클라이언트 측 경량 모니터링(서버 없는 정적 앱). 런타임 에러/거부를 한 곳에서 포착.
// @MX:REASON 정적 단일 HTML이라 서버 APM 부재 — 전역 핸들러가 유일한 런타임 안전망.
const __errors = []
function __record(kind, detail) {
  __errors.push({ kind, detail: String(detail).slice(0, 300), at: performance.now() })
  // 외부 전송 없음(프라이버시·무서버). 디버깅용으로 window에 노출.
  globalThis.__smvlErrors = __errors
}
window.addEventListener('error', (e) => __record('error', e.message))
window.addEventListener('unhandledrejection', (e) => __record('unhandledrejection', e.reason))

async function bootstrap() {
  const mount = document.querySelector('#app')
  if (!mount) throw new Error('#app 마운트 지점을 찾을 수 없습니다.')
  const app = new App(mount)
  await app.init()
  return app
}

bootstrap().catch((err) => {
  // @MX:NOTE: fire-and-forget이 아니라 반드시 catch로 처리(요구: unhandled rejection 금지).
  console.error('[bootstrap]', err)
  document.body.dataset.bootError = err.message
  const mount = document.querySelector('#app')
  if (mount) {
    mount.innerHTML =
      '<p style="color:#dc2626">초기화 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.</p>'
  }
})
