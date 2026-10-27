/**
 * Basic HTML sanitizer using tag allowlist and attribute allowlist
 * To protect against XSS injections without requiring browser DOM
 */

const ALLOWED_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'blockquote', 'ul', 'ol', 'li', 'a', 'img',
  'br', 'hr', 'span', 'div', 'table', 'thead', 'tbody',
  'tr', 'th', 'td', 'code', 'pre', 'small', 'sub', 'sup'
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  '*': new Set(['class', 'title', 'id', 'dir', 'lang']),
  'a': new Set(['href', 'target', 'rel']),
  'img': new Set(['src', 'alt', 'width', 'height', 'loading']),
  'th': new Set(['colspan', 'rowspan', 'scope']),
  'td': new Set(['colspan', 'rowspan']),
};

export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // 1. Strip script, style, iframe, object, embed tags entirely
  let clean = input.replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '');
  clean = clean.replace(/<(script|style|iframe|object|embed)[^>]*\/?>/gi, '');

  // 2. Remove all on* event handlers (e.g. onclick, onerror, onload)
  clean = clean.replace(/\son[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // 3. Remove javascript: pseudo-protocols in href/src
  clean = clean.replace(/(href|src)\s*=\s*["']?\s*javascript:[^"'>]*/gi, '$1="#"');

  // 4. Remove data: URIs in tags other than images
  clean = clean.replace(/(<a[^>]+href\s*=\s*["']?)\s*data:[^"'>]*/gi, '$1#"');

  return clean;
}
