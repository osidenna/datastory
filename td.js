/* Pages de TD : exercices avec cellules Python exécutées dans le navigateur (Pyodide).
   Affiche les figures Matplotlib/Seaborn, les graphiques Altair (vega-embed), les tableaux pandas,
   et des vérifications automatiques. Règles d'usage de l'IA comme dans les TD de SID34.
   Les solutions vivent dans dist/<td>-solutions.js, absent de la copie publique. */
(function () {
  const K = window.Kit, M = window.Mascots, esc = K.esc;
  const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
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
    '    if hasattr(x, "_repr_html_"): return "html"',
    '    return "repr"',
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
  }
  // Exécute du code dans l'espace de noms de la page ; renvoie sortie texte, figures, dernière valeur et vérifications.
  function run(ns, code, {status = () => {}, check = ''} = {}) {
    return job(async () => {
      const py = await load(status);
      await ensure(py, code + '\n' + check, status);
      status('Exécution…');
      let out = '', ok = true, value = null, checks = [];
      py.setStdout({batched: s => { out += s + '\n'; }});
      py.setStderr({batched: s => { out += s + '\n'; }});
      try {
        const res = await py.runPythonAsync(code, {globals: ns.ns});
        if (res !== undefined && res !== null) {
          const kind = typeof res === 'object' ? py.globals.get('_ds_kind')(res) : 'repr';
          if (kind === 'altair') value = {altair: res.to_json()};
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
      return {ok, out: out.trimEnd(), value, images, checks};
    });
  }
  async function namespace(status) {
    return job(async () => { const py = await load(status); return {ns: py.globals.get('dict')()}; });
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
      '<textarea class="cell-code" spellcheck="false" autocapitalize="off" autocomplete="off" rows="' + rows + '" aria-label="Code Python">' + esc(c.code) + '</textarea>' +
      '<div class="cell-bar"><button class="btn btn-primary cell-run">▶ Exécuter</button><button class="btn btn-ghost cell-reset" hidden>Revenir au code initial</button>' +
      '<button class="btn btn-ghost cell-sol" hidden>Solution (enseignante)</button><span class="cell-status small" aria-live="polite"></span></div>' +
      '<div class="cell-out" hidden></div></div>';
    return c.setup ? '<details class="setup-wrap"><summary>' + esc(c.label || 'Données') + ' · s’exécute automatiquement</summary>' + cell + '</details>' : cell;
  }
  function partHTML(p) {
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
    if (p.html) return p.html;
    return '';
  }

  function render(app, tdIn, ses, helpers) {
    // Version enseignante (fichier local <td>-solutions.js, jamais publié) : exercices de référence ajoutés à la fin.
    const extra = (window.DS_TD_TEACHER || {})[tdIn.id];
    const td = extra ? Object.assign({}, tdIn, {exercises: tdIn.exercises.concat(extra)}) : tdIn;
    document.title = ses.type + ' ' + ses.n + ' · ' + td.title;
    const marks = (() => { try { return JSON.parse(localStorage.getItem('ds-td-' + td.id) || '{}'); } catch (e) { return {}; } })();
    const save = () => { try { localStorage.setItem('ds-td-' + td.id, JSON.stringify(marks)); } catch (e) { /* rien */ } };
    const cells = [], exOf = {};
    td.exercises.forEach(ex => ex.parts.forEach(p => { if (p.cell) { cells.push(p.cell); exOf[p.cell.id] = ex.id; } }));
    app.innerHTML = '<main class="lesson td"><header class="lesson-head"><div class="crumbs"><a href="#/">Le cours</a> / ' + ses.type + ' ' + ses.n + '</div>' +
      '<h1>' + td.title + '</h1><p class="lede">' + td.lede + '</p>' + (td.model ? '<p class="model">' + td.model + '</p>' : '') +
      '<div class="td-howto">' + td.howto + '</div>' +
      '<nav class="toc" aria-label="Exercices"><ol>' + td.exercises.map((ex, k) => '<li><a href="#" data-go="' + ex.id + '"><span>' + (k + 1) + '</span>' + ex.title + (ex.extra ? ' <em class="small">(en plus)</em>' : '') + '</a></li>').join('') + '</ol></nav></header>' +
      td.exercises.map((ex, k) => (ex.teacher ? (td.exercises[k - 1].teacher ? '' : '<div class="part-head"><span>Version enseignante · locale, jamais publiée</span><h2>Le code complet</h2></div>') : ex.extra && !td.exercises[k - 1].extra ? '<div class="part-head"><span>Pour aller plus loin</span><h2>Si vous avez fini</h2></div>' : '') +
        '<section class="step td-ex' + (ex.teacher ? ' td-teacher' : '') + '" id="' + ex.id + '"><div class="step-kicker"><span class="n">' + (ex.teacher ? 'Référence' : 'Exercice ' + (k + 1)) + '</span><span>≈ ' + ex.minutes + ' min</span>' +
        '<button class="chip td-mark" data-ex="' + ex.id + '" aria-pressed="' + (marks[ex.id] ? 'true' : 'false') + '">' + (marks[ex.id] ? '✓ Fait' : 'Marquer comme fait') + '</button></div>' +
        '<h2>' + ex.title + '</h2>' + (ex.lead ? '<p class="step-lead">' + inline(ex.lead) + '</p>' : '') +
        '<div class="step-body">' + ex.parts.map(partHTML).join('') + '</div></section>').join('') +
      helpers.foot(td, ses).replace(' hidden>', '>') + '</main>';

    app.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); document.getElementById(a.dataset.go).scrollIntoView({behavior: 'smooth'}); }));
    app.querySelectorAll('.td-mark').forEach(b => b.addEventListener('click', () => {
      marks[b.dataset.ex] = !marks[b.dataset.ex]; save();
      b.setAttribute('aria-pressed', marks[b.dataset.ex] ? 'true' : 'false'); b.textContent = marks[b.dataset.ex] ? '✓ Fait' : 'Marquer comme fait';
    }));
    // Questions à choix
    td.exercises.forEach(ex => ex.parts.forEach(p => { if (p.q) K.question(app.querySelector('[data-q="' + p.q + '"]'), td.questions[p.q]); }));

    // Cellules
    let nsP = null;
    const done = new Set();
    const sol = (window.DS_TD_SOL || {})[td.id] || {};
    const ns = status => nsP || (nsP = namespace(status));
    async function exec(cell, el, quiet) {
      const out = el.querySelector('.cell-out'), st = el.querySelector('.cell-status'), btn = el.querySelector('.cell-run');
      const status = s => { st.textContent = s; };
      btn.disabled = true;
      try {
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
        html += r.images.map(b => '<img class="cell-img" alt="Figure produite par le code" src="data:image/png;base64,' + b + '">').join('');
        if (r.checks.length) html += '<ul class="cell-checks">' + r.checks.map(c => '<li class="' + (c.ok ? 'ok' : 'ko') + '">' + (c.ok ? '✓ ' : '✗ ') + esc(c.msg) + '</li>').join('') + '</ul>';
        out.innerHTML = html; out.hidden = !html;
        if (r.value && r.value.altair) await embedAltair(out.querySelector('.cell-altair'), r.value.altair);
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
      if (sol[cell.id]) { sb.hidden = false; sb.addEventListener('click', () => { ta.value = sol[cell.id]; reset.hidden = false; fit(); }); }
    });
  }

  window.TD = {render, run, namespace};
})();
