/* Pages de TD : exercices avec cellules Python exécutées dans le navigateur (Pyodide).
   Affiche les figures Matplotlib/Seaborn, les graphiques Altair (vega-embed), les tableaux pandas,
   et des vérifications automatiques. Règles d'usage de l'IA comme dans les TD de SID34.
   Les solutions vivent dans dist/<td>-solutions.js, absent de la copie publique. */
(function () {
  const K = window.Kit, M = window.Mascots, esc = K.esc;
  const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const BOKEH_JS = v => ['https://cdn.bokeh.org/bokeh/release/bokeh-' + v + '.min.js', 'https://cdn.bokeh.org/bokeh/release/bokeh-widgets-' + v + '.min.js'];
  const VEGA = ['https://cdn.jsdelivr.net/npm/vega@5.30.0', 'https://cdn.jsdelivr.net/npm/vega-lite@5.21.0', 'https://cdn.jsdelivr.net/npm/vega-embed@6.26.0'];

  /* ---------- Noyau Python ---------- */
  const script = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Chargement impossible : vérifiez la connexion.')); document.head.appendChild(s); });
  let ready = null, vega = null, tail = Promise.resolve();
  const job = f => { const r = tail.then(f); tail = r.catch(() => {}); return r; };
  const installed = new Set();
  const HELPERS = [
    'import os, warnings, sys, io, base64',
    "os.environ['MPLBACKEND'] = 'agg'",
    "warnings.filterwarnings('ignore')",
    'import matplotlib', "matplotlib.use('agg')",
    'def _ds_kind(x):',
    '    m = type(x).__module__ or ""',
    '    if x is None or m.startswith("matplotlib"): return "none"',
    '    if m.startswith("altair"): return "altair"',
    '    if m.startswith("bokeh"): return "bokeh"',
    '    if hasattr(x, "_repr_html_"): return "html"',
    '    return "repr"',
    '_ds_bokeh = []',
    'def _ds_bokeh_items():',
    '    import json',
    '    from bokeh.embed import json_item',
    '    return [json.dumps(json_item(o)) for o in _ds_bokeh]',
    'def _ds_checks(r):',
    '    return [[bool(a), str(b)] for a, b in r]',
    'def _ds_figs():',
    '    out = []',
    '    if "matplotlib.pyplot" in sys.modules:',
    '        p = sys.modules["matplotlib.pyplot"]',
    '        for n in p.get_fignums():',
    '            f = io.BytesIO(); p.figure(n).savefig(f, format="png", dpi=110, bbox_inches="tight"); out.append(base64.b64encode(f.getvalue()).decode())',
    '        p.close("all")',
    '    return out'
  ].join('\n');
  function load(status) {
    if (ready) return ready;
    ready = (async () => {
      status('Chargement de Python dans le navigateur… (la première fois seulement, environ 20 s)');
      if (!window.loadPyodide) await script(PYODIDE + 'pyodide.js');
      const py = await window.loadPyodide({indexURL: PYODIDE});
      await py.loadPackage(['micropip', 'pandas', 'matplotlib']);
      py.runPython(HELPERS);
      return py;
    })();
    ready.catch(() => { ready = null; });
    return ready;
  }
  async function ensure(py, code, status) {
    const need = [];
    if (/\bseaborn\b/.test(code) && !installed.has('seaborn')) need.push('seaborn');
    if (/\baltair\b/.test(code) && !installed.has('altair')) need.push('altair');
    if (/\.style\b/.test(code) && !installed.has('jinja2')) need.push('jinja2');
    if (need.length) {
      status('Installation de ' + need.join(', ') + '…');
      await py.runPythonAsync('import micropip\nawait micropip.install(' + JSON.stringify(need) + ')');
      need.forEach(n => installed.add(n));
    }
    await py.loadPackagesFromImports(code, {messageCallback: () => {}});
    // Un téléchargement raté ne lève aucune erreur : Pyodide continue sans le paquet. Pour GeoPandas, on redemande ce qui manque.
    if (/\b(geopandas|gpd)\b/.test(code)) {
      const manque = () => ['geopandas', 'fiona', 'pyproj', 'shapely'].filter(p => !py.loadedPackages[p]);
      for (let i = 0; i < 3 && manque().length; i++) {
        status('Téléchargement de GeoPandas…');
        await py.loadPackage(manque(), {messageCallback: () => {}, errorCallback: () => {}});
      }
      if (manque().length) throw new Error('Téléchargement interrompu (' + manque().join(', ') + ') : vérifiez la connexion, puis cliquez de nouveau sur Exécuter.');
    }
    // Bokeh : show() et output_notebook() sont interceptés ; les figures montrées s'affichent sous la cellule.
    if (/\bbokeh\b/.test(code) && !installed.has('bokeh-patch')) {
      py.runPython('import bokeh, bokeh.io, bokeh.plotting\ndef _ds_show(obj, *a, **k):\n    _ds_bokeh.append(obj)\nbokeh.io.show = _ds_show\nbokeh.plotting.show = _ds_show\nbokeh.io.output_notebook = lambda *a, **k: None\nbokeh.io.output_file = lambda *a, **k: None');
      installed.add('bokeh-patch');
    }
  }
  // Exécute du code dans l'espace de noms de la page ; renvoie sortie texte, figures, dernière valeur et vérifications.
  function run(ns, code, {status = () => {}, check = ''} = {}) {
    return job(async () => {
      const py = await load(status);
      await ensure(py, code + '\n' + check, status);
      status('Exécution…');
      let out = '', ok = true, value = null, checks = [], bokeh = [];
      if (installed.has('bokeh-patch')) py.runPython('_ds_bokeh.clear()');
      py.setStdout({batched: s => { out += s + '\n'; }});
      py.setStderr({batched: s => { out += s + '\n'; }});
      try {
        const res = await py.runPythonAsync(code, {globals: ns.ns});
        if (res !== undefined && res !== null) {
          const kind = typeof res === 'object' ? py.globals.get('_ds_kind')(res) : 'repr';
          if (kind === 'altair') value = {altair: res.to_json()};
          else if (kind === 'bokeh') py.globals.get('_ds_bokeh').append(res);
          else if (kind === 'html') value = {html: res._repr_html_()};
          else if (kind === 'repr') value = {text: typeof res === 'object' ? py.globals.get('repr')(res) : String(res)};
          res.destroy?.();
        }
        if (check) {
          // bool() côté Python : un numpy.bool_ False deviendrait « vrai » en JavaScript.
          const c = await py.runPythonAsync(check, {globals: ns.ns});
          const plain = py.globals.get('_ds_checks')(c);
          checks = plain.toJs().map(x => ({ok: x[0] === true, msg: String(x[1])})); plain.destroy?.(); c.destroy?.();
        }
      } catch (e) {
        ok = false;
        const lines = String(e.message || e).trim().split('\n'), start = lines.findIndex(l => l.includes('File "<exec>"'));
        out += (start >= 0 ? lines.slice(start) : lines.slice(-4)).join('\n');
      }
      let images = [];
      try { const p = py.globals.get('_ds_figs')(); images = p.toJs(); p.destroy(); } catch (_) { /* rien */ }
      if (installed.has('bokeh-patch')) {
        try { const b = py.globals.get('_ds_bokeh_items')(); bokeh = b.toJs(); b.destroy(); } catch (e) { out += '\n' + String(e.message || e).split('\n').slice(-2).join('\n'); }
      }
      return {ok, out: out.trimEnd(), value, images, checks, bokeh, bokehVersion: installed.has('bokeh-patch') ? py.runPython('bokeh.__version__') : null};
    });
  }
  /* ---------- Cellules JavaScript (D3) ---------- */
  // Le code tourne dans la page, avec d3 et `chart`, un div vide déjà placé sous la cellule.
  // check(chart, code) renvoie une liste [ok, message], comme les vérifications Python.
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  async function execJS(cell, el, out, status) {
    const chart = document.createElement('div');
    chart.className = 'cell-chart';
    out.innerHTML = ''; out.hidden = false; out.appendChild(chart);
    status('Exécution…');
    let text = '', ok = true, checks = [];
    const show = x => typeof x === 'string' ? x : (() => { try { return JSON.stringify(x); } catch (e) { return String(x); } })();
    const log = (...a) => { text += a.map(show).join(' ') + '\n'; };
    const code = el.querySelector('.cell-code').value;
    try {
      await new AsyncFunction('d3', 'chart', 'console', code)(window.d3, chart, {log, info: log, warn: log, error: log});
    } catch (e) {
      ok = false;
      text += (e && e.name ? e.name + ' : ' : '') + (e && e.message ? e.message : String(e));
    }
    if (ok && cell.check) {
      await new Promise(r => setTimeout(r, cell.wait || 0)); // laisser finir une transition avant de vérifier
      try { checks = cell.check(chart, code).map(([a, b]) => ({ok: !!a, msg: b})); } catch (e) { checks = [{ok: false, msg: 'Vérification impossible : ' + e.message}]; }
    }
    if (text) out.insertAdjacentHTML('beforeend', '<pre class="cell-text' + (ok ? '' : ' is-error') + '">' + esc(text.trimEnd()) + '</pre>');
    if (checks.length) out.insertAdjacentHTML('beforeend', '<ul class="cell-checks">' + checks.map(c => '<li class="' + (c.ok ? 'ok' : 'ko') + '">' + (c.ok ? '✓ ' : '✗ ') + esc(c.msg) + '</li>').join('') + '</ul>');
    if (checks.length && checks.every(c => c.ok)) K.confetti(el);
    status(ok ? 'Terminé.' : 'Erreur : lisez le message ci-dessous.');
  }

  async function namespace(status) {
    return job(async () => { const py = await load(status); return {ns: py.globals.get('dict')()}; });
  }
  let bk = null;
  async function embedBokeh(el, json, version) {
    if (!bk) bk = (async () => { if (!window.Bokeh) for (const s of BOKEH_JS(version)) await script(s); })();
    bk.catch(() => { bk = null; });
    await bk;
    await window.Bokeh.embed.embed_item(JSON.parse(json), el);
  }
  async function embedAltair(el, json) {
    if (!vega) vega = (async () => { if (!window.vegaEmbed) for (const s of VEGA) await script(s); })();
    vega.catch(() => { vega = null; });
    await vega;
    await window.vegaEmbed(el, JSON.parse(json), {actions: false, renderer: 'svg'});
  }

  /* ---------- Rendu ---------- */
  const AI = {off: ['Sans IA', 'is-off'], hint: ['IA : indices seulement', 'is-hint'], on: ['IA autorisée', 'is-on']};
  const inline = s => String(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  function cellHTML(c) {
    const rows = Math.max(3, c.code.split('\n').length);
    const cell = '<div class="cell' + (c.setup ? ' cell-setup' : '') + '" data-cell="' + c.id + '">' +
      '<textarea class="cell-code" spellcheck="false" autocapitalize="off" autocomplete="off" rows="' + rows + '" aria-label="' + (c.js ? 'Code JavaScript' : 'Code Python') + '">' + esc(c.code) + '</textarea>' +
      '<div class="cell-bar"><button class="btn btn-primary cell-run">▶ Exécuter</button><button class="btn btn-ghost cell-reset" hidden>Revenir au code initial</button>' +
      '<button class="btn btn-ghost cell-sol" hidden>Solution (enseignante)</button><span class="cell-status small" aria-live="polite"></span></div>' +
      '<div class="cell-out" hidden></div></div>';
    return c.setup ? '<details class="setup-wrap"><summary>' + esc(c.label || 'Données') + ' · s’exécute automatiquement</summary>' + cell + '</details>' : cell;
  }
  function partHTML(p) {
    if (p.demo) return '<div class="td-demo" data-demo="' + esc(p.demo.id) + '"><p class="small">Chargement de l’exemple interactif…</p></div>';
    if (p.p) return '<p>' + inline(p.p) + '</p>';
    if (p.phase) return '<h3 class="td-phase"><span>' + p.phase + '</span>' + (p.ai ? '<span class="ai-badge ' + AI[p.ai][1] + '">' + AI[p.ai][0] + '</span>' : '') + '</h3>';
    if (p.ask) return '<div class="td-ask">' + M.mascot('cat') + '<div>' + inline(p.ask) + '</div></div>';
    if (p.cell) return cellHTML(p.cell);
    if (p.ol) return '<ol class="td-list">' + p.ol.map(x => '<li>' + inline(x) + '</li>').join('') + '</ol>';
    if (p.table) return '<div class="viz"><table class="data td-table"><thead><tr>' + p.table.head.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' + p.table.rows.map(r => '<tr>' + r.map(x => '<td>' + inline(x) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
    if (p.fig) return '<div class="viz">' + p.fig() + (p.caption ? '<div class="viz-caption">' + p.caption + '</div>' : '') + '</div>';
    if (p.note) return M.note(p.mascot || 'lion', '<p>' + inline(p.note) + '</p>');
    if (p.details) return '<details class="foot-details"><summary>' + p.details + '</summary>' + (p.body || '') + '</details>';
    if (p.q) return '<div data-q="' + p.q + '"></div>';
    if (p.steps) return '<ol class="qsteps">' + p.steps.map(x => typeof x === 'string' ? '<li>' + inline(x) + '</li>'
      : '<li>' + inline(x.t) + (x.menu ? ' <span class="qmenu">' + x.menu + '</span>' : '') + (x.en ? ' <span class="qen">' + x.en + '</span>' : '') + '</li>').join('') + '</ol>';
    if (p.shot) return '<figure class="qshot"><img loading="lazy" src="' + p.shot + '" alt="' + esc(p.alt || p.caption || 'Capture de QGIS') + '">' + (p.caption ? '<figcaption>' + inline(p.caption) + '</figcaption>' : '') + '</figure>';
    if (p.ctrl) return '<form class="qctrl" data-ctrl="' + p.ctrl.id + '"><label for="c-' + p.ctrl.id + '">' + inline(p.ctrl.label) + '</label><span class="qctrl-in"><input id="c-' + p.ctrl.id + '" inputmode="decimal" autocomplete="off">' +
      (p.ctrl.unit ? '<span class="small">' + p.ctrl.unit + '</span>' : '') + '<button class="btn btn-ghost">Contrôler</button></span><output class="qctrl-out" aria-live="polite"></output></form>';
    if (p.tick) return '<ul class="qtick">' + p.tick.map((t, i) => '<li><label><input type="checkbox" data-tick="' + i + '"><span>' + inline(t) + '</span></label></li>').join('') + '</ul>';
    if (p.html) return p.html;
    return '';
  }

  // Bloc de corrigé d'un exercice : réponses écrites + code des solutions.
  function corrHTML(ex, corr, sol) {
    const codes = ex.parts.filter(p => p.cell && sol[p.cell.id]).map(p => '<p class="small"><b>Cellule ' + esc(p.cell.id) + '</b></p><pre class="corr-code">' + esc(sol[p.cell.id]) + '</pre>').join('');
    return '<div class="td-corr" hidden><h3>📘 Correction</h3>' + (corr[ex.id] || '') + codes + '</div>';
  }
  function render(app, tdIn, ses, helpers) {
    // Version enseignante (fichier local <td>-solutions.js, jamais publié) : exercices de référence ajoutés à la fin.
    const extra = (window.DS_TD_TEACHER || {})[tdIn.id];
    const corr = (window.DS_TD_CORR || {})[tdIn.id], solAll = (window.DS_TD_SOL || {})[tdIn.id] || {};
    const corrLabel = tdIn.correctionPublique ? '📘 Voir la correction' : '📘 Corrigé (enseignante, local)';
    const td = extra ? Object.assign({}, tdIn, {exercises: tdIn.exercises.concat(extra)}) : tdIn;
    document.title = ses.type + ' ' + ses.n + ' · ' + td.title;
    const marks = (() => { try { return JSON.parse(localStorage.getItem('ds-td-' + td.id) || '{}'); } catch (e) { return {}; } })();
    const save = () => { try { localStorage.setItem('ds-td-' + td.id, JSON.stringify(marks)); } catch (e) { /* rien */ } };
    const cells = [], exOf = {};
    td.exercises.forEach(ex => ex.parts.forEach(p => { if (p.cell) { cells.push(p.cell); exOf[p.cell.id] = ex.id; } }));
    app.innerHTML = '<main class="lesson td"><header class="lesson-head"><div class="crumbs"><a href="#/">Le cours</a> / ' + ses.type + ' ' + ses.n + '</div>' +
      '<h1>' + td.title + '</h1><p class="lede">' + td.lede + '</p>' + (td.model ? '<p class="model">' + td.model + '</p>' : '') +
      (corr ? '<div class="lesson-tools"><button class="tool td-corr-toggle" aria-pressed="false">' + corrLabel + '</button></div>' : '') +
      '<div class="td-howto">' + td.howto + '</div>' +
      '<nav class="toc" aria-label="Exercices">' + (td.exercises[0].partHead ? '' : '<ol>') + td.exercises.map((ex, k) => (ex.partHead ? (k ? '</ol>' : '') + '<p class="toc-part">' + ex.partHead.k + ' · ' + ex.partHead.t + '</p><ol>' : '') + '<li><a href="#" data-go="' + ex.id + '"><span>' + (k + 1) + '</span>' + ex.title + (ex.extra ? ' <em class="small">(en plus)</em>' : '') + '</a></li>').join('') + '</ol></nav></header>' +
      td.exercises.map((ex, k) => (ex.partHead ? '<div class="part-head"><span>' + ex.partHead.k + '</span><h2>' + ex.partHead.t + '</h2></div>' : '') + (ex.teacher ? (td.exercises[k - 1].teacher ? '' : '<div class="part-head"><span>Version enseignante · locale, jamais publiée</span><h2>Le code complet</h2></div>') : ex.extra && !td.exercises[k - 1].extra && !ex.partHead ? '<div class="part-head"><span>Pour aller plus loin</span><h2>Si vous avez fini</h2></div>' : '') +
        '<section class="step td-ex' + (ex.teacher ? ' td-teacher' : '') + '" id="' + ex.id + '"><div class="step-kicker"><span class="n">' + (ex.teacher ? 'Référence' : 'Exercice ' + (k + 1)) + '</span>' + (ex.minutes ? '<span>≈ ' + ex.minutes + ' min</span>' : '') +
        '<button class="chip td-mark" data-ex="' + ex.id + '" aria-pressed="' + (marks[ex.id] ? 'true' : 'false') + '">' + (marks[ex.id] ? '✓ Fait' : 'Marquer comme fait') + '</button></div>' +
        '<h2>' + ex.title + '</h2>' + (ex.lead ? '<p class="step-lead">' + inline(ex.lead) + '</p>' : '') +
        '<div class="step-body">' + ex.parts.map(partHTML).join('') + '</div>' + (corr && !ex.teacher ? corrHTML(ex, corr, solAll) : '') + '</section>').join('') +
      helpers.foot(td, ses).replace(' hidden>', '>') + '</main>';

    app.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); document.getElementById(a.dataset.go).scrollIntoView({behavior: 'smooth'}); }));
    const ct = app.querySelector('.td-corr-toggle');
    if (ct) ct.addEventListener('click', () => {
      const on = ct.getAttribute('aria-pressed') !== 'true';
      ct.setAttribute('aria-pressed', on ? 'true' : 'false');
      ct.textContent = on ? (tdIn.correctionPublique ? '📘 Masquer la correction' : '📘 Masquer le corrigé') : corrLabel;
      app.querySelectorAll('.td-corr').forEach(d => { d.hidden = !on; });
    });
    app.querySelectorAll('.td-mark').forEach(b => b.addEventListener('click', () => {
      marks[b.dataset.ex] = !marks[b.dataset.ex]; save();
      b.setAttribute('aria-pressed', marks[b.dataset.ex] ? 'true' : 'false'); b.textContent = marks[b.dataset.ex] ? '✓ Fait' : 'Marquer comme fait';
    }));
    // Questions à choix
    td.exercises.forEach(ex => ex.parts.forEach(p => { if (p.q) K.question(app.querySelector('[data-q="' + p.q + '"]'), td.questions[p.q]); }));

    // Contrôles : on tape le nombre lu dans QGIS, la page dit s'il est dans la marge attendue.
    td.exercises.forEach(ex => ex.parts.forEach(p => {
      if (!p.ctrl) return;
      const f = app.querySelector('[data-ctrl="' + p.ctrl.id + '"]'), o = f.querySelector('output');
      f.addEventListener('submit', e => {
        e.preventDefault();
        const v = parseFloat(f.querySelector('input').value.replace(/\s/g, '').replace(',', '.'));
        if (Number.isNaN(v)) { o.textContent = 'Tapez un nombre.'; o.className = 'qctrl-out ko'; return; }
        const ok = Math.abs(v - p.ctrl.ans) <= (p.ctrl.tol || 0);
        o.innerHTML = ok ? '✓ ' + (p.ctrl.ok || 'Bon.') : '✗ ' + (p.ctrl.ko || 'Pas encore : reprenez l’étape.');
        o.className = 'qctrl-out ' + (ok ? 'ok' : 'ko');
      });
    }));

    // Cellules
    let nsP = null;
    const done = new Set();
    const sol = (window.DS_TD_SOL || {})[td.id] || {};
    const ns = status => nsP || (nsP = namespace(status));
    async function exec(cell, el, quiet) {
      const out = el.querySelector('.cell-out'), st = el.querySelector('.cell-status'), btn = el.querySelector('.cell-run');
      const status = s => { st.textContent = s; };
      if (btn.disabled) return;
      btn.disabled = true;
      try {
        if (cell.js) { await execJS(cell, el, out, status); return; }
        const space = await ns(status);
        // Comme « exécuter tout ce qui précède » : les cellules de données de la page, puis les cellules
        // précédentes du même exercice qui n'ont pas encore tourné (imports, variables).
        if (!quiet) for (const c of cells) {
          if (c === cell) break;
          if (!done.has(c.id) && (c.setup || exOf[c.id] === exOf[cell.id])) await exec(c, app.querySelector('[data-cell="' + c.id + '"]'), true);
        }
        const code = el.querySelector('.cell-code').value;
        const r = await run(space, code, {status, check: cell.check || ''});
        done.add(cell.id);
        let html = '';
        if (r.out) html += '<pre class="cell-text' + (r.ok ? '' : ' is-error') + '">' + esc(r.out) + '</pre>';
        if (r.value && r.value.text) html += '<pre class="cell-text">' + esc(r.value.text) + '</pre>';
        if (r.value && r.value.html) html += '<div class="cell-html">' + r.value.html + '</div>';
        if (r.value && r.value.altair) html += '<div class="cell-altair"></div>';
        html += r.bokeh.map(() => '<div class="cell-bokeh"></div>').join('');
        html += r.images.map(b => '<img class="cell-img" alt="Figure produite par le code" src="data:image/png;base64,' + b + '">').join('');
        if (r.checks.length) html += '<ul class="cell-checks">' + r.checks.map(c => '<li class="' + (c.ok ? 'ok' : 'ko') + '">' + (c.ok ? '✓ ' : '✗ ') + esc(c.msg) + '</li>').join('') + '</ul>';
        out.innerHTML = html; out.hidden = !html;
        if (r.value && r.value.altair) await embedAltair(out.querySelector('.cell-altair'), r.value.altair);
        const bks = out.querySelectorAll('.cell-bokeh');
        for (let i = 0; i < r.bokeh.length; i++) await embedBokeh(bks[i], r.bokeh[i], r.bokehVersion);
        if (r.checks.length && r.checks.every(c => c.ok)) K.confetti(el);
        status(r.ok ? (quiet ? '' : 'Terminé.') : 'Erreur : lisez le message ci-dessous.');
      } catch (e) {
        status(String(e.message || e));
      } finally { btn.disabled = false; }
    }
    cells.forEach(cell => {
      const el = app.querySelector('[data-cell="' + cell.id + '"]'), ta = el.querySelector('.cell-code');
      const reset = el.querySelector('.cell-reset'), sb = el.querySelector('.cell-sol');
      const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 2 + 'px'; };
      requestAnimationFrame(fit);
      ta.addEventListener('input', () => { fit(); reset.hidden = ta.value === cell.code; });
      ta.addEventListener('keydown', e => {
        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end'); }
        if (e.key === 'Enter' && (e.shiftKey || e.metaKey || e.ctrlKey)) { e.preventDefault(); exec(cell, el); }
      });
      el.querySelector('.cell-run').addEventListener('click', () => exec(cell, el));
      reset.addEventListener('click', () => { ta.value = cell.code; reset.hidden = true; fit(); });
      if (sol[cell.id]) { sb.hidden = false; if (td.correctionPublique) sb.textContent = 'Remplir avec la correction'; sb.addEventListener('click', () => { ta.value = sol[cell.id]; reset.hidden = false; fit(); }); }
    });
    td.exercises.forEach(ex => ex.parts.forEach(p => {
      if (!p.demo) return;
      const host = app.querySelector('[data-demo="' + p.demo.id + '"]');
      Promise.resolve().then(() => p.demo.build(host)).catch(() => {
        if (host.isConnected) host.innerHTML = '<p class="small">L’exemple n’a pas chargé. Rechargez la page ; les cellules restent disponibles.</p>';
      });
    }));
  }

  window.TD = {render, run, namespace};
})();
