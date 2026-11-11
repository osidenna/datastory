/* CM 5 · Dashboards : no-code et code
   Fil rouge : les 639 restaurants et cafés de Nouakchott (fiches publiques Google Maps, data-cm5.js,
   scripts/build-data-cm5.py), déjà vus au TD 3 partie 4. Suite du CM 4 (la voiture, le tableau de bord React des
   élections) : un tableau de bord répond à des questions ; état → logique → vues ; ce que l'outil sans code décide
   à votre place (agrégation par défaut, données sales) ; quand passer au code. Outil sans code : Looker Studio.
   Graphiques en D3 (dist/vendor) ; la partie 4 en React 18 (React.createElement, sans JSX). */
(function () {
  const d3 = window.d3, K = window.Kit, M = window.Mascots, E = window.DS_DATA5;
  if (!d3 || !E || !E.restos) return;
  const {fr} = K;
  const R = window.React, RD = window.ReactDOM, h = R && R.createElement;
  const ACC = '#8a4f8c', GREY = '#d9dce2', GREY2 = '#a3a8b3', INK = '#1d2433', MUTED = '#6b7280', BAD = '#b4532a', GOOD = '#2e6b4f', BLUE = '#4e79a7';
  const SRC = 'Source : fiches publiques Google Maps de 639 restaurants et cafés de Nouakchott (collecte nettoyée, 7 novembre 2026).';
  const ALL = E.restos;
  const NOTES = ALL.filter(d => d.r != null);
  const TYPES = [['restaurant', 'Restaurants'], ['café', 'Cafés'], ['pâtisserie', 'Pâtisseries'], ['jus', 'Jus'], ['inconnu', 'Type inconnu']];
  const TLAB = Object.fromEntries(TYPES);
  const TCOL = {restaurant: ACC, 'café': BLUE, 'pâtisserie': '#b38a00', jus: GOOD, inconnu: GREY2};
  const WW = () => K.narrow() ? 400 : 680;
  const mk = (host, w, hh) => d3.select(host).append('svg').attr('class', 'chart d4').attr('viewBox', '0 0 ' + w + ' ' + hh).attr('role', 'img');
  const ink = (sel, size, fill = INK, weight = null) => sel.style('font-size', size + 'px').style('fill', fill).style('font-weight', weight);
  const chips = (items, cur, attr = 'k') => '<div class="row" style="gap:6px;flex-wrap:wrap">' + items.map(([k, t]) => '<button type="button" class="chip" data-' + attr + '="' + k + '" aria-pressed="' + (k === cur ? 'true' : 'false') + '">' + t + '</button>').join('') + '</div>';
  function wire(b, attr, fn) {
    const all = [...b.querySelectorAll('.chip[data-' + attr + ']')];
    all.forEach(c => c.addEventListener('click', () => { all.forEach(x => x.setAttribute('aria-pressed', x === c ? 'true' : 'false')); fn(c.dataset[attr]); }));
  }
  const codeBox = html => '<pre class="d4-code">' + html + '</pre>';
  const hl = s => K.esc(s).replace(/(&quot;.*?&quot;)|(\/\/[^\n]*)/g, (m, str, com) => str ? '<span class="s">' + str + '</span>' : '<span class="c">' + com + '</span>');
  const note = v => fr(v, 2).replace(/0$/, '');
  const mean = a => a.length ? d3.mean(a, d => d.r) : NaN;
  const wmean = a => a.length ? d3.sum(a, d => d.r * d.a) / d3.sum(a, d => d.a) : NaN;
  // La question du café : note d'au moins 4,5 et au moins 20 avis.
  const BONS = d => d.r != null && d.r >= 4.5 && d.a >= 20;
  // Ordre propre à chaque question, stable après rechargement.
  function question(host, opts) {
    const options = opts.options.slice();
    let seed = 2166136261;
    for (const ch of opts.prompt) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    for (let i = options.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = Math.floor(seed / 4294967296 * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return K.question(host, Object.assign({}, opts, {options}));
  }
  // Carte des points : lng / lat avec la même échelle sur les deux axes (corrigée de cos(latitude)).
  const LX = Math.cos(18.08 * Math.PI / 180);
  function proj(w, hh, pad = 10) {
    const ex = d3.extent(ALL, d => d.lo * LX), ey = d3.extent(ALL, d => d.la);
    const k = Math.min((w - 2 * pad) / (ex[1] - ex[0]), (hh - 2 * pad) / (ey[1] - ey[0]));
    const ox = (w - k * (ex[1] - ex[0])) / 2, oy = (hh - k * (ey[1] - ey[0])) / 2;
    return {x: d => ox + k * (d.lo * LX - ex[0]), y: d => hh - oy - k * (d.la - ey[0])};
  }
  const steps = [];

  /* ================= Partie 1 · Pourquoi un tableau de bord ? ================= */

  steps.push({
    id: 'tableur', kicker: 'Prédire', title: 'Où ouvrir un café ?',
    lead: 'Une amie veut ouvrir un café à Nouakchott. Elle a le tableau des 639 lieux. Sa première question : combien de cafés sont déjà très bien notés, avec assez d’avis pour y croire ?',
    build(b) {
      const cafes = ALL.filter(d => d.t === 'café'), bons = cafes.filter(BONS).length;
      const rows = ALL.slice(0, 14);
      b.innerHTML = '<div class="viz main"><div class="d4-car-sheet" style="max-height:330px;overflow:auto"><table class="data"><thead><tr><th>nom</th><th>type</th><th>ville</th><th>note</th><th>nb_avis</th></tr></thead><tbody>' +
        rows.map(d => '<tr><td>' + K.esc(d.n) + '</td><td>' + d.t + '</td><td>' + K.esc(d.v) + '</td><td>' + (d.r == null ? '' : fr(d.r, 1)) + '</td><td>' + d.a + '</td></tr>').join('') +
        '<tr><td colspan="5" class="small">… et ' + (ALL.length - rows.length) + ' lignes de plus</td></tr></tbody></table></div>' +
        '<div class="viz-caption">Le tableau tel qu’il arrive. ' + SRC + '</div></div><div data-q></div><div data-r hidden></div>';
      question(b.querySelector('[data-q]'), {
        prompt: 'Sans calculer : combien de <b>cafés</b> ont une note d’au moins 4,5 <b>et</b> au moins 20 avis ?',
        options: [
          {t: 'Environ 40', why: 'Il n’y a que ' + cafes.length + ' cafés en tout.'},
          {t: 'Moins de 10', ok: true, why: 'Il y en a <b>' + bons + '</b> sur ' + cafes.length + ' cafés. Personne ne le voit en lisant 639 lignes : il faut <b>filtrer, compter, montrer</b>. C’est le travail d’un tableau de bord.'},
          {t: 'Impossible : il manque des notes', why: 'Des notes manquent, mais la question reste calculable sur les lieux notés.'}
        ],
        onAnswer: () => { const r = b.querySelector('[data-r]'); r.hidden = false; r.innerHTML = M.note('dog', '<p>Au CM 4, la voiture : douze lignes qui bougent, ou un compteur et un voyant. Ici, la même idée : <b>la réponse doit sauter aux yeux</b>, sans relire le tableau.</p>'); }
      });
    }
  });

  const PERSONAS = {
    cafe: {t: 'Ouvrir un café', qs: ['Combien de cafés existent déjà, et sont-ils bien notés ?', 'Où sont-ils ? Quels quartiers en manquent ?', 'Quelles notes obtiennent les cafés qui ont beaucoup d’avis ?'], vues: ['Un chiffre clé : cafés bien notés', 'Une carte des points', 'Un nuage note × nombre d’avis']},
    guide: {t: 'Guide pour visiteurs', qs: ['Quels lieux recommander, avec assez d’avis pour y croire ?', 'Lesquels sont ouverts et à jour ?', 'Par type de cuisine, où aller ?'], vues: ['Un classement filtré (note, avis ≥ 20)', 'Un filtre « fiche à jour »', 'Des barres par type']},
    data: {t: 'Qualité des données', qs: ['Combien de fiches n’ont ni note ni type ?', 'Combien ne sont pas à jour ?', 'La colonne ville est-elle utilisable ?'], vues: ['Des chiffres clés : manquants', 'Une barre « à jour / pas à jour »', 'Les valeurs de ville, triées']}
  };
  steps.push({
    id: 'questions', kicker: 'Décider', title: 'Trois questions avant le premier graphique',
    lead: 'Un tableau de bord ne montre pas « les données » : il répond aux questions d’un lecteur précis. Changez de lecteur : que deviennent les vues ?',
    build(b) {
      b.innerHTML = chips(Object.entries(PERSONAS).map(([k, p]) => [k, p.t]), 'cafe') + '<div class="viz main"><div data-p></div></div><div data-q></div>';
      const draw = k => {
        const p = PERSONAS[k];
        b.querySelector('[data-p]').innerHTML = '<table class="data d4-cmp"><thead><tr><th>Question directrice</th><th>La vue qui y répond</th></tr></thead><tbody>' +
          p.qs.map((q, i) => '<tr><td>' + q + '</td><td><b>' + p.vues[i] + '</b></td></tr>').join('') + '</tbody></table>';
      };
      draw('cafe'); wire(b, 'k', draw);
      question(b.querySelector('[data-q]'), {
        prompt: 'Laquelle n’est <b>pas</b> une question directrice ?',
        options: [
          {t: 'Montrer toutes les colonnes du fichier', ok: true, why: 'C’est un inventaire, pas une question. Une question directrice a un lecteur et appelle une décision.'},
          {t: 'Où les cafés bien notés manquent-ils ?', why: 'Lecteur précis, décision précise : où ouvrir.'},
          {t: 'Combien de fiches ne sont pas à jour ?', why: 'Une question de qualité : peut-on se fier au reste ?'}
        ]
      });
    }
  });

  steps.push({
    id: 'zigzag', kicker: 'Lire', title: 'L’œil lit en Z',
    lead: 'Un lecteur ne lit pas un tableau de bord : il le balaie. Comme une page, en <b>Z</b> : en haut à gauche, à droite, en diagonale, puis en bas. Regardez où tombe le chiffre clé dans chaque disposition.',
    build(b) {
      b.innerHTML = chips([['a', 'Disposition A'], ['b', 'Disposition B']], 'a') + '<div class="row" style="margin-top:8px"><button class="btn" data-play>▶ Suivre l’œil</button></div>' +
        '<div class="viz main"><div data-c></div><div class="viz-caption">Les quatre vues du tableau de bord des cafés. Les numéros donnent l’ordre de lecture habituel (de gauche à droite, de haut en bas).</div></div><div data-q></div>';
      const host = b.querySelector('[data-c]'), w = WW(), H = K.narrow() ? 300 : 340, g = 12;
      const svg = mk(host, w, H);
      const cw = (w - 3 * g) / 2, ch = (H - 3 * g) / 2;
      const box = i => ({x: g + (i % 2) * (cw + g), y: g + Math.floor(i / 2) * (ch + g)});
      const LAY = {
        a: ['Classement des 9 cafés', 'Carte des cafés', 'Barres par type', 'Chiffre clé : 3 cafés à 4,5+'],
        b: ['Chiffre clé : 3 cafés à 4,5+', 'Carte des cafés', 'Barres par type', 'Classement des 9 cafés']
      };
      const cells = [0, 1, 2, 3].map(i => {
        const p = box(i), c = svg.append('g').attr('transform', 'translate(' + p.x + ',' + p.y + ')');
        const r = c.append('rect').attr('width', cw).attr('height', ch).attr('rx', 10).attr('stroke', GREY2);
        const t = ink(c.append('text').attr('x', cw / 2).attr('y', ch / 2 + 5).attr('text-anchor', 'middle'), K.narrow() ? 11 : 14, INK, 700);
        c.append('circle').attr('cx', 18).attr('cy', 18).attr('r', 12).attr('fill', ACC);
        ink(c.append('text').attr('x', 18).attr('y', 23).attr('text-anchor', 'middle').text(i + 1), 13, '#fff', 700);
        return {r, t};
      });
      const pts = [0, 1, 2, 3].map(i => { const p = box(i); return [p.x + cw * (i % 2 ? .75 : .25), p.y + ch / 2 + 22]; });
      const path = svg.append('path').attr('d', d3.line()(pts)).attr('fill', 'none').attr('stroke', '#f6cd4c').attr('stroke-width', 5).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round').attr('opacity', .9);
      const eye = svg.append('circle').attr('r', 9).attr('fill', INK).attr('cx', pts[0][0]).attr('cy', pts[0][1]);
      const L = path.node().getTotalLength();
      const dur = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 2400;
      let lay = 'a';
      const draw = () => cells.forEach((c, i) => {
        const key = /Chiffre clé/.test(LAY[lay][i]);
        c.r.attr('fill', key ? 'rgba(138,79,140,.12)' : '#fff').attr('stroke', key ? ACC : GREY2);
        c.t.text(LAY[lay][i]);
      });
      const play = () => {
        path.attr('stroke-dasharray', L).attr('stroke-dashoffset', L).transition().duration(dur()).ease(d3.easeLinear).attr('stroke-dashoffset', 0);
        eye.transition().duration(dur()).ease(d3.easeLinear).attrTween('cx', () => t => path.node().getPointAtLength(t * L).x).attrTween('cy', () => t => path.node().getPointAtLength(t * L).y);
      };
      draw(); wire(b, 'k', k => { lay = k; draw(); play(); });
      b.querySelector('[data-play]').addEventListener('click', play);
      question(b.querySelector('[data-q]'), {
        prompt: 'Le lecteur pressé regarde trois secondes. Dans quelle disposition voit-il la réponse à sa question ?',
        options: [
          {t: 'B : le chiffre clé est en haut à gauche, là où l’œil commence', ok: true, why: 'La case 1 est lue par tous, la case 4 par ceux qui restent. Placez la <b>réponse</b> en haut à gauche, le <b>contexte</b> (carte, barres) au milieu, le <b>détail</b> (classement, tableau) en bas. Pour une page en arabe, lue de droite à gauche, le Z s’inverse.'},
          {t: 'A : le chiffre clé conclut la lecture', why: 'Seuls ceux qui vont jusqu’au bout le voient. Un tableau de bord n’est pas un roman : la réponse vient d’abord.'},
          {t: 'Les deux : l’œil voit tout d’un coup', why: 'L’œil se pose case par case ; l’ordre compte.'}
        ]
      });
    }
  });

  steps.push({
    id: 'couches', kicker: 'Manipuler', title: 'État, logique, vues',
    lead: 'Tout tableau de bord a trois étages : ce que l’utilisateur a choisi (état), le calcul qui en découle (logique), ce qu’on dessine (vues). Bougez un filtre et suivez la flèche.',
    build(b) {
      b.innerHTML = '<div class="row" style="gap:6px;flex-wrap:wrap" data-types>' + TYPES.map(([k, t]) => '<button type="button" class="chip" data-t="' + k + '" aria-pressed="' + (k !== 'inconnu') + '">' + t + '</button>').join('') + '</div>' +
        '<label class="row small" style="margin-top:8px;gap:8px">Au moins <b data-av>0</b> avis <input type="range" min="0" max="100" step="5" value="0" data-min style="flex:1"></label>' +
        '<div class="viz main"><p class="d4-state-read" data-state></p><p class="d4-state-read" data-logic></p><div data-c></div></div><div data-q></div>';
      const types = new Set(TYPES.map(t => t[0]).filter(k => k !== 'inconnu'));
      let minA = 0;
      const host = b.querySelector('[data-c]'), w = WW(), nar = K.narrow(), H = 220;
      const svg = mk(host, w, H);
      const gA = svg.append('g'), gB = svg.append('g').attr('transform', 'translate(' + (nar ? 0 : w / 2 + 10) + ',' + (nar ? H : 0) + ')');
      if (nar) svg.attr('viewBox', '0 0 ' + w + ' ' + (2 * H));
      const bw = nar ? w : w / 2 - 10;
      const draw = () => {
        const sel = NOTES.filter(d => types.has(d.t) && d.a >= minA);
        b.querySelector('[data-av]').textContent = minA;
        b.querySelector('[data-state]').innerHTML = '<b>État</b> · types = [' + [...types].map(t => '"' + t + '"').join(', ') + '] · minAvis = ' + minA;
        b.querySelector('[data-logic]').innerHTML = '<b>Logique</b> · lieux = restos.filter(d => types.has(d.type) &amp;&amp; d.nb_avis ≥ ' + minA + ') → <b>' + sel.length + '</b> lieux';
        // Vue 1 : nombre par type
        const cnt = TYPES.map(([k]) => ({k, n: sel.filter(d => d.t === k).length}));
        const x = d3.scaleLinear().domain([0, d3.max(cnt, d => d.n) || 1]).range([0, bw - 130]);
        gA.selectAll('*').remove();
        ink(gA.append('text').attr('x', 0).attr('y', 14).text('Vue 1 · lieux par type'), 12, MUTED);
        cnt.forEach((d, i) => {
          const y = 28 + i * 34;
          ink(gA.append('text').attr('x', 92).attr('y', y + 15).attr('text-anchor', 'end').text(TLAB[d.k]), 12);
          gA.append('rect').attr('x', 100).attr('y', y).attr('height', 22).attr('width', x(d.n)).attr('fill', types.has(d.k) ? TCOL[d.k] : GREY);
          ink(gA.append('text').attr('x', 106 + x(d.n)).attr('y', y + 15).text(d.n), 11, MUTED);
        });
        // Vue 2 : histogramme des notes
        const bins = d3.range(1, 5.01, .5).map(v => ({v, n: sel.filter(d => Math.round(d.r * 2) / 2 === v).length}));
        const xb = d3.scaleBand().domain(bins.map(d => d.v)).range([10, bw - 10]).padding(.15), yb = d3.scaleLinear().domain([0, d3.max(bins, d => d.n) || 1]).range([H - 28, 30]);
        gB.selectAll('*').remove();
        ink(gB.append('text').attr('x', 10).attr('y', 14).text('Vue 2 · répartition des notes'), 12, MUTED);
        bins.forEach(d => {
          gB.append('rect').attr('x', xb(d.v)).attr('width', xb.bandwidth()).attr('y', yb(d.n)).attr('height', yb(0) - yb(d.n)).attr('fill', d.v >= 4.5 ? ACC : GREY2);
          ink(gB.append('text').attr('x', xb(d.v) + xb.bandwidth() / 2).attr('y', H - 12).attr('text-anchor', 'middle').text(fr(d.v, 1)), 10, MUTED);
        });
      };
      b.querySelectorAll('[data-t]').forEach(c => c.addEventListener('click', () => {
        const k = c.dataset.t; types.has(k) ? types.delete(k) : types.add(k); c.setAttribute('aria-pressed', types.has(k)); draw();
      }));
      b.querySelector('[data-min]').addEventListener('input', e => { minA = +e.target.value; draw(); });
      draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'Vous poussez le curseur à 50 avis. Qu’est-ce qui change en premier ?',
        options: [
          {t: 'L’état, puis la logique recalcule, puis les deux vues se redessinent', ok: true, why: 'Toujours dans cet ordre. Les vues ne se parlent jamais : elles lisent toutes le même résultat. C’est aussi le schéma du CM 4 (<code>useState</code> dans le parent).'},
          {t: 'La vue 1, qui prévient la vue 2', why: 'Aucune vue ne commande l’autre : elles lisent le même état.'},
          {t: 'Le fichier de données', why: 'Le fichier ne change jamais ; seul le filtre change.'}
        ]
      });
    }
  });

  /* ================= Partie 2 · Des chiffres qui ne mentent pas ================= */

  steps.push({
    id: 'kpi', kicker: 'Piège', title: 'Un chiffre clé, trois calculs',
    lead: 'La tuile « note moyenne » trône en haut de presque tous les tableaux de bord. Mais quelle moyenne ? Bougez le seuil d’avis.',
    build(b) {
      b.innerHTML = '<label class="row small" style="gap:8px">Au moins <b data-av>1</b> avis <input type="range" min="1" max="100" value="1" data-min style="flex:1"></label>' +
        '<div class="viz main"><div class="d4-kpis" data-k></div><div class="viz-caption">Lieux notés seulement. ' + SRC + '</div></div><div data-q></div>';
      const draw = m => {
        const s = NOTES.filter(d => d.a >= m);
        b.querySelector('[data-av]').textContent = m;
        const tile = (lab, v, sub) => '<div class="d4-kpi"><span>' + lab + '</span><b>' + v + '</b><i>' + sub + '</i></div>';
        b.querySelector('[data-k]').innerHTML = '<div class="d4-kpi d4-kpi-head"><span>Sélection</span><b>' + s.length + ' lieux</b><i>au moins ' + m + ' avis</i></div>' +
          tile('Moyenne simple', note(mean(s)), 'chaque lieu compte pour 1') +
          tile('Pondérée par les avis', note(wmean(s)), 'chaque avis compte pour 1') +
          tile('Lieux à 5,0', s.filter(d => d.r === 5).length, 'souvent 1 à 3 avis');
      };
      draw(1);
      b.querySelector('[data-min]').addEventListener('input', e => draw(+e.target.value));
      question(b.querySelector('[data-q]'), {
        prompt: 'À 1 avis minimum, ' + NOTES.filter(d => d.r === 5).length + ' lieux ont 5,0. À 20 avis, presque aucun. Pourquoi ?',
        options: [
          {t: 'Un 5,0 avec un seul avis, c’est un seul client content', ok: true, why: 'Peu d’avis = note instable. Une tuile honnête dit <b>sur quoi</b> elle est calculée (seuil, pondération), comme le pictogramme du CM 4 disait « sur 100 inscrits ».'},
          {t: 'Les grands restaurants sont moins bons', why: 'Rien ne le prouve : la note moyenne bouge peu avec le seuil. Ce sont les extrêmes qui disparaissent.'},
          {t: 'Google supprime les notes parfaites', why: 'Non : ces lieux sont toujours là, ils ont seulement trop peu d’avis pour passer le seuil.'}
        ]
      });
    }
  });

  steps.push({
    id: 'couleur', kicker: 'Comparer', title: 'Une couleur, un sens',
    lead: 'Dans un tableau de bord, la couleur est une légende partagée : si « café » est bleu ici, il doit l’être partout. Comparez les deux versions : où sont les cafés ?',
    build(b) {
      b.innerHTML = chips([['arc', 'Couleurs par défaut'], ['sens', 'Une couleur, un sens']], 'arc') + '<div class="viz main"><div data-c></div><div class="viz-caption">Deux vues du même tableau de bord. ' + SRC + '</div></div><div data-q></div>';
      const host = b.querySelector('[data-c]'), w = WW(), nar = K.narrow(), H = nar ? 560 : 300;
      const svg = mk(host, w, H);
      const bw = nar ? w : w / 2 - 10, gB = svg.append('g'), gM = svg.append('g').attr('transform', nar ? 'translate(0,250)' : 'translate(' + (w / 2 + 10) + ',0)');
      const P = proj(bw, 290, 8);
      // Par défaut : chaque graphique reçoit sa palette, dans l'ordre où il rencontre les catégories.
      const ARC1 = d3.scaleOrdinal(TYPES.map(t => t[0]), d3.schemeTableau10);
      const ARC2 = d3.scaleOrdinal(['inconnu', 'jus', 'café', 'restaurant', 'pâtisserie'], d3.schemeTableau10);
      const SENS = k => k === 'café' ? ACC : GREY;
      const x = d3.scaleLinear().domain([0, d3.max(TYPES, t => ALL.filter(d => d.t === t[0]).length)]).range([0, bw - 130]);
      const bars = TYPES.map(([k, t], i) => {
        const y = 22 + i * 40;
        const n = ALL.filter(d => d.t === k).length;
        ink(gB.append('text').attr('x', 100).attr('y', y + 18).attr('text-anchor', 'end').text(t), 12);
        const r = gB.append('rect').attr('x', 108).attr('y', y).attr('height', 26).attr('width', x(n));
        const v = ink(gB.append('text').attr('x', 114 + x(n)).attr('y', y + 18).text(n), 11, MUTED);
        return {k, r, v};
      });
      const lab = ink(gB.append('text').attr('x', 0).attr('y', 12), 12, MUTED);
      const dots = gM.selectAll('circle').data(ALL).join('circle').attr('cx', P.x).attr('cy', P.y).attr('r', d => d.t === 'café' ? 3.4 : 2.4);
      const leg = gM.append('g').attr('transform', 'translate(6,' + 6 + ')');
      const draw = m => {
        lab.text(m === 'arc' ? 'Barres : palette du graphique' : 'Cafés en couleur, le reste en gris');
        bars.forEach(o => o.r.transition().duration(400).attr('fill', m === 'arc' ? ARC1(o.k) : SENS(o.k)));
        dots.transition().duration(400).attr('fill', d => m === 'arc' ? ARC2(d.t) : SENS(d.t)).attr('fill-opacity', d => m === 'sens' && d.t !== 'café' ? .35 : .8);
        leg.selectAll('*').remove();
        (m === 'arc' ? TYPES : [['café', 'Cafés']]).forEach(([k, t], i) => {
          leg.append('circle').attr('cx', 6).attr('cy', 6 + i * 16).attr('r', 5).attr('fill', m === 'arc' ? ARC2(k) : ACC);
          ink(leg.append('text').attr('x', 16).attr('y', 10 + i * 16).text(t), 11);
        });
      };
      draw('arc'); wire(b, 'k', draw);
      question(b.querySelector('[data-q]'), {
        prompt: 'Dans la version par défaut, les cafés sont orange dans les barres et rouges sur la carte. Que se passe-t-il dans la tête du lecteur ?',
        options: [
          {t: 'Il doit réapprendre la légende à chaque vue, et peut se tromper', ok: true, why: 'Chaque outil attribue ses couleurs dans l’ordre où il rencontre les catégories. Fixez une couleur par catégorie pour tout le tableau de bord, et réservez <b>une</b> couleur d’accent à ce qui répond à la question. Rouge et vert seulement pour une alerte, jamais seuls : 1 homme sur 12 les confond.'},
          {t: 'Rien : chaque graphique a sa légende', why: 'La légende existe, mais l’œil associe la couleur au sens vu juste avant.'},
          {t: 'Il trouve le tableau de bord plus riche', why: 'Plus de couleurs, c’est plus de bruit : rien ne ressort.'}
        ]
      });
    }
  });

  steps.push({
    id: 'hierarchie', kicker: 'Comparer', title: 'Un grand chiffre, un petit contexte',
    lead: 'Un chiffre clé seul ne dit ni « beaucoup » ni « peu ». Comparez deux rangées de tuiles : laquelle répond à la question du café ?',
    build(b) {
      const g20 = t => NOTES.filter(d => d.t === t && d.a >= 20), c = g20('café'), r = g20('restaurant');
      const cb = c.filter(d => d.r >= 4.5).length, rb = r.filter(d => d.r >= 4.5).length;
      b.innerHTML = chips([['plat', 'Tout à la même taille'], ['hier', 'Hiérarchie et contexte']], 'plat') + '<div class="viz main"><div data-k></div><div class="viz-caption">Lieux ayant au moins 20 avis. ' + SRC + '</div></div><div data-q></div>';
      const box = b.querySelector('[data-k]');
      const draw = m => {
        if (m === 'plat') box.innerHTML = '<div class="d4-kpis">' + [['Cafés', c.length], ['Bien notés', cb], ['Note moyenne', note(mean(c))], ['Restaurants', r.length]].map(([l, v]) => '<div class="d4-kpi"><span>' + l + '</span><b>' + v + '</b></div>').join('') + '</div>';
        else box.innerHTML = '<div class="d4-kpis" style="grid-template-columns:2fr 1fr 1fr">' +
          '<div class="d4-kpi d4-kpi-head"><span>Cafés très bien notés</span><b style="font-size:44px">' + cb + ' sur ' + c.length + '</b><i>note ≥ 4,5 · au moins 20 avis</i></div>' +
          '<div class="d4-kpi"><span>Part des cafés</span><b>' + fr(100 * cb / c.length, 0) + ' %</b><i>contre ' + fr(100 * rb / r.length, 0) + ' % des restaurants (' + rb + ' sur ' + r.length + ')</i></div>' +
          '<div class="d4-kpi"><span>Note moyenne</span><b>' + note(mean(c)) + '</b><i>cafés · restaurants : ' + note(mean(r)) + '</i></div></div>';
      };
      draw('plat'); wire(b, 'k', draw);
      question(b.querySelector('[data-q]'), {
        prompt: 'Qu’apporte la deuxième rangée ?',
        options: [
          {t: 'Un ordre de lecture et une comparaison', ok: true, why: 'La taille dit <b>quoi lire d’abord</b> ; le petit texte dit <b>par rapport à quoi</b> (un total, une autre catégorie, l’an dernier). « 3 », seul, ne veut rien dire ; « 3 sur 9, contre 3 sur 84 restaurants », oui.'},
          {t: 'Plus de chiffres', why: 'Il y en a autant ; ils sont hiérarchisés et comparés.'},
          {t: 'Une décoration', why: 'La taille et le contexte sont de l’information : ils guident l’œil et donnent l’échelle.'}
        ]
      });
    }
  });

  steps.push({
    id: 'bulles', kicker: 'Piège', title: 'Des bulles qui mentent',
    lead: 'Dans Looker Studio, une carte à bulles grossit selon <code>nb_avis</code>. Comparez un rayon proportionnel et une aire proportionnelle : le plus grand lieu a combien de fois plus d’avis que les autres ?',
    build(b) {
      const big = ALL.reduce((a, c) => c.a > a.a ? c : a), ref = 50;
      b.innerHTML = chips([['rayon', 'Rayon ∝ nb_avis'], ['aire', 'Aire ∝ nb_avis']], 'rayon') + '<div class="viz main"><div data-c></div><div class="viz-caption">Lieux d’au moins 20 avis. À droite : le plus commenté (' + big.a + ' avis) et un lieu de ' + ref + ' avis. ' + SRC + '</div></div><div data-q></div>';
      const host = b.querySelector('[data-c]'), w = WW(), nar = K.narrow(), H = 340, mw = nar ? w : w * .62, P = proj(mw, H, 14);
      const svg = mk(host, w, H), sel = ALL.filter(d => d.a >= 20).sort((a, c) => c.a - a.a);
      const dots = svg.append('g').selectAll('circle').data(sel).join('circle').attr('cx', P.x).attr('cy', P.y).attr('fill', ACC).attr('fill-opacity', .3).attr('stroke', ACC);
      const side = svg.append('g').attr('transform', 'translate(' + (nar ? w - 110 : mw + 30) + ',0)');
      const c1 = side.append('circle').attr('cx', 60).attr('cy', 110).attr('fill', ACC).attr('fill-opacity', .3).attr('stroke', ACC);
      const c2 = side.append('circle').attr('cx', 60).attr('cy', 250).attr('fill', ACC).attr('fill-opacity', .3).attr('stroke', ACC);
      ink(side.append('text').attr('x', 60).attr('y', 205).attr('text-anchor', 'middle').text(big.a + ' avis'), 12, INK, 700);
      ink(side.append('text').attr('x', 60).attr('y', 300).attr('text-anchor', 'middle').text(ref + ' avis'), 12, INK, 700);
      const ratio = ink(side.append('text').attr('x', 60).attr('y', 326).attr('text-anchor', 'middle'), 12, BAD, 700);
      const draw = m => {
        const s = m === 'rayon' ? d3.scaleLinear().domain([0, big.a]).range([0, 60]) : d3.scaleSqrt().domain([0, big.a]).range([0, 60]);
        dots.transition().duration(500).attr('r', d => s(d.a));
        c1.transition().duration(500).attr('r', s(big.a)); c2.transition().duration(500).attr('r', s(ref));
        const a = (s(big.a) / s(ref)) ** 2;
        ratio.text('aire : × ' + fr(a, 0) + (m === 'rayon' ? ' (vrai : × ' + fr(big.a / ref, 1) + ')' : ' ✓'));
      };
      draw('rayon'); wire(b, 'k', draw);
      question(b.querySelector('[data-q]'), {
        prompt: 'Avec le rayon proportionnel, la grosse bulle paraît ' + fr((big.a / ref) ** 2, 0) + ' fois plus grande que celle de ' + ref + ' avis. Combien devrait-elle paraître ?',
        options: [
          {t: 'Environ ' + fr(big.a / ref, 0) + ' fois : l’œil compare des aires', ok: true, why: 'Comme au CM 4 (« Rayon ou aire ? ») : on perçoit la surface. Une aire proportionnelle (<code>d3.scaleSqrt</code>) dit vrai. Dans un outil sans code, vérifiez ce que fait le réglage de taille, et gardez une légende de taille.'},
          {t: fr((big.a / ref) ** 2, 0) + ' fois : c’est ce qu’on voit', why: 'C’est l’effet du carré : rayon × ' + fr(big.a / ref, 1) + ' donne aire × ' + fr((big.a / ref) ** 2, 0) + '.'},
          {t: 'Peu importe, c’est une carte', why: 'Sur une carte aussi, la taille encode une valeur : elle doit être juste.'}
        ]
      });
    }
  });

  steps.push({
    id: 'ville', kicker: 'Piège', title: 'Combien de villes à Nouakchott ?',
    lead: 'Vous ajoutez un filtre « ville » dans l’outil. Il propose la liste des valeurs du fichier. Combien de choix verra l’utilisateur ?',
    build(b) {
      b.innerHTML = chips([['brut', 'Valeurs brutes'], ['net', 'Après nettoyage']], 'brut') + '<div class="viz main"><div data-c></div><div class="viz-caption">La colonne <code>ville</code>, saisie à la main par les propriétaires des fiches.</div></div><div data-q></div>';
      const NKC = /^(nouakchott|nkc|hwynouakchott|نواكشوط،?)$/i;
      const clean = v => !v ? 'Nouakchott' : NKC.test(v.trim()) ? 'Nouakchott' : 'Autre (quartier, localité, erreur)';
      const host = b.querySelector('[data-c]'), w = WW();
      const draw = mode => {
        host.innerHTML = '';
        const rows = d3.rollups(ALL, v => v.length, d => mode === 'brut' ? (d.v || '(vide)') : clean(d.v)).sort((a, c) => c[1] - a[1]);
        const rh = 24, H = rows.length * rh + 10, L = 190;
        const svg = mk(host, w, H), x = d3.scaleLog().domain([1, 700]).range([0, w - L - 50]);
        rows.forEach(([k, n], i) => {
          ink(svg.append('text').attr('x', L - 8).attr('y', 8 + i * rh + 13).attr('text-anchor', 'end').text(k), 12);
          svg.append('rect').attr('x', L).attr('y', 8 + i * rh).attr('height', rh - 6).attr('width', Math.max(2, x(n))).attr('fill', /^Nouakchott$/.test(k) ? ACC : GREY2);
          ink(svg.append('text').attr('x', L + Math.max(2, x(n)) + 6).attr('y', 8 + i * rh + 13).text(n), 11, MUTED);
        });
      };
      draw('brut'); wire(b, 'k', draw);
      question(b.querySelector('[data-q]'), {
        prompt: 'Que fera l’outil sans code avec cette colonne, si personne ne la nettoie ?',
        options: [
          {t: 'Un filtre à douze choix, dont quatre façons d’écrire Nouakchott', ok: true, why: 'L’outil affiche les valeurs telles quelles. « Nkc » et « نواكشوط، » deviennent des villes. Nettoyez <b>avant</b> l’outil, ou n’utilisez pas la colonne : les coordonnées (lat, lng) sont plus fiables.'},
          {t: 'Il regroupe tout seul les écritures proches', why: 'Aucun outil ne sait que « Nkc » veut dire Nouakchott.'},
          {t: 'Il refuse la colonne', why: 'Il l’accepte sans rien dire : c’est le danger.'}
        ]
      });
    }
  });

  steps.push({
    id: 'theatre', kicker: 'Critiquer', title: 'Le théâtre de l’interactivité',
    lead: 'Un tableau de bord à cinq filtres a l’air puissant. Mais un filtre qui ne change jamais la réponse est du bruit. Essayez chaque filtre : la réponse à « quelle part des lieux sont très bien notés ? » bouge-t-elle ?',
    build(b) {
      const share = a => { const s = a.filter(d => d.r != null && d.a >= 20); return s.length ? 100 * s.filter(d => d.r >= 4.5).length / s.length : NaN; };
      const base = share(ALL);
      const F = {
        aucun: ['Aucun filtre', ALL],
        resto: ['Restaurants seulement', ALL.filter(d => d.t === 'restaurant')],
        cafe: ['Cafés seulement', ALL.filter(d => d.t === 'café')],
        jour: ['Fiches à jour seulement', ALL.filter(d => d.u)],
        ouvert: ['Sans les fermés temporairement', ALL.filter(d => !d.f)],
        nkc: ['Ville = « Nouakchott » (écrit ainsi)', ALL.filter(d => d.v === 'Nouakchott')]
      };
      b.innerHTML = chips(Object.entries(F).map(([k, f]) => [k, f[0]]), 'aucun') + '<div class="viz main"><div data-c></div><div class="viz-caption">Part des lieux à 4,5 ou plus, parmi ceux qui ont au moins 20 avis. ' + SRC + '</div></div><div data-q></div>';
      const host = b.querySelector('[data-c]'), w = WW(), H = 120;
      const svg = mk(host, w, H), x = d3.scaleLinear().domain([0, 60]).range([20, w - 20]);
      svg.append('line').attr('x1', x(base)).attr('x2', x(base)).attr('y1', 20).attr('y2', 90).attr('stroke', MUTED).attr('stroke-dasharray', '4 3');
      ink(svg.append('text').attr('x', x(base)).attr('y', 14).attr('text-anchor', 'middle').text('sans filtre : ' + fr(base, 0) + ' %'), 11, MUTED);
      const bar = svg.append('rect').attr('x', x(0)).attr('y', 40).attr('height', 30).attr('fill', ACC);
      const lab = ink(svg.append('text').attr('y', 60), 14, INK, 700);
      const sub = ink(svg.append('text').attr('x', 20).attr('y', 108), 12, MUTED);
      const draw = k => {
        const [t, a] = F[k], v = share(a), n = a.filter(d => d.r != null && d.a >= 20).length;
        bar.transition().duration(400).attr('width', x(v) - x(0));
        lab.transition().duration(400).attr('x', x(v) + 8).text(fr(v, 0) + ' %');
        sub.text(t + ' · ' + n + ' lieux avec au moins 20 avis · écart : ' + (v >= base ? '+' : '−') + fr(Math.abs(v - base), 0) + ' pt');
      };
      draw('aucun'); wire(b, 'k', draw);
      question(b.querySelector('[data-q]'), {
        prompt: 'Quels filtres garderiez-vous dans le tableau de bord ?',
        options: [
          {t: 'Ceux qui changent la réponse, ou qu’un lecteur précis demande (le café)', ok: true, why: 'Un filtre se justifie par une question directrice. Les autres décorent : l’utilisateur croit explorer, mais la conclusion ne bouge pas.'},
          {t: 'Tous : plus de filtres, plus de liberté', why: 'Chaque filtre coûte de l’attention. Cinq filtres qui ne changent rien cachent celui qui compte.'},
          {t: 'Aucun : un tableau de bord doit être statique', why: 'Le filtre « cafés seulement » répond à la question de notre amie : il mérite sa place.'}
        ]
      });
    }
  });

  steps.push({
    id: 'carte', kicker: 'Cartographier', title: '639 points sur une ville',
    lead: 'Les coordonnées sont fiables : posons chaque lieu par sa longitude et sa latitude. Où sont les restaurants ? Comparez les points et la grille.',
    build(b) {
      b.innerHTML = chips([['pts', 'Un point par lieu'], ['grille', 'Grille : nombre par case']], 'pts') + '<div class="viz main"><div data-c></div><div class="viz-caption">Sans fond de carte : la forme de la ville apparaît d’elle-même. ' + SRC + '</div></div><div data-q></div>';
      const host = b.querySelector('[data-c]'), w = WW(), H = K.narrow() ? 400 : 440, P = proj(w, H, 16);
      const svg = mk(host, w, H);
      const gp = svg.append('g'), gg = svg.append('g');
      gp.selectAll('circle').data(ALL).join('circle').attr('cx', P.x).attr('cy', P.y).attr('r', 3).attr('fill', ACC).attr('fill-opacity', .35);
      const S = 22, cells = d3.rollups(ALL, v => v.length, d => Math.floor(P.x(d) / S) + ',' + Math.floor(P.y(d) / S));
      const c = d3.scaleSequential([0, d3.max(cells, d => d[1])], d3.interpolateRgb('#f3e9f4', '#5b2a5d'));
      cells.forEach(([k, n]) => {
        const [i, j] = k.split(',').map(Number);
        gg.append('rect').attr('x', i * S).attr('y', j * S).attr('width', S - 1).attr('height', S - 1).attr('fill', c(n));
        if (n >= 10) ink(gg.append('text').attr('x', i * S + S / 2).attr('y', j * S + S / 2 + 4).attr('text-anchor', 'middle').text(n), 9, '#fff', 700);
      });
      const draw = m => { gp.style('display', m === 'pts' ? null : 'none'); gg.style('display', m === 'grille' ? null : 'none'); };
      draw('pts'); wire(b, 'k', draw);
      question(b.querySelector('[data-q]'), {
        prompt: 'Dans le centre, les points se recouvrent. Que fait la grille de mieux ?',
        options: [
          {t: 'Elle compte ce que l’œil ne peut plus compter', ok: true, why: 'Au-delà de quelques points superposés, la densité devient illisible. La grille (ou des hexagones) montre combien il y en a. Le point reste utile pour le détail au survol.'},
          {t: 'Elle est plus précise', why: 'Elle l’est moins : chaque lieu perd sa position exacte. Elle gagne en lisibilité.'},
          {t: 'Rien : c’est une question de goût', why: 'C’est une question de lecture : combien, pas où exactement.'}
        ]
      });
    }
  });

  /* ================= Partie 3 · Sans code : Looker Studio ================= */

  const COLS = [['nom', 'dim'], ['type', 'dim'], ['ville', 'dim'], ['note', 'met'], ['nb_avis', 'met'], ['lat, lng', 'geo'], ['actualise', 'dim']];
  steps.push({
    id: 'looker', kicker: 'Classer', title: 'Dimension ou métrique ?',
    lead: 'Looker Studio (Google, gratuit, dans le navigateur) range chaque colonne en deux familles : les <b>dimensions</b> (on regroupe par elles) et les <b>métriques</b> (on les calcule). Cliquez sur chaque colonne pour la classer.',
    build(b) {
      const LBL = {dim: 'Dimension', met: 'Métrique', geo: 'Dimension géographique'};
      const cur = {};
      b.innerHTML = '<div class="viz main"><div class="d4-files" data-cols></div><div class="viz-caption">Les colonnes de <code>restaurants.csv</code>, telles que Looker Studio les importe.</div></div>' +
        '<div class="row"><button class="btn btn-primary" data-check>Vérifier</button></div><div data-fb></div>';
      const box = b.querySelector('[data-cols]');
      const draw = () => {
        box.innerHTML = '<table class="data d4-cmp"><thead><tr><th>Colonne</th><th>Votre choix (cliquez)</th></tr></thead><tbody>' +
          COLS.map(([c]) => '<tr><td><code>' + c + '</code></td><td><button type="button" class="chip" data-c="' + c + '" aria-pressed="' + (!!cur[c]) + '">' + (cur[c] ? LBL[cur[c]] : '?') + '</button></td></tr>').join('') + '</tbody></table>';
        box.querySelectorAll('[data-c]').forEach(btn => btn.addEventListener('click', () => {
          const order = ['dim', 'met', 'geo'], c = btn.dataset.c;
          cur[c] = order[(order.indexOf(cur[c]) + 1) % 3]; draw();
        }));
      };
      draw();
      b.querySelector('[data-check]').addEventListener('click', () => {
        const ok = COLS.filter(([c, k]) => cur[c] === k).length;
        b.querySelector('[data-fb]').innerHTML = M.note(ok === COLS.length ? 'lion' : 'ghost',
          '<p><b>' + ok + ' / ' + COLS.length + '.</b> ' + COLS.map(([c, k]) => '<code>' + c + '</code> : ' + LBL[k]).join(' · ') + '.</p>' +
          '<p>Le piège : <code>lat</code> et <code>lng</code> sont des nombres, donc l’outil en fait des <b>métriques</b> et propose de les additionner. Il faut les réunir en un champ « latitude, longitude » de type géographique. <code>nom</code> est une dimension : on ne calcule pas avec.</p>');
      });
    }
  });

  steps.push({
    id: 'somme', kicker: 'Piège', title: 'Ce que l’outil décide à votre place',
    lead: 'Vous glissez <code>note</code> dans un graphique en barres par type. Looker Studio choisit l’agrégation par défaut d’un nombre : la <b>somme</b>. Comparez.',
    build(b) {
      b.innerHTML = chips([['sum', 'Somme (par défaut)'], ['avg', 'Moyenne'], ['cnt', 'Nombre de lieux']], 'sum') + '<div class="viz main"><div data-c></div><div class="viz-caption">La même colonne <code>note</code>, trois agrégations. Lieux notés seulement.</div></div><div data-q></div>';
      const host = b.querySelector('[data-c]'), w = WW(), rh = 36, L = 110, H = TYPES.length * rh + 30;
      const svg = mk(host, w, H);
      const title = ink(svg.append('text').attr('x', 0).attr('y', 14), 13, INK, 700);
      const g = svg.selectAll('g.r').data(TYPES).join('g').attr('class', 'r').attr('transform', (d, i) => 'translate(' + L + ',' + (26 + i * rh) + ')');
      g.append('text').attr('x', -8).attr('y', 17).attr('text-anchor', 'end').text(d => d[1]).style('font-size', '12px');
      const bars = g.append('rect').attr('height', rh - 12).attr('fill', d => TCOL[d[0]]);
      const vals = g.append('text').attr('y', 17).style('font-size', '11px').style('fill', MUTED);
      const draw = m => {
        const v = k => { const a = NOTES.filter(d => d.t === k); return m === 'sum' ? d3.sum(a, d => d.r) : m === 'avg' ? mean(a) : a.length; };
        const x = d3.scaleLinear().domain([0, d3.max(TYPES, t => v(t[0]))]).range([0, w - L - 70]);
        title.text(m === 'sum' ? 'SOMME(note) par type' : m === 'avg' ? 'MOYENNE(note) par type' : 'NOMBRE de lieux notés par type');
        bars.transition().duration(500).attr('width', d => x(v(d[0])));
        vals.transition().duration(500).attr('x', d => x(v(d[0])) + 6).text(d => m === 'avg' ? note(v(d[0])) : fr(v(d[0]), 0));
      };
      draw('sum'); wire(b, 'k', draw);
      question(b.querySelector('[data-q]'), {
        prompt: 'Avec la somme, les restaurants « gagnent » largement. Que mesure vraiment cette barre ?',
        options: [
          {t: 'Surtout le nombre de restaurants', ok: true, why: 'Additionner des notes, c’est compter des lieux déguisés en qualité. Dans Looker Studio, changez l’agrégation de <code>note</code> en <b>Moyenne</b> (et dites sur combien d’avis). L’outil sans code est rapide, mais il <b>choisit à votre place</b> : vérifiez chaque agrégation.'},
          {t: 'La qualité des restaurants', why: 'Leur moyenne est proche de celle des cafés (≈ 4). La barre est longue parce qu’ils sont nombreux.'},
          {t: 'Le nombre d’avis', why: 'C’est une autre colonne, <code>nb_avis</code>.'}
        ]
      });
    }
  });

  const QUAND = [
    {prompt: 'La mairie veut, pour demain, un tableau de bord partagé avec trois chiffres et une carte.', options: [{t: 'Sans code', ok: true, why: 'Rapide, partageable par un lien, assez pour trois vues standard.'}, {t: 'Code', why: 'Des jours de travail pour un besoin standard.'}]},
    {prompt: 'Survoler un point de la carte doit allumer le lieu dans un nuage note × avis et dans un classement.', options: [{t: 'Code', ok: true, why: 'Des vues liées sur mesure : React + D3, comme au CM 4. Les outils sans code relient les filtres, rarement un survol précis entre graphiques.'}, {t: 'Sans code', why: 'Les filtres croisés existent, mais pas ce surlignage sur mesure.'}]},
    {prompt: 'Le fichier change chaque semaine, et c’est une collègue non développeuse qui met à jour.', options: [{t: 'Sans code', ok: true, why: 'Elle remplace la source, les vues suivent ; personne n’ouvre de code.'}, {t: 'Code', why: 'Chaque mise à jour passerait par un développeur.'}]}
  ];
  steps.push({
    id: 'quand', kicker: 'Décider', title: 'Sans code ou en code ?',
    lead: 'Trois demandes réelles. Pour chacune, quel chemin ?',
    build(b) { QUAND.forEach(q => { const el = document.createElement('div'); b.appendChild(el); question(el, q); }); }
  });

  /* ================= Partie 4 · En code : React + D3 ================= */

  const JSX = `function TableauDeBord() {
  // ÉTAT : ce que l’utilisateur a choisi
  const [type, setType] = useState(null);       // clic sur une barre
  const [minAvis, setMinAvis] = useState(20);   // curseur
  const [survol, setSurvol] = useState(null);   // point survolé
  // LOGIQUE : un seul calcul, partagé
  const lieux = restos.filter(d => d.note != null && d.nb_avis >= minAvis
                                && (!type || d.type === type));
  // VUES : chacune lit les mêmes lieux
  return <>
    <Chiffres lieux={lieux} />
    <Carte lieux={lieux} survol={survol} onSurvol={setSurvol} />
    <Types lieux={lieux} type={type} onChoisir={setType} />
    <Classement lieux={lieux} survol={survol} onSurvol={setSurvol} />
  </>;
}`;
  steps.push({
    id: 'react', kicker: 'Manipuler', title: 'Le même tableau de bord, en code',
    lead: 'Trois états, une logique, quatre vues. Cliquez sur une barre de type, bougez le curseur, survolez un point : qu’est-ce qui s’allume ailleurs ?',
    build(b) {
      if (!R || !RD) { b.innerHTML = '<p class="small">React est indisponible.</p>'; return; }
      b.innerHTML = '<div class="viz main"><div data-c></div><div class="viz-caption">Écrit en React (état, composants) et D3 (échelles), dans cette page. ' + SRC + '</div></div>' + codeBox(hl(JSX)) + '<div data-q></div>';
      const {useState} = R, nar = K.narrow();
      function Chiffres({lieux, type, minAvis}) {
        const tile = (lab, v, sub) => h('div', {className: 'd4-kpi'}, h('span', null, lab), h('b', null, v), sub ? h('i', null, sub) : null);
        return h('div', {className: 'd4-kpis'},
          h('div', {className: 'd4-kpi d4-kpi-head'}, h('span', null, 'Sélection'), h('b', null, type ? TLAB[type] : 'Tous les lieux'), h('i', null, 'au moins ' + minAvis + ' avis')),
          tile('Lieux', fr(lieux.length)), tile('Note moyenne', lieux.length ? note(mean(lieux)) : '—', 'chaque lieu compte pour 1'),
          tile('Très bien notés', lieux.filter(d => d.r >= 4.5).length, 'note ≥ 4,5'));
      }
      function Carte({lieux, survol, onSurvol}) {
        const w = 330, H = 300, P = proj(w, H, 10), on = new Set(lieux);
        return h('svg', {className: 'chart d4', viewBox: '0 0 ' + w + ' ' + H, role: 'img', onMouseLeave: () => onSurvol(null)},
          ALL.map((d, i) => h('circle', {key: i, cx: P.x(d), cy: P.y(d), r: d === survol ? 6 : on.has(d) ? 3.2 : 1.6,
            fill: d === survol ? INK : on.has(d) ? TCOL[d.t] : GREY, fillOpacity: on.has(d) ? .75 : .5,
            onMouseEnter: on.has(d) ? () => onSurvol(d) : null})),
          h('text', {x: 6, y: H - 8, style: {fontSize: '11px', fill: MUTED}}, survol ? survol.n + ' · ' + fr(survol.r, 1) + ' · ' + survol.a + ' avis' : 'Survolez un point'));
      }
      function Types({lieux, type, onChoisir, minAvis}) {
        const w = 330, rh = 30, H = TYPES.length * rh + 20;
        const base = NOTES.filter(d => d.a >= minAvis);
        const x = d3.scaleLinear().domain([0, d3.max(TYPES, t => base.filter(d => d.t === t[0]).length) || 1]).range([0, w - 150]);
        return h('svg', {className: 'chart d4', viewBox: '0 0 ' + w + ' ' + H, role: 'img'},
          h('text', {x: 0, y: 12, style: {fontSize: '11px', fill: MUTED}}, 'Clic : filtrer par type'),
          TYPES.map(([k, t], i) => { const n = base.filter(d => d.t === k).length;
            return h('g', {key: k, transform: 'translate(100,' + (20 + i * rh) + ')', style: {cursor: 'pointer'}, onClick: () => onChoisir(k === type ? null : k)},
              h('text', {x: -6, y: 15, textAnchor: 'end', style: {fontSize: '12px', fill: INK, fontWeight: k === type ? 700 : 400}}, t),
              h('rect', {height: rh - 10, width: x(n), fill: !type || k === type ? TCOL[k] : GREY, style: {transition: 'width .4s'}}),
              h('text', {x: x(n) + 6, y: 15, style: {fontSize: '11px', fill: MUTED}}, n)); }));
      }
      function Classement({lieux, survol, onSurvol}) {
        const top = lieux.slice().sort((a, c) => c.r - a.r || c.a - a.a).slice(0, 6);
        return h('ol', {className: 'recap', style: {margin: 0}}, top.map((d, i) => h('li', {key: i, onMouseEnter: () => onSurvol(d), onMouseLeave: () => onSurvol(null),
          style: {background: d === survol ? 'rgba(246,205,76,.35)' : null, cursor: 'default'}},
          h('span', null, h('b', null, d.n), ' · ' + fr(d.r, 1) + ' · ' + d.a + ' avis'))));
      }
      function TableauDeBord() {
        const [type, setType] = useState(null), [minAvis, setMinAvis] = useState(20), [survol, setSurvol] = useState(null);
        const lieux = NOTES.filter(d => d.a >= minAvis && (!type || d.t === type));
        return h('div', {className: 'd4-dash'},
          h('label', {className: 'row small', style: {gap: '8px'}}, 'Au moins ', h('b', null, minAvis), ' avis',
            h('input', {type: 'range', min: 1, max: 100, value: minAvis, style: {flex: 1}, onChange: e => setMinAvis(+e.target.value)})),
          h(Chiffres, {lieux, type, minAvis}),
          h('div', {className: 'd4-dash-row'}, h(Carte, {lieux, survol, onSurvol: setSurvol}), h(Types, {lieux, type, onChoisir: setType, minAvis})),
          h(Classement, {lieux, survol, onSurvol: setSurvol}),
          h('p', {className: 'd4-state-read', 'aria-live': 'polite'}, 'État : type = ' + (type ? '"' + type + '"' : 'null') + ' · minAvis = ' + minAvis + ' · survol = ' + (survol ? '"' + survol.n + '"' : 'null')));
      }
      RD.createRoot(b.querySelector('[data-c]')).render(h(TableauDeBord));
      question(b.querySelector('[data-q]'), {
        prompt: 'Vous survolez le premier du classement. Pourquoi son point grossit-il sur la carte ?',
        options: [
          {t: 'Le survol est un état du parent, lu par la carte et le classement', ok: true, why: 'Comme au CM 4 avec les wilayas : <code>onSurvol(d)</code> change l’état, les deux vues se redessinent. C’est ce qu’un outil sans code fait rarement : relier un survol entre deux graphiques.'},
          {t: 'Le classement envoie un message à la carte', why: 'Les vues ne se parlent pas : elles lisent le même état.'},
          {t: 'D3 détecte les points identiques', why: 'D3 calcule les positions ; c’est React qui redessine quand l’état change.'}
        ]
      });
    }
  });

  steps.push({
    id: 'compare', kicker: 'Comparer', title: 'Deux chemins, un même lecteur',
    lead: 'Vous avez vu les deux. Lequel gagne, critère par critère ? Votez avant d’ouvrir la réponse.',
    build(b) {
      const C = [['Premier tableau de bord en ligne', 'Une heure', 'Une journée'], ['Partager avec un décideur', 'Un lien', 'Héberger une page'], ['Mise à jour des données', 'Remplacer la source', 'Relancer un script'],
        ['Vues liées sur mesure (survol, annotation)', 'Limité', 'Tout est possible'], ['Agrégations, nettoyage', 'Cachés dans des menus', 'Écrits, relisibles'], ['Versions, relecture', 'Historique de l’outil', 'Git, revue de code']];
      b.innerHTML = '<div class="viz main"><table class="data d4-cmp"><thead><tr><th>Critère</th><th>Sans code (Looker Studio)</th><th>En code (React + D3)</th></tr></thead><tbody>' +
        C.map(r => '<tr><td>' + r[0] + '</td><td data-h>' + r[1] + '</td><td data-h>' + r[2] + '</td></tr>').join('') + '</tbody></table></div><div data-q></div>';
      question(b.querySelector('[data-q]'), {
        prompt: 'Votre projet final : un public, une question, des données qui ne changent plus. Par où commencer ?',
        options: [
          {t: 'Sans code pour esquisser, puis le code si le récit l’exige', ok: true, why: 'Le prototype sans code teste les questions directrices en une heure. On passe au code pour ce que l’outil ne sait pas faire : annoter, relier, raconter.'},
          {t: 'Toujours le code : c’est plus professionnel', why: 'Le meilleur outil est celui qui répond à la question, au moindre coût.'},
          {t: 'Toujours sans code : c’est plus rapide', why: 'Rapide pour le standard ; bloquant pour un récit sur mesure.'}
        ]
      });
    }
  });

  steps.push({
    id: 'retenir', kicker: 'À retenir', title: 'Ce qu’il faut garder',
    lead: 'Avant le TD 4 : pour qui, quelles questions, quel chemin ?',
    build(b) {
      b.innerHTML = '<ol class="recap">' + [
        'Un tableau de bord répond à <b>trois questions directrices</b> d’un lecteur précis. Pas de question, pas de vue.',
        'L’œil lit en <b>Z</b> : la réponse en haut à gauche, le contexte au milieu, le détail en bas.',
        'Trois étages : <b>état</b> (les choix), <b>logique</b> (un seul calcul partagé), <b>vues</b> (qui lisent toutes le même résultat).',
        'Un chiffre clé dit <b>sur quoi</b> il est calculé (seuil, moyenne) et <b>par rapport à quoi</b> ; il est le plus grand élément de la page.',
        '<b>Une couleur, un sens</b> dans toutes les vues ; un seul accent pour la réponse, le gris pour le reste. Les bulles : <b>aire</b> proportionnelle, pas rayon.',
        'Un filtre qui ne change pas la réponse est du <b>théâtre</b>. Gardez ceux qu’une question appelle.',
        'L’outil sans code <b>décide à votre place</b> : somme par défaut, valeurs sales affichées telles quelles. Vérifiez chaque agrégation, nettoyez avant.',
        '<b>Sans code</b> pour aller vite, partager et mettre à jour ; <b>en code</b> pour les vues liées, l’annotation, le récit sur mesure.'
      ].map(t => '<li><span>' + t + '</span></li>').join('') + '</ol>' + '<details class="foot-details" open><summary>Liste de contrôle avant de publier un tableau de bord</summary><ul class="qtick">' + ['Étiquettes directes sur les barres et les points ; légende seulement si elle est inévitable.', 'Nombres en format français (4,16 ; 1 250), unités écrites, pas de décimales inutiles.', 'Blocs alignés sur une grille, espaces égaux ; 5 à 7 vues au plus.', 'De l’air autour du chiffre clé : le vide aussi guide l’œil.', 'Date des données, source et seuils écrits sur la page (« données au 7 novembre 2026 ; 163 fiches non mises à jour »).'].map(t => '<li><label><input type="checkbox"><span>' + t + '</span></label></li>').join('') + '</ul></details>' + M.note('cat', '<p><b>Billet de sortie.</b> Écrivez les trois questions directrices de votre projet final, et pour chacune la vue qui y répond.</p>');
    }
  });

  /* ================= Ateliers complémentaires ================= */

  steps.push({
    id: 'ia', kicker: 'Critiquer', title: 'Demander un tableau de bord à une IA',
    lead: 'Deux demandes pour le même fichier. Laquelle obtiendra un tableau de bord utile ?',
    build(b) {
      b.innerHTML = '<div class="viz main"><p class="d4-tag">Demande A</p>' + codeBox('Fais-moi un dashboard avec restaurants.csv.') +
        '<p class="d4-tag">Demande B</p>' + codeBox(K.esc('Lecteur : une personne qui veut ouvrir un café à Nouakchott.\nQuestions : 1) combien de cafés ont une note ≥ 4,5 et au moins 20 avis ? 2) où sont-ils ? 3) note et nombre d’avis vont-ils ensemble ?\nRègles : moyenne simple, seuil de 20 avis affiché ; pas de colonne ville (sale), positions lat/lng ; un filtre par type, rien d’autre.')) + '</div><div data-q></div>';
      question(b.querySelector('[data-q]'), {
        prompt: 'Que contient la demande B que la demande A laisse au hasard ?',
        options: [
          {t: 'Le lecteur, les questions et les règles de calcul', ok: true, why: 'Sans eux, l’IA fait comme l’outil sans code : toutes les colonnes, des sommes par défaut, un filtre par colonne. Vos principes du cours sont la meilleure demande.'},
          {t: 'Le nom de la bibliothèque à utiliser', why: 'Utile, mais secondaire : le problème de A est l’absence de question.'},
          {t: 'Les couleurs', why: 'Les couleurs viennent après les questions.'}
        ]
      });
    }
  });

  const QUIZ = [
    {prompt: 'Un tableau de bord commence par…', options: [{t: 'Les questions d’un lecteur précis', ok: true, why: 'Les vues en découlent.'}, {t: 'La liste des colonnes', why: 'C’est un inventaire.'}]},
    {prompt: 'Dans Looker Studio, <code>note</code> glissée dans un graphique est d’abord…', options: [{t: 'Additionnée', ok: true, why: 'Somme par défaut pour un nombre : passez en Moyenne.'}, {t: 'Moyennée', why: 'Pas par défaut.'}]},
    {prompt: 'Les vues d’un tableau de bord se mettent à jour parce que…', options: [{t: 'Elles lisent le même état', ok: true, why: 'État → logique → vues.'}, {t: 'Elles s’envoient des messages', why: 'Les vues ne se parlent pas.'}]},
    {prompt: '<code>lat</code> et <code>lng</code> dans un outil sans code :', options: [{t: 'Un champ géographique « latitude, longitude »', ok: true, why: 'Sinon ce sont deux métriques additionnées.'}, {t: 'Deux métriques', why: 'On ne somme pas des coordonnées.'}]},
    {prompt: 'Un filtre qui ne change jamais la conclusion :', options: [{t: 'On le retire', ok: true, why: 'Théâtre de l’interactivité.'}, {t: 'On le garde, pour la liberté', why: 'Il coûte de l’attention pour rien.'}]}
  ];
  steps.push({
    id: 'quiz5', kicker: 'Quiz', title: 'Cinq questions éclair',
    lead: 'Réponses à voix haute.',
    build(b) { QUIZ.forEach(q => { const el = document.createElement('div'); b.appendChild(el); question(el, q); }); }
  });

  window.DS_LESSONS = window.DS_LESSONS || {};
  window.DS_LESSONS.cm5 = {
    id: 'cm5',
    title: 'Dashboards : no-code et code',
    lede: 'Au CM 4, la voiture et le tableau de bord React des élections ; au TD 3, les restaurants de Nouakchott. Construisons maintenant un tableau de bord pour un lecteur qui doit décider, deux fois : sans code dans Looker Studio, puis en code avec React et D3. Fil rouge : 639 restaurants et cafés de Nouakchott.',
    overview: '<div class="d4-route"><p class="d4-tag">Le parcours · 90 minutes</p><ol><li><b>Des questions</b><span>Un lecteur, trois questions, la lecture en Z, état → logique → vues.</span></li><li><b>Des chiffres honnêtes</b><span>Seuils, couleurs, tailles, filtres utiles, données sales.</span></li><li><b>Deux chemins</b><span>Looker Studio, puis React + D3 : quand choisir lequel.</span></li></ol></div>',
    activityLabel: '17 activités · 90 min + 2 ateliers complémentaires',
    coreCount: 17,
    model: '<span>Lecteur</span><i>→</i><span>Questions</span><i>→</i><span>État</span><i>→</i><span>Logique</span><i>→</i><span>Vues</span>',
    minutes: 90,
    plan: {tableur: 5, questions: 5, zigzag: 4, couches: 6, kpi: 5, couleur: 5, hierarchie: 4, bulles: 4, ville: 4, theatre: 5, carte: 4, looker: 5, somme: 5, quand: 4, react: 8, compare: 4, retenir: 5},
    reserve: {ia: 6, quiz5: 5},
    parts: [
      {title: 'Pourquoi un tableau de bord ?', from: 'tableur'},
      {title: 'Des chiffres qui ne mentent pas', from: 'kpi'},
      {title: 'Sans code : Looker Studio', from: 'looker'},
      {title: 'En code : React + D3', from: 'react'},
      {title: 'À retenir', from: 'retenir'},
      {title: 'Ateliers complémentaires', from: 'ia'}
    ],
    endAt: 'retenir',
    footer: '<section class="foot-block"><h3>À faire avant le TD 4</h3><ol class="recap">' +
      '<li><span>Connectez-vous à <a href="https://lookerstudio.google.com/" target="_blank" rel="noopener">Looker Studio</a> avec un compte Google et ouvrez un rapport vide.</span></li>' +
      '<li><span>Gardez le kit du TD 3 (VS Code, Live Server) : le TD 4 s’en sert.</span></li>' +
      '<li><span>Écrivez trois questions directrices sur les restaurants de Nouakchott, pour un lecteur de votre choix.</span></li></ol></section>' +
      '<details class="foot-details"><summary>Bibliographie et ressources</summary><ul class="biblio">' +
      '<li>Stephen Few, <i>Information Dashboard Design</i>, 2<sup>e</sup> éd., Analytics Press, 2013.</li>' +
      '<li>Steve Wexler, Jeffrey Shaffer, Andy Cotgreave, <i>The Big Book of Dashboards</i>, Wiley, 2017.</li>' +
      '<li>Ben Shneiderman, « The Eyes Have It », <i>IEEE Symposium on Visual Languages</i>, 1996.</li>' +
      '<li>Aide officielle : <a href="https://support.google.com/looker-studio" target="_blank" rel="noopener">Looker Studio</a> ; <a href="https://react.dev/learn" target="_blank" rel="noopener">react.dev</a> ; <a href="https://d3js.org/" target="_blank" rel="noopener">d3js.org</a>.</li>' +
      '<li>Restaurants : fiches publiques Google Maps, 639 lieux de Nouakchott, collecte nettoyée du 7 novembre 2026 (ni téléphone, ni adresse, ni texte d’avis).</li></ul></details>',
    steps: (() => {
      const order = ['tableur', 'questions', 'zigzag', 'couches', 'kpi', 'couleur', 'hierarchie', 'bulles', 'ville', 'theatre', 'carte', 'looker', 'somme', 'quand', 'react', 'compare', 'retenir', 'ia', 'quiz5'];
      const byId = Object.fromEntries(steps.map(s => [s.id, s]));
      byId.retenir.next = 'Explorer les ateliers complémentaires';
      return order.map(id => byId[id]);
    })()
  };
})();
