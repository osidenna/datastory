/* Local, reversible translations. Lesson scripts continue to own the DOM and state.
   Translate text nodes (including SVG) and accessible labels, never HTML or code. */
(function () {
  'use strict';
  const STORAGE_KEY = 'ds-language';
  const attributes = ['aria-label', 'title', 'alt', 'placeholder'];
  const excluded = 'script, style, code, pre, textarea, .cell-out, .d4-state-read, [data-state], [data-logic], [translate="no"], [data-no-i18n]';
  const originals = new WeakMap();
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  const catalog = window.DS_EN || {};
  const escapeRE = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Fragments cover labels assembled around live values, such as "50 avis".
  // Whole phrases take precedence; boundaries prevent replacements inside names.
  const fragments = Object.keys(catalog).filter(key => key.length >= 4 && key !== catalog[key])
    .sort((a, b) => b.length - a.length);
  const pattern = fragments.length ? new RegExp('(^|[^\\p{L}\\p{N}_])(' + fragments.map(escapeRE).join('|') + ')(?=$|[^\\p{L}\\p{N}_])', 'gu') : null;
  let language = 'fr';
  try { if (localStorage.getItem(STORAGE_KEY) === 'en') language = 'en'; } catch (_) { /* Private browsing can disable storage. */ }

  function translate(value) {
    const source = normalize(value);
    if (!source || language === 'fr' || !/[a-zÀ-ÿ]/i.test(source)) return value;
    const result = Object.hasOwn(catalog, source) ? catalog[source]
      : pattern ? source.replace(pattern, (_, boundary, phrase) => boundary + catalog[phrase]) : source;
    // Keep whitespace around inline elements and original French number formatting.
    return value.slice(0, value.length - value.trimStart().length) + result + value.slice(value.trimEnd().length);
  }

  function update(node, key, value, write) {
    let records = originals.get(node);
    if (!records) { records = new Map(); originals.set(node, records); }
    let record = records.get(key);
    // D3/React may have replaced the text since our last pass.
    if (!record || value !== record.rendered) record = {source: value, rendered: value};
    const next = translate(record.source);
    record.rendered = next;
    records.set(key, record);
    if (next !== value) write(next);
  }

  function visit(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      if (root.parentElement && !root.parentElement.closest(excluded)) update(root, 'text', root.data, value => { root.data = value; });
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE && root.parentElement?.closest(excluded)) return;
    function labels(node) {
      if (node.matches('[translate="no"], [data-no-i18n]')) return;
      for (const name of attributes) {
        if (node.hasAttribute(name)) update(node, name, node.getAttribute(name), value => node.setAttribute(name, value));
      }
    }
    if (root.nodeType === Node.ELEMENT_NODE) {
      labels(root);
      if (root.matches(excluded)) return;
    }
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          labels(node);
          if (node.matches(excluded)) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    function one(node) {
      if (node.nodeType === Node.TEXT_NODE) update(node, 'text', node.data, value => { node.data = value; });
    }
    one(root);
    while (walk.nextNode()) one(walk.currentNode);
  }

  const observer = new MutationObserver(records => {
    observer.disconnect();
    const roots = new Set();
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(node => roots.add(node));
      else roots.add(record.target);
    }
    for (const root of roots) if (root.isConnected) visit(root);
    observe();
  });
  function observe() {
    observer.observe(document.documentElement, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes});
  }

  const select = document.getElementById('language');
  const notice = document.getElementById('translation-note');
  function setLanguage(next) {
    if (next !== 'fr' && next !== 'en') return;
    observer.disconnect();
    language = next;
    document.documentElement.lang = next;
    select.value = next;
    select.setAttribute('aria-label', next === 'fr' ? 'Langue' : 'Language');
    notice.hidden = next !== 'en';
    visit(document);
    const description = document.querySelector('meta[name="description"]');
    if (description) update(description, 'content', description.content, value => { description.content = value; });
    observe();
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) { /* In-memory switching still works. */ }
  }
  select.addEventListener('change', () => setLanguage(select.value));
  setLanguage(language);
  // Code that temporarily replaces a label (e.g. PDF export) must save its source,
  // so an English label is not later mistaken for newly authored French text.
  function sourceText(element) {
    const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let text = '';
    while (walk.nextNode()) {
      const node = walk.currentNode, record = originals.get(node)?.get('text');
      text += record && node.data === record.rendered ? record.source : node.data;
    }
    return text;
  }
  window.DS_I18N = {setLanguage, sourceText, get language() { return language; }};
})();
