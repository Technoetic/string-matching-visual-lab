// @MX:NOTE Vite 설정. 단일 HTML 파일 빌드(viteSingleFile) — 초보자가 dist/index.html을
// 더블클릭(file://)으로 바로 열 수 있도록 모든 JS/CSS를 인라인한다.
// @MX:REASON 외부 asset 참조 ES module은 file:// 에서 CORS로 차단됨(step081 실측 확인).
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/algorithms/**'],
      reporter: ['text', 'json'],
    },
  },
})
