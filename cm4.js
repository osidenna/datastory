/* CM 4 · D3.js : rendre un récit interactif
   Fil rouge : les présidentielles 2019 et 2024 par commune (dépôt rimdata ; agrégats dans data-cm4.js),
   limites des wilayas ANSADE / OCHA (data-cm3.js). Suite du CM 2 (explorer puis expliquer, choisir le graphique)
   et du CM 3 (choroplèthe ou cercles, encart de Nouakchott) : on y ajoute ce qu'un graphique imprimé ne sait pas faire,
   le survol, le filtre, le zoom et les vues liées. Tous les graphiques sont dessinés avec D3 (dist/vendor) ; la partie 5
   utilise React 18 (dist/vendor, sans JSX : React.createElement). Le TD 3 reste sur la bibliothèque Iqraa Ma3i.
   Idées reprises de Yan Holtz (webinaire Data ChangeMakers, nov. 2026 ; d3-graph-gallery, react-graph-gallery, dataviz-skills), redessinées. */
(function () {
  const d3 = window.d3, K = window.Kit, M = window.Mascots, E = window.DS_DATA4;
  if (!d3 || !E || !E.cands) return;
  const {fr} = K;
  // Ordre propre à chaque question, stable en projection et après rechargement.
  function question(host, opts) {
    const options = opts.options.slice();
    let seed = 2166136261;
    for (const ch of opts.prompt) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    for (let i = options.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = Math.floor(seed / 4294967296 * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return K.question(host, Object.assign({}, opts, {options,
      onAnswer: opts.onAnswer && ((ok, i) => opts.onAnswer(ok, opts.options.indexOf(options[i])))
    }));
  }
  const ACC = '#8a4f8c', ACC2 = '#5b2a5d', GREY = '#d9dce2', GREY2 = '#a3a8b3', INK = '#1d2433', MUTED = '#6b7280', BAD = '#b4532a', GOOD = '#2e6b4f', BLUE = '#4e79a7', MARK = '#f6cd4c';
  const SRC = 'Source : résultats officiels par commune, dépôt public <a href="https://github.com/binorassocies/rimdata" target="_blank" rel="noopener">rimdata</a>.';
  const YAN = 'D’après une idée de Yan Holtz (webinaire Data ChangeMakers, novembre 2026), redessinée.';
  const steps = [];
  const WW = () => K.narrow() ? 400 : 680;
  const mk = (host, w, h, cls = '') => d3.select(host).append('svg').attr('class', 'chart d4 ' + cls).attr('viewBox', '0 0 ' + w + ' ' + h).attr('role', 'img');
  // La feuille de style fixe la couleur des textes de .chart : on passe par style pour la remplacer.
  const ink = (sel, size, fill = INK, weight = null) => sel.style('font-size', size + 'px').style('fill', fill).style('font-weight', weight);
  const halo = sel => sel.style('paint-order', 'stroke').style('stroke', '#fff').style('stroke-width', '4px').style('stroke-linejoin', 'round');
  const chips = (items, cur, attr = 'k') => '<div class="row" style="gap:6px;flex-wrap:wrap">' + items.map(([k, t]) => '<button type="button" class="chip" data-' + attr + '="' + k + '" aria-pressed="' + (k === cur ? 'true' : 'false') + '">' + t + '</button>').join('') + '</div>';
  function wire(b, attr, fn) {
    const all = [...b.querySelectorAll('.chip[data-' + attr + ']')];
    all.forEach(c => c.addEventListener('click', () => { all.forEach(x => x.setAttribute('aria-pressed', x === c ? 'true' : 'false')); fn(c.dataset[attr]); }));
  }
  const codeBox = html => '<pre class="d4-code">' + html + '</pre>';
  // Une seule passe : chaîne d'abord, sinon commentaire (deux passes casseraient les balises <span class="c">).
  const hl = s => K.esc(s).replace(/(&quot;.*?&quot;)|(\/\/[^\n]*)/g, (m, str, com) => str ? '<span class="s">' + str + '</span>' : '<span class="c">' + com + '</span>');
  const pct = (v, k = 1) => fr(v, k) + ' %';
  // Une infobulle HTML posée sur le graphique, placée d'après la souris (le SVG est mis à l'échelle par viewBox).
  function tipFor(host) {
    host.classList.add('d4-tiphost');
    const t = document.createElement('div');
    t.className = 'd4-tip'; t.hidden = true; t.setAttribute('role', 'status');
    host.appendChild(t);
    return {
      show(ev, html) {
        const r = host.getBoundingClientRect();
        t.innerHTML = html; t.hidden = false;
        const tw = t.offsetWidth, th = t.offsetHeight;
        let x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14;
        if (x + tw > r.width) x = ev.clientX - r.left - tw - 14;
        if (y + th > r.height + 40) y = ev.clientY - r.top - th - 10;
        t.style.left = Math.max(0, x) + 'px'; t.style.top = Math.max(0, y) + 'px';
      },
      hide() { t.hidden = true; }
    };
  }

  /* ---------- Données ---------- */
  const YRS = ['2019', '2024'];
  const CK = {}, COURT = {}, NOM = {};
  YRS.forEach(y => { CK[y] = E.cands[y].map(c => c.k); E.cands[y].forEach(c => { COURT[c.k] = c.court; NOM[c.k] = c.nom; }); });
  const CCOL = {ghazouani: ACC, biram: BLUE, hamadi: GOOD, boubacar: GOOD, kane: BAD, ba: BAD, elid: '#b38a00', maouloud: '#b38a00', soumare: '#8b8f99', wavi: '#c4c8d0'};
  const NAT = {};
  YRS.forEach(y => {
    const n = E.nat[y], vot = n.nul + n.neu + n.ex, v = Object.fromEntries(E.cands[y].map(c => [c.k, c.v]));
    NAT[y] = Object.assign({}, n, {vot, part: 100 * vot / n.reg, v, sh: k => 100 * (v[k] || 0) / n.ex});
  });
  const lead = (v, ks) => ks.reduce((a, k) => (v[k] || 0) > (v[a] || 0) ? k : a, ks[0]);
  const COM = {};
  YRS.forEach(y => {
    COM[y] = E.com[y].filter(r => r[5] > 0).map(r => {
      const v = {}; CK[y].forEach((k, i) => { v[k] = r[6 + i]; });
      return {w: r[0], m: r[1], c: r[2], reg: r[3], vot: r[4], ex: r[5], v, part: 100 * r[4] / r[3], gh: 100 * v.ghazouani / r[5], first: lead(v, CK[y])};
    });
  });
  const C24 = COM['2024'];
  const NOT1 = C24.filter(d => d.first !== 'ghazouani');
  // Wilayas (l'étranger est à part : il n'a pas de polygone)
  const WALL = E.wil.map(w => {
    const o = {nom: w.w};
    YRS.forEach(y => {
      const r = w[y], vot = r.nul + r.neu + r.ex;
      o[y] = Object.assign({}, r, {vot, part: 100 * vot / r.reg, sh: k => 100 * (r.c[k] || 0) / r.ex, first: lead(r.c, CK[y])});
    });
    return o;
  });
  const WIL = WALL.filter(w => w.nom !== 'Etranger');
  const WBY = Object.fromEntries(WALL.map(w => [w.nom, w]));
  const label = n => n === 'Etranger' ? 'Étranger' : n;
  const isNK = n => n.startsWith('Nouakchott');
  // Mini-barres d'une infobulle : les candidats d'un lieu, du premier au dernier
  function tipBars(v, ex, ks, max = 4) {
    const rows = ks.map(k => [k, v[k] || 0]).sort((a, c) => c[1] - a[1]).slice(0, max);
    return '<div class="d4-tip-bars">' + rows.map(([k, n]) => '<div><span>' + COURT[k] + '</span><i style="width:' + Math.max(2, Math.round(80 * n / ex)) + 'px;background:' + CCOL[k] + '"></i><b>' + pct(100 * n / ex, 0) + '</b></div>').join('') + '</div>';
  }
  const comTip = (d, y = '2024') => '<b>' + d.c + '</b><span class="d4-tip-sub">' + (d.w === 'Etranger' ? 'Vote à l’étranger' : d.w + ' · ' + d.m) + '</span>' +
    '<span class="d4-tip-sub">' + fr(d.reg) + ' inscrits · participation ' + pct(d.part, 0) + '</span>' + tipBars(d.v, d.ex, CK[y]);
  const wilTip = (w, y) => { const r = w[y]; return '<b>' + label(w.nom) + '</b><span class="d4-tip-sub">' + y + ' · ' + fr(r.reg) + ' inscrits · participation ' + pct(r.part, 0) + '</span>' + tipBars(r.c, r.ex, CK[y]); };

  /* ================= Partie 1 · Pourquoi interagir ? ================= */

  // Nuage des communes : participation (x), score de Ghazouani (y), inscrits (aire).
  function nuage(host, data = C24) {
    const w = WW(), nar = K.narrow(), H = nar ? 380 : 430, MG = {t: 30, r: 14, b: 44, l: 46}, iw = w - MG.l - MG.r, ih = H - MG.t - MG.b;
    const svg = mk(host, w, H), z = svg.append('g').attr('transform', 'translate(' + MG.l + ',' + MG.t + ')');
    const x = d3.scaleLinear().domain([10, 100]).range([0, iw]), y = d3.scaleLinear().domain([0, 100]).range([ih, 0]);
    const r = d3.scaleSqrt().domain([0, d3.max(data, d => d.reg)]).range([1.6, nar ? 12 : 16]);
    const gx = z.append('g').attr('transform', 'translate(0,' + ih + ')'), gy = z.append('g');
    const axes = (xs, ys) => {
      gx.call(d3.axisBottom(xs).ticks(nar ? 4 : 7).tickFormat(v => v + ' %')).selectAll('text').style('font-size', '11px');
      gy.call(d3.axisLeft(ys).ticks(5).tickFormat(v => v + ' %')).selectAll('text').style('font-size', '11px');
    };
    axes(x, y);
    ink(z.append('text').attr('x', iw).attr('y', ih + 36).attr('text-anchor', 'end'), 12, MUTED).text('Participation →');
    ink(z.append('text').attr('x', 0).attr('y', -14), 12, MUTED).text('↑ Voix pour Ghazouani (% des suffrages exprimés)');
    const id = 'd4clip' + Math.random().toString(36).slice(2, 8);
    svg.append('clipPath').attr('id', id).append('rect').attr('width', iw).attr('height', ih);
    const pg = z.append('g').attr('clip-path', 'url(#' + id + ')');
    const half = pg.append('line').attr('x1', 0).attr('x2', iw).attr('y1', y(50)).attr('y2', y(50)).attr('stroke', INK).attr('stroke-dasharray', '4 4').attr('stroke-opacity', .5);
    const halfT = ink(pg.append('text').attr('x', iw - 4).attr('y', y(50) - 6).attr('text-anchor', 'end'), 11, MUTED).text('50 % des voix');
    const dots = pg.append('g').selectAll('circle').data(data.slice().sort((a, c) => c.reg - a.reg)).join('circle')
      .attr('cx', d => x(d.part)).attr('cy', d => y(d.gh)).attr('r', d => r(d.reg))
      .attr('fill', GREY2).attr('fill-opacity', .55).attr('stroke', '#fff').attr('stroke-width', .7);
    return {svg, z, pg, x, y, r, dots, iw, ih, axes, half, halfT};
  }

  steps.push({
    id: 'ouverture', kicker: 'Prédire', title: 'Où le président élu n’est-il pas arrivé en tête ?',
    lead: 'Au TD 2, vous avez joint ce fichier aux moughataas, et Bokeh dessinait une carte qu’on survole. Reprenons-le, commune par commune. Présidentielle 2024 : Ghazouani est élu avec 56 % des voix. Un point = une commune (ou un pays, pour le vote à l’étranger). Dans ' + NOT1.length + ' d’entre elles, un autre candidat arrive premier. Nommez-en une.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">' + fr(C24.length) + ' communes et pays, ' + fr(NAT['2024'].reg) + ' inscrits. Aire du cercle = nombre d’inscrits. ' + SRC + '</div></div>' +
        '<div class="row"><button class="btn btn-primary" data-on>Activer le survol</button><button class="btn" data-show hidden>Montrer les ' + NOT1.length + '</button></div><div data-after></div><div data-q hidden></div>';
      const host = b.querySelector('[data-c]'), S = nuage(host), tip = tipFor(host);
      let live = false;
      S.dots.on('pointerenter', (ev, d) => {
        if (!live) return;
        d3.select(ev.currentTarget).raise().attr('stroke', INK).attr('stroke-width', 1.6);
        tip.show(ev, comTip(d));
      }).on('pointermove', (ev, d) => { if (live) tip.show(ev, comTip(d)); })
        .on('pointerleave', ev => { d3.select(ev.currentTarget).attr('stroke', '#fff').attr('stroke-width', .7); tip.hide(); });
      b.querySelector('[data-on]').addEventListener('click', e => {
        live = true; e.target.hidden = true; S.svg.style('cursor', 'pointer');
        b.querySelector('[data-show]').hidden = false;
        b.querySelector('[data-after]').innerHTML = M.note('lion', '<p>Passez sur les points sous la ligne des 50 %. Le nom, la wilaya et le détail des voix apparaissent <b>quand vous les demandez</b>, sans encombrer le dessin.</p>');
      });
      b.querySelector('[data-show]').addEventListener('click', e => {
        e.target.hidden = true;
        S.dots.transition().duration(700).attr('fill', d => d.first === 'ghazouani' ? GREY : CCOL[d.first]).attr('fill-opacity', d => d.first === 'ghazouani' ? .45 : .9);
        const ks = [...new Set(NOT1.map(d => d.first))];
        b.querySelector('[data-after]').innerHTML = '<p class="small d4-legend">' + ks.map(k => '<span><i style="background:' + CCOL[k] + '"></i>' + COURT[k] + ' en tête (' + NOT1.filter(d => d.first === k).length + ')</span>').join('') + '</p>';
        b.querySelector('[data-q]').hidden = false;
      });
      question(b.querySelector('[data-q]'), {
        prompt: 'Sur papier, ce nuage ne pourrait nommer aucune commune. Qu’apporte le survol ?',
        options: [
          {t: 'Les détails à la demande : chaque point garde son nom et ses chiffres, sans 246 étiquettes à l’écran', ok: true, why: 'C’est la promesse de l’interactivité : le graphique reste lisible (la forme d’ensemble), et le lecteur va chercher le détail qui l’intéresse : <b>sa</b> commune. Au CM 2, on « cherchait les perles » ; ici, c’est le lecteur qui cherche.'},
          {t: 'Un graphique plus joli', why: 'Le dessin est le même. Ce qui change, c’est ce que le lecteur peut en tirer.'},
          {t: 'Rien : il suffisait d’écrire les 246 noms', why: 'Essayez : 246 étiquettes se recouvrent et cachent les points.'}
        ]
      });
    }
  });

  const WOPT = ['Tous'].concat(WALL.map(w => w.nom).sort((a, c) => a.localeCompare(c, 'fr')));
  steps.push({
    id: 'mantra', kicker: 'Explorer', title: 'Vue d’ensemble, zoom et filtre, détails',
    lead: 'Le « mantra » de Ben Shneiderman (1996) : d’abord tout le nuage, puis on filtre et on zoome, enfin les détails. Choisissez une wilaya, zoomez, survolez.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div class="d4-mantra" data-m><span data-s="1">1 · Vue d’ensemble</span><span data-s="2">2 · Zoom et filtre</span><span data-s="3">3 · Détails</span></div><div data-c></div><div class="viz-caption">Glissez pour vous déplacer, double-cliquez pour zoomer. ' + SRC + '</div></div>' +
        '<div class="row"><label class="d4-control">Wilaya <select data-w>' + WOPT.map(n => '<option value="' + n + '">' + (n === 'Tous' ? 'Toutes' : label(n)) + '</option>').join('') + '</select></label>' +
        '<button class="btn" data-zin>＋</button><button class="btn" data-zout>－</button><button class="btn" data-reset>Tout voir</button></div>' +
        '<details class="foot-details"><summary>Voir le code : filtre et zoom</summary>' + codeBox(hl('// Filtrer : on ne retire rien, on estompe les autres\npoints.attr("opacity", d => d.wilaya === choix ? 1 : 0.08);\n\n// Zoomer : d3.zoom donne une transformation, on recalcule les échelles\nconst zoom = d3.zoom().scaleExtent([1, 12]).on("zoom", ev => {\n  const x2 = ev.transform.rescaleX(x), y2 = ev.transform.rescaleY(y);\n  points.attr("cx", d => x2(d.participation)).attr("cy", d => y2(d.score));\n  axeX.call(d3.axisBottom(x2)); axeY.call(d3.axisLeft(y2));\n});\nsvg.call(zoom);')) + '</details><div data-q></div>';
      const host = b.querySelector('[data-c]'), S = nuage(host), tip = tipFor(host);
      let st = 0;
      const stage = k => { st = Math.max(st, k); b.querySelectorAll('[data-s]').forEach(s => s.classList.toggle('on', +s.dataset.s <= st)); };
      stage(1);
      let cur = 'Tous', T = d3.zoomIdentity;
      const place = () => {
        const xs = T.rescaleX(S.x), ys = T.rescaleY(S.y);
        S.dots.attr('cx', d => xs(d.part)).attr('cy', d => ys(d.gh));
        S.axes(xs, ys);
        S.half.attr('y1', ys(50)).attr('y2', ys(50)); S.halfT.attr('y', ys(50) - 6);
      };
      const zoom = d3.zoom().scaleExtent([1, 12]).extent([[0, 0], [S.iw, S.ih]]).translateExtent([[0, 0], [S.iw, S.ih]])
        .filter(ev => ev.type !== 'wheel' || ev.ctrlKey || ev.metaKey)   // la molette fait défiler la page
        .on('zoom', ev => { T = ev.transform; place(); if (T.k > 1.01) stage(2); });
      S.svg.call(zoom);
      const zoomTo = pts => {
        if (!pts.length) return;
        const [x0, x1] = d3.extent(pts, d => S.x(d.part)), [y0, y1] = d3.extent(pts, d => S.y(d.gh));
        const k = Math.max(1, Math.min(10, .8 / Math.max((x1 - x0 + 30) / S.iw, (y1 - y0 + 30) / S.ih)));
        const t = d3.zoomIdentity.translate(S.iw / 2, S.ih / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
        S.svg.transition().duration(900).call(zoom.transform, t);
      };
      const sel = b.querySelector('[data-w]');
      sel.addEventListener('change', () => {
        cur = sel.value; stage(2);
        const on = d => cur === 'Tous' || d.w === cur;
        S.dots.transition().duration(500).attr('fill', d => cur !== 'Tous' && on(d) ? ACC : GREY2).attr('fill-opacity', d => on(d) ? .8 : .08);
        if (cur === 'Tous') S.svg.transition().duration(800).call(zoom.transform, d3.zoomIdentity);
        else zoomTo(C24.filter(on));
      });
      b.querySelector('[data-zin]').addEventListener('click', () => { stage(2); S.svg.transition().duration(500).call(zoom.scaleBy, 1.8); });
      b.querySelector('[data-zout]').addEventListener('click', () => S.svg.transition().duration(500).call(zoom.scaleBy, 1 / 1.8));
      b.querySelector('[data-reset]').addEventListener('click', () => { sel.value = 'Tous'; sel.dispatchEvent(new Event('change')); });
      S.dots.on('pointerenter', (ev, d) => { stage(3); d3.select(ev.currentTarget).attr('stroke', INK).attr('stroke-width', 1.6); tip.show(ev, comTip(d)); })
        .on('pointermove', (ev, d) => tip.show(ev, comTip(d)))
        .on('pointerleave', ev => { d3.select(ev.currentTarget).attr('stroke', '#fff').attr('stroke-width', .7); tip.hide(); });
      S.svg.style('cursor', 'grab');
      question(b.querySelector('[data-q]'), {
        prompt: 'Choisissez Nouakchott Sud. Pourquoi garder les autres points en gris clair plutôt que de les supprimer ?',
        options: [
          {t: 'Pour garder le contexte : on voit où se situent ces communes par rapport au pays', ok: true, why: 'Les communes de Nouakchott Sud se détachent <b>par rapport au reste</b> : participation moyenne, score bas. Sans les points gris, impossible de dire si c’est haut ou bas. C’est la hiérarchie « focus + contexte » du CM 3.'},
          {t: 'Parce que D3 ne sait pas retirer des points', why: 'Il le sait (<code>.filter()</code>, ou la sortie de <code>.join()</code>). Garder le contexte est un choix.'},
          {t: 'Pour que le graphique ait l’air plus rempli', why: 'Le gris n’est pas du décor : il sert de point de comparaison.'}
        ]
      });
    }
  });

  steps.push({
    id: 'recit', kicker: 'Comparer', title: 'Le lecteur ne survolera pas',
    lead: 'Au TD 2, vous vous êtes demandé ce qu’il faudrait écrire sur la carte si le survol disparaissait. Voici le même graphique en deux versions. Dans la première, tout est dans l’infobulle. Dans la seconde, le message se voit sans toucher à rien. Laquelle publieriez-vous ?',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Présidentielle 2024, voix pour Ghazouani par wilaya (% des exprimés). ' + SRC + '</div></div>' +
        chips([['ex', 'Version « exploration »'], ['ec', 'Version « explication »']], 'ex') + '<div data-q></div>';
      const host = b.querySelector('[data-c]'), tip = tipFor(host);
      const w = WW(), nar = K.narrow(), L = nar ? 122 : 150, rh = 22, top = 64, H = top + WALL.length * rh + 10;
      const svg = mk(host, w, H);
      const rows = WALL.slice().sort((a, c) => c['2024'].sh('ghazouani') - a['2024'].sh('ghazouani'));
      const x = d3.scaleLinear().domain([0, 100]).range([L, w - 50]);
      const title = svg.append('text').attr('class', 'title').attr('x', 0).attr('y', 24);
      const sub = ink(svg.append('text').attr('x', 0).attr('y', 46), 13, MUTED);
      const g = svg.selectAll('g.r').data(rows).join('g').attr('class', 'r').attr('transform', (d, i) => 'translate(0,' + (top + i * rh) + ')');
      g.append('rect').attr('x', 0).attr('width', w).attr('height', rh).attr('fill', 'transparent');
      const bars = g.append('rect').attr('x', L).attr('y', 3).attr('height', rh - 6).attr('width', d => x(d['2024'].sh('ghazouani')) - L);
      const names = ink(g.append('text').attr('x', L - 8).attr('y', rh / 2 + 4).attr('text-anchor', 'end').text(d => label(d.nom)), 12, '#464d5c');
      const vals = ink(g.append('text').attr('x', d => x(d['2024'].sh('ghazouani')) + 6).attr('y', rh / 2 + 4).text(d => pct(d['2024'].sh('ghazouani'), 0)), 11, MUTED);
      const note = ink(svg.append('text'), 12, BLUE, 700);
      g.on('pointerenter', (ev, d) => { tip.show(ev, wilTip(d, '2024')); d3.select(ev.currentTarget).select('rect').attr('fill', '#f3f4f6'); })
        .on('pointermove', (ev, d) => tip.show(ev, wilTip(d, '2024')))
        .on('pointerleave', ev => { tip.hide(); d3.select(ev.currentTarget).select('rect').attr('fill', 'transparent'); });
      const lost = d => d['2024'].first !== 'ghazouani';
      const draw = k => {
        const ec = k === 'ec';
        title.text(ec ? 'Nouakchott Sud et Nouadhibou ont placé Biram en tête' : 'Résultats de la présidentielle 2024 par wilaya');
        sub.text(ec ? 'En bleu : les wilayas où Biram devance Ghazouani. Survolez pour le détail.' : 'Survolez une barre pour voir les résultats.');
        bars.transition().duration(500).attr('fill', d => ec ? (lost(d) ? BLUE : GREY) : '#8b8f99');
        vals.style('opacity', ec ? 1 : 0);
        names.style('font-weight', d => ec && lost(d) ? 700 : null).style('fill', d => ec && lost(d) ? INK : '#464d5c');
        const last = rows.filter(lost).pop(), i = rows.indexOf(last);
        note.style('opacity', ec ? 1 : 0).attr('x', x(last['2024'].sh('ghazouani')) + 42).attr('y', top + i * rh + rh / 2 + 4)
          .text(nar ? '← Biram 1er' : '← Biram arrive premier : ' + pct(last['2024'].sh('biram'), 0) + ' contre ' + pct(last['2024'].sh('ghazouani'), 0));
      };
      draw('ex'); wire(b, 'k', draw);
      question(b.querySelector('[data-q]'), {
        prompt: 'Archie Tse (<i>New York Times</i>, 2016) conseille de supposer que <b>personne</b> n’ouvrira une infobulle. Où doit donc vivre votre message ?',
        options: [
          {t: 'À l’écran sans interaction (titre, couleur, annotation) ; l’infobulle sert à approfondir', ok: true, why: 'C’est le <b>verre à martini</b> de Segel et Heer : on commence guidé (le message de l’auteur), on finit libre (l’exploration). La version « exploration » est un outil ; la version « explication » est un récit qui se laisse explorer. Les deux usages du CM 2 : chercher, puis montrer.'},
          {t: 'Dans l’infobulle : c’est là que le lecteur cherche', why: 'Le lecteur pressé ne survole pas, et un téléphone n’a pas de souris : le message serait perdu pour la plupart.'},
          {t: 'Dans un paragraphe sous le graphique', why: 'Mieux que l’infobulle, mais le titre et la couleur se lisent avant tout paragraphe (CM 1, pyramide inversée).'}
        ]
      });
    }
  });

  const FAMS = [
    {k: 'Tableur', items: ['Excel'], c: '#8b8f99', h: 1},
    {k: 'Outils de dataviz', items: ['Datawrapper', 'Power BI', 'Tableau'], c: GOOD, h: 3},
    {k: 'Code data science', items: ['Python', 'R', 'Julia'], c: BAD, h: 3},
    {k: 'Bibliothèques JS', items: ['Chart.js', 'Vega', 'Plot'], c: BLUE, h: 3},
    {k: 'D3.js', items: ['D3'], c: ACC, h: 1}
  ];
  steps.push({
    id: 'echelle', kicker: 'Situer', title: 'L’échelle des outils',
    lead: 'Du tableur au code web : plus on monte, plus c’est difficile, et plus on peut tout faire. Ajoutez les familles une à une.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">' + YAN + '</div></div>' +
        '<div class="row"><button class="btn btn-primary" data-add>Ajouter la famille suivante</button></div><div data-q hidden></div>';
      const w = WW(), nar = K.narrow(), h = nar ? 300 : 300, base = 236, bw = (w - 20) / 5 - 12;
      const svg = mk(b.querySelector('[data-c]'), w, h);
      svg.append('defs').append('marker').attr('id', 'd4-arr').attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5).attr('markerWidth', 8).attr('markerHeight', 8).attr('orient', 'auto')
        .append('path').attr('d', 'M0 0 L10 5 L0 10 Z').attr('fill', INK);
      svg.append('line').attr('x1', 12).attr('x2', w - 8).attr('y1', base + 14).attr('y2', base + 14).attr('stroke', INK).attr('stroke-width', 1.6).attr('marker-end', 'url(#d4-arr)');
      ink(svg.append('text').attr('x', w - 8).attr('y', base + 36).attr('text-anchor', 'end'), 13, INK, 700).text('plus complexe, plus puissant');
      let n = 0;
      const add = () => {
        if (n >= FAMS.length) return;
        const f = FAMS[n], x0 = 10 + n * (bw + 12), bh = f.h === 1 ? 46 : 26 + f.items.length * 24, y0 = base - bh;
        const g = svg.append('g').style('opacity', 0);
        g.append('rect').attr('x', x0).attr('y', y0).attr('width', bw).attr('height', bh).attr('rx', 10).attr('fill', f.c).attr('fill-opacity', .1).attr('stroke', f.c).attr('stroke-width', 1.6);
        ink(g.append('text').attr('x', x0 + bw / 2).attr('y', y0 - 10).attr('text-anchor', 'middle'), nar ? 11 : 13, f.c, 700).text(f.k);
        f.items.forEach((t, i) => ink(g.append('text').attr('x', x0 + bw / 2).attr('y', y0 + 30 + i * 24).attr('text-anchor', 'middle'), nar ? 12 : 15, INK, 700).text(t));
        if (n === 4) {
          g.append('path').attr('d', 'M' + (x0 + bw / 2) + ' ' + (y0 - 26) + ' C' + (x0 + bw / 2) + ' ' + (y0 - 70) + ' ' + (x0 + 4) + ' ' + (base - 120) + ' ' + (x0 - 10) + ' ' + (base - 110))
            .attr('fill', 'none').attr('stroke', ACC).attr('stroke-width', 1.4).attr('stroke-dasharray', '4 3').attr('marker-end', 'url(#d4-arr)');
          ink(g.append('text').attr('x', x0 + bw).attr('y', base - 150).attr('text-anchor', 'end'), nar ? 10 : 12, ACC).text('Vega et Plot utilisent D3 en coulisse');
        }
        g.transition().duration(500).style('opacity', 1);
        n++;
        if (n === FAMS.length) { b.querySelector('[data-add]').hidden = true; b.querySelector('[data-q]').hidden = false; }
      };
      b.querySelector('[data-add]').addEventListener('click', add);
      add();
      question(b.querySelector('[data-q]'), {
        prompt: 'Altair (TD 1) et Bokeh (TD extra) : dans quelle boîte ?',
        options: [
          {t: 'Code data science… mais le graphique final est du JavaScript', ok: true, why: 'On les écrit en Python, mais Altair produit une spécification Vega-Lite affichée par Vega, et Bokeh envoie ses figures à BokehJS. Les graphiques interactifs du web finissent toujours en JavaScript.'},
          {t: 'Bibliothèques JavaScript', why: 'On ne les écrit pas en JavaScript : on les pilote depuis Python.'},
          {t: 'Outils de dataviz', why: 'Ce sont des bibliothèques de code, pas des logiciels à la souris.'}
        ]
      });
    }
  });

  const CRIT = [['Prise en main', [3, 2, 1, 0]], ['Joli par défaut', [0, 2, 1, -1]], ['Reproductible', [0, 1, 3, 3]], ['Sur mesure', [1, 1, 3, 3]], ['Interactif', [0, 2, 1, 3]], ['Gros volumes', [1, 1, 2, 3]]];
  const SCEN = [
    ['demain', 'Un graphique pour demain matin, sans développeur', 1, 'Un outil sans code : Datawrapper sort un graphique propre en dix minutes.'],
    ['mois', 'Le même rapport chaque mois', 2, 'Un script Python ou R : on le relance, on obtient le même graphique avec les nouvelles données.'],
    ['presse', 'Un récit interactif pour un site de presse', 3, 'Du code web : seul D3 (ou une bibliothèque JS) permet un graphique jamais vu, animé, au survol.'],
    ['jetable', 'Un calcul rapide, pour soi', 0, 'Le tableur suffit. Aucun outil n’est le meilleur partout.']
  ];
  steps.push({
    id: 'compromis', kicker: 'Comparer', title: 'Aucun outil ne gagne partout',
    lead: 'Quatre familles, six critères. Choisissez une situation : quelle colonne l’emporte ?',
    build(b) {
      const cols = ['Tableur', 'Outils sans code', 'Code data science', 'Code web (D3)'];
      const dots = v => v < 0 ? '<span class="small">—</span>' : '<span class="d4-dots">' + '●'.repeat(v) + '<i>' + '●'.repeat(3 - v) + '</i></span>';
      b.innerHTML = '<div class="viz main"><table class="data d4-table"><thead><tr><th></th>' + cols.map((c, i) => '<th data-col="' + i + '">' + c + '</th>').join('') + '</tr></thead><tbody>' +
        CRIT.map(([k, v]) => '<tr><th scope="row">' + k + '</th>' + v.map((x, i) => '<td data-col="' + i + '">' + dots(x) + '</td>').join('') + '</tr>').join('') +
        '</tbody></table><div class="viz-caption">Notes de 0 à 3, à discuter. D3 n’a pas de « défaut » : tout se construit. ' + YAN + '</div></div>' +
        chips(SCEN.map(s => [s[0], s[1]]), '') + '<div data-why class="small" style="min-height:2.4em;margin-top:8px"></div><div data-q></div>';
      wire(b, 'k', k => {
        const s = SCEN.find(z => z[0] === k);
        b.querySelectorAll('[data-col]').forEach(c => c.classList.toggle('is-on', +c.dataset.col === s[2]));
        b.querySelector('[data-why]').innerHTML = '<b>' + cols[s[2]] + '.</b> ' + s[3];
      });
      question(b.querySelector('[data-q]'), {
        prompt: 'Une IA écrit maintenant le code D3 à votre place. Quelle ligne du tableau change le plus ?',
        options: [
          {t: 'Prise en main : le prix d’entrée de D3 s’effondre', ok: true, why: 'C’est l’argument de Yan Holtz : D3 était réservé à ceux qui savaient coder pour le web. Avec une IA, tout le monde peut en écrire. Reste à savoir <b>lire</b> ce code et juger le graphique : c’est l’objet de ce cours et du TD.'},
          {t: 'Reproductible', why: 'Le code était déjà reproductible : l’IA n’y change rien.'},
          {t: 'Gros volumes', why: 'La performance dépend du navigateur, pas de qui écrit le code.'}
        ]
      });
    }
  });

  /* ================= Partie 2 · Le web en trois couches ================= */

  const LAYERS = [
    ['html', 'HTML', 'la structure', '<div id="livre"></div>'],
    ['css', 'CSS', 'le style', '#livre {\n  width: 100px; height: 50px;\n  background: #8a4f8c;\n  position: absolute;\n}'],
    ['js', 'JavaScript', 'le mouvement', 'const livre = document.getElementById("livre");\nlet x = 0;\nfunction anime() {\n  x = (x + 2) % 300;\n  livre.style.left = x + "px";\n  requestAnimationFrame(anime);\n}\nanime();']
  ];
  steps.push({
    id: 'couches', kicker: 'Construire', title: 'Une page web, trois couches',
    lead: 'Tout ce que vous voyez sur le web s’écrit en trois langages. Allumez-les un à un.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div class="d4-split"><div data-code></div><div class="d4-stage"><div id="livre-demo"></div></div></div><div class="viz-caption">' + YAN + '</div></div>' +
        chips(LAYERS.map(l => [l[0], l[1]]), 'html') + '<div data-q style="margin-top:8px"></div>';
      const box = b.querySelector('#livre-demo'), stage = b.querySelector('.d4-stage');
      let lvl = 0, timer = null;
      const draw = () => {
        b.querySelector('[data-code]').innerHTML = LAYERS.map((l, i) => '<div class="d4-layer' + (i <= lvl ? ' on' : '') + '"><span class="d4-tag">' + l[1] + ' · ' + l[2] + '</span>' + codeBox(hl(l[3])) + '</div>').join('');
        box.className = 'd4-box l' + lvl;
        if (timer) { timer.stop(); timer = null; box.style.left = '0px'; }
        if (lvl === 2) {
          let x = 0;
          timer = d3.timer(() => {
            if (!box.isConnected) { timer.stop(); return; }
            x = (x + 2) % Math.max(60, stage.clientWidth - 110);
            box.style.left = x + 'px';
          });
        }
      };
      wire(b, 'k', k => { lvl = LAYERS.findIndex(l => l[0] === k); draw(); });
      draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'D3.js est écrit dans quelle couche, et que fait-il ?',
        options: [
          {t: 'JavaScript : il crée et modifie les éléments de la page à partir des données', ok: true, why: '<b>D3 = Data-Driven Documents</b> : des documents pilotés par les données. Chaque nombre devient un élément (un rectangle, un cercle) dont la position et la couleur viennent de la donnée.'},
          {t: 'CSS : il donne un style aux graphiques', why: 'Le CSS habille. D3 crée les éléments et calcule leurs attributs : c’est du JavaScript.'},
          {t: 'HTML : c’est un nouveau type de balise', why: 'D3 n’ajoute aucune balise au langage : il en crée avec du JavaScript.'}
        ]
      });
    }
  });

  steps.push({
    id: 'svg', kicker: 'Prédire', title: 'Où va le cercle ?',
    lead: 'Un graphique D3 est presque toujours un dessin SVG : des formes placées par leurs coordonnées. Cliquez où ce cercle va apparaître.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption" data-coordinate-caption>Zone de dessin de 400 × 260 pixels. Placez le cercle sans axes ni graduations.</div></div>' +
        codeBox(hl('<svg width="400" height="260">\n  <circle cx="300" cy="60" r="14" fill="#8a4f8c" />\n</svg>')) + '<div data-fb></div><div data-q hidden></div>';
      const W0 = 400, H0 = 260, P = 30, svg = mk(b.querySelector('[data-c]'), W0 + P + 16, H0 + P + 16, 'd4-svgdemo');
      const g = svg.append('g').attr('transform', 'translate(' + P + ',' + P + ')');
      g.append('rect').attr('width', W0).attr('height', H0).attr('fill', '#fafafa').attr('stroke', GREY2);
      const guides = g.append('g').attr('class', 'd4-coordinate-guides').attr('visibility', 'hidden');
      guides.selectAll('.vx').data(d3.range(50, W0, 50)).join('line').attr('x1', d => d).attr('x2', d => d).attr('y2', H0).attr('stroke', '#e5e7eb');
      guides.selectAll('.hy').data(d3.range(50, H0, 50)).join('line').attr('y1', d => d).attr('y2', d => d).attr('x2', W0).attr('stroke', '#e5e7eb');
      ink(guides.selectAll('.tx').data(d3.range(0, W0 + 1, 100)).join('text').attr('x', d => d).attr('y', -8).attr('text-anchor', 'middle').text(d => d), 11, MUTED);
      ink(guides.selectAll('.ty').data(d3.range(0, H0 + 1, 100)).join('text').attr('x', -6).attr('y', d => d + 4).attr('text-anchor', 'end').text(d => d), 11, MUTED);
      ink(guides.append('text').attr('x', 4).attr('y', 14), 11, INK, 700).text('(0, 0)');
      ink(guides.append('text').attr('x', W0 - 6).attr('y', 14).attr('text-anchor', 'end'), 11, INK, 700).text('x →');
      ink(guides.append('text').attr('x', 6).attr('y', H0 - 8), 11, INK, 700).text('y ↓');
      let done = false;
      svg.style('cursor', 'crosshair').on('click', ev => {
        if (done) return;
        const [px, py] = d3.pointer(ev, g.node());
        if (px < 0 || px > W0 || py < 0 || py > H0) return;
        done = true;
        const correct = Math.hypot(px - 300, py - 60) <= 30;
        guides.attr('visibility', 'visible');
        svg.style('cursor', 'default');
        b.querySelector('[data-coordinate-caption]').textContent = 'Origine en haut à gauche ; x vers la droite, y vers le bas. Graduations tous les 50 pixels.';
        g.append('path').attr('d', 'M-7 -7 L7 7 M7 -7 L-7 7').attr('transform', 'translate(' + px + ',' + py + ')').attr('stroke', correct ? GOOD : BAD).attr('stroke-width', 2.5);
        const c = g.append('circle').attr('cx', 300).attr('cy', 60).attr('r', 0).attr('fill', ACC);
        c.transition().duration(600).attr('r', 14);
        b.querySelector('[data-fb]').innerHTML = M.note(correct ? 'lion' : 'ghost', correct
          ? '<p><b>Bien vu.</b> L’origine (0, 0) est <b>en haut à gauche</b>. Le cercle est à 300 pixels du bord gauche et 60 pixels du haut : <b>y descend</b>.</p>'
          : '<p><b>Comparez votre croix au cercle.</b> En SVG, l’origine (0, 0) est <b>en haut à gauche</b> et <b>y descend</b>. cx = 300 : 300 pixels depuis la gauche ; cy = 60 : 60 pixels sous le bord du haut.</p>');
        b.querySelector('[data-q]').hidden = false;
      });
      question(b.querySelector('[data-q]'), {
        prompt: 'Une barre de 120 pixels de haut doit reposer sur le bas de la zone (y = 260). <code>&lt;rect x="60" y="?" width="40" height="120"&gt;</code> : que vaut y ?',
        options: [
          {t: '140', ok: true, why: 'y désigne le <b>haut</b> du rectangle : 260 − 120 = 140. C’est pourquoi, en D3, l’échelle verticale va « à l’envers » : <code>.range([hauteur, 0])</code>.'},
          {t: '120', why: 'Le rectangle irait de 120 à 240 : il flotterait 20 pixels au-dessus du bas.'},
          {t: '260', why: 'Le rectangle partirait du bas… vers le bas, hors de la zone.'}
        ]
      });
    }
  });

  /* ================= Partie 3 · Les idées de D3 ================= */

  const W24 = WIL.slice().sort((a, c) => c['2024'].reg - a['2024'].reg);
  steps.push({
    id: 'jointure', kicker: 'Manipuler', title: 'Une donnée, un élément',
    lead: 'Le cœur de D3 : lier un tableau de données à des éléments. Ajoutez, retirez, changez d’élection, et regardez qui entre, qui reste, qui sort.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div data-count class="small" style="margin-top:6px"></div></div>' +
        codeBox(hl('zone.selectAll("rect")\n  .data(wilayas, d => d.nom)       // une donnée par rectangle\n  .join("rect")                    // entrée, mise à jour, sortie\n  .attr("width", d => x(d.inscrits));')) +
        '<div class="row"><button class="btn" data-add>+ Ajouter une wilaya</button><button class="btn" data-rm>− Retirer la dernière</button></div>' +
        '<div style="margin-top:8px">' + chips([['2024', 'Inscrits 2024'], ['2019', 'Inscrits 2019']], '2024', 'y') + '</div><div data-q></div>';
      const w = WW(), nar = K.narrow(), L = nar ? 130 : 160, rh = 30, top = 10, h = top + 8 * rh + 10;
      const x = d3.scaleLinear().domain([0, 260000]).range([L, w - 66]);
      const svg = mk(b.querySelector('[data-c]'), w, h);
      let n = 3, year = '2024';
      const val = d => d[year].reg;
      const draw = () => {
        const data = W24.slice(0, n);
        let e = 0, u = 0, s = 0;
        svg.selectAll('g.bar').data(data, d => d.nom).join(
          enter => {
            e = enter.size();
            const g = enter.append('g').attr('class', 'bar').attr('transform', (d, i) => 'translate(0,' + (top + i * rh) + ')');
            ink(g.append('text').attr('x', L - 10).attr('y', rh / 2 + 4).attr('text-anchor', 'end').text(d => d.nom), 13, '#464d5c');
            g.append('rect').attr('x', L).attr('height', rh - 8).attr('y', 4).attr('width', 0).attr('fill', GOOD)
              .transition().duration(700).attr('width', d => x(val(d)) - L).transition().duration(600).attr('fill', GREY2);
            ink(g.append('text').attr('class', 'v').attr('y', rh / 2 + 4).attr('x', d => x(val(d)) + 6).text(d => fr(val(d))), 12, INK);
            return g;
          },
          update => {
            u = update.size();
            update.select('rect').attr('fill', MARK).transition().duration(700).attr('width', d => x(val(d)) - L).transition().duration(600).attr('fill', GREY2);
            update.select('.v').transition().duration(700).attr('x', d => x(val(d)) + 6).text(d => fr(val(d)));
            return update;
          },
          exit => {
            s = exit.size();
            exit.select('rect').attr('fill', BAD);
            exit.transition().delay(250).duration(500).style('opacity', 0).remove();
            return exit;
          }
        );
        b.querySelector('[data-count]').innerHTML = '<span style="color:' + GOOD + '">● entrée : ' + e + '</span> · <span style="color:#b38a00">● mise à jour : ' + u + '</span> · <span style="color:' + BAD + '">● sortie : ' + s + '</span>';
      };
      b.querySelector('[data-add]').addEventListener('click', () => { n = Math.min(8, n + 1); draw(); });
      b.querySelector('[data-rm]').addEventListener('click', () => { n = Math.max(1, n - 1); draw(); });
      wire(b, 'y', y => { year = y; draw(); });
      draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'Le tableau passe de 4 à 3 wilayas. Que fait <code>.join()</code> du rectangle en trop ?',
        options: [
          {t: 'Il le supprime : c’est la sortie (exit)', ok: true, why: 'À chaque appel, D3 compare les données aux éléments : les nouvelles entrent, les présentes se mettent à jour, celles qui manquent sortent. C’est ce qui permet d’animer un graphique quand les données changent, et de répondre à un clic.'},
          {t: 'Il le laisse à l’écran, vide', why: 'Sans <code>.join()</code>, on aurait ce bug. <code>.join()</code> retire les éléments sans donnée.'},
          {t: 'Il redessine tout le graphique depuis zéro', why: 'Justement non : seuls les éléments concernés changent, ce qui permet les transitions.'}
        ]
      });
    }
  });

  const NKS = WBY['Nouakchott Sud'];
  steps.push({
    id: 'echelles', kicker: 'Calculer', title: 'Une échelle, une simple fonction',
    lead: 'Une échelle traduit une donnée en pixels. À score identique, que devient la longueur si le domaine passe de 0–50 % à 0–100 % ? Prédisez, puis essayez.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div></div>' +
        '<div data-scale-code></div><label class="d4-control">Maximum du domaine <select data-domain><option value="50">50 %</option><option value="100">100 %</option></select></label>' +
        '<div class="row"><label class="small" for="s-v">Score</label><input id="s-v" type="range" min="0" max="50" step="0.5" value="34" style="flex:1;accent-color:' + ACC + '"><code data-out aria-live="polite"></code></div><div data-q></div>';
      const w = WW(), L = 20, R = w - 20, h = 170;
      const top = d3.scaleLinear().domain([0, 50]).range([L, R]), px = d3.scaleLinear().domain([0, 500]).range([L, L + (R - L) * .68]);
      const svg = mk(b.querySelector('[data-c]'), w, h);
      const axis = (y, sc, ticks, lab, f) => {
        svg.append('line').attr('x1', sc.range()[0]).attr('x2', sc.range()[1]).attr('y1', y).attr('y2', y).attr('stroke', INK);
        const labels = ink(svg.append('g').selectAll('text').data(ticks).join('text').attr('x', sc).attr('y', y + (y < 80 ? -10 : 22)).attr('text-anchor', 'middle').text(f), 12, MUTED);
        ink(svg.append('text').attr('x', L).attr('y', y + (y < 80 ? -30 : 44)), 12, INK, 700).text(lab);
        return labels;
      };
      const domainLabels = axis(50, top, [0, 10, 20, 30, 40, 50], 'domaine : % des voix', d => d + ' %');
      axis(120, px, [0, 100, 200, 300, 400, 500], 'étendue : pixels', d => d + ' px');
      const link = svg.append('line').attr('stroke', ACC).attr('stroke-width', 2).attr('stroke-dasharray', '4 3');
      const d1 = svg.append('circle').attr('r', 6).attr('fill', ACC), d2 = svg.append('circle').attr('r', 6).attr('fill', ACC);
      const inp = b.querySelector('#s-v'), out = b.querySelector('[data-out]'), domain = b.querySelector('[data-domain]');
      const draw = () => {
        const max = +domain.value, v = Math.min(+inp.value, max);
        const x = d3.scaleLinear().domain([0, max]).range([0, 500]), p = x(v);
        top.domain([0, max]);
        domainLabels.data(d3.range(6).map(i => i * max / 5)).attr('x', top).text(d => d + ' %');
        b.querySelector('[data-scale-code]').innerHTML = codeBox(hl('const x = d3.scaleLinear()\n  .domain([0, ' + max + '])  // les données : % des voix\n  .range([0, 500]);    // le résultat : pixels'));
        link.attr('x1', top(v)).attr('y1', 50).attr('x2', px(p)).attr('y2', 120);
        d1.attr('cx', top(v)).attr('cy', 50); d2.attr('cx', px(p)).attr('cy', 120);
        out.textContent = 'x(' + String(v).replace('.', ',') + ') = ' + fr(p) + ' px';
      };
      inp.addEventListener('input', draw);
      const quiz = () => {
        const expected = 5000 / +domain.value;
        b.querySelector('[data-q]').replaceChildren();
        question(b.querySelector('[data-q]'), {
          prompt: 'Domaine [0, ' + domain.value + '], étendue [0, 500] : combien vaut <code>x(10)</code> (El Id en Nouakchott Nord : ' + pct(WBY['Nouakchott Nord']['2024'].sh('elid'), 0) + ', arrondi à 10) ?',
          options: [
            {t: expected + ' pixels', ok: true, why: 'x(10) = 10 ÷ ' + domain.value + ' × 500 = ' + expected + ' pixels. Doubler le domaine, sans changer l’étendue, divise la longueur par deux.'},
            {t: '10 pixels', why: 'Ce serait vrai sans échelle : 50 % ferait alors 50 pixels, un trait minuscule.'},
            {t: (expected === 100 ? '50' : '100') + ' pixels', why: 'Cette réponse correspond à l’autre domaine. Relisez le maximum choisi.'}
          ]
        });
      };
      domain.addEventListener('change', () => { inp.max = domain.value; draw(); quiz(); });
      draw(); quiz();
    }
  });

  // Construction d'un graphique en barres, ligne par ligne. Les numéros indiquent l'étape où la ligne apparaît.
  const LOW = 'Nouakchott Sud';
  const PROG = [
    [1, 'const MARGE = {haut: 60, droite: 50, bas: 30, gauche: 150};'],
    [1, 'const largeur = 680 - MARGE.gauche - MARGE.droite;'],
    [1, 'const hauteur = 420 - MARGE.haut - MARGE.bas;'],
    [1, 'const zone = d3.select("#graphique").append("svg")'],
    [1, '    .attr("viewBox", "0 0 680 420")'],
    [1, '  .append("g")   // toute la suite se dessine dans cette zone'],
    [1, '    .attr("transform", `translate(${MARGE.gauche},${MARGE.haut})`);'],
    [5, 'wilayas.sort((a, b) => d3.descending(a.score, b.score));'],
    [2, 'const x = d3.scaleLinear().domain([0, 100]).range([0, largeur]);'],
    [2, 'const y = d3.scaleBand()'],
    [2, '    .domain(wilayas.map(d => d.nom)).range([0, hauteur]).padding(0.2);'],
    [3, 'const barres = zone.selectAll("rect").data(wilayas).join("rect")'],
    [3, '    .attr("y", d => y(d.nom)).attr("height", y.bandwidth())'],
    [3, '    .attr("width", d => x(d.score))'],
    [6, '    .attr("fill", d => d.nom === "' + LOW + '" ? "#8a4f8c" : "#d9dce2");'],
    [4, 'zone.append("g").call(d3.axisLeft(y));'],
    [4, 'zone.append("g").attr("transform", `translate(0,${hauteur})`)'],
    [4, '    .call(d3.axisBottom(x));'],
    [7, 'zone.append("text").attr("y", -30)'],
    [7, '    .text("Nouakchott Sud : un tiers des voix pour le président élu");'],
    [8, 'const bulle = d3.select("#graphique").append("div").attr("class", "bulle");'],
    [8, 'barres.on("mouseenter", (ev, d) => bulle.style("opacity", 1)'],
    [8, '         .html(`${d.nom} : ${d.score} %`))'],
    [8, '       .on("mousemove", ev => bulle.style("left", ev.offsetX + 12 + "px")'],
    [8, '                                  .style("top", ev.offsetY + "px"))'],
    [8, '       .on("mouseleave", () => bulle.style("opacity", 0));']
  ];
  const STAGES = ['Le cadre et les marges', 'Les échelles', 'Les rectangles', 'Les axes', 'Trier', 'Une couleur pour le message', 'Un titre qui dit quelque chose', 'Le survol'];
  const NS = STAGES.length;
  steps.push({
    id: 'anatomie', kicker: 'Construire', title: 'Un graphique D3, ligne par ligne',
    lead: 'Huit étapes, toujours les mêmes. Avancez, et regardez quelle ligne de code change quoi. La dernière ajoute ce que le papier ne sait pas faire.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Voix pour Ghazouani par wilaya, présidentielle 2024 (% des exprimés). ' + SRC + '</div></div>' +
        '<div class="row"><button class="btn" data-prev>←</button><b data-lab style="flex:1"></b><button class="btn btn-primary" data-next>Étape suivante →</button></div>' +
        '<div data-code></div><div data-q hidden></div>';
      const w = WW(), nar = K.narrow(), H = 420, MG = {t: 60, r: nar ? 44 : 50, b: 30, l: nar ? 126 : 150};
      const iw = w - MG.l - MG.r, ih = H - MG.t - MG.b;
      const ROWS = WIL.map(d => ({fr: d.nom, t: d['2024'].sh('ghazouani'), w: d}));
      const alpha = ROWS.slice().sort((a, c) => a.fr.localeCompare(c.fr, 'fr')), sorted = ROWS.slice().sort((a, c) => c.t - a.t);
      const x = d3.scaleLinear().domain([0, 100]).range([0, iw]);
      const host = b.querySelector('[data-c]'), tip = tipFor(host);
      let s = 1, prev = 1;
      const render = () => {
        host.querySelectorAll('svg').forEach(n => n.remove()); tip.hide();
        const svg = mk(host, w, H);
        svg.append('rect').attr('x', .5).attr('y', .5).attr('width', w - 1).attr('height', H - 1).attr('fill', 'none').attr('stroke', s < 7 ? GREY2 : 'none').attr('stroke-dasharray', '5 4');
        const z = svg.append('g').attr('transform', 'translate(' + MG.l + ',' + MG.t + ')');
        if (s < 7) {
          z.append('rect').attr('width', iw).attr('height', ih).attr('fill', s === 1 ? '#f3eaf3' : 'none').attr('stroke', ACC).attr('stroke-dasharray', '4 3');
          if (s === 1) {
            ink(z.append('text').attr('x', iw / 2).attr('y', ih / 2).attr('text-anchor', 'middle'), 14, ACC, 700).text('zone : largeur × hauteur');
            ink(svg.append('text').attr('x', MG.l / 2).attr('y', H / 2).attr('text-anchor', 'middle'), 12, MUTED).text('marge gauche');
            ink(svg.append('text').attr('x', w / 2).attr('y', MG.t / 2 + 4).attr('text-anchor', 'middle'), 12, MUTED).text('marge haute');
          }
        }
        if (s === 1) return;
        const order = s >= 5 ? sorted : alpha;
        const startOrder = s === 5 && prev === 4 ? alpha : order;
        const y = d3.scaleBand().domain(startOrder.map(d => d.fr)).range([0, ih]).padding(.2);
        const yEnd = d3.scaleBand().domain(order.map(d => d.fr)).range([0, ih]).padding(.2);
        if (s === 2) {
          z.selectAll('.slot').data(order).join('rect').attr('y', d => y(d.fr)).attr('height', y.bandwidth()).attr('width', iw).attr('fill', '#eef0f3');
          ink(z.append('text').attr('x', iw - 6).attr('y', y(order[0].fr) + y.bandwidth() / 2 + 4).attr('text-anchor', 'end'), 12, ACC, 700).text('y.bandwidth() : l’épaisseur d’une barre');
          return;
        }
        const bars = z.selectAll('.bar').data(ROWS, d => d.fr).join('rect').attr('class', 'bar').attr('x', 0).attr('y', d => y(d.fr)).attr('height', y.bandwidth())
          .attr('width', d => (s === 3 && prev < 3) ? 0 : x(d.t)).attr('fill', s >= 6 ? (d => d.fr === LOW ? ACC : GREY) : '#8b8f99');
        if (s === 3 && prev < 3) bars.transition().duration(800).attr('width', d => x(d.t));
        if (s === 5 && prev === 4) bars.transition().duration(1000).delay((d, i) => i * 40).attr('y', d => yEnd(d.fr));
        if (s >= 4 && s < 7) {
          const ay = z.append('g').call(d3.axisLeft(y).tickSize(0).tickPadding(8));
          ay.selectAll('text').style('font-size', '12px').style('fill', '#464d5c');
          if (s === 5 && prev === 4) ay.transition().duration(1000).call(d3.axisLeft(yEnd).tickSize(0).tickPadding(8));
          z.append('g').attr('transform', 'translate(0,' + ih + ')').call(d3.axisBottom(x).ticks(nar ? 4 : 5).tickFormat(d => d + ' %')).selectAll('text').style('font-size', '11px');
        }
        if (s >= 7) {
          ink(z.selectAll('.lab').data(order).join('text').attr('x', -8).attr('y', d => yEnd(d.fr) + yEnd.bandwidth() / 2 + 4).attr('text-anchor', 'end').text(d => d.fr), 12, '#464d5c');
          z.selectAll('.lab').style('fill', d => d.fr === LOW ? INK : '#464d5c').style('font-weight', d => d.fr === LOW ? 700 : null);
          ink(z.selectAll('.val').data(order).join('text').attr('class', 'val').attr('x', d => x(d.t) + 6).attr('y', d => yEnd(d.fr) + yEnd.bandwidth() / 2 + 4).text(d => pct(d.t, 0)), 12, MUTED);
          z.selectAll('.val').style('fill', d => d.fr === LOW ? ACC : MUTED).style('font-weight', d => d.fr === LOW ? 700 : null);
          z.append('text').attr('class', 'title').attr('x', -MG.l + 6).attr('y', -32).text(nar ? 'Nouakchott Sud : un tiers des voix' : 'Nouakchott Sud : un tiers des voix pour le président élu');
          ink(z.append('text').attr('x', -MG.l + 6).attr('y', -12), 13, MUTED).text('Voix pour Ghazouani par wilaya, présidentielle 2024');
        }
        if (s === 8) {
          bars.style('cursor', 'pointer')
            .on('mouseenter', (ev, d) => { d3.select(ev.currentTarget).attr('stroke', INK).attr('stroke-width', 1.5); tip.show(ev, wilTip(d.w, '2024')); })
            .on('mousemove', (ev, d) => tip.show(ev, wilTip(d.w, '2024')))
            .on('mouseleave', ev => { d3.select(ev.currentTarget).attr('stroke', null); tip.hide(); });
          ink(z.append('text').attr('x', iw).attr('y', ih + 26).attr('text-anchor', 'end'), 12, ACC, 700).text('Survolez une barre ↑');
        }
      };
      const code = () => {
        b.querySelector('[data-code]').innerHTML = '<pre class="d4-code">' + PROG.filter(l => l[0] <= s).map(l => '<span class="' + (l[0] === s ? 'new' : '') + '">' + hl(l[1]) + '</span>').join('\n') + '</pre>';
        b.querySelector('[data-lab]').textContent = s + ' / ' + NS + ' · ' + STAGES[s - 1];
        b.querySelector('[data-prev]').disabled = s === 1;
        b.querySelector('[data-next]').disabled = s === NS;
        if (s === NS) b.querySelector('[data-q]').hidden = false;
      };
      const go = k => { prev = s; s = Math.max(1, Math.min(NS, k)); render(); code(); };
      b.querySelector('[data-prev]').addEventListener('click', () => go(s - 1));
      b.querySelector('[data-next]').addEventListener('click', () => go(s + 1));
      render(); code();
      question(b.querySelector('[data-q]'), {
        prompt: 'À l’étape 8, combien de lignes de dessin a-t-il fallu changer pour ajouter le survol ?',
        options: [
          {t: 'Aucune : on écoute des événements sur les barres déjà dessinées', ok: true, why: '<code>.on("mouseenter", …)</code> branche une fonction sur chaque barre ; D3 lui passe l’événement et <b>la donnée de la barre</b> (<code>d</code>). L’interaction se pose sur le graphique, elle ne le remplace pas. L’infobulle est un simple <code>&lt;div&gt;</code> HTML qu’on montre, déplace et cache.'},
          {t: 'Il faut redessiner tout le graphique à chaque mouvement', why: 'Non : seule l’infobulle bouge. Les barres restent en place.'},
          {t: 'Il faut une autre bibliothèque pour l’interaction', why: 'D3 gère les événements lui-même (<code>.on()</code>, <code>d3.pointer</code>).'}
        ]
      });
    }
  });

  /* ================= Partie 4 · L'interaction, pièce par pièce ================= */

  const PART = WIL.slice().sort((a, c) => c['2024'].part - a['2024'].part);
  const BEH = [
    ['hl', 'Surligner', '// 1. Surligner l’élément survolé\nlignes.on("pointerenter", (ev, d) =>\n  d3.select(ev.currentTarget).classed("actif", true))'],
    ['dim', 'Estomper les autres', '// 2. Estomper tout le reste\n  lignes.style("opacity", e => e === d ? 1 : 0.2);'],
    ['tip', 'Infobulle', '// 3. Une infobulle qui suit la souris\n  bulle.style("opacity", 1)\n    .html(`${d.nom} : ${d.p2019} % → ${d.p2024} %`)\n    .style("left", ev.offsetX + 12 + "px");'],
    ['big', 'Zone de survol large', '// 4. Viser toute la ligne, pas un point de 5 pixels\nlignes.append("rect").attr("width", largeur)\n  .attr("height", y.bandwidth()).attr("fill", "transparent");']
  ];
  steps.push({
    id: 'survol', kicker: 'Manipuler', title: 'Quatre façons de répondre au survol',
    lead: 'La participation a baissé dans presque toutes les wilayas entre 2019 et 2024. Allumez les réactions une à une, puis survolez : laquelle rend la lecture la plus facile ?',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Participation : votants ÷ inscrits. Des points reliés (« haltères »), pas des barres : l’axe peut ne pas partir de zéro (CM 2). ' + SRC + '</div></div>' +
        '<div class="row" data-beh style="gap:6px;flex-wrap:wrap">' + BEH.map(([k, t]) => '<button type="button" class="chip" data-b="' + k + '" aria-pressed="false">' + t + '</button>').join('') + '</div>' +
        '<div data-code></div><div data-q></div>';
      const host = b.querySelector('[data-c]'), tip = tipFor(host);
      const w = WW(), nar = K.narrow(), L = nar ? 122 : 150, rh = 23, top = 46, H = top + PART.length * rh + 30;
      const svg = mk(host, w, H);
      const x = d3.scaleLinear().domain([40, 80]).range([L + 10, w - 24]);
      const on = new Set();
      ink(svg.append('text').attr('x', 0).attr('y', 20), 13, MUTED).html('<tspan style="fill:' + GREY2 + ';font-weight:700">● 2019</tspan>   <tspan style="fill:' + ACC + ';font-weight:700">● 2024</tspan>');
      const ax = svg.append('g').attr('transform', 'translate(0,' + (top + PART.length * rh + 4) + ')').call(d3.axisBottom(x).ticks(nar ? 4 : 8).tickFormat(v => v + ' %'));
      ax.selectAll('text').style('font-size', '11px');
      [NAT['2019'].part, NAT['2024'].part].forEach((v, i) => {
        svg.append('line').attr('x1', x(v)).attr('x2', x(v)).attr('y1', top - 6).attr('y2', top + PART.length * rh).attr('stroke', i ? ACC : GREY2).attr('stroke-dasharray', '3 3').attr('stroke-opacity', .7);
        ink(svg.append('text').attr('x', x(v)).attr('y', top - 10).attr('text-anchor', 'middle'), 10, i ? ACC : MUTED, 700).text('pays ' + (i ? '2024' : '2019'));
      });
      const g = svg.selectAll('g.r').data(PART).join('g').attr('class', 'r').attr('transform', (d, i) => 'translate(0,' + (top + i * rh) + ')');
      const hit = g.append('rect').attr('x', 0).attr('width', w).attr('height', rh).attr('fill', 'transparent');
      const name = ink(g.append('text').attr('x', L - 6).attr('y', rh / 2 + 4).attr('text-anchor', 'end').text(d => d.nom), 12, '#464d5c');
      const seg = g.append('line').attr('x1', d => x(d['2019'].part)).attr('x2', d => x(d['2024'].part)).attr('y1', rh / 2).attr('y2', rh / 2).attr('stroke', GREY).attr('stroke-width', 3);
      const p19 = g.append('circle').attr('cx', d => x(d['2019'].part)).attr('cy', rh / 2).attr('r', 5).attr('fill', GREY2);
      const p24 = g.append('circle').attr('cx', d => x(d['2024'].part)).attr('cy', rh / 2).attr('r', 5.5).attr('fill', ACC);
      const html = d => '<b>' + d.nom + '</b><span class="d4-tip-sub">Participation : ' + pct(d['2019'].part, 0) + ' → ' + pct(d['2024'].part, 0) + ' (' + fr(d['2024'].part - d['2019'].part, 0).replace('-', '−') + ' points)</span>';
      // Sans « zone large », seuls les deux points réagissent.
      const targets = () => on.has('big') ? g : g.selectAll('circle');
      const enter = (ev, d) => {
        if (on.has('hl')) { name.filter(e => e === d).style('font-weight', 700).style('fill', INK); seg.filter(e => e === d).attr('stroke', MARK).attr('stroke-width', 6); }
        if (on.has('dim')) g.style('opacity', e => e === d ? 1 : .2);
        if (on.has('tip')) tip.show(ev, html(d));
      };
      const leave = () => { name.style('font-weight', null).style('fill', '#464d5c'); seg.attr('stroke', GREY).attr('stroke-width', 3); g.style('opacity', 1); tip.hide(); };
      const bind = () => {
        g.on('pointerenter pointermove pointerleave', null); g.selectAll('circle').on('pointerenter pointermove pointerleave', null);
        const t = targets();
        t.on('pointerenter', function (ev) { enter(ev, d3.select(this).datum()); })
          .on('pointermove', function (ev) { if (on.has('tip')) tip.show(ev, html(d3.select(this).datum())); })
          .on('pointerleave', leave);
        hit.style('cursor', on.has('big') ? 'pointer' : null);
        b.querySelector('[data-code]').innerHTML = on.size ? codeBox(hl(BEH.filter(z => on.has(z[0])).map(z => z[2]).join('\n'))) : '<p class="small">Aucune réaction allumée : survolez, il ne se passe rien.</p>';
      };
      b.querySelectorAll('[data-b]').forEach(c => c.addEventListener('click', () => {
        const k = c.dataset.b; on.has(k) ? on.delete(k) : on.add(k);
        c.setAttribute('aria-pressed', on.has(k) ? 'true' : 'false'); leave(); bind();
      }));
      bind();
      question(b.querySelector('[data-q]'), {
        prompt: 'Sur un téléphone, il n’y a pas de souris. Que devient votre survol ?',
        options: [
          {t: 'Il doit aussi marcher au toucher (événements pointer, clic), et le message ne doit jamais dépendre de lui', ok: true, why: 'Les événements <code>pointerenter</code>/<code>pointerdown</code> couvrent souris, doigt et stylet ; un clic (ou un toucher) peut ouvrir la même infobulle. La zone de survol large aide le doigt autant que la souris. Et le message reste dans le titre et la couleur.'},
          {t: 'Rien : les téléphones simulent la souris', why: 'En partie seulement : il n’y a pas de « survol » avant le toucher, et un doigt vise mal un point de 5 pixels.'},
          {t: 'On désactive le graphique sur téléphone', why: 'En Mauritanie comme ailleurs, la plupart des lecteurs de presse lisent sur téléphone.'}
        ]
      });
    }
  });

  // Atelier : viser un point minuscule (Delaunay)
  steps.push({
    id: 'voisin', kicker: 'Manipuler', title: 'Viser un point de deux pixels',
    lead: 'Les communes en tout petits points. Essayez de survoler une commune précise. Puis passez au « point le plus proche ».',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">' + SRC + '</div></div>' +
        chips([['exact', 'Survol exact du point'], ['near', 'Le point le plus proche : d3.Delaunay']], 'exact') +
        codeBox(hl('const delaunay = d3.Delaunay.from(communes, d => x(d.participation), d => y(d.score));\nsvg.on("pointermove", ev => {\n  const [mx, my] = d3.pointer(ev);\n  const d = communes[delaunay.find(mx, my)];   // l’index du point le plus proche\n  montrer(d);\n});')) + '<div data-q></div>';
      const host = b.querySelector('[data-c]'), S = nuage(host), tip = tipFor(host);
      S.dots.attr('r', 2.4).attr('fill', ACC).attr('fill-opacity', .7).attr('stroke', 'none');
      const data = S.dots.data(), ring = S.pg.append('circle').attr('r', 7).attr('fill', 'none').attr('stroke', INK).attr('stroke-width', 1.5).style('display', 'none');
      const del = d3.Delaunay.from(data, d => S.x(d.part), d => S.y(d.gh));
      const show = (ev, d) => { ring.style('display', null).attr('cx', S.x(d.part)).attr('cy', S.y(d.gh)); tip.show(ev, comTip(d)); };
      const hide = () => { ring.style('display', 'none'); tip.hide(); };
      let mode = 'exact';
      S.dots.on('pointerenter', (ev, d) => { if (mode === 'exact') show(ev, d); }).on('pointerleave', () => { if (mode === 'exact') hide(); });
      S.svg.on('pointermove', ev => {
        if (mode !== 'near') return;
        const [mx, my] = d3.pointer(ev, S.z.node());
        if (mx < 0 || my < 0 || mx > S.iw || my > S.ih) { hide(); return; }
        show(ev, data[del.find(mx, my)]);
      }).on('pointerleave', hide);
      wire(b, 'k', k => { mode = k; hide(); });
      question(b.querySelector('[data-q]'), {
        prompt: 'Pourquoi « le point le plus proche » est-il plus agréable ?',
        options: [
          {t: 'La zone de survol couvre tout le graphique : chaque point « possède » la région la plus proche de lui', ok: true, why: 'C’est un diagramme de Voronoï, calculé par <code>d3.Delaunay</code>. Le lecteur n’a plus à viser au pixel près. C’est une astuce de la <i>React Graph Gallery</i> de Yan Holtz pour les nuages de points.'},
          {t: 'Les points sont plus gros', why: 'Ils ont la même taille : c’est la zone sensible qui grandit.'},
          {t: 'Il est plus précis', why: 'Il est plus tolérant, pas plus précis : il choisit toujours un point, même loin.'}
        ]
      });
    }
  });

  // Atelier : entrée, mise à jour, sortie entre deux élections
  steps.push({
    id: 'transition', kicker: 'Animer', title: 'Les candidats qui entrent et qui sortent',
    lead: 'De 2019 à 2024, certains candidats restent, d’autres partent, d’autres arrivent. Basculez : D3 anime chaque cas différemment.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Voix au niveau national (% des exprimés). ' + SRC + '</div></div>' +
        chips([['2019', '2019'], ['2024', '2024']], '2019', 'y') + codeBox(hl('zone.selectAll("g").data(candidats, d => d.cle)   // la clé : le candidat\n  .join(\n    entree => entree.append("g").style("opacity", 0),   // arrive\n    maj    => maj,                                      // reste : glisse\n    sortie => sortie.transition().style("opacity", 0).remove()  // part\n  )\n  .transition().duration(900)\n  .attr("transform", (d, i) => `translate(0,${i * 34})`);')) + '<div data-q></div>';
      const w = WW(), nar = K.narrow(), L = nar ? 90 : 120, rh = 34, H = 7 * rh + 20, svg = mk(b.querySelector('[data-c]'), w, H);
      const x = d3.scaleLinear().domain([0, 60]).range([L, w - 60]);
      const draw = y => {
        const data = E.cands[y].map(c => Object.assign({}, c, {p: NAT[y].sh(c.k)}));
        const t = svg.transition().duration(900);
        svg.selectAll('g.c').data(data, d => d.k).join(
          en => {
            const g = en.append('g').attr('class', 'c').attr('transform', (d, i) => 'translate(0,' + (10 + i * rh) + ')').style('opacity', 0);
            g.append('rect').attr('x', L).attr('y', 4).attr('height', rh - 12).attr('width', 0).attr('fill', d => CCOL[d.k]);
            ink(g.append('text').attr('class', 'n').attr('x', L - 8).attr('y', rh / 2 + 2).attr('text-anchor', 'end').text(d => d.court), 13, INK, 700);
            ink(g.append('text').attr('class', 'v').attr('x', L + 6).attr('y', rh / 2 + 2), 12, MUTED);
            g.transition(t).style('opacity', 1);
            return g;
          },
          up => up,
          ex => ex.call(g => g.select('rect').attr('fill', BAD)).transition(t).style('opacity', 0).remove()
        ).call(g => {
          g.transition(t).attr('transform', (d, i) => 'translate(0,' + (10 + i * rh) + ')');
          g.select('rect').transition(t).attr('width', d => x(d.p) - L);
          g.select('.v').transition(t).attr('x', d => x(d.p) + 6).text(d => pct(d.p));
        });
      };
      draw('2019'); wire(b, 'y', draw);
      question(b.querySelector('[data-q]'), {
        prompt: 'Biram reste à la 2<sup>e</sup> place : sa barre grandit au lieu de disparaître puis réapparaître. Grâce à quoi ?',
        options: [
          {t: 'La clé d => d.cle : D3 reconnaît le même candidat d’une année à l’autre', ok: true, why: 'Sans clé, D3 apparie les données par position : la 3<sup>e</sup> barre de 2019 (Boubacar) deviendrait la 3<sup>e</sup> de 2024 (Hamadi), et l’œil croirait suivre une seule personne. C’est la <b>constance d’objet</b>. Attention : il a fallu harmoniser les noms, écrits différemment en 2019 et en 2024 (voir « D3 ne nettoie rien »).'},
          {t: 'La transition', why: 'La transition anime ; c’est la clé qui dit <b>quoi</b> animer vers quoi.'},
          {t: 'L’ordre alphabétique', why: 'Les barres sont triées par voix, pas par nom.'}
        ]
      });
    }
  });

  const TRA = WBY['Trarza'], TAG = WBY['Tagant'], RAT = TRA['2024'].reg / TAG['2024'].reg;
  steps.push({
    id: 'aire', kicker: 'Piège', title: 'Rayon ou aire ?',
    lead: 'Inscrits 2024 : Trarza ' + fr(TRA['2024'].reg) + ', Tagant ' + fr(TAG['2024'].reg) + ', ' + fr(RAT, 1) + ' fois moins. Deux façons de tailler les cercles.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption" data-cap></div></div>' +
        chips([['r', 'Rayon ∝ valeur : d3.scaleLinear'], ['a', 'Aire ∝ valeur : d3.scaleSqrt']], 'r') + '<div data-q></div>';
      const w = WW(), h = 260, svg = mk(b.querySelector('[data-c]'), w, h);
      const vals = [TRA, TAG], cx = [w * .36, w * .78], MX = TRA['2024'].reg;
      const circ = svg.selectAll('circle').data(vals).join('circle').attr('cx', (d, i) => cx[i]).attr('cy', 130).attr('fill', (d, i) => i ? GREY2 : ACC).attr('fill-opacity', .85);
      ink(svg.selectAll('text.l').data(vals).join('text').attr('class', 'l').attr('x', (d, i) => cx[i]).attr('y', 252).attr('text-anchor', 'middle').text(d => d.nom + ' : ' + fr(d['2024'].reg)), 13, INK, 700);
      const draw = k => {
        const s = k === 'r' ? d3.scaleLinear().domain([0, MX]).range([0, 110]) : d3.scaleSqrt().domain([0, MX]).range([0, 110]);
        circ.transition().duration(700).attr('r', d => s(d['2024'].reg));
        const ratio = (s(MX) / s(TAG['2024'].reg)) ** 2;
        b.querySelector('[data-cap]').innerHTML = 'Le grand cercle a une surface <b>' + fr(ratio, 0) + ' fois</b> plus grande, pour ' + fr(RAT, 1) + ' fois plus d’inscrits.' + (k === 'r' ? ' Facteur de mensonge (CM 2) : ' + fr(ratio / RAT, 1) + '.' : ' L’œil compare des surfaces : elles disent vrai.');
      };
      wire(b, 'k', draw); draw('r');
      question(b.querySelector('[data-q]'), {
        prompt: 'Pour un cercle, une bulle, un symbole proportionnel sur une carte, quelle échelle ?',
        options: [
          {t: 'd3.scaleSqrt : l’aire suit la valeur', ok: true, why: 'L’œil lit la surface. Si le rayon suit la valeur, la surface suit son carré. La racine carrée corrige. C’est ce que font les cartes à cercles de ce cours.'},
          {t: 'd3.scaleLinear : c’est la plus simple', why: 'Simple, mais elle multiplie les écarts : ici le facteur de mensonge dépasse 4.'},
          {t: 'Peu importe, on met les chiffres à côté', why: 'Le lecteur regarde la forme avant de lire le chiffre.'}
        ]
      });
    }
  });


  /* ================= Partie 5 · Graphiques spéciaux, interactifs ================= */

  // Ramène des effectifs à 100 icônes (méthode du plus fort reste : la somme fait toujours 100).
  function hundred(parts) {
    const tot = d3.sum(parts, p => p.n), raw = parts.map(p => 100 * p.n / tot), fl = raw.map(Math.floor);
    let left = 100 - d3.sum(fl);
    raw.map((v, i) => [v - fl[i], i]).sort((a, c) => c[0] - a[0]).forEach(([, i]) => { if (left > 0) { fl[i]++; left--; } });
    return parts.map((p, i) => Object.assign({}, p, {k100: fl[i], p: raw[i]}));
  }
  const PICT = y => {
    const n = NAT[y], top = E.cands[y].slice(0, 3), rest = E.cands[y].slice(3);
    const cands = top.map(c => ({k: c.k, t: c.court, n: c.v, col: CCOL[c.k]})).concat([{k: 'autres', t: 'Autres candidats', n: d3.sum(rest, c => c.v), col: '#c4a35a'}]);
    return {ins: cands.concat([{k: 'nuls', t: 'Bulletins nuls ou neutres', n: n.nul + n.neu, col: '#7c8191'}, {k: 'abs', t: 'Abstention', n: n.reg - n.vot, col: '#eceef1', line: true}]), ex: cands};
  };
  steps.push({
    id: 'pictogramme', kicker: 'Compter', title: 'Cent inscrits',
    lead: '« Ghazouani réélu avec 56 % des voix. » Ramenons l’élection à 100 personnes. Combien d’icônes violettes si l’on compte <b>tous les inscrits</b> ? Prédisez, puis basculez.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Une icône = 1 % des personnes comptées, arrondi. D’après l’Isotype d’Otto et Marie Neurath (Vienne, 1925–1934). ' + SRC + '</div></div>' +
        chips([['ex', 'Sur 100 suffrages exprimés'], ['ins', 'Sur 100 inscrits']], 'ex') + '<div style="margin-top:6px">' + chips([['2024', '2024'], ['2019', '2019']], '2024', 'y') + '</div>' +
        '<details class="foot-details"><summary>Voir le code : 100 icônes, une donnée chacune</summary>' + codeBox(hl('const grille = groupes.flatMap(g => d3.range(g.sur100).map(() => g));   // 100 éléments\nzone.selectAll("use").data(grille).join("use")\n  .attr("href", "#personne")               // une icône définie une fois (<symbol>)\n  .attr("x", (d, i) => (i % 20) * 32).attr("y", (d, i) => Math.floor(i / 20) * 44)\n  .attr("fill", d => d.couleur)\n  .on("pointerenter", (ev, d) => icones.attr("opacity", e => e.groupe === d.groupe ? 1 : 0.25));')) + '</details><div data-q></div>';
      const host = b.querySelector('[data-c]'), tip = tipFor(host);
      const w = WW(), nar = K.narrow(), cols = nar ? 10 : 20, rows = 100 / cols, cw = (w - 16) / cols, rh = nar ? 40 : 46, H = 74 + rows * rh + (nar ? 70 : 50);
      const svg = mk(host, w, H);
      const iconW = nar ? 17 : 19, iconH = nar ? 34 : 38;
      const person = svg.append('defs').append('symbol').attr('id', 'd4-person').attr('viewBox', '-10 0 20 40');
      person.append('circle').attr('cx', 0).attr('cy', 5).attr('r', 3.5).attr('fill', 'currentColor');
      person.append('path').attr('d', 'M-4 13Q-4 10 0 10Q4 10 4 13V25H-4Z').attr('fill', 'currentColor');
      person.append('path').attr('d', 'M-4 13L-7 23M4 13L7 23M-2 24L-3 35M2 24L3 35')
        .attr('fill', 'none').attr('stroke', 'currentColor').attr('stroke-width', 3.5).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
      const big = svg.append('text').attr('class', 'title').attr('x', 0).attr('y', 26);
      const sub = ink(svg.append('text').attr('x', 0).attr('y', 48), 13, MUTED);
      const leg = svg.append('g').attr('transform', 'translate(8,' + (74 + rows * rh + 6) + ')');
      const icons = svg.append('g').attr('transform', 'translate(8,70)').selectAll('use').data(d3.range(100)).join('use').attr('href', '#d4-person')
        .attr('x', i => (i % cols) * cw + (cw - iconW) / 2).attr('y', i => Math.floor(i / cols) * rh).attr('width', iconW).attr('height', iconH)
        .attr('color', GREY).style('cursor', 'pointer');
      let mode = 'ex', year = '2024', grid = [];
      const draw = () => {
        const P = PICT(year), groups = hundred(P[mode]);
        grid = groups.flatMap(g => d3.range(g.k100).map(() => g));
        const gh = groups.find(g => g.k === 'ghazouani');
        big.text(mode === 'ex' ? gh.k100 + ' voix sur 100 pour Ghazouani' : gh.k100 + ' inscrits sur 100 ont voté Ghazouani');
        sub.text(year + ' · ' + (mode === 'ex' ? fr(NAT[year].ex) + ' suffrages exprimés' : fr(NAT[year].reg) + ' inscrits, dont ' + pct(100 - NAT[year].part, 0) + ' d’abstention'));
        icons.data(grid).interrupt().transition().duration(350).delay((d, i) => i * 4)
          .attr('color', d => d.col).style('opacity', 1);
        icons.attr('stroke', d => d.line ? GREY2 : null).attr('stroke-width', d => d.line ? .6 : null);
        leg.selectAll('*').remove();
        let lx = 0, ly = 0;
        groups.forEach(gr => {
          const t = gr.t + ' ' + gr.k100, wd = t.length * 7 + 30;
          if (lx + wd > w - 16) { lx = 0; ly += 18; }
          leg.append('rect').attr('x', lx).attr('y', ly).attr('width', 11).attr('height', 11).attr('rx', 2).attr('fill', gr.col).attr('stroke', gr.line ? GREY2 : null);
          ink(leg.append('text').attr('x', lx + 15).attr('y', ly + 10), 11.5, '#464d5c').text(t);
          lx += wd;
        });
      };
      icons.on('pointerenter', (ev, d) => {
        icons.style('opacity', e => e.k === d.k ? 1 : .25);
        tip.show(ev, '<b>' + d.t + '</b><span class="d4-tip-sub">' + d.k100 + ' icônes sur 100 · ' + fr(d.n) + ' personnes (' + pct(d.p) + ')</span>');
      }).on('pointerleave', () => { icons.style('opacity', 1); tip.hide(); });
      draw();
      wire(b, 'k', k => { mode = k; draw(); });
      wire(b, 'y', y => { year = y; draw(); });
      question(b.querySelector('[data-q]'), {
        prompt: '« 56 voix sur 100 » et « 29 inscrits sur 100 » : lequel est faux ?',
        options: [
          {t: 'Aucun : les deux sont vrais, ils ne comptent pas les mêmes personnes', ok: true, why: 'Le premier divise par les suffrages exprimés (la règle de l’élection), le second par les inscrits (l’abstention dépasse 44 %). C’est « même chiffre, deux unes » du CM 1 : le <b>dénominateur</b> fait le titre. Un récit honnête dit toujours sur combien il compte. Survolez un groupe pour lire l’effectif exact.'},
          {t: '« 29 inscrits sur 100 » : c’est un mauvais calcul', why: 'Le calcul est juste : ' + fr(NAT['2024'].v.ghazouani) + ' voix ÷ ' + fr(NAT['2024'].reg) + ' inscrits.'},
          {t: '« 56 voix sur 100 » : l’abstention est oubliée', why: 'Ce n’est pas faux : c’est le résultat officiel, calculé sur les exprimés. Il répond à une autre question.'}
        ]
      });
    }
  });

  // Les 15 wilayas (limites ANSADE / OCHA 2024, déjà simplifiées pour le CM 3) en GeoJSON pour d3.geoPath.
  const GEO = (() => {
    const W3 = window.DS_DATA3 && window.DS_DATA3.wilayas;
    if (!W3) return null;
    const ring = r => { const c = r.slice(); if (c[0][0] !== c[c.length - 1][0] || c[0][1] !== c[c.length - 1][1]) c.push(c[0]); return d3.geoArea({type: 'Polygon', coordinates: [c]}) > 2 * Math.PI ? c.reverse() : c; };
    return {type: 'FeatureCollection', features: W3.map(w => ({type: 'Feature', properties: {nom: w.n, km2: w.km2}, geometry: {type: 'MultiPolygon', coordinates: w.rings.map(r => [ring(r)])}}))
      .sort((a, c) => c.properties.km2 - a.properties.km2)};
  })();
  const TCOL = d3.scaleThreshold().domain([40, 50, 60, 70]).range(['#f3e6f3', '#ddbfdd', '#c08fc1', '#9d5f9f', ACC2]);
  const TLAB = ['< 40 %', '40–50', '50–60', '60–70', '≥ 70 %'];
  const NKREG = d3.sum(WIL.filter(w => isNK(w.nom) || w.nom === 'Dakhlet Nouadhibou'), w => w['2024'].reg);
  steps.push({
    id: 'carte', kicker: 'Cartographier', title: 'Une carte, deux histoires',
    lead: 'Au CM 3 : « mêmes chiffres, autre histoire ». Les aplats colorient le score de Ghazouani ; les cercles comptent des voix. Basculez, survolez une wilaya.',
    build(b) {
      if (!GEO) { b.innerHTML = '<p class="small">Limites des wilayas indisponibles.</p>'; return; }
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Limites : ANSADE / OCHA, 2024. Projection <code>d3.geoMercator()</code>, la famille de l’EPSG:3857 du CM 3. Le vote à l’étranger n’a pas de place sur la carte. ' + SRC + '</div></div>' +
        chips([['g', 'Aplats : score de Ghazouani'], ['cg', 'Cercles : voix de Ghazouani'], ['cb', 'Cercles : voix de Biram']], 'g') +
        '<div style="margin-top:6px">' + chips([['2024', '2024'], ['2019', '2019']], '2024', 'y') + '</div>' +
        '<details class="foot-details"><summary>Voir le code : projection, chemins, survol</summary>' + codeBox(hl('const projection = d3.geoMercator()\n  .fitSize([largeur, hauteur], wilayas);   // cadre la carte tout seul\nconst chemin = d3.geoPath(projection);    // GeoJSON → attribut "d"\nzone.selectAll("path").data(wilayas.features).join("path")\n  .attr("d", chemin)\n  .attr("fill", d => couleur(d.properties.score))\n  .on("pointerenter", (ev, d) => montrer(ev, d))   // la même infobulle que les barres\n  .on("pointerleave", cacher);\n// cercles : d3.scaleSqrt (l’aire suit la valeur)\nzone.selectAll("circle").data(wilayas.features).join("circle")\n  .attr("transform", d => `translate(${chemin.centroid(d)})`)\n  .attr("r", d => rayon(d.properties.voix));')) + '</details><div data-q></div>';
      const host = b.querySelector('[data-c]'), tip = tipFor(host);
      const w = WW(), nar = K.narrow(), H = nar ? 420 : 520;
      const svg = mk(host, w, H);
      const proj = d3.geoMercator().fitExtent([[10, 10], [w - (nar ? 10 : 150), H - 10]], GEO), path = d3.geoPath(proj);
      let mode = 'g', year = '2024';
      const over = (ev, f) => { tip.show(ev, wilTip(WBY[f.properties.nom], year)); shapes.attr('stroke', e => e === f ? INK : '#fff').attr('stroke-width', e => e === f ? 2 : .8); nk.attr('stroke', e => e === f ? INK : '#fff'); };
      const out = () => { tip.hide(); shapes.attr('stroke', '#fff').attr('stroke-width', .8); nk.attr('stroke', '#fff'); };
      const shapes = svg.append('g').selectAll('path').data(GEO.features).join('path').attr('d', path).attr('stroke', '#fff').attr('stroke-width', .8).attr('stroke-linejoin', 'round').style('cursor', 'pointer')
        .on('pointerenter pointermove', over).on('pointerleave', out);
      // Encart : Nouakchott, invisible à cette échelle
      const NK = {type: 'FeatureCollection', features: GEO.features.filter(f => isNK(f.properties.nom))};
      const box = nar ? [w - 112, H - 122, 100, 100] : [w - 140, 40, 130, 130];
      const pin = path.centroid(NK);
      const ins = svg.append('g');
      ins.append('line').attr('x1', pin[0]).attr('y1', pin[1]).attr('x2', box[0]).attr('y2', box[1] + box[3] / 2).attr('stroke', GREY2).attr('stroke-dasharray', '3 3');
      ins.append('circle').attr('cx', pin[0]).attr('cy', pin[1]).attr('r', 5).attr('fill', 'none').attr('stroke', INK);
      ins.append('rect').attr('x', box[0]).attr('y', box[1]).attr('width', box[2]).attr('height', box[3]).attr('fill', '#fff').attr('stroke', GREY2);
      ink(ins.append('text').attr('x', box[0]).attr('y', box[1] - 6), 11, MUTED, 700).text('Nouakchott (encart)');
      const p2 = d3.geoPath(d3.geoMercator().fitExtent([[box[0] + 6, box[1] + 6], [box[0] + box[2] - 6, box[1] + box[3] - 6]], NK));
      const nk = ins.selectAll('path.nk').data(NK.features).join('path').attr('class', 'nk').attr('d', p2).attr('stroke', '#fff').attr('stroke-width', 1).style('cursor', 'pointer')
        .on('pointerenter pointermove', over).on('pointerleave', out);
      const cpos = f => isNK(f.properties.nom) ? p2.centroid(f) : path.centroid(f);
      const vmax = d3.max(WIL, d => Math.max(d['2024'].c.ghazouani || 0, d['2024'].c.biram || 0, d['2019'].c.ghazouani || 0));
      const rad = d3.scaleSqrt().domain([0, vmax]).range([0, nar ? 26 : 34]);
      const circ = svg.append('g').selectAll('circle').data(GEO.features).join('circle').attr('transform', f => 'translate(' + cpos(f) + ')')
        .attr('fill-opacity', .55).attr('r', 0).style('pointer-events', 'none');
      const leg = svg.append('g').attr('transform', 'translate(' + (nar ? 10 : w - 140) + ',' + (nar ? 16 : 210) + ')');
      const draw = () => {
        const t = svg.transition().duration(700), sc = f => WBY[f.properties.nom][year].sh('ghazouani');
        const k = mode === 'cb' ? 'biram' : 'ghazouani';
        shapes.transition(t).attr('fill', f => mode === 'g' ? TCOL(sc(f)) : '#eceef1');
        nk.transition(t).attr('fill', f => mode === 'g' ? TCOL(sc(f)) : '#eceef1');
        circ.attr('fill', CCOL[k]).attr('stroke', k === 'biram' ? '#2f5577' : ACC2).transition(t).attr('r', f => mode === 'g' ? 0 : rad(WBY[f.properties.nom][year].c[k] || 0));
        leg.selectAll('*').remove();
        if (mode === 'g') {
          ink(leg.append('text').attr('y', -6), 11, MUTED, 700).text('Ghazouani, ' + year);
          TCOL.range().forEach((c, i) => {
            leg.append('rect').attr('x', nar ? i * 62 : 0).attr('y', nar ? 0 : i * 18).attr('width', 14).attr('height', 12).attr('fill', c);
            ink(leg.append('text').attr('x', (nar ? i * 62 : 0) + 18).attr('y', (nar ? 0 : i * 18) + 10), 11, MUTED).text(TLAB[i]);
          });
        } else {
          ink(leg.append('text').attr('y', -6), 11, MUTED, 700).text('Voix de ' + COURT[k] + ', ' + year);
          [10000, 40000, 80000].forEach((v, i) => {
            leg.append('circle').attr('cx', nar ? 20 + i * 90 : 40).attr('cy', nar ? 14 : 90 - rad(v)).attr('r', rad(v)).attr('fill', 'none').attr('stroke', MUTED);
            ink(leg.append('text').attr('x', nar ? 20 + i * 90 + rad(v) + 4 : 86).attr('y', nar ? 18 : 94 - 2 * rad(v)), 11, MUTED).text(fr(v));
          });
        }
      };
      draw();
      wire(b, 'k', k => { mode = k; draw(); });
      wire(b, 'y', y => { year = y; draw(); });
      question(b.querySelector('[data-q]'), {
        prompt: 'Sur les aplats, presque tout le pays est violet foncé. Que cachent-ils ?',
        options: [
          {t: 'Que les villes, où Biram fait ses meilleurs scores, pèsent lourd en inscrits', ok: true, why: 'Nouakchott et Dakhlet Nouadhibou réunissent ' + pct(100 * NKREG / NAT['2024'].reg, 0) + ' des inscrits, sur une toute petite surface. Les deux Hodh, immenses et très favorables à Ghazouani, prennent toute la place. Pour un <b>score</b>, la couleur ; pour des <b>voix</b>, des cercles en <code>scaleSqrt</code>, et un encart pour ce qui est trop petit. Le survol donne, en plus, le détail de chaque wilaya.'},
          {t: 'Rien : les couleurs sont justes', why: 'Les couleurs sont justes, mais la surface parle plus fort qu’elles (CM 3).'},
          {t: 'Que la projection est fausse', why: 'Mercator déforme peu à ces latitudes. Le problème est la surface des wilayas, pas la projection.'}
        ]
      });
    }
  });

  const PMET = {part: ['Participation', d => d.part], ghazouani: ['Voix pour Ghazouani', d => d.sh('ghazouani')], biram: ['Voix pour Biram', d => d.sh('biram')]};
  steps.push({
    id: 'pente', kicker: 'Comparer', title: 'Seize pentes, une à la fois',
    lead: 'Au CM 2, le « spaghetti » : trop de lignes pour en suivre une. Ici, chaque wilaya relie 2019 à 2024. Survolez une ligne pour la sortir du lot.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">' + SRC + '</div></div>' +
        chips([['part', 'Participation'], ['ghazouani', 'Ghazouani'], ['biram', 'Biram']], 'part') +
        codeBox(hl('lignes.on("pointerenter", (ev, d) => {\n  lignes.attr("stroke", e => e === d ? "#8a4f8c" : "#d9dce2");   // focus + contexte\n  d3.select(ev.currentTarget).raise();                          // au premier plan\n  etiquettes.style("opacity", e => e === d ? 1 : 0);\n});')) + '<div data-q></div>';
      const host = b.querySelector('[data-c]');
      const w = WW(), nar = K.narrow(), H = 430, MG = {t: 40, b: 26, l: nar ? 120 : 170, r: nar ? 120 : 170};
      const svg = mk(host, w, H);
      const x0 = MG.l, x1 = w - MG.r, y = d3.scaleLinear().range([H - MG.b, MG.t]);
      [['2019', x0], ['2024', x1]].forEach(([t, xx]) => {
        svg.append('line').attr('x1', xx).attr('x2', xx).attr('y1', MG.t - 10).attr('y2', H - MG.b).attr('stroke', '#e5e7eb');
        ink(svg.append('text').attr('x', xx).attr('y', 20).attr('text-anchor', 'middle'), 13, INK, 700).text(t);
      });
      const grid = svg.append('g'), gL = svg.append('g'), labs = svg.append('g');
      const nat = svg.append('g').style('pointer-events', 'none');
      const natL = nat.append('line').attr('stroke', INK).attr('stroke-width', 2.5).attr('stroke-dasharray', '6 4');
      const natA = halo(ink(nat.append('text').attr('text-anchor', 'end'), 12, INK, 700)), natB = halo(ink(nat.append('text'), 12, INK, 700));
      const ttl = ink(svg.append('text').attr('x', w / 2).attr('y', 20).attr('text-anchor', 'middle'), 12, MUTED);
      let met = 'part';
      const draw = () => {
        const [nm, f] = PMET[met], all = WALL.flatMap(d => [f(d['2019']), f(d['2024'])]);
        y.domain([Math.floor(d3.min(all) / 10) * 10, Math.ceil(d3.max(all) / 10) * 10]);
        ttl.text(nm + ' (%) · tirets : le pays');
        const tk = y.ticks(5);
        grid.selectAll('line').data(tk, d => d).join('line').attr('x1', x0 - 4).attr('x2', x1 + 4).attr('y1', y).attr('y2', y).attr('stroke', '#f1f2f5');
        ink(grid.selectAll('text').data(tk, d => d).join('text').attr('x', (x0 + x1) / 2).attr('text-anchor', 'middle').attr('y', d => y(d) - 3).text(d => d + ' %'), 10, '#b6bac4');
        const n19 = f(NAT['2019']), n24 = f(NAT['2024']);
        natL.attr('x1', x0).attr('x2', x1).attr('y1', y(n19)).attr('y2', y(n24));
        natA.attr('x', x0 - 8).attr('y', y(n19) + 4).text((nar ? '' : 'Pays ') + fr(n19, 0) + ' %');
        natB.attr('x', x1 + 8).attr('y', y(n24) + 4).text(fr(n24, 0) + ' %' + (nar ? '' : ' Pays'));
        const t = svg.transition().duration(700);
        const ln = gL.selectAll('g.l').data(WALL, d => d.nom).join(en => {
          const g = en.append('g').attr('class', 'l').style('cursor', 'pointer');
          g.append('line').attr('class', 'hit').attr('stroke', 'transparent').attr('stroke-width', 12);
          g.append('line').attr('class', 'vis').attr('stroke', GREY).attr('stroke-width', 2);
          g.append('circle').attr('class', 'a').attr('r', 3.5).attr('fill', GREY2);
          g.append('circle').attr('class', 'b').attr('r', 3.5).attr('fill', GREY2);
          return g;
        });
        ln.selectAll('line').transition(t).attr('x1', x0).attr('x2', x1).attr('y1', d => y(f(d['2019']))).attr('y2', d => y(f(d['2024'])));
        ln.select('.a').transition(t).attr('cx', x0).attr('cy', d => y(f(d['2019'])));
        ln.select('.b').transition(t).attr('cx', x1).attr('cy', d => y(f(d['2024'])));
        const lb = labs.selectAll('g.t').data(WALL, d => d.nom).join(en => {
          const g = en.append('g').attr('class', 't').style('opacity', 0).style('pointer-events', 'none');
          halo(ink(g.append('text').attr('class', 'a').attr('text-anchor', 'end'), 12, INK, 700));
          halo(ink(g.append('text').attr('class', 'b'), 12, INK, 700));
          return g;
        });
        lb.select('.a').attr('x', x0 - 8).attr('y', d => y(f(d['2019'])) + 4).text(d => (nar ? '' : label(d.nom) + ' ') + fr(f(d['2019']), 0) + ' %');
        lb.select('.b').attr('x', x1 + 8).attr('y', d => y(f(d['2024'])) + 4).text(d => fr(f(d['2024']), 0) + ' %' + (nar ? '' : ' ' + label(d.nom)));
        const focus = d => {
          ln.select('.vis').attr('stroke', e => e === d ? ACC : GREY).attr('stroke-width', e => e === d ? 3.5 : 2);
          ln.selectAll('circle').attr('fill', e => e === d ? ACC : GREY2);
          ln.filter(e => e === d).raise();
          lb.style('opacity', e => e === d ? 1 : 0);
          nat.style('opacity', d ? .35 : 1);
        };
        ln.on('pointerenter', (ev, d) => focus(d)).on('pointerleave', () => focus(null));
        focus(null);
      };
      draw();
      wire(b, 'k', k => { met = k; draw(); });
      question(b.querySelector('[data-q]'), {
        prompt: 'Participation : survolez Nouakchott Nord, puis Gorgol. Quelle histoire se dessine ?',
        options: [
          {t: 'La participation baisse surtout dans les villes : les trois Nouakchott perdent 15 à 17 points', ok: true, why: 'Nouakchott Nord passe de ' + pct(WBY['Nouakchott Nord']['2019'].part, 0) + ' à ' + pct(WBY['Nouakchott Nord']['2024'].part, 0) + ', Gorgol bouge à peine (' + pct(WBY['Gorgol']['2019'].part, 0) + ' → ' + pct(WBY['Gorgol']['2024'].part, 0) + '). Le survol transforme le spaghetti en seize histoires lisibles, une à la fois. Pour publier, on garderait les deux ou trois lignes du message en couleur, les autres en gris.'},
          {t: 'La participation monte partout', why: 'Presque toutes les pentes descendent : regardez la colonne 2024.'},
          {t: 'On ne peut rien conclure, il y a trop de lignes', why: 'C’est justement ce que règle le survol : une ligne à la fois, sur fond gris.'}
        ]
      });
    }
  });


  /* ================= Partie 6 · React + D3 : vers le tableau de bord ================= */

  const R = window.React, RD = window.ReactDOM, h = R && R.createElement;
  steps.push({
    id: 'react-props', kicker: 'Décomposer', title: 'Un composant, une entrée',
    lead: 'Deux cartes, la même recette. Quelle valeur faut-il changer pour passer de 2019 à 2024 ?',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Même composant, deux élections. ' + SRC + '</div></div>' +
        '<label class="d4-control">Deuxième carte <select data-year><option>2024</option><option>2019</option></select></label>' +
        codeBox(hl('function Chiffre({ annee, participation }) {\n  return <p>Présidentielle {annee} : <strong>{participation} %</strong> de votants</p>;\n}\n\n<Chiffre annee={2019} participation={62.7} />\n<Chiffre annee={2024} participation={55.4} />')) +
        '<p class="small">Le <b>JSX</b> ressemble au HTML ; les accolades y insèrent une valeur JavaScript. Un <b>composant</b> décrit un morceau d’interface. Ses <b>props</b> sont les valeurs que son parent lui donne.</p><div data-q></div>';
      if (!R || !RD) { b.querySelector('[data-c]').textContent = 'React indisponible.'; return; }
      function Chiffre({annee, participation}) {
        return h('div', {className: 'd4-kpi'}, h('span', null, 'Présidentielle ' + annee), h('b', null, pct(participation)), h('i', null, 'des inscrits ont voté'));
      }
      const root = RD.createRoot(b.querySelector('[data-c]'));
      const show = () => { const y = b.querySelector('[data-year]').value; root.render(h('div', {className: 'd4-component-pair'}, h(Chiffre, {annee: '2019', participation: NAT['2019'].part}), h(Chiffre, {annee: y, participation: NAT[y].part}))); };
      b.querySelector('[data-year]').addEventListener('change', show); show();
      question(b.querySelector('[data-q]'), {
        prompt: 'Pour une troisième élection, faut-il réécrire le composant ?',
        options: [
          {t: 'Non : le parent lui transmet de nouvelles valeurs', ok: true, why: 'Une seule recette, des entrées différentes. On réutilise <code>Chiffre</code> pour chaque élection, puis on fait de même avec <code>Barres</code> ou <code>Carte</code>.'},
          {t: 'Oui : il faut un composant par élection', why: 'Le composant reçoit l’année en entrée ; sa structure reste la même.'},
          {t: 'D3 doit remplacer le texte dans la page', why: 'Ici, React produit les éléments. D3 n’a aucun élément à modifier.'}
        ]
      });
    }
  });

  steps.push({
    id: 'react-etat', kicker: 'Prédire puis manipuler', title: 'Un clic, un état, deux vues',
    lead: 'Avant de cliquer sur 2019 : le chiffre et la barre vont-ils changer ensemble ? Vérifiez.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Un chiffre et une barre calculés à partir de la même année. ' + SRC + '</div></div>' +
        codeBox(hl('function Tableau() {\n  const [annee, setAnnee] = useState(2024);\n  return <>\n    <button onClick={() => setAnnee(2019)}>2019</button>\n    <Chiffre annee={annee} />\n    <Barre annee={annee} />\n  </>;\n}')) +
        '<ol class="d4-flow" aria-label="Le trajet du clic"><li>Clic</li><li><code>setAnnee(2019)</code></li><li>État : 2019</li><li>Deux vues mises à jour</li></ol><div data-q></div>';
      if (!R || !RD) { b.querySelector('[data-c]').textContent = 'React indisponible.'; return; }
      const x = d3.scaleLinear().domain([0, 100]).range([0, 300]);
      function Chiffre({annee}) { return h('p', {className: 'd4-state-value'}, 'Présidentielle ' + annee + ' : ', h('strong', null, pct(NAT[annee].part)), ' de participation'); }
      function Barre({annee}) {
        return h('svg', {viewBox: '0 0 360 80', role: 'img', 'aria-label': 'Participation en ' + annee},
          h('rect', {x: 8, y: 12, width: 300, height: 24, fill: GREY}),
          h('rect', {x: 8, y: 12, width: x(NAT[annee].part), height: 24, fill: ACC, style: {transition: 'width .6s'}}),
          [0, 50, 100].map(v => h('text', {key: v, x: 8 + x(v), y: 57, textAnchor: v === 0 ? 'start' : v === 100 ? 'end' : 'middle', style: {fontSize: '12px', fill: MUTED}}, v + ' %')));
      }
      function Tableau() {
        const [annee, setAnnee] = R.useState('2024');
        return h('div', null,
          h('div', {className: 'row'}, YRS.map(y => h('button', {key: y, type: 'button', className: 'chip', 'aria-pressed': y === annee, onClick: () => setAnnee(y)}, y))),
          h('p', {className: 'd4-state-read', 'aria-live': 'polite'}, 'État du parent : annee = ' + annee),
          h(Chiffre, {annee}), h(Barre, {annee}));
      }
      RD.createRoot(b.querySelector('[data-c]')).render(h(Tableau));
      question(b.querySelector('[data-q]'), {
        prompt: 'On ajoute le pictogramme « cent inscrits », qui doit suivre les mêmes boutons. Où vit son année ?',
        options: [
          {t: 'Dans Tableau : le pictogramme reçoit annee en prop', ok: true, why: 'La sélection commune appartient au parent commun. <code>useState</code> fournit la valeur actuelle et la fonction qui la change ; chaque vue la reçoit.'},
          {t: 'Dans un nouvel useState du pictogramme', why: 'Ce serait une deuxième sélection indépendante : cliquer 2019 ne changerait pas le pictogramme.'},
          {t: 'D3 va chercher le bouton actif dans la page', why: 'L’année est déjà dans l’état ; relire le bouton ajouterait une deuxième source pour la même information.'}
        ]
      });
    }
  });

  const JSX_BARS = 'function Barres({ donnees, annee }) {\n  const [survol, setSurvol] = useState(null);   // l’interaction est un état\n  // D3 calcule…\n  const x = d3.scaleLinear().domain([0, 100]).range([0, 420]);\n  const y = d3.scaleBand().domain(donnees.map(d => d.nom))\n    .range([0, 330]).padding(0.2);\n  // … React dessine\n  return (\n    <svg viewBox="0 0 680 380">\n      {donnees.map(d => (\n        <rect key={d.nom}                      // la clé, comme .data(…, d => d.nom)\n              y={y(d.nom)} height={y.bandwidth()}\n              width={x(d.score[annee])}\n              fill={d.nom === survol ? "#8a4f8c" : "#d9dce2"}\n              onMouseEnter={() => setSurvol(d.nom)}\n              onMouseLeave={() => setSurvol(null)} />\n      ))}\n    </svg>\n  );\n}';
  const D3_BARS = 'zone.selectAll("rect").data(donnees, d => d.nom)\n  .join("rect")\n  .attr("y", d => y(d.nom)).attr("height", y.bandwidth())\n  .attr("width", d => x(d.score[annee]))\n  .on("mouseenter", (ev, d) => d3.select(ev.currentTarget).attr("fill", "#8a4f8c"))\n  .on("mouseleave", ev => d3.select(ev.currentTarget).attr("fill", "#d9dce2"));';
  steps.push({
    id: 'react', kicker: 'Construire', title: 'D3 calcule, React dessine',
    lead: 'Les barres de tout à l’heure, en React. D3 calcule les positions ; React décrit les rectangles et retient la barre survolée. Survolez, changez d’élection.',
    build(b) {
      if (!R || !RD) { b.innerHTML = '<p class="small">React indisponible.</p>'; return; }
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="small" data-n></div></div>' +
        '<div class="row">' + chips(YRS.map(v => [v, v]), '2024', 'y') + '</div>' +
        '<div><span class="d4-tag">React + D3 (JSX)</span>' + codeBox(hl(JSX_BARS)) + '</div><details class="foot-details"><summary>Comparer avec D3 seul</summary>' + codeBox(hl(D3_BARS)) + '</details>' +
        '<div data-q></div>';
      const host = b.querySelector('[data-c]'), nOut = b.querySelector('[data-n]');
      let renders = 0;
      function Barres({annee}) {
        const [survol, setSurvol] = R.useState(null);
        renders++;
        const w = WW(), nar = K.narrow(), L = nar ? 130 : 160, iw = w - L - 56, ih = WIL.length * 22;
        const rows = WIL.map(d => ({nom: d.nom, t: d[annee].sh('ghazouani'), b: d[annee].sh('biram')})).sort((a, c) => c.t - a.t);
        const x = d3.scaleLinear().domain([0, 100]).range([0, iw]);
        const y = d3.scaleBand().domain(rows.map(d => d.nom)).range([0, ih]).padding(.2);
        const s = rows.find(d => d.nom === survol);
        return h('svg', {className: 'chart d4', viewBox: '0 0 ' + w + ' ' + (ih + 50), role: 'img'},
          h('text', {className: 'title', x: 0, y: 22}, s ? s.nom + ' : ' + pct(s.t, 0) + ' pour Ghazouani, ' + pct(s.b, 0) + ' pour Biram' : annee + ' : survolez une wilaya'),
          h('g', {transform: 'translate(' + L + ',36)'},
            rows.map(d => h('g', {key: d.nom, style: {transform: 'translate(0px,' + y(d.nom) + 'px)', transition: 'transform .6s', cursor: 'pointer'},
              onMouseEnter: () => setSurvol(d.nom), onMouseLeave: () => setSurvol(null)},
              h('rect', {x: -L, width: L + iw + 50, height: y.bandwidth(), fill: 'transparent'}),
              h('rect', {height: y.bandwidth(), width: x(d.t), fill: d.nom === survol ? ACC : GREY2, style: {transition: 'width .6s'}}),
              h('text', {x: -8, y: y.bandwidth() / 2 + 4, textAnchor: 'end', style: {fontSize: '12px', fill: d.nom === survol ? INK : '#464d5c', fontWeight: d.nom === survol ? 700 : 400}}, d.nom),
              h('text', {x: x(d.t) + 6, y: y.bandwidth() / 2 + 4, style: {fontSize: '11px', fill: MUTED}}, pct(d.t, 0))))));
      }
      const root = RD.createRoot(host);
      const tick = () => setTimeout(() => { nOut.textContent = 'Rendus de Barres : ' + renders + ' (un par changement d’état : année ou survol).'; }, 0);
      host.addEventListener('pointerover', tick); host.addEventListener('pointerout', tick);
      const show = annee => { root.render(h(Barres, {annee})); tick(); };
      show('2024');
      wire(b, 'y', show);
      question(b.querySelector('[data-q]'), {
        prompt: 'Dans la version React, que se passe-t-il quand la souris entre sur une barre ?',
        options: [
          {t: 'setSurvol change l’état ; React redessine les barres et le titre avec la nouvelle valeur', ok: true, why: 'En React, l’interaction est un <b>état</b> comme un autre. On ne modifie pas l’élément à la main (<code>d3.select(…).attr(…)</code>) : on change la donnée, et React recalcule. C’est la règle du skill <b>d3</b> de Yan Holtz : « D3 for math, React for rendering ». Le compteur de rendus le montre.'},
          {t: 'D3 colore la barre avec d3.select', why: 'Il n’y a plus de <code>d3.select</code> : regardez le code. D3 ne fait que les échelles.'},
          {t: 'Le navigateur colore la barre grâce au CSS', why: 'Un <code>:hover</code> CSS colorerait la barre, mais ne changerait pas le titre : le titre dépend de l’état.'}
        ]
      });
    }
  });

  // Analogie du cours 2025-2026 (cm4.pptx) : pourquoi une voiture a un tableau de bord, et pas un tableur ?
  const CAR = [
    ['Conçu pour des décisions en temps réel', 'Conçu pour du pilotage continu', 'On change d’élection ou de wilaya : la réponse s’affiche aussitôt.'],
    ['Montre uniquement ce qui compte maintenant', 'Montre uniquement ce qui déclenche une action', 'Quatre chiffres : la sélection, les inscrits, la participation, le candidat en tête.'],
    ['Cache la complexité mécanique', 'Cache les pipelines, calculs, modèles', '246 communes, une ligne par candidat, deux orthographes par nom : nettoyés avant (voir « D3 ne nettoie rien »).'],
    ['Réagit au contexte (alertes, vitesse…)', 'Réagit à l’utilisateur, aux filtres, à l’état', 'Le survol et le clic sont des états : <code>annee</code>, <code>wilaya</code>, <code>survol</code>.']
  ];
  steps.push({
    id: 'voiture', kicker: 'Analogie', title: 'Pourquoi une voiture a un tableau de bord, et pas un tableur ?',
    lead: 'Vous conduisez. Démarrez, et cliquez « Faire le plein » dès qu’il le faut. Essayez d’abord avec le tableur, puis avec le tableau de bord.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Une voiture simulée : douze mesures, mises à jour cinq fois par seconde.</div></div>' +
        chips([['tab', 'Tableur'], ['bord', 'Tableau de bord']], 'tab') +
        '<div class="row" style="margin-top:8px"><button class="btn btn-primary" data-go>▶ Démarrer</button><button class="btn" data-fill disabled>⛽ Faire le plein</button></div>' +
        '<div data-fb></div><div data-ana hidden></div><div data-q hidden></div>';
      const host = b.querySelector('[data-c]');
      const w = WW(), nar = K.narrow(), H = 300;
      let mode = 'tab', st = null, timer = null, tries = 0;
      const fresh = () => ({t: 0, v: 72, fuel: 24, km: 48213.4, temp: 89});
      const ROWS = s => [
        ['Vitesse', fr(s.v, 0) + ' km/h'], ['Régime moteur', fr(s.v * 27 + 300 + 80 * Math.sin(s.t * 3), 0) + ' tr/min'],
        ['Température moteur', fr(s.temp, 1) + ' °C'], ['Pression d’huile', fr(3.1 + .2 * Math.sin(s.t), 2) + ' bar'],
        ['Tension batterie', fr(13.9 + .1 * Math.cos(s.t * 2), 2) + ' V'], ['Consommation', fr(5.5 + s.v / 40 + .4 * Math.sin(s.t * 4), 1) + ' L/100'],
        ['Pneu avant gauche', fr(2.31 + .01 * Math.sin(s.t), 2) + ' bar'], ['Pneu avant droit', fr(2.29 + .01 * Math.cos(s.t), 2) + ' bar'],
        ['Carburant', fr(s.fuel, 1) + ' %'], ['Pneu arrière gauche', fr(2.4 + .01 * Math.sin(s.t * 1.3), 2) + ' bar'],
        ['Température extérieure', fr(38 + .3 * Math.sin(s.t / 3), 1) + ' °C'], ['Compteur', fr(s.km, 1) + ' km']
      ];
      // Le tableau de bord : un compteur, une jauge, un voyant
      const svg = mk(host, w, H);
      const dash = svg.append('g');
      const cx = nar ? w * .36 : w * .38, cy = 170, R = nar ? 110 : 125;
      const ang = d3.scaleLinear().domain([0, 180]).range([-2.2, 2.2]);
      dash.append('rect').attr('x', 6).attr('y', 6).attr('width', w - 12).attr('height', H - 12).attr('rx', 26).attr('fill', '#1d2433');
      dash.append('path').attr('transform', 'translate(' + cx + ',' + cy + ')').attr('d', d3.arc()({innerRadius: R - 8, outerRadius: R, startAngle: -2.2, endAngle: 2.2})).attr('fill', '#3a4255');
      d3.range(0, 181, 20).forEach(v => {
        const a = ang(v) - Math.PI / 2;
        dash.append('line').attr('x1', cx + (R - 14) * Math.cos(a)).attr('y1', cy + (R - 14) * Math.sin(a)).attr('x2', cx + (R - 2) * Math.cos(a)).attr('y2', cy + (R - 2) * Math.sin(a)).attr('stroke', '#e8eaf0').attr('stroke-width', 2);
        ink(dash.append('text').attr('x', cx + (R - 30) * Math.cos(a)).attr('y', cy + (R - 30) * Math.sin(a) + 4).attr('text-anchor', 'middle').text(v), 11, '#c9ccd3');
      });
      const needle = dash.append('line').attr('x1', cx).attr('y1', cy).attr('x2', cx).attr('y2', cy - R + 20).attr('stroke', MARK).attr('stroke-width', 3.5).attr('stroke-linecap', 'round');
      dash.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 7).attr('fill', MARK);
      const spd = ink(dash.append('text').attr('x', cx).attr('y', cy + 46).attr('text-anchor', 'middle'), 26, '#fff', 700);
      ink(dash.append('text').attr('x', cx).attr('y', cy + 64).attr('text-anchor', 'middle').text('km/h'), 11, '#c9ccd3');
      // Jauge de carburant
      const fx = nar ? w * .82 : w * .78, fy = 150, fr2 = nar ? 46 : 58;
      const fang = d3.scaleLinear().domain([0, 100]).range([-1.2, 1.2]);
      const farc = d3.arc().innerRadius(fr2 - 7).outerRadius(fr2);
      dash.append('path').attr('transform', 'translate(' + fx + ',' + fy + ')').attr('d', farc({startAngle: fang(12), endAngle: 1.2})).attr('fill', '#3a4255');
      dash.append('path').attr('transform', 'translate(' + fx + ',' + fy + ')').attr('d', farc({startAngle: -1.2, endAngle: fang(12)})).attr('fill', BAD);
      ink(dash.append('text').attr('x', fx + (fr2 + 10) * Math.cos(-1.2 - Math.PI / 2)).attr('y', fy + (fr2 + 10) * Math.sin(-1.2 - Math.PI / 2) + 4).attr('text-anchor', 'middle').text('E'), 12, '#c9ccd3', 700);
      ink(dash.append('text').attr('x', fx + (fr2 + 10) * Math.cos(1.2 - Math.PI / 2)).attr('y', fy + (fr2 + 10) * Math.sin(1.2 - Math.PI / 2) + 4).attr('text-anchor', 'middle').text('F'), 12, '#c9ccd3', 700);
      const fneedle = dash.append('line').attr('x1', fx).attr('y1', fy).attr('x2', fx).attr('y2', fy - fr2 + 10).attr('stroke', '#fff').attr('stroke-width', 2.5).attr('stroke-linecap', 'round');
      // Voyant : une pompe à essence
      const lamp = dash.append('g').attr('transform', 'translate(' + (fx - 13) + ',' + (fy + 26) + ')');
      lamp.append('rect').attr('x', 0).attr('y', 0).attr('width', 16).attr('height', 24).attr('rx', 2);
      lamp.append('rect').attr('x', 3).attr('y', 4).attr('width', 10).attr('height', 7).attr('fill', '#1d2433');
      lamp.append('path').attr('d', 'M16 6 L22 10 V20 Q22 23 25 21 V9').attr('fill', 'none').attr('stroke-width', 2.5);
      const paint = on => { lamp.selectAll('rect:first-child').attr('fill', on ? '#f59e0b' : '#3a4255'); lamp.select('path').attr('stroke', on ? '#f59e0b' : '#3a4255'); };
      paint(false);
      // Le tableur : douze lignes qui bougent
      const tab = document.createElement('div');
      tab.className = 'd4-car-sheet';
      host.appendChild(tab);
      const draw = () => {
        const s = st || fresh();
        svg.style('display', mode === 'bord' ? null : 'none'); tab.hidden = mode !== 'tab';
        if (mode === 'tab') tab.innerHTML = '<table class="data"><tbody>' + ROWS(s).map(r => '<tr><td>' + r[0] + '</td><td style="text-align:right;font-variant-numeric:tabular-nums">' + r[1] + '</td></tr>').join('') + '</tbody></table>';
        else {
          needle.attr('transform', 'rotate(' + (ang(s.v) * 180 / Math.PI) + ',' + cx + ',' + cy + ')');
          fneedle.attr('transform', 'rotate(' + (fang(s.fuel) * 180 / Math.PI) + ',' + fx + ',' + fy + ')');
          spd.text(fr(s.v, 0));
          paint(s.fuel < 12 && Math.floor(s.t * 2) % 2 === 0);
        }
      };
      const fb = b.querySelector('[data-fb]'), go = b.querySelector('[data-go]'), fill = b.querySelector('[data-fill]');
      const end = html => {
        if (timer) timer.stop(); timer = null;
        go.disabled = false; go.textContent = '▶ Recommencer'; fill.disabled = true;
        fb.innerHTML = html; tries++;
        if (tries >= 1) { b.querySelector('[data-ana]').hidden = false; }
        if (tries >= 2) b.querySelector('[data-q]').hidden = false;
      };
      go.addEventListener('click', () => {
        st = fresh(); go.disabled = true; fill.disabled = false; fb.innerHTML = '';
        timer = d3.interval(() => {
          if (!b.isConnected) { timer.stop(); return; }
          st.t += .2; st.v = Math.max(40, Math.min(130, st.v + 7 * Math.sin(st.t * 1.7) + (Math.random() - .5) * 6));
          st.fuel = Math.max(0, st.fuel - .3); st.km += st.v / 18000; st.temp = 89 + 2 * Math.sin(st.t / 2);
          draw();
          if (st.fuel <= 0) end(M.note('ghost', '<p><b>Panne sèche</b> (' + (mode === 'tab' ? 'tableur' : 'tableau de bord') + '). Le chiffre était là, sur la 9<sup>e</sup> ligne… mais rien ne le faisait remarquer.</p>'));
        }, 200);
      });
      fill.addEventListener('click', () => {
        const f = st.fuel;
        end(M.note(f <= 12 ? 'lion' : 'cat', '<p>Plein fait avec <b>' + fr(f, 1) + ' %</b> d’essence, avec le <b>' + (mode === 'tab' ? 'tableur' : 'tableau de bord') + '</b>. ' +
          (f > 12 ? 'Un peu tôt : rien ne pressait encore.' : 'Juste à temps.') + (mode === 'tab' ? ' Passez au tableau de bord et recommencez.' : ' Le voyant a parlé avant que vous ayez à lire un seul chiffre.') + '</p>'));
      });
      wire(b, 'k', k => { mode = k; draw(); });
      draw();
      b.querySelector('[data-ana]').innerHTML = '<table class="data d4-table d4-car"><thead><tr><th>Tableau de bord de voiture</th><th>Dashboard data</th><th>Dans notre tableau de bord électoral</th></tr></thead><tbody>' +
        CAR.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>').join('') + '</tbody></table>' +
        M.note('dog', '<p>Un tableau de bord n’est pas une page de graphiques : c’est un <b>système</b>. <b>L’état</b> (la mémoire : ce qui est choisi), <b>la logique</b> (les calculs), <b>les vues</b> (les fenêtres). Le voyant d’essence, c’est une logique (« moins de 12 % ? ») branchée sur un état (le niveau) et affichée dans une vue.</p>');
      question(b.querySelector('[data-q]'), {
        prompt: 'Le tableur montrait tout, et pourtant on tombait en panne. Que faut-il décider avant de dessiner un tableau de bord ?',
        options: [
          {t: 'Les quelques chiffres qui déclenchent une décision, pour qui, et quand alerter', ok: true, why: 'Le conducteur n’a pas besoin de la pression d’huile au centième : il a besoin de savoir quand s’arrêter. Pour un tableau de bord électoral, même question : qui le lit (un journaliste, la CENI, un candidat ?) et quelle décision prend-il ? Le reste se cache, ou se trouve au survol.'},
          {t: 'Le nombre maximal de graphiques qu’on peut afficher', why: 'C’est le réflexe du tableur : tout montrer. Plus de vues, c’est plus de lignes à parcourir des yeux.'},
          {t: 'Les couleurs', why: 'La couleur sert le voyant, mais seulement une fois qu’on sait ce qui doit alerter.'}
        ]
      });
    }
  });

  const JSX_DASH = 'function TableauDeBord() {\n  const [annee, setAnnee]   = useState(2024);\n  const [wilaya, setWilaya] = useState(null);   // le clic : choisir\n  const [survol, setSurvol] = useState(null);   // le survol : prévisualiser\n  const vue = survol ?? wilaya;                  // ce que montrent les chiffres\n  return (\n    <div className="tableau">\n      <Chiffres   annee={annee} wilaya={vue} />\n      <Carte      annee={annee} wilaya={wilaya} survol={survol}\n                  onChoisir={setWilaya} onSurvol={setSurvol} />\n      <Classement annee={annee} wilaya={wilaya} survol={survol}\n                  onChoisir={setWilaya} onSurvol={setSurvol} />\n      <Candidats  annee={annee} wilaya={vue} />\n    </div>\n  );\n}';
  steps.push({
    id: 'tableau', kicker: 'Manipuler', title: 'Un tableau de bord en React',
    lead: 'Quatre vues, trois états : l’élection, la wilaya choisie (clic) et la wilaya survolée. Survolez la carte : que s’allume ailleurs ? Puis cliquez.',
    build(b) {
      if (!R || !RD || !GEO) { b.innerHTML = '<p class="small">React ou les limites des wilayas sont indisponibles.</p>'; return; }
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Écrit en React (composants, état) et D3 (échelles, <code>geoPath</code>), dans cette page. Le vote à l’étranger est compté dans le total national. ' + SRC + '</div></div>' +
        codeBox(hl(JSX_DASH)) + '<div data-q></div>';
      const {useState} = R;
      const nar = K.narrow();
      const val = (wy, annee) => wy ? WBY[wy][annee] : NAT[annee];
      function Chiffres({annee, wilaya}) {
        const v = val(wilaya, annee), p = annee === '2024' ? val(wilaya, '2019') : null, f = v.first || lead(v.v, CK[annee]);
        const sh = k => wilaya ? v.sh(k) : NAT[annee].sh(k);
        const tile = (lab, txt, d) => h('div', {className: 'd4-kpi'}, h('span', null, lab), h('b', null, txt), d ? h('i', null, d) : null);
        const dd = p ? v.part - p.part : null;
        return h('div', {className: 'd4-kpis'},
          h('div', {className: 'd4-kpi d4-kpi-head'}, h('span', null, 'Sélection'), h('b', null, wilaya ? label(wilaya) : 'Mauritanie'), h('i', null, 'présidentielle ' + annee)),
          tile('Inscrits', fr(v.reg)),
          tile('Participation', pct(v.part, 0), dd != null ? (dd >= 0 ? '+' : '−') + fr(Math.abs(dd), 0) + ' pt sur 2019' : null),
          tile('En tête', COURT[f], pct(sh(f), 0) + ' des voix'));
      }
      function Carte({annee, wilaya, survol, onChoisir, onSurvol}) {
        const w = nar ? 340 : 330, H = nar ? 300 : 290;
        const path = d3.geoPath(d3.geoMercator().fitExtent([[6, 6], [w - 6, H - 6]], GEO));
        const on = nm => nm === wilaya || nm === survol;
        return h('svg', {className: 'chart d4', viewBox: '0 0 ' + w + ' ' + H, role: 'img', onMouseLeave: () => onSurvol(null)},
          GEO.features.slice().sort((a, c) => on(a.properties.nom) - on(c.properties.nom)).map(f => {
            const nm = f.properties.nom, t = WBY[nm][annee].sh('ghazouani');
            return h('path', {key: nm, d: path(f), fill: TCOL(t), stroke: on(nm) ? INK : '#fff', strokeWidth: on(nm) ? 2 : .7,
              style: {cursor: 'pointer'}, onMouseEnter: () => onSurvol(nm), onClick: () => onChoisir(nm === wilaya ? null : nm)});
          }),
          h('text', {x: 6, y: H - 8, style: {fontSize: '11px', fill: MUTED}}, 'Couleur : score de Ghazouani · clic : choisir'));
      }
      function Classement({annee, wilaya, survol, onChoisir, onSurvol}) {
        const w = nar ? 340 : 330, L = 118, rh = 17, H = WIL.length * rh + 10;
        const rows = WIL.map(d => ({nom: d.nom, t: d[annee].sh('ghazouani')})).sort((a, c) => c.t - a.t);
        const x = d3.scaleLinear().domain([0, 100]).range([0, w - L - 34]);
        return h('svg', {className: 'chart d4', viewBox: '0 0 ' + w + ' ' + H, role: 'img', onMouseLeave: () => onSurvol(null)},
          rows.map((d, i) => h('g', {key: d.nom, style: {transform: 'translate(' + L + 'px,' + (5 + i * rh) + 'px)', cursor: 'pointer', transition: 'transform .5s'},
            onMouseEnter: () => onSurvol(d.nom), onClick: () => onChoisir(d.nom === wilaya ? null : d.nom)},
            h('rect', {x: -L, y: -1, width: w, height: rh, fill: d.nom === survol ? 'rgba(246,205,76,.35)' : 'transparent'}),
            h('rect', {height: rh - 4, width: x(d.t), fill: d.nom === wilaya ? ACC : GREY2}),
            h('text', {x: -6, y: rh / 2 + 2, textAnchor: 'end', style: {fontSize: '11px', fill: d.nom === wilaya ? INK : '#464d5c', fontWeight: d.nom === wilaya || d.nom === survol ? 700 : 400}}, d.nom),
            h('text', {x: x(d.t) + 4, y: rh / 2 + 2, style: {fontSize: '10px', fill: MUTED}}, fr(d.t, 0)))));
      }
      function Candidats({annee, wilaya}) {
        const w = WW(), L = nar ? 80 : 100, rh = 22, v = val(wilaya, annee), cv = wilaya ? v.c : NAT[annee].v;
        const rows = CK[annee].map(k => ({k, n: cv[k] || 0})).sort((a, c) => c.n - a.n);
        const x = d3.scaleLinear().domain([0, 100]).range([0, w - L - 120]);
        const H = rows.length * rh + 26;
        return h('svg', {className: 'chart d4', viewBox: '0 0 ' + w + ' ' + H, role: 'img'},
          h('text', {x: 0, y: 14, style: {fontSize: '12px', fill: MUTED}}, 'Les candidats, ' + (wilaya ? label(wilaya) : 'Mauritanie') + ' (% des exprimés)'),
          rows.map((d, i) => h('g', {key: d.k, transform: 'translate(' + L + ',' + (22 + i * rh) + ')'},
            h('rect', {height: rh - 6, width: x(100 * d.n / v.ex), fill: CCOL[d.k], style: {transition: 'width .5s'}}),
            h('text', {x: -6, y: rh / 2 + 1, textAnchor: 'end', style: {fontSize: '12px', fill: INK}}, COURT[d.k]),
            h('text', {x: x(100 * d.n / v.ex) + 6, y: rh / 2 + 1, style: {fontSize: '11px', fill: MUTED}}, pct(100 * d.n / v.ex, 1) + ' · ' + fr(d.n) + ' voix'))));
      }
      function TableauDeBord() {
        const [annee, setAnnee] = useState('2024');
        const [wilaya, setWilaya] = useState(null);
        const [survol, setSurvol] = useState(null);
        const vue = survol || wilaya;
        return h('div', {className: 'd4-dash'},
          h('div', {className: 'row', style: {gap: '6px'}}, YRS.map(y => h('button', {key: y, type: 'button', className: 'chip', 'aria-pressed': y === annee, onClick: () => setAnnee(y)}, 'Présidentielle ' + y)),
            wilaya ? h('button', {className: 'btn', type: 'button', onClick: () => setWilaya(null)}, '← Tout le pays') : null),
          h(Chiffres, {annee, wilaya: vue}),
          h('div', {className: 'd4-dash-row'}, h(Carte, {annee, wilaya, survol, onChoisir: setWilaya, onSurvol: setSurvol}), h(Classement, {annee, wilaya, survol, onChoisir: setWilaya, onSurvol: setSurvol})),
          h(Candidats, {annee, wilaya: vue}),
          h('p', {className: 'd4-state-read', 'aria-live': 'polite'}, 'État : annee = ' + annee + ' · wilaya = ' + (wilaya ? '"' + wilaya + '"' : 'null') + ' · survol = ' + (survol ? '"' + survol + '"' : 'null')));
      }
      RD.createRoot(b.querySelector('[data-c]')).render(h(TableauDeBord));
      question(b.querySelector('[data-q]'), {
        prompt: 'Vous survolez Gorgol sur la carte. Pourquoi sa barre s’allume-t-elle dans le classement ?',
        options: [
          {t: 'Parce que le survol est un état du parent, transmis aux deux vues', ok: true, why: 'C’est le principe des <b>vues liées</b> (<i>linked highlighting</i>) : la carte appelle <code>onSurvol("Gorgol")</code>, le parent met à jour <code>survol</code>, et chaque vue se redessine avec la même valeur. Survoler <b>prévisualise</b>, cliquer <b>choisit</b> : deux états différents. Le CM 5 et le TD 4 partent de là.'},
          {t: 'Parce que D3 synchronise les graphiques entre eux', why: 'D3 ne connaît pas les autres graphiques : il calcule des échelles et des chemins.'},
          {t: 'Parce que chaque graphique surveille la souris', why: 'Seule la carte reçoit la souris. Le classement change parce que son entrée (<code>survol</code>) a changé.'}
        ]
      });
    }
  });

  /* ================= Partie 7 · D3 à l'ère de l'IA ================= */

  steps.push({
    id: 'ia', kicker: 'Critiquer', title: 'Le premier jet d’une IA',
    lead: '« Fais-moi un graphique D3 interactif des résultats de la présidentielle 2024. » Voici une réponse typique. Survolez-la, puis comptez les défauts.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Graphique refait ici à titre d’exemple, avec D3 : <code>d3.pie()</code> et la palette <code>d3.schemeTableau10</code>.</div></div>' +
        '<div class="row"><button class="btn" data-show>Voir les défauts</button></div><div data-list></div><div data-skills hidden></div><div data-q hidden></div>';
      const host = b.querySelector('[data-c]'), tip = tipFor(host);
      const w = WW(), nar = K.narrow(), H = nar ? 440 : 330, svg = mk(host, w, H);
      ink(svg.append('text').attr('x', w / 2).attr('y', 22).attr('text-anchor', 'middle'), 16, INK, 700).text('Résultats de l’élection');
      const data = E.cands['2024'];
      const pie = d3.pie().value(d => d.v).sort(null), arc = d3.arc().innerRadius(0).outerRadius(nar ? 110 : 125);
      const col = d3.scaleOrdinal(d3.schemeTableau10);
      const g = svg.append('g').attr('transform', 'translate(' + (nar ? w / 2 : 170) + ',' + (nar ? 160 : 180) + ')');
      g.selectAll('path').data(pie(data)).join('path').attr('d', arc).attr('fill', d => col(d.data.k)).attr('stroke', '#fff').attr('stroke-width', .8)
        .on('pointerenter pointermove', (ev, d) => tip.show(ev, '<b>' + d.data.nom + '</b><span class="d4-tip-sub">' + fr(d.data.v) + ' voix</span>')).on('pointerleave', () => tip.hide());
      const lg = svg.append('g').attr('transform', nar ? 'translate(16,300)' : 'translate(340,90)');
      lg.selectAll('g').data(data).join('g').attr('transform', (d, i) => 'translate(0,' + i * 20 + ')').each(function (d) {
        const r = d3.select(this);
        r.append('rect').attr('width', 10).attr('height', 10).attr('fill', col(d.k));
        ink(r.append('text').attr('x', 15).attr('y', 9.5), nar ? 10.5 : 12, '#464d5c').text(d.nom);
      });
      const DEF = [
        '<b>Un titre qui ne dit rien</b> : quelle élection, quel message ?',
        '<b>Les chiffres seulement au survol</b> : personne ne les verra (Archie Tse), et pas du tout sur téléphone.',
        '<b>Des voix, pas des pourcentages</b>, et sans dire sur quoi : exprimés ? inscrits ?',
        '<b>L’abstention a disparu</b> : ' + pct(100 - NAT['2024'].part, 0) + ' des inscrits ne sont pas dans le camembert.',
        '<b>Sept parts et une légende</b> : l’œil fait des allers-retours ; les petites parts sont illisibles.',
        '<b>Aucune géographie</b> : le contraste villes / Est, le vrai sujet, est invisible.',
        '<b>Pas de source</b>.'
      ];
      b.querySelector('[data-show]').addEventListener('click', e => {
        e.target.hidden = true;
        b.querySelector('[data-list]').innerHTML = '<ol class="recap">' + DEF.map(t => '<li><span>' + t + '</span></li>').join('') + '</ol>';
        b.querySelector('[data-skills]').hidden = false; b.querySelector('[data-q]').hidden = false;
      });
      b.querySelector('[data-skills]').innerHTML = M.note('dog', '<p><b>Des « skills » pour l’IA.</b> Un skill est un fichier d’instructions (<code>SKILL.md</code>) que l’assistant lit avant de travailler. Yan Holtz en publie pour la dataviz : <b>inspiration</b> (chercher d’abord 3 à 5 graphiques publiés), <b>roast-my-chart</b> (relire un graphique avec les 61 fiches d’erreurs de Data to Viz), <b>d3</b> (React + D3, comme le tableau de bord ci-dessus). Au TD 3, vous les utiliserez pas à pas, captures d’écran à l’appui : <a href="https://github.com/holtzy/dataviz-skills" target="_blank" rel="noopener">github.com/holtzy/dataviz-skills</a>.</p>');
      question(b.querySelector('[data-q]'), {
        prompt: 'L’IA a bien ajouté de l’interactivité. Pourquoi le graphique reste-t-il mauvais ?',
        options: [
          {t: 'Parce que l’interaction ne remplace ni la question, ni le message, ni la vérification', ok: true, why: 'L’IA a mis des infobulles parce qu’on lui a dit « interactif ». Elle ne sait pas ce que vous voulez montrer, ni sur quel dénominateur. Vous choisissez quoi montrer, vous relisez, vous corrigez, puis l’interaction vient approfondir.'},
          {t: 'Parce qu’il manque une animation', why: 'Une animation ne réparerait aucun des défauts listés.'},
          {t: 'Parce qu’il fallait plus de couleurs', why: 'Il y en a déjà sept, une par part : c’est trop, pas trop peu.'}
        ]
      });
    }
  });

  const RN = E.rawNames, NV = E.naive;
  steps.push({
    id: 'donnees', kicker: 'Piège', title: 'D3 ne nettoie rien',
    lead: 'Le piège du TD 2, en D3 cette fois. Le fichier compte une ligne par commune <b>et par candidat</b>. On additionne la colonne des inscrits : combien d’inscrits en 2024 ?',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">' + SRC + '</div></div>' +
        chips([['raw', 'La somme de toutes les lignes'], ['clean', 'Une ligne par commune, puis la somme']], 'raw') +
        codeBox(hl('// 7 candidats → chaque commune apparaît 7 fois\nconst faux = d3.sum(lignes, d => d.registered_voters);\nconst communes = d3.rollup(lignes, v => v[0].registered_voters,\n  d => d.moughataa + "/" + d.commune);   // deux communes peuvent porter le même nom\nconst vrai = d3.sum(communes.values());')) +
        '<ul class="recap d4-facts">' +
        '<li><span>Biram s’écrit <code>' + K.esc(RN['2019'].find(n => n.startsWith('Biram'))) + '</code> en 2019 et <code>' + K.esc(RN['2024'].find(n => n.startsWith('Biram'))).replace(/  /g, '␣␣') + '</code> en 2024 (deux espaces) : une jointure par nom le perd.</span></li>' +
        '<li><span>Ghazouani : <code>' + K.esc(RN['2019'].find(n => n.includes('GHAZOUANI'))) + '</code>, puis <code>' + K.esc(RN['2024'].find(n => n.includes('Ghazouani'))) + '</code>.</span></li>' +
        '<li><span>« Etranger » est rangé comme une wilaya : ' + fr(WBY.Etranger['2024'].reg) + ' inscrits sans polygone sur la carte.</span></li></ul><div data-q></div>';
      const w = WW(), H = 170, L = 160, svg = mk(b.querySelector('[data-c]'), w, H);
      const x = d3.scaleLinear().domain([0, NV['2024'].reg]).range([0, w - L - 110]);
      const rows = [['2024', NV['2024'].reg, NAT['2024'].reg], ['2019', NV['2019'].reg, NAT['2019'].reg]];
      const g = svg.selectAll('g').data(rows).join('g').attr('transform', (d, i) => 'translate(' + L + ',' + (24 + i * 64) + ')');
      ink(g.append('text').attr('x', -10).attr('y', 22).attr('text-anchor', 'end').text(d => 'Inscrits ' + d[0]), 13, INK, 700);
      const bar = g.append('rect').attr('height', 32).attr('fill', BAD);
      const v = ink(g.append('text').attr('y', 22), 13, INK, 700);
      const draw = k => {
        const t = svg.transition().duration(800), f = d => k === 'raw' ? d[1] : d[2];
        bar.transition(t).attr('width', d => x(f(d))).attr('fill', k === 'raw' ? BAD : GOOD);
        v.transition(t).attr('x', d => x(f(d)) + 8).text(d => fr(f(d)) + (k === 'raw' ? ' ?' : ''));
      };
      draw('raw'); wire(b, 'k', draw);
      question(b.querySelector('[data-q]'), {
        prompt: fr(NV['2024'].reg) + ' inscrits, pour un pays d’environ 4,9 millions d’habitants. Où se corrige l’erreur ?',
        options: [
          {t: 'Dans les données, avant D3 : une ligne par commune, des noms harmonisés', ok: true, why: 'D3 additionne ce qu’on lui donne : chaque commune compte ici ' + E.cands['2024'].length + ' fois, une par candidat. On regroupe (<code>d3.rollup</code>, ou pandas avant), on harmonise les noms, on documente. Un graphique interactif expose encore plus les erreurs : le lecteur survole et lit le faux chiffre.'},
          {t: 'Dans D3 : d3.sum ignore les doublons', why: '<code>d3.sum</code> ignore les valeurs vides, pas les doublons.'},
          {t: 'Nulle part : le graphique reste proportionnel', why: 'Toutes les barres seraient multipliées par 7 ou 6 selon l’année (' + E.cands['2019'].length + ' candidats en 2019) : même les comparaisons entre élections seraient fausses.'}
        ]
      });
    }
  });

  steps.push({
    id: 'retenir', kicker: 'À retenir', title: 'Ce qu’il faut garder',
    lead: 'Sans regarder le code : qui calcule, qui dessine, où vit le survol ?',
    build(b) {
      b.innerHTML = '<ol class="recap">' + [
        'L’interactivité sert à <b>explorer</b> : vue d’ensemble, zoom et filtre, détails à la demande (Shneiderman). Le papier ne sait pas nommer 246 points ; le survol, si.',
        'Mais <b>le message ne se cache pas</b> derrière un survol : titre, couleur, annotation d’abord ; l’interaction pour approfondir (le verre à martini).',
        'D3 lie chaque donnée à un élément SVG (<code>.data().join()</code>) ; en SVG, <b>y descend</b>. Une <b>échelle</b> est une fonction : domaine → pixels ; pour une aire, <code>scaleSqrt</code>.',
        'Toujours le même squelette : <b>marges, échelles, formes, axes, message</b>, puis <b>les événements</b> (<code>.on("pointerenter", …)</code>) posés sur les formes.',
        'Un bon survol : <b>surligner, estomper le reste, infobulle, zone de survol large</b> ; il marche aussi au doigt.',
        'Graphiques spéciaux : <b>pictogramme</b> (dites sur combien vous comptez), <b>carte</b> (couleur pour un taux, cercles pour des voix, un encart), <b>pentes</b> (une ligne à la fois).',
        '<b>React + D3</b> : D3 calcule, React dessine. Le clic et le survol sont des <b>états</b> du parent, partagés par toutes les vues.',
        'D3 ne nettoie rien : <b>une ligne par commune, des noms harmonisés</b>, avant le premier rectangle.'
      ].map(t => '<li><span>' + t + '</span></li>').join('') + '</ol>' + M.note('cat', '<p><b>Votre billet de sortie.</b> Dessinez sur papier <code>TableauDeBord → Carte + Classement</code>. Placez <code>survol</code>, <code>setSurvol</code> et le clic. Expliquez à votre voisin ce qui se passe quand la souris entre sur Gorgol.</p>') + M.note('lion', '<p><b>Au TD 3</b> : les mêmes outils sur la bibliothèque de Nouakchott. Vous construisez un graphique, défendez son message, ajoutez le survol, puis reliez deux vues avec React, et vous faites relire votre graphique par une IA avec les skills de Yan Holtz. Au CM 5 : le tableau de bord complet.</p>');
    }
  });

  /* ================= Pour aller plus loin ================= */

  const QUIZ = [
    {prompt: 'En SVG, le point (0, 0) est…', options: [{t: 'En haut à gauche', ok: true, why: 'Et y descend.'}, {t: 'En bas à gauche', why: 'C’est la convention des maths, pas du SVG.'}]},
    {prompt: 'Le message principal d’un graphique interactif se place…', options: [{t: 'Dans le titre et la couleur, visible sans rien toucher', ok: true, why: 'L’infobulle approfondit ; elle ne porte pas le message.'}, {t: 'Dans l’infobulle', why: 'Supposez que personne ne l’ouvrira.'}]},
    {prompt: 'Des cercles proportionnels aux voix :', options: [{t: 'd3.scaleSqrt', ok: true, why: 'L’aire suit la valeur.'}, {t: 'd3.scaleLinear sur le rayon', why: 'L’aire suivrait le carré : mensonge.'}]},
    {prompt: 'Survoler une wilaya de la carte allume sa barre dans le classement. C’est…', options: [{t: 'Des vues liées : un état partagé', ok: true, why: 'Le survol vit dans le parent, transmis aux deux vues.'}, {t: 'Une animation D3', why: 'Aucune transition ici : un état qui change.'}]},
    {prompt: 'Dans un tableau de bord React + D3, qui crée les éléments SVG ?', options: [{t: 'React', ok: true, why: 'D3 calcule (échelles, chemins), React dessine.'}, {t: 'D3', why: 'Deux chefs pour le même DOM : l’un efface le travail de l’autre.'}]}
  ];
  steps.push({
    id: 'quiz4', kicker: 'Quiz', title: 'Cinq questions éclair',
    lead: 'Réponses à voix haute.',
    build(b) { QUIZ.forEach(q => { const el = document.createElement('div'); b.appendChild(el); question(el, q); }); }
  });

  const GLOSS = [['Sélection', 'Selection'], ['Jointure de données (entrée, mise à jour, sortie)', 'Data join (enter, update, exit)'], ['Échelle', 'Scale'], ['Domaine → étendue', 'Domain → range'], ['Axe', 'Axis'], ['Marges', 'Margins'], ['Événement, écouteur', 'Event, listener'], ['Survol', 'Hover, mouseover'], ['Infobulle', 'Tooltip'], ['Détails à la demande', 'Details on demand'], ['Focus + contexte', 'Focus + context'], ['Zoom, déplacement', 'Zoom, pan'], ['Transition', 'Transition'], ['Constance d’objet', 'Object constancy'], ['Pictogramme', 'Pictogram, isotype, unit chart'], ['Carte choroplèthe', 'Choropleth map'], ['Symboles proportionnels', 'Proportional symbols, bubble map'], ['Graphique en pentes', 'Slope chart'], ['Composant, état', 'Component, state'], ['Vues liées, surbrillance liée', 'Linked views, linked highlighting'], ['Récit guidé / exploration', 'Author-driven / reader-driven']];
  window.DS_LESSONS = window.DS_LESSONS || {};
  window.DS_LESSONS.cm4 = {
    id: 'cm4',
    title: 'D3.js : rendre un récit interactif',
    lede: 'Au CM 2, nous avons choisi les graphiques ; au CM 3, les cartes ; au TD 2, Bokeh a rendu votre carte survolable. Voyons comment c’est fait et à quoi ça sert. Ajoutons ce que le papier ne sait pas faire : survoler, filtrer, zoomer, relier deux vues. Fil rouge : les présidentielles 2019 et 2024, commune par commune.',
    overview: '<div class="d4-route"><p class="d4-tag">Le parcours · 90 minutes</p><ol><li><b>Pourquoi interagir</b><span>Explorer 246 communes, sans cacher le message.</span></li><li><b>Construire en D3</b><span>Données, échelles, formes, axes, puis le survol.</span></li><li><b>Relier avec React</b><span>Un survol, un clic, quatre vues.</span></li></ol><p class="small">À la fin : expliquer quand une interaction aide, écrire un survol en D3, et dire où vit l’état dans un tableau de bord React. Les ateliers complémentaires restent accessibles après le parcours.</p></div>',
    activityLabel: '20 activités · 90 min + 6 ateliers complémentaires',
    coreCount: 20,
    model: '<span>Données</span><i>→</i><span>Échelles</span><i>→</i><span>Formes</span><i>→</i><span>Axes</span><i>→</i><span>Message</span><i>→</i><span>Interaction</span>',
    minutes: 90,
    plan: {ouverture: 6, mantra: 6, recit: 5, couches: 3, svg: 3, jointure: 4, echelles: 3, anatomie: 7, survol: 6, pictogramme: 5, carte: 6, pente: 4, 'react-props': 3, 'react-etat': 4, react: 5, voiture: 4, tableau: 6, ia: 4, donnees: 3, retenir: 3},
    reserve: {voisin: 4, transition: 4, aire: 3, echelle: 4, compromis: 5, quiz4: 5},
    parts: [
      {title: 'Pourquoi interagir ?', from: 'ouverture'},
      {title: 'Construire un graphique D3', from: 'couches'},
      {title: 'L’interaction, pièce par pièce', from: 'survol'},
      {title: 'Graphiques spéciaux, interactifs', from: 'pictogramme'},
      {title: 'React + D3 : les vues liées', from: 'react-props'},
      {title: 'Relire avec l’IA', from: 'ia'},
      {title: 'À retenir', from: 'retenir'},
      {title: 'Ateliers complémentaires', from: 'voisin'}
    ],
    endAt: 'retenir',
    footer: '<section class="foot-block"><h3>À faire avant le TD 3</h3><ol class="recap">' +
      '<li><span>Ouvrez la <a href="https://d3-graph-gallery.com/interactivity.html" target="_blank" rel="noopener">page « interactivité » de la D3 Graph Gallery</a> et la <a href="https://www.react-graph-gallery.com/" target="_blank" rel="noopener">React Graph Gallery</a> (Yan Holtz) : choisissez une interaction que vous aimeriez refaire.</span></li>' +
      '<li><span>Ayez un assistant IA sous la main (ChatGPT, Claude, Gemini…) : au TD, vous lui donnerez un skill à lire.</span></li>' +
      '<li><span>Regardez la page <a href="https://github.com/holtzy/dataviz-skills" target="_blank" rel="noopener">dataviz-skills</a> de Yan Holtz : que fait chacun des skills ?</span></li></ol></section>' +
      '<details class="foot-details"><summary>Votre propre projet React + D3, sur votre ordinateur</summary><ol class="recap">' +
      '<li><span>Installez <a href="https://nodejs.org/" target="_blank" rel="noopener">Node.js</a> (version LTS).</span></li>' +
      '<li><span>Dans un terminal : <code>npm create vite@latest mon-tableau -- --template react</code>, puis <code>cd mon-tableau</code>, <code>npm install d3</code>, <code>npm run dev</code>.</span></li>' +
      '<li><span>Un composant par graphique (<code>Carte.jsx</code>, <code>Classement.jsx</code>…), les états partagés (<code>annee</code>, <code>wilaya</code>, <code>survol</code>) dans <code>App.jsx</code>. Pour l’IA : <code>npx skills add holtzy/dataviz-skills</code> installe le skill <b>d3</b>, qui suit exactement cette méthode.</span></li></ol></details>' +
      '<details class="foot-details"><summary>Lexique français ↔ anglais</summary><table class="data"><thead><tr><th>Français</th><th>English</th></tr></thead><tbody>' + GLOSS.map(g => '<tr><td>' + g[0] + '</td><td>' + g[1] + '</td></tr>').join('') + '</tbody></table></details>' +
      '<details class="foot-details"><summary>Bibliographie et ressources</summary><ul class="biblio">' +
      '<li>Ben Shneiderman, « The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations », <i>IEEE Symposium on Visual Languages</i>, 1996.</li>' +
      '<li>Edward Segel, Jeffrey Heer, « Narrative Visualization: Telling Stories with Data », <i>IEEE TVCG</i>, 16(6), 2010 (le verre à martini).</li>' +
      '<li>Archie Tse (<i>The New York Times</i>), conférence aux Malofiej Awards, Pampelune, 2016 ; et la réponse de Gregor Aisch, « In Defense of Interactive Graphics », 2017.</li>' +
      '<li>Michael Bostock, Vadim Ogievetsky, Jeffrey Heer, « D³: Data-Driven Documents », <i>IEEE TVCG</i>, 17(12), 2011.</li>' +
      '<li>Otto Neurath, <i>International Picture Language</i>, Londres, Kegan Paul, 1936 (l’Isotype).</li>' +
      '<li>Scott Murray, <i>Interactive Data Visualization for the Web</i>, 2<sup>e</sup> éd., O’Reilly, 2017.</li>' +
      '<li>Progression inspirée de Yan Holtz, <a href="https://www.react-graph-gallery.com/react-d3-dataviz-course" target="_blank" rel="noopener">D3 ❤️ React</a> : <a href="https://www.react-graph-gallery.com/course/introduction/d3-react-binding" target="_blank" rel="noopener">séparer calcul et rendu</a>, infobulles et survol au point le plus proche. Exemples et activités créés ici sur les données mauritaniennes.</li>' +
      '<li>Yan Holtz : <a href="https://d3-graph-gallery.com/" target="_blank" rel="noopener">D3 Graph Gallery</a>, <a href="https://www.react-graph-gallery.com/" target="_blank" rel="noopener">React Graph Gallery</a>, <a href="https://www.data-to-viz.com/caveats.html" target="_blank" rel="noopener">Data to Viz, les pièges</a>, <a href="https://github.com/holtzy/dataviz-skills" target="_blank" rel="noopener">dataviz-skills</a> (MIT).</li>' +
      '<li>Documentation officielle : <a href="https://d3js.org/" target="_blank" rel="noopener">d3js.org</a>, <a href="https://react.dev/learn" target="_blank" rel="noopener">react.dev</a>.</li>' +
      '<li>Présidentielles 2019 et 2024, résultats par commune : dépôt public <a href="https://github.com/binorassocies/rimdata" target="_blank" rel="noopener">binorassocies/rimdata</a>. Limites des wilayas : ANSADE / OCHA, 2024.</li>' +
      '<li>TD 3 : Iqraa Ma3i Library (2026), <i>Iqraa Ma3i Library – Mauritania (2024–2026)</i> [jeu de données], Kaggle, CC BY 4.0.</li></ul></details>',
    steps: (() => {
      const order = ['ouverture', 'mantra', 'recit', 'couches', 'svg', 'jointure', 'echelles', 'anatomie', 'survol', 'pictogramme', 'carte', 'pente', 'react-props', 'react-etat', 'react', 'voiture', 'tableau', 'ia', 'donnees', 'retenir', 'voisin', 'transition', 'aire', 'echelle', 'compromis', 'quiz4'];
      const byId = Object.fromEntries(steps.map(s => [s.id, s]));
      byId.retenir.next = 'Explorer les ateliers complémentaires';
      return order.map(id => byId[id]);
    })()
  };
})();
