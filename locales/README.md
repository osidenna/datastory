# French and English

French remains the authored source in the lesson scripts. `en.js` is a bundled
French-to-English catalog. Its keys use collapsed whitespace, matching individual
DOM text nodes (including SVG text) and accessible labels. Edit the corresponding
English value to improve a translation. Keep numbers, proper names and units
faithful to the source. When changing French text, update its catalog entry too.

The English draft was generated locally using
[OPUS-MT French–English](https://huggingface.co/Helsinki-NLP/opus-mt-fr-en)
via CTranslate2, then corrected for navigation, course terminology and detected
numeric omissions. It has not had a complete bilingual editorial review; the
English interface identifies it as machine-assisted. No model, translation API,
or network translation request is used by the site.

`i18n.js` translates existing text nodes without rebuilding the page. It keeps
original French in a WeakMap so switching back is lossless, and observes new
lesson content, quiz feedback, chart updates and accessible labels. Exact phrases
take precedence over word-bounded fragments for text assembled around live values.
Unknown text falls back to French. Add complete phrases whenever possible rather
than relying on fragment translation for sentence grammar.

Exercise code (`code`, `pre`, `textarea`), live code/state readouts, execution output (`.cell-out`), scripts,
styles and elements marked `translate="no"` or `data-no-i18n` are excluded. Form
values, data attributes, dataset files and lesson IDs are never changed. Text in
images and downloadable kits retains its original language. Displayed numbers
retain the course's French separators for consistency with the original data.

The language preference uses `localStorage['ds-language']`; French is the default.
Switching also works when storage is disabled. The selector uses native language
names, updates `html[lang]`, and leaves the current hash, exercise edits, quiz state
and completion state intact.

## Browser checks

The site still needs no build step. Node dependencies are for tests only:

```sh
npm ci
npx playwright install chromium
npm test
```

To use a Chromium installation already on your system:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm test
```

Tests serve the site locally and cover all available routes, persistence, dynamic
content, French restoration, exercise state, storage denial and a narrow viewport.
