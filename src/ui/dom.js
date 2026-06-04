// @MX:NOTE: 초경량 DOM 헬퍼. 외부 라이브러리 없이 요소 생성/조회만 담당(SRP).

/**
 * 요소 생성 헬퍼.
 * @param {string} tag
 * @param {object} [props]  className/text/attrs/children 등
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag)
  const { className, text, html, ...attrs } = props
  if (className) node.className = className
  if (text != null) node.textContent = text
  if (html != null) node.innerHTML = html
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v)
    } else if (v != null && v !== false) {
      node.setAttribute(k, v === true ? '' : String(v))
    }
  }
  for (const c of [].concat(children)) {
    if (c == null) continue
    node.append(c.nodeType ? c : document.createTextNode(String(c)))
  }
  return node
}
