/* CM 3 · Le SIG comme outil de storytelling
   Contenu tiré de cm3.pdf (2025-2026), refait pour la projection : l'enseignante fait défiler, la classe répond à voix haute.
   Fil rouge : Nouakchott, invisible sur la carte du début, reprend sa place avec les cartogrammes.
   Données réelles (data-cm3.js) : limites ANSADE, OSM/HOT, Kontur, SRTM, Natural Earth, bac 2025 (rimdata). */
(function () {
  const K = window.Kit, M = window.Mascots, D = window.DS_DATA3;
  if (!D) return;
  const {fr, question, esc} = K;
  // La feuille de style fixe .chart text { fill; font-size } : ces réglages doivent passer par style pour s'appliquer.
  const textStyle = s => s.replace(/<text\b[^>]*>/g, t => {
    let css = '';
    t = t.replace(/ font-size="([^"]*)"/, (_, v) => { css += 'font-size:' + v + 'px !important;'; return ''; })
      .replace(/ fill="([^"]*)"/, (_, v) => { css += 'fill:' + v + ';'; return ''; })
      .replace(/ font-weight="([^"]*)"/, (_, v) => { css += 'font-weight:' + v + ';'; return ''; })
      .replace(/ letter-spacing="([^"]*)"/, (_, v) => { css += 'letter-spacing:' + v + 'px;'; return ''; });
    if (!css) return t;
    return / style="/.test(t) ? t.replace(/ style="/, ' style="' + css) : t.replace(/>$/, ' style="' + css + '">');
  });
  const svg = (w, h, inner, cls) => K.svg(w, h, textStyle(inner), cls);
  const ACC = '#8a4f8c', GREY = '#d9dce2', GREY2 = '#a3a8b3', INK = '#1d2433', BAD = '#b4532a', GOOD = '#2e6b4f', BLUE = '#4e79a7', SAND = '#efe9da', MARK = '#f6cd4c';
  const W = D.wilayas, byName = Object.fromEntries(W.map(w => [w.n, w]));
  const isNkc = w => w.n.startsWith('Nouakchott');
  const TOT = {km2: W.reduce((a, w) => a + w.km2, 0), cand: W.reduce((a, w) => a + w.cand, 0), pop: W.reduce((a, w) => a + w.pop, 0)};
  const NKC = {km2: W.filter(isNkc).reduce((a, w) => a + w.km2, 0), cand: W.filter(isNkc).reduce((a, w) => a + w.cand, 0), pop: W.filter(isNkc).reduce((a, w) => a + w.pop, 0)};
  const SRC_BAC = 'Bac 2025 : dépôt public <a href="https://github.com/binorassocies/rimdata" target="_blank" rel="noopener">rimdata</a>. Limites : ANSADE / OCHA, 2024.';
  const halo = 'paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round';
  const ask = t => '<span class="sc-ask">' + t + '</span>';
  const RAD = Math.PI / 180;
  const CHEFS = [['Zouérat', -12.47, 22.73], ['Nouadhibou', -17.04, 20.94], ['Atar', -13.05, 20.52], ['Akjoujt', -14.39, 19.75], ['Nouakchott', -15.96, 18.09], ['Rosso', -15.81, 16.51], ['Tidjikja', -11.43, 18.56], ['Aleg', -13.92, 17.05], ['Kiffa', -11.40, 16.62], ['Kaédi', -13.50, 16.15], ['Sélibaby', -12.18, 15.16], ['Aïoun', -9.61, 16.66], ['Néma', -7.26, 16.62]];
  const steps = [];

  /* ---------- Géométrie ---------- */
  // Projection simple de la Mauritanie : longitude contractée par le cosinus de la latitude moyenne.
  function fitBox(box, w, h, pad = 10) {
    const k = Math.cos((box[1] + box[3]) / 2 * RAD);
    const s = Math.min((w - 2 * pad) / ((box[2] - box[0]) * k), (h - 2 * pad) / (box[3] - box[1]));
    const ox = (w - (box[2] - box[0]) * k * s) / 2, oy = (h - (box[3] - box[1]) * s) / 2;
    const f = p => [ox + (p[0] - box[0]) * k * s, oy + (box[3] - p[1]) * s];
    f.kmPerPx = 111.32 / s;
    return f;
  }
  const ring = (r, f) => { let s = ''; for (let i = 0; i < r.length; i++) { const q = f(r[i]); s += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); } return s + 'Z'; };
  const line = (r, f) => { let s = ''; for (let i = 0; i < r.length; i++) { const q = f(r[i]); s += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); } return s; };
  const dOf = (rings, f) => rings.map(r => ring(r, f)).join('');
  const SIZE = () => K.narrow() ? [400, 430] : [600, 610];
  const mapF = (w, h) => fitBox(D.bounds, w, h);
  function country(f, fill, stroke = '#fff', sw = .8) {
    return W.map(w => '<path d="' + dOf(w.rings, f) + '" fill="' + (typeof fill === 'function' ? fill(w) : fill) + '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round"/>').join('');
  }
  const svgMap = (w, h, inner) => svg(w, h, inner, 'map');
  const chips = (items, cur) => '<div class="row" style="gap:6px;flex-wrap:wrap">' + items.map(([k, t]) => '<button type="button" class="chip" data-k="' + k + '" aria-pressed="' + (k === cur ? 'true' : 'false') + '">' + t + '</button>').join('') + '</div>';
  function wire(b, fn) {
    b.querySelectorAll('.chip[data-k]').forEach(c => c.addEventListener('click', () => {
      b.querySelectorAll('.chip[data-k]').forEach(x => x.setAttribute('aria-pressed', x === c ? 'true' : 'false'));
      fn(c.dataset.k);
    }));
  }
  const inPoly = (pt, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], d = r[j]; if ((a[1] > pt[1]) !== (d[1] > pt[1]) && pt[0] < (d[0] - a[0]) * (pt[1] - a[1]) / (d[1] - a[1]) + a[0]) c = !c; } return c; };
  const WORLD = D.world, NOANT = WORLD.filter(c => c.a3 !== 'ATA');
  const areaOf = (rings, f) => rings.reduce((acc, r) => { let s = 0; for (let i = 0; i < r.length; i++) { const a = f(r[i]), d = f(r[(i + 1) % r.length]); s += a[0] * d[1] - d[0] * a[1]; } return acc + Math.abs(s) / 2; }, 0);
  const worldBy = a3 => WORLD.find(c => c.a3 === a3);

  // Projections du monde, en coordonnées abstraites.
  const mercY = lat => Math.log(Math.tan(Math.PI / 4 + Math.max(-84, Math.min(84, lat)) * RAD / 2));
  const PROJ = {
    merc: p => [p[0] * RAD, -mercY(p[1])],
    plate: p => [p[0] * RAD, -p[1] * RAD],
    earth: p => { // Equal Earth (Šavrič, Patterson, Jenny, 2018)
      const A = [1.340264, -0.081106, 0.000893, 0.003796], th = Math.asin(Math.sqrt(3) / 2 * Math.sin(p[1] * RAD)), t2 = th * th, t6 = t2 * t2 * t2;
      const dy = A[0] + 3 * A[1] * t2 + t6 * (7 * A[2] + 9 * A[3] * t2);
      return [2 * Math.sqrt(3) * p[0] * RAD * Math.cos(th) / (3 * dy), -th * (A[0] + A[1] * t2 + t6 * (A[2] + A[3] * t2))];
    },
    azi: p => { // Azimutale équidistante centrée sur Nouakchott
      const l0 = -15.96 * RAD, f0 = 18.09 * RAD, l = p[0] * RAD, f = p[1] * RAD;
      const c = Math.acos(Math.max(-1, Math.min(1, Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l - l0))));
      const k = c < 1e-6 ? 1 : c / Math.sin(c);
      return [k * Math.cos(f) * Math.sin(l - l0), -k * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l - l0))];
    }
  };
  const fitProj = (pr, w, h, box) => { const s = Math.min(w / (box[1] - box[0]), h / (box[3] - box[2])); return p => { const q = pr(p); return [(q[0] - box[0]) * s + (w - (box[1] - box[0]) * s) / 2, (q[1] - box[2]) * s + (h - (box[3] - box[2]) * s) / 2]; }; };
  const worldPath = (cs, f) => cs.map(c => dOf(c.rings, f)).join('');

  /* ======================= Partie 1 · Une carte est un récit ======================= */

  // 1. La carte où Nouakchott disparaît.
  steps.push({
    id: 'invisible', kicker: 'Une carte est un récit', title: 'Où passent-ils le bac ?',
    lead: 'Quinze wilayas, 53 148 candidats en 2025. Regardons la carte comme un lecteur pressé.',
    build(b) {
      const [ww, hh] = SIZE(), f = mapF(ww, hh);
      const nk = f([-15.96, 18.09]), tz = f(byName['Tiris Zemmour'].c);
      K.scrolly(b, {
        steps: [
          '<p>Voici le pays, découpé en 15 wilayas.</p>' + ask('Où se trouvent la plupart des candidats au bac ? Montrez sur la carte.'),
          '<p>La plus vaste wilaya, <b>Tiris Zemmour</b> : ' + fr(100 * byName['Tiris Zemmour'].km2 / TOT.km2) + ' % du territoire. Et seulement <b>' + fr(100 * byName['Tiris Zemmour'].cand / TOT.cand, 1) + ' % des candidats</b>.</p>',
          '<p>Les trois wilayas de <b>Nouakchott</b> : ' + fr(100 * NKC.km2 / TOT.km2, 2) + ' % du territoire et <mark>' + fr(100 * NKC.cand / TOT.cand) + ' % des candidats</mark>.</p>' + ask('Les voyez-vous ?'),
          '<p>Plus d’un candidat sur deux tient dans cette tache. L’œil, lui, voit le désert.</p><p class="small">« Une carte n’est pas un miroir de la réalité, c’est un récit construit avec une intention précise. »</p>',
          '<p>Aujourd’hui : comment on fabrique une carte, où elle peut tromper, et comment <b>rendre sa place à Nouakchott</b>. Réponse à la fin du cours.</p>'
        ],
        render(el, i) {
          const fill = w => i >= 1 && i < 2 && w.n === 'Tiris Zemmour' ? '#c5b2c6' : i >= 2 && isNkc(w) ? ACC : GREY;
          let extra = '';
          if (i === 1) extra = '<text x="' + tz[0] + '" y="' + tz[1] + '" text-anchor="middle" font-weight="700" fill="' + INK + '" style="' + halo + '">Tiris Zemmour</text>';
          if (i >= 2) extra = '<circle cx="' + nk[0] + '" cy="' + nk[1] + '" r="' + (K.narrow() ? 14 : 20) + '" fill="none" stroke="' + BAD + '" stroke-width="2.5"/>' +
            '<text x="' + (nk[0] + 26) + '" y="' + (nk[1] + 5) + '" font-weight="700" fill="' + BAD + '" style="' + halo + '">Nouakchott</text>';
          el.innerHTML = svgMap(ww, hh, country(f, fill) + extra);
        }
      });
      b.insertAdjacentHTML('beforeend', '<p class="viz-caption">' + SRC_BAC + '</p>');
    }
  });

  // 2. SIG : la géométrie et la table sont liées.
  steps.push({
    id: 'sig', kicker: 'Qu’est-ce qu’un SIG ?', title: 'Où ? Et quoi ?',
    lead: 'Un <b>S</b>ystème d’<b>I</b>nformation <b>G</b>éographique lie des formes à une table. Cliquez une wilaya, une ligne, ou posez une question.',
    build(b) {
      const [ww, hh] = K.narrow() ? [400, 410] : [430, 440], f = mapF(ww, hh);
      const QS = [['all', 'Aucune requête', () => false], ['t', '« taux » > 20', w => w.taux > 20], ['c', '« candidats » > 5 000', w => w.cand > 5000], ['s', '« km² » > 100 000', w => w.km2 > 100000]];
      let sel = new Set();
      b.innerHTML = chips(QS.map(q => [q[0], q[1]]), 'all') +
        '<div class="sig-grid"><div class="viz"><div data-map></div></div><div class="viz sig-table"><table class="data"><thead><tr><th>Wilaya</th><th>km²</th><th>Candidats</th><th>Taux</th></tr></thead><tbody>' +
        W.map(w => '<tr data-n="' + w.n + '"><td>' + w.n + '</td><td>' + fr(w.km2) + '</td><td>' + fr(w.cand) + '</td><td>' + fr(w.taux, 1) + ' %</td></tr>').join('') + '</tbody></table></div></div>' +
        '<div class="viz-caption">' + SRC_BAC + '</div><div data-q></div>';
      const draw = () => {
        b.querySelector('[data-map]').innerHTML = svgMap(ww, hh, W.map(w => '<path data-n="' + w.n + '" d="' + dOf(w.rings, f) + '" fill="' + (sel.has(w.n) ? MARK : GREY) + '" stroke="#fff" stroke-width=".8" style="cursor:pointer"/>').join(''));
        b.querySelectorAll('[data-map] path').forEach(p => p.addEventListener('click', () => toggle(p.dataset.n)));
        b.querySelectorAll('tbody tr').forEach(r => r.classList.toggle('is-sel', sel.has(r.dataset.n)));
      };
      const toggle = n => { sel.has(n) ? sel.delete(n) : sel.add(n); draw(); };
      b.querySelectorAll('tbody tr').forEach(r => { r.style.cursor = 'pointer'; r.addEventListener('click', () => toggle(r.dataset.n)); });
      wire(b, k => { sel = new Set(W.filter(QS.find(q => q[0] === k)[2]).map(w => w.n)); draw(); });
      draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'Qu’apporte un SIG que n’apporte pas un tableur ?',
        options: [
          {t: 'Il relie chaque ligne à un lieu : on peut interroger l’espace', ok: true, why: '« Cette wilaya touche-t-elle le fleuve ? », « combien d’habitants à 5 km ? » : un tableur ne sait pas répondre. Un SIG, ce sont des <b>données</b> géoréférencées, des <b>outils</b> (QGIS, ArcGIS, Python) et une <b>analyse</b>.'},
          {t: 'Il dessine de plus jolis graphiques', why: 'Pas forcément. Sa force est le lien entre géométrie et table.'},
          {t: 'Il corrige les données', why: 'Non : il les montre, erreurs comprises. Vous le verrez au TD.'}
        ]
      });
    }
  });

  /* ======================= Partie 2 · De la Terre à la donnée ======================= */

  // Douglas-Peucker sur un anneau.
  function simplify(pts, tol) {
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const st = [[0, pts.length - 1]];
    while (st.length) {
      const [a, z] = st.pop(); let mx = 0, id = -1;
      const dx = pts[z][0] - pts[a][0], dy = pts[z][1] - pts[a][1], L = Math.hypot(dx, dy) || 1e-9;
      for (let i = a + 1; i < z; i++) { const d = Math.abs(dy * (pts[i][0] - pts[a][0]) - dx * (pts[i][1] - pts[a][1])) / L; if (d > mx) { mx = d; id = i; } }
      if (mx > tol && id > 0) { keep[id] = 1; st.push([a, id], [id, z]); }
    }
    return pts.filter((_, i) => keep[i]);
  }
  const perim = pts => { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], d = pts[(i + 1) % pts.length], k = Math.cos((a[1] + d[1]) / 2 * RAD); s += Math.hypot((d[0] - a[0]) * k, d[1] - a[1]) * 111.32; } return s; };

  steps.push({
    id: 'simplifier', kicker: 'Modéliser', title: 'Choisir ce qu’on garde',
    lead: 'Le monde est infiniment détaillé. Une carte sélectionne, généralise, code. Tirez le curseur.',
    build(b) {
      const [ww, hh] = SIZE(), f = mapF(ww, hh);
      b.innerHTML = '<div class="viz main"><div class="row" style="gap:12px"><label class="small" for="s-gen">Généralisation</label><input id="s-gen" type="range" min="0" max="100" value="0" style="flex:1;accent-color:' + ACC + '"></div><div data-chart></div><div class="viz-caption" data-cap></div></div><div data-q></div>';
      const cap = b.querySelector('[data-cap]');
      const draw = () => {
        const t = +b.querySelector('#s-gen').value, tol = .002 * Math.pow(600, t / 100), half = Math.floor(D.border.length / 2);
        const a = simplify(D.border.slice(0, half + 1), tol), z = simplify(D.border.slice(half).concat([D.border[0]]), tol);
        const pts = a.slice(0, -1).concat(z.slice(0, -1));
        b.querySelector('[data-chart]').innerHTML = svgMap(ww, hh, '<path d="' + ring(pts, f) + '" fill="' + SAND + '" stroke="' + INK + '" stroke-width="1.4" stroke-linejoin="round"/>' + (pts.length < 90 ? pts.map(p => { const q = f(p); return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.5" fill="' + ACC + '"/>'; }).join('') : ''));
        cap.innerHTML = '<b>' + fr(pts.length) + ' points</b> · périmètre mesuré : <b>' + fr(Math.round(perim(pts) / 10) * 10) + ' km</b>. Limites ANSADE / OCHA, 2024.';
      };
      b.querySelector('#s-gen').addEventListener('input', draw); draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'Le périmètre change quand on simplifie. Quelle est la « vraie » longueur de la frontière ?',
        options: [
          {t: 'Elle dépend de l’échelle à laquelle on mesure', ok: true, why: 'Plus on regarde de près, plus la côte et le fleuve ont de détours, plus la longueur grandit : c’est le <b>paradoxe de la côte</b>. Toute donnée spatiale porte une échelle et des choix.'},
          {t: 'Celle du fichier le plus détaillé', why: 'Un fichier plus détaillé encore donnerait un nombre plus grand.'},
          {t: 'Celle de la carte la plus simple', why: 'Elle coupe tous les méandres : c’est un minimum, pas la vérité.'}
        ]
      });
    }
  });

  steps.push({
    id: 'vecteurs', kicker: 'Vecteurs', title: 'Points, lignes, polygones',
    lead: 'Le monde vectoriel : des coordonnées reliées. Allumez et éteignez les couches.',
    build(b) {
      const [ww, hh] = SIZE(), f = mapF(ww, hh);
      const on = {poly: true, line: true, pt: true};
      b.innerHTML = '<div class="viz main"><div class="row" style="gap:6px;flex-wrap:wrap">' + [['poly', 'Polygones : 15 wilayas'], ['line', 'Lignes : routes et voie ferrée'], ['pt', 'Points : lieux de santé']].map(([k, t]) => '<button type="button" class="chip" data-l="' + k + '" aria-pressed="true">' + t + '</button>').join('') + '</div><div data-chart></div>' +
        '<div class="viz-caption">Routes principales, voie ferrée et lieux de santé : © contributeurs OpenStreetMap (ODbL). Limites : ANSADE / OCHA.</div></div><div data-q></div>';
      const draw = () => {
        const nd = f([-16.9, 21.95]);
        b.querySelector('[data-chart]').innerHTML = svgMap(ww, hh,
          (on.poly ? country(f, SAND, '#b9b2a0', 1) : '') +
          (on.line ? D.lines.road.map(l => '<path d="' + line(l, f) + '" fill="none" stroke="' + GREY2 + '" stroke-width="1.6"/>').join('') + D.lines.rail.map(l => '<path d="' + line(l, f) + '" fill="none" stroke="' + INK + '" stroke-width="2" stroke-dasharray="5 3"/>').join('') +
            '<text x="' + nd[0] + '" y="' + nd[1] + '" font-size="13" fill="' + INK + '" style="' + halo + '">voie ferrée de la SNIM</text>' : '') +
          (on.pt ? D.health.filter(h => h[3]).map(h => { const q = f(h); return '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="2.4" fill="' + BAD + '" fill-opacity=".75"/>'; }).join('') : ''));
      };
      b.querySelectorAll('[data-l]').forEach(c => c.addEventListener('click', () => { on[c.dataset.l] = !on[c.dataset.l]; c.setAttribute('aria-pressed', on[c.dataset.l]); draw(); }));
      draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'Sur une carte du pays, Nouakchott est un point. Et sur un plan de la ville ?',
        options: [
          {t: 'Des polygones : 3 wilayas, 9 moughataas, des bâtiments', ok: true, why: 'Le type d’objet n’est pas dans le monde : il dépend de <b>l’échelle</b> et de la <b>question</b>. Une ville est un point, puis une surface, puis des milliers de bâtiments.'},
          {t: 'Toujours un point', why: 'À l’échelle du quartier, un point ne dit plus rien de la ville.'},
          {t: 'Une ligne', why: 'Une ligne convient aux routes, aux fleuves, aux réseaux.'}
        ]
      });
    }
  });

  // Raster : le Guelb er Richat, pixels réglables.
  const hypso = v => { // v dans [0,1] : vert, sable, ocre, blanc
    const S = [[0, [58, 110, 92]], [.3, [176, 180, 120]], [.55, [226, 196, 140]], [.8, [176, 120, 80]], [1, [250, 246, 240]]];
    for (let i = 1; i < S.length; i++) if (v <= S[i][0]) { const a = S[i - 1], d = S[i], t = (v - a[0]) / (d[0] - a[0]); return a[1].map((c, j) => Math.round(c + (d[1][j] - c) * t)); }
    return S[S.length - 1][1];
  };
  steps.push({
    id: 'raster', kicker: 'Rasters', title: 'Une grille de pixels',
    lead: 'Chaque case contient un nombre, ici une altitude. Voici un vrai fichier, sur le territoire mauritanien.',
    build(b) {
      const R = D.raster, bin = atob(R.b64), W0 = R.w, H0 = R.h, val = new Float32Array(W0 * H0);
      for (let i = 0; i < val.length; i++) val[i] = bin.charCodeAt(i) / 255;
      const kmPx = (R.bbox[2] - R.bbox[0]) * Math.cos(21 * RAD) * 111.32 / W0;
      b.innerHTML = '<div class="viz main"><div class="row" style="gap:12px"><label class="small" for="r-px">Taille du pixel</label><input id="r-px" type="range" min="0" max="5" value="5" style="flex:1;accent-color:' + ACC + '"><b data-size class="small"></b></div>' +
        '<canvas class="raster-canvas" width="' + W0 * 3 + '" height="' + H0 * 3 + '" role="img" aria-label="Relief en pixels"></canvas><div class="viz-caption"><span data-read>Passez la souris pour lire la valeur d’un pixel.</span> NASA SRTM.</div></div><div data-q></div>';
      const cv = b.querySelector('canvas'), cx = cv.getContext('2d');
      let block = 32, cells = null;
      const draw = () => {
        const blocks = [1, 2, 4, 8, 16, 32]; block = blocks[+b.querySelector('#r-px').value];
        const cw = Math.ceil(W0 / block), ch = Math.ceil(H0 / block); cells = new Float32Array(cw * ch);
        for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
          let s = 0, n = 0;
          for (let y = j * block; y < Math.min(H0, (j + 1) * block); y++) for (let x = i * block; x < Math.min(W0, (i + 1) * block); x++) { s += val[y * W0 + x]; n++; }
          cells[j * cw + i] = s / n;
          const c = hypso(s / n); cx.fillStyle = 'rgb(' + c + ')'; cx.fillRect(i * block * 3, j * block * 3, block * 3 + 1, block * 3 + 1);
        }
        cells.cw = cw;
        b.querySelector('[data-size]').textContent = (block * kmPx < 1 ? fr(Math.round(block * kmPx * 1000 / 10) * 10) + ' m' : fr(block * kmPx, 1) + ' km');
      };
      b.querySelector('#r-px').addEventListener('input', draw);
      cv.addEventListener('mousemove', e => {
        const r = cv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * W0 / block), y = Math.floor((e.clientY - r.top) / r.height * H0 / block);
        const v = cells[y * cells.cw + x]; if (v === undefined) return;
        b.querySelector('[data-read]').textContent = 'Ce pixel vaut ' + fr(R.lo + v * (R.hi - R.lo)) + ' m.';
      });
      draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'Réduisez la taille du pixel. Que voyez-vous apparaître ?',
        options: [
          {t: 'Le Guelb er Richat, un dôme géologique érodé', ok: true, why: 'L’« <b>œil de l’Afrique</b> », dans l’Adrar : environ 40 km de large, visible depuis l’espace. Longtemps pris pour un cratère de météorite. <b>Taille du pixel = résolution</b> : à 10 km, il n’existe pas. Les rasters conviennent à ce qui varie partout : altitude, température, images satellites.'},
          {t: 'Un cratère de météorite', why: 'C’est ce qu’on a longtemps cru. Les géologues y voient un dôme érodé : des roches dures et tendres forment ces anneaux.'},
          {t: 'Le lit d’un ancien lac', why: 'Non : ces anneaux sont des couches de roches dégagées par l’érosion.'}
        ]
      });
    }
  });

  // Cinq objets, trois vues : le terrain, sa grille, ses coordonnées. Le raster est calculé depuis la géométrie du vecteur.
  const ENTITES = {
    point: {t: 'Points', nom: 'Des puits', sets: [[[16, 30]], [[38, 78]], [[63, 52]], [[86, 20]]]},
    ligne: {t: 'Lignes', nom: 'Une voie ferrée', sets: [[[6, 10], [28, 24], [50, 26], [68, 58], [92, 90]]]},
    surface: {t: 'Surfaces', nom: 'Un lac', sets: [[[22, 40], [30, 68], [52, 80], [74, 72], [82, 50], [68, 28], [50, 34], [36, 22]]]},
    reseau: {t: 'Réseaux', nom: 'Des routes', sets: [[[4, 46], [46, 46], [96, 58]], [[46, 46], [40, 96]], [[46, 46], [62, 20], [58, 4]], [[62, 20], [94, 14]]]},
    relief: {t: 'Relief', nom: 'Un guelb', sets: []}
  };
  const GUELB = {cx: 52, cy: 50, rad: a => 34 * (1 + .22 * Math.cos(2 * a + .6) + .1 * Math.sin(3 * a)), levels: [1, .75, .5, .25]};
  ENTITES.relief.sets = GUELB.levels.map(k => Array.from({length: 12}, (_, n) => { const a = n / 12 * 2 * Math.PI; return [GUELB.cx + k * GUELB.rad(a) * Math.cos(a), GUELB.cy + k * GUELB.rad(a) * Math.sin(a)]; }));
  const NCELL = 12;
  function rasterCells(kind) {
    const c = 100 / NCELL, on = new Map(), mark = (x, y, v = 1) => on.set(Math.min(NCELL - 1, Math.floor(x / c)) + ',' + Math.min(NCELL - 1, Math.floor(y / c)), v), sets = ENTITES[kind].sets;
    if (kind === 'point') sets.forEach(q => mark(q[0][0], q[0][1]));
    if (kind === 'ligne' || kind === 'reseau') sets.forEach(l => { for (let i = 1; i < l.length; i++) { const n = Math.ceil(Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]) * 2); for (let t = 0; t <= n; t++) mark(l[i - 1][0] + (l[i][0] - l[i - 1][0]) * t / n, l[i - 1][1] + (l[i][1] - l[i - 1][1]) * t / n); } });
    for (let i = 0; i < NCELL; i++) for (let j = 0; j < NCELL; j++) {
      const x = (i + .5) * c, y = (j + .5) * c;
      if (kind === 'surface') { const q = sets[0]; let inside = false; for (let a = 0, b = q.length - 1; a < q.length; b = a++) if ((q[a][1] > y) !== (q[b][1] > y) && x < q[a][0] + (y - q[a][1]) / (q[b][1] - q[a][1]) * (q[b][0] - q[a][0])) inside = !inside; if (inside) mark(x, y); }
      if (kind === 'relief') { const d = Math.hypot(x - GUELB.cx, y - GUELB.cy), a = Math.atan2(y - GUELB.cy, x - GUELB.cx); mark(x, y, Math.max(.05, 1 - d / GUELB.rad(a))); }
    }
    return on;
  }
  function entiteFigure(kind, ww) {
    const gap = 14, S = (ww - 2 * gap) / 3, top = 24, c = S / NCELL, e = ENTITES[kind], X = (x0, v) => x0 + v / 100 * S, Y = v => top + (1 - v / 100) * S;
    const poly = (q, x0, close) => 'M' + q.map(v => X(x0, v[0]).toFixed(1) + ' ' + Y(v[1]).toFixed(1)).join('L') + (close ? 'Z' : '');
    const closed = kind === 'surface' || kind === 'relief', x1 = 0, x2 = S + gap, x3 = 2 * (S + gap);
    const head = (x0, t) => '<text x="' + (x0 + S / 2) + '" y="15" text-anchor="middle" class="lbl-strong">' + t + '</text>';
    let terrain = '<rect x="' + x1 + '" y="' + top + '" width="' + S + '" height="' + S + '" rx="6" fill="' + SAND + '"/>';
    if (kind === 'point') terrain += e.sets.map(q => '<circle cx="' + X(x1, q[0][0]) + '" cy="' + Y(q[0][1]) + '" r="' + S * .04 + '" fill="' + BLUE + '" stroke="' + INK + '" stroke-width="2"/>').join('');
    if (kind === 'ligne') terrain += e.sets.map(q => '<path d="' + poly(q, x1) + '" fill="none" stroke="' + INK + '" stroke-width="' + S * .045 + '" stroke-dasharray="1.5 4"/><path d="' + poly(q, x1) + '" fill="none" stroke="' + INK + '" stroke-width="1.6"/>').join('');
    if (kind === 'surface') terrain += '<path d="' + poly(e.sets[0], x1, true) + '" fill="' + BLUE + '" stroke="' + BLUE + '" stroke-width="' + S * .05 + '" stroke-linejoin="round" opacity=".75"/>';
    if (kind === 'reseau') terrain += e.sets.map(q => '<path d="' + poly(q, x1) + '" fill="none" stroke="#7b808c" stroke-width="' + S * .04 + '" stroke-linecap="round" stroke-linejoin="round"/>').join('') + e.sets.map(q => '<path d="' + poly(q, x1) + '" fill="none" stroke="#fff" stroke-dasharray="5 5"/>').join('');
    if (kind === 'relief') terrain += e.sets.map((q, n) => { const col = ['#e0d0ad', '#cdb483', '#b0905f', '#866a44'][n]; return '<path d="' + poly(q, x1, true) + '" fill="' + col + '" stroke="' + col + '" stroke-width="5" stroke-linejoin="round"/>'; }).join('');
    const on = rasterCells(kind);
    let raster = '';
    on.forEach((v, k) => { const [i, j] = k.split(',').map(Number); raster += '<rect x="' + (x2 + i * c).toFixed(1) + '" y="' + (top + (NCELL - 1 - j) * c).toFixed(1) + '" width="' + c.toFixed(1) + '" height="' + c.toFixed(1) + '" fill="' + ACC + '" fill-opacity="' + (kind === 'relief' ? Math.min(1, v * 1.2).toFixed(2) : '.7') + '"/>'; });
    for (let n = 0; n <= NCELL; n++) raster += '<path d="M' + (x2 + n * c).toFixed(1) + ' ' + top + 'V' + (top + S) + 'M' + x2 + ' ' + (top + n * c).toFixed(1) + 'H' + (x2 + S) + '" stroke="' + GREY + '"/>';
    const r = ww < 500 ? 2 : 3, seen = new Set();
    let vecteur = '<path d="M' + x3 + ' ' + top + 'V' + (top + S) + 'H' + (x3 + S) + '" fill="none" stroke="' + GREY2 + '"/><text x="' + (x3 + 5) + '" y="' + (top + 11) + '">y</text><text x="' + (x3 + S - 10) + '" y="' + (top + S - 5) + '">x</text>';
    if (kind !== 'point') vecteur += e.sets.map(q => '<path d="' + poly(q, x3, closed) + '" fill="' + (kind === 'surface' ? BLUE : 'none') + '" fill-opacity=".15" stroke="' + INK + '" stroke-width="1.6"/>').join('');
    e.sets.forEach(q => q.forEach(v => { const k = v.join(); if (seen.has(k)) return; seen.add(k); vecteur += '<circle cx="' + X(x3, v[0]).toFixed(1) + '" cy="' + Y(v[1]).toFixed(1) + '" r="' + r + '" fill="' + (kind === 'point' ? INK : '#fff') + '" stroke="' + INK + '" stroke-width="1.4"/>'; }));
    const n = seen.size, cap = NCELL * NCELL;
    return {
      svg: svg(ww, top + S + 2, head(x1, 'Le terrain') + terrain + head(x2, 'Raster') + raster + head(x3, 'Vecteur') + vecteur),
      note: '<b>' + e.nom + '.</b> ' + (kind === 'relief'
        ? 'Raster : ' + cap + ' cellules, chacune avec son altitude. Vecteur : ' + e.sets.length + ' courbes de niveau, ' + n + ' sommets, et rien entre deux courbes.'
        : 'Raster : ' + cap + ' cellules à stocker, dont ' + on.size + ' occupées. Vecteur : ' + n + (kind === 'point' ? ' points' : ' sommets') + ', soit ' + 2 * n + ' nombres.') + ' Terrain schématique.'
    };
  }
  // Les cinq objets, puis la même idée sur la voie ferrée de la SNIM.
  steps.push({
    id: 'deuxvues', kicker: 'Vecteur ou raster', title: 'Deux façons de voir le monde',
    lead: 'Le même monde, deux modèles. Regardez ce que devient chaque objet, puis essayez sur un vrai tracé.',
    build(b) {
      const ww = K.narrow() ? 400 : 680, hh = K.narrow() ? 190 : 300, box = [-17.25, 20.7, -12, 23], f = fitBox(box, ww, hh, 8);
      b.innerHTML = '<div class="viz">' + chips(Object.keys(ENTITES).map(k => [k, ENTITES[k].t]), 'ligne') + '<div data-ent style="margin-top:12px"></div><div class="viz-caption" data-ent-note></div></div>' +
        '<div class="viz main"><div class="row" style="gap:12px;flex-wrap:wrap"><label class="small" for="v-c">Taille de la cellule</label><input id="v-c" type="range" min="0" max="4" value="4" style="flex:1;min-width:160px;accent-color:' + ACC + '"><b class="small" data-c></b>' +
        '<label class="small"><input type="checkbox" data-vec checked> Vecteur</label></div><div data-chart></div><div class="viz-caption" data-n></div></div><div data-q></div>';
      const ent = k => { const x = entiteFigure(k, ww); b.querySelector('[data-ent]').innerHTML = x.svg; b.querySelector('[data-ent-note]').innerHTML = x.note; };
      wire(b, ent); ent('ligne');
      const pts = D.lines.rail.reduce((n, l) => n + l.length, 0);
      const draw = () => {
        const km = [5, 10, 20, 40, 80][+b.querySelector('#v-c').value], dLat = km / 111.32, dLon = km / (111.32 * Math.cos(21.8 * RAD)), on = new Set();
        D.lines.rail.forEach(l => { for (let i = 1; i < l.length; i++) { const n = Math.ceil(Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]) / Math.min(dLat, dLon) * 2) + 1; for (let t = 0; t <= n; t++) on.add(Math.floor((l[i - 1][0] + (l[i][0] - l[i - 1][0]) * t / n - box[0]) / dLon) + ',' + Math.floor((l[i - 1][1] + (l[i][1] - l[i - 1][1]) * t / n - box[1]) / dLat)); } });
        const cells = [...on].map(c => { const [i, j] = c.split(',').map(Number), a = f([box[0] + i * dLon, box[1] + (j + 1) * dLat]), z = f([box[0] + (i + 1) * dLon, box[1] + j * dLat]); return '<rect x="' + a[0].toFixed(1) + '" y="' + a[1].toFixed(1) + '" width="' + (z[0] - a[0]).toFixed(1) + '" height="' + (z[1] - a[1]).toFixed(1) + '" fill="' + ACC + '" fill-opacity=".55" stroke="#fff" stroke-width=".5"/>'; }).join('');
        b.querySelector('[data-c]').textContent = km + ' km';
        b.querySelector('[data-chart]').innerHTML = svg(ww, hh, cells + (b.querySelector('[data-vec]').checked ? D.lines.rail.map(l => '<path d="' + line(l, f) + '" fill="none" stroke="' + INK + '" stroke-width="1.6"/>').join('') : ''));
        b.querySelector('[data-n]').innerHTML = 'Voie ferrée de la SNIM. En raster : <b>' + fr(on.size) + ' cellules</b> de ' + km + ' km. En vecteur : ' + fr(pts) + ' points, justes à toute échelle. © contributeurs OpenStreetMap.';
      };
      b.querySelector('#v-c').addEventListener('input', draw); b.querySelector('[data-vec]').addEventListener('change', draw); draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'Vous cartographiez l’Adrar : le relief, et les limites des moughataas. Quel modèle pour chacun ?',
        options: [
          {t: 'Relief en raster, limites en vecteur', ok: true, why: 'L’altitude existe <b>partout</b> : une valeur par cellule. Une limite est un <b>objet</b> au tracé précis, qu’on veut joindre à une table. Le relief peut aussi devenir vecteur (courbes de niveau), et l’inverse existe : la conversion a un coût.'},
          {t: 'Tout en vecteur', why: 'Il faudrait décrire chaque variation d’altitude par des objets : on perd ce qui varie entre deux courbes.'},
          {t: 'Tout en raster', why: 'Une limite en pixels perd sa précision dès qu’on zoome, et ne se joint plus à une table.'}
        ]
      });
    }
  });

  steps.push({
    id: 'formats', kicker: 'Le jargon', title: 'Trois formats, un même contenu',
    lead: 'Vous les croiserez tous les trois au TD.',
    build(b) {
      b.innerHTML = '<div class="fmt-grid">' +
        '<div class="fmt"><h3>.shp</h3><p class="small"><b>Shapefile</b> : l’ancien standard, en plusieurs fichiers.</p><pre class="fmt-code">wilayas.shp  formes\nwilayas.shx  index\nwilayas.dbf  table\nwilayas.prj  projection\nwilayas.cpg  encodage</pre></div>' +
        '<div class="fmt"><h3>.geojson</h3><p class="small"><b>GeoJSON</b> : du texte, idéal pour le web.</p><pre class="fmt-code">{"type": "Feature",\n "geometry": {\n  "type": "Point",\n  "coordinates":\n    [-15.96, 18.09]},\n "properties":\n  {"nom": "Nouakchott"}}</pre></div>' +
        '<div class="fmt"><h3>.gpkg</h3><p class="small"><b>GeoPackage</b> : le standard moderne, une base SQLite dans un seul fichier, plusieurs couches possibles.</p><pre class="fmt-code">pays.gpkg\n ├ wilayas\n ├ routes\n └ villes</pre></div></div><div data-q></div>';
      question(b.querySelector('[data-q]'), {
        prompt: 'Un collègue vous envoie seulement <code>wilayas.shp</code>. Que se passe-t-il ?',
        options: [
          {t: 'Il manque des fichiers : la table et la projection n’y sont pas', ok: true, why: 'Les attributs sont dans le <code>.dbf</code>, la projection dans le <code>.prj</code>. Un shapefile s’envoie <b>toujours en entier</b>, souvent zippé. Autre limite : les noms de champs tiennent en 10 caractères.'},
          {t: 'Tout marche : le .shp contient tout', why: 'Il ne contient que les formes. Ouvrez le dossier d’un shapefile : plusieurs fichiers portent le même nom.'},
          {t: 'Il suffit de le renommer en .gpkg', why: 'Changer l’extension ne convertit rien. Il faut exporter la couche.'}
        ]
      });
    }
  });

  /* ======================= Partie 3 · Aplatir la Terre ======================= */

  // « Correct the Map » : le Groenland et l'Afrique, de Mercator à Equal Earth.
  const AFRIQUE = new Set('DZA AGO BEN BWA BFA BDI CMR CAF TCD COG COD CIV DJI EGY GNQ ERI ETH GAB GMB GHA GIN GNB KEN LSO LBR LBY MDG MWI MLI MRT MAR MOZ NAM NER NGA RWA SEN SLE SOM ZAF SSD SDN SWZ TZA TGO TUN UGA ESH ZMB ZWE'.split(' '));
  const enAfrique = c => AFRIQUE.has(c.a3) || c.n === 'Somaliland';
  steps.push({
    id: 'corriger', kicker: 'Actualité', title: 'L’ONU a voté sur une carte',
    lead: 'Une projection de 1569 a fini à l’Assemblée générale des Nations unies. Pourquoi ?',
    build(b) {
      const ww = K.narrow() ? 400 : 680, hh = K.narrow() ? 330 : 470;
      const fm = fitProj(PROJ.merc, ww, hh, [-Math.PI, Math.PI, -mercY(84), -mercY(-58)]), fe = fitProj(PROJ.earth, ww, hh, [-2.74, 2.74, -1.36, 1.36]);
      const groupes = [NOANT.filter(c => !enAfrique(c) && c.a3 !== 'GRL'), NOANT.filter(enAfrique), NOANT.filter(c => c.a3 === 'GRL')];
      const COL = ['#e4e6ea', ACC, BLUE];
      const paths = t => groupes.map(cs => worldPath(cs, p => { const a = fm(p), z = fe(p); return [a[0] + (z[0] - a[0]) * t, a[1] + (z[1] - a[1]) * t]; }));
      let cur = -1, anim = 0, pe = null, chart = null;
      const paint = t => { const d = paths(t); pe.forEach((n, i) => n.setAttribute('d', d[i])); };
      const go = to => {
        if (cur === to) return;
        const from = cur < 0 ? to : cur, t0 = performance.now(); cur = to; cancelAnimationFrame(anim);
        const tick = now => { const u = Math.min(1, (now - t0) / 1100), e = u * u * (3 - 2 * u); paint(from + (to - from) * e); if (u < 1) anim = requestAnimationFrame(tick); };
        anim = requestAnimationFrame(tick);
      };
      K.scrolly(b, {
        steps: [
          '<p>La carte du monde que vous avez vue toute votre vie. En mauve l’Afrique, en bleu le Groenland.</p>' + ask('Lequel est le plus grand ? De combien ?'),
          '<p>Sur cette carte, presque à égalité. En réalité, l’Afrique fait environ <b>30 millions de km²</b> et le Groenland <b>2,2 millions</b>.</p><p><mark>L’Afrique est environ 14 fois plus grande.</mark></p>',
          '<p><b>4 septembre 2026.</b> L’Assemblée générale de l’ONU adopte la résolution « Correct the Map », portée par le Togo au nom du Groupe africain.</p><p class="vote"><b>164</b> pour · <b>1</b> contre · <b>6</b> abstentions</p><p class="small">Non contraignante : elle encourage à passer de Mercator à des projections comme Equal Earth.</p>',
          '<p>La même Terre, les mêmes pays, en <b>Equal Earth</b>. L’Afrique reprend sa place, le Groenland fond.</p>' + ask('Qu’est-ce qui est plus juste ? Qu’est-ce qui l’est moins ?'),
          '<p>Une carte n’est donc pas neutre : <b>choisir une projection, c’est déjà raconter quelque chose</b>. Voyons pourquoi aucune n’est parfaite.</p>'
        ],
        render(el, i) {
          if (chart !== el) { el.innerHTML = svg(ww, hh, COL.map(c => '<path fill="' + c + '" stroke="#fff" stroke-width=".4"></path>').join('')); pe = [...el.querySelectorAll('path')]; chart = el; cur = -1; }
          go(i >= 3 ? 1 : 0);
          if (cur < 0) paint(0);
        }
      });
      const h = document.createElement('div'); b.appendChild(h);
      b.insertBefore(Object.assign(document.createElement('p'), {className: 'viz-caption', innerHTML: 'Résolution : <a href="https://www.npr.org/2026/09/04/nx-s1-5958611/africa-world-map-un-vote" target="_blank" rel="noopener">NPR</a>, <a href="https://www.speakupafrica.org/?p=16033" target="_blank" rel="noopener">Speak Up Africa</a>. Contours : Natural Earth.'}), h);
      question(h, {
        prompt: 'Google Maps et les cartes web utilisent une variante de Mercator. Après ce vote, doivent-elles changer ?',
        options: [
          {t: 'Non : le texte encourage sans obliger, et Mercator garde un vrai usage', ok: true, why: 'Mercator conserve les <b>angles et les formes locales</b> : parfait pour naviguer ou zoomer dans une rue. Le problème est de s’en servir pour <b>comparer des surfaces</b> : à l’école, dans la presse, dans une carte du monde.'},
          {t: 'Oui : la résolution les y oblige', why: 'Elle est non contraignante : elle encourage gouvernements, écoles, médias et entreprises, sans interdire.'},
          {t: 'Non : le vote ne concerne que l’Afrique', why: 'Il concerne la carte du monde, toutes régions comprises.'}
        ]
      });
    }
  });

  // Pelure : du globe aux fuseaux.
  steps.push({
    id: 'pelure', kicker: 'Projections', title: 'Le paradoxe de la pelure',
    lead: 'Essayez d’aplatir une peau d’orange. Ici, les pays ne bougent pas : on découpe seulement la Terre en fuseaux.',
    build(b) {
      const ww = K.narrow() ? 400 : 680, hh = K.narrow() ? 240 : 360;
      const LOBES = [0, 1, 2, 3, 4, 6, 8, 12];
      b.innerHTML = '<figure class="qshot cm-fig cm-fig-s"><img src="assets/cm3/peau-orange.webp" alt="Une peau d’orange se fend quand on l’aplatit ; une carte du monde interrompue, découpée en fuseaux, fait de même."><figcaption>Une peau d’orange se fend quand on l’aplatit. La carte du monde aussi.</figcaption></figure><div class="viz main"><div class="row" style="gap:12px"><label class="small" for="p-n">Découpage</label><input id="p-n" type="range" min="0" max="7" value="0" style="flex:1;accent-color:' + ACC + '"><b class="small" data-n></b></div><div data-chart></div><div class="viz-caption">Contours : Natural Earth (domaine public).</div></div><div data-q></div>';
      const draw = () => {
        const n = LOBES[+b.querySelector('#p-n').value]; let inner = '';
        b.querySelector('[data-n]').textContent = n === 0 ? 'Le globe' : n === 1 ? 'Une seule pièce' : n + ' fuseaux';
        if (n === 0) {
          const r = hh / 2 - 6, l0 = 0, f0 = 15 * RAD;
          const o = p => { const l = (p[0] - l0) * RAD, ph = p[1] * RAD, x = Math.cos(ph) * Math.sin(l), y = Math.cos(f0) * Math.sin(ph) - Math.sin(f0) * Math.cos(ph) * Math.cos(l), c = Math.sin(f0) * Math.sin(ph) + Math.cos(f0) * Math.cos(ph) * Math.cos(l); const k = c < 0 ? 1 / Math.hypot(x, y) : 1; return [ww / 2 + r * x * k, hh / 2 - r * y * k]; };
          inner = '<circle cx="' + ww / 2 + '" cy="' + hh / 2 + '" r="' + r + '" fill="#eef2f6" stroke="' + GREY2 + '"/><path d="' + worldPath(WORLD, o) + '" fill="' + SAND + '" stroke="#b9b2a0" stroke-width=".5"/>';
        } else {
          const lat = [], R = (ww - 12) / (2 * Math.PI), s = Math.min(R, (hh - 8) / Math.PI), w = 2 * Math.PI / n, x0 = ww / 2 - Math.PI * s;
          for (let a = -90; a <= 90; a += 6) lat.push(a);
          for (let i = 0; i < n; i++) {
            const c = -Math.PI + (i + .5) * w, cx = ww / 2 - Math.PI * s + (i + .5) * w * s;
            const f = p => [cx + (p[0] * RAD - c) * Math.cos(p[1] * RAD) * s, hh / 2 - p[1] * RAD * s];
            const shape = lat.map(a => [cx + w / 2 * Math.cos(a * RAD) * s, hh / 2 - a * RAD * s]).concat(lat.slice().reverse().map(a => [cx - w / 2 * Math.cos(a * RAD) * s, hh / 2 - a * RAD * s]));
            const d = 'M' + shape.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
            inner += '<clipPath id="lobe' + i + '"><path d="' + d + '"/></clipPath><path d="' + d + '" fill="#eef2f6" stroke="' + GREY2 + '" stroke-width=".6"/><g clip-path="url(#lobe' + i + ')"><path d="' + worldPath(WORLD, f) + '" fill="' + SAND + '" stroke="#b9b2a0" stroke-width=".35"/></g>';
          }
          void x0;
        }
        b.querySelector('[data-chart]').innerHTML = svg(ww, hh, inner);
      };
      b.querySelector('#p-n').addEventListener('input', draw); draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'À 12 fuseaux, les formes sont presque justes. Pourquoi n’utilise-t-on pas cette carte ?',
        options: [
          {t: 'Parce qu’elle déchire : on évite de déformer en découpant', ok: true, why: 'On ne peut pas aplatir une sphère sans <b>déchirer ou déformer</b>. <mark>Toute projection est un compromis.</mark> Toute carte est un mensonge géométrique nécessaire.'},
          {t: 'Parce qu’elle est fausse en surface', why: 'Elle est au contraire très bonne en surface et en forme. Mais les océans et les continents sont coupés.'},
          {t: 'Parce que les ordinateurs ne savent pas la calculer', why: 'Elle se calcule en deux lignes : vous venez de la voir.'}
        ]
      });
    }
  });

  // Coordonnées : le piège des colonnes.
  steps.push({
    id: 'coordonnees', kicker: 'Coordonnées', title: 'Pourquoi Nouakchott est-elle en Angola ?',
    lead: 'Un fichier de points s’ouvre : Nouakchott n’est pas à sa place. Essayez les erreurs les plus fréquentes.',
    build(b) {
      const ww = K.narrow() ? 400 : 680, hh = K.narrow() ? 210 : 340;
      const f = fitProj(PROJ.plate, ww, hh, [-Math.PI, Math.PI, -85 * RAD, 85 * RAD]);
      const ERR = [['ok', 'lon = −15,96 ; lat = 18,09', [-15.96, 18.09]], ['sign', 'signe oublié : lon = 15,96', [15.96, 18.09]], ['swap', 'colonnes inversées : lon = 18,09 ; lat = −15,96', [18.09, -15.96]], ['both', 'inversées et signe changé : lon = −18,09 ; lat = −15,96', [-18.09, -15.96]]];
      b.innerHTML = chips(ERR.map(e => [e[0], e[1]]), 'swap') + '<div class="viz main"><div data-chart></div><div class="viz-caption" data-cap></div></div><div data-q></div>' +
        '<aside class="info-box"><h3>Le dictionnaire spatial</h3><p>La Terre n’est pas une sphère : elle est aplatie aux pôles (21 km d’écart de rayon). Un <b>datum</b> fixe ce modèle ; <b>WGS 84</b> est celui du GPS. Un <b>SCR</b> (système de coordonnées de référence, <i>CRS</i>) dit comment lire les nombres. Chacun a un code <b>EPSG</b>.</p>' +
        '<table class="data"><thead><tr><th>Code</th><th>Nom</th><th>Unité</th><th>Usage</th></tr></thead><tbody><tr><td>EPSG:4326</td><td>WGS 84</td><td>degrés</td><td>GPS, échange de données</td></tr><tr><td>EPSG:3857</td><td>Web Mercator</td><td>« mètres » déformés</td><td>Fonds de carte web, comme OpenStreetMap</td></tr><tr><td>EPSG:32628</td><td>UTM zone 28N</td><td>mètres</td><td>Mesures en Mauritanie (zone 29N à l’est)</td></tr><tr><td>EPSG:2154</td><td>Lambert 93</td><td>mètres</td><td>Standard officiel en France</td></tr></tbody></table></aside>';
      const draw = k => {
        const e = ERR.find(x => x[0] === k), q = f(e[2]), hit = WORLD.find(c => c.rings.some(r => inPoly(e[2], r)));
        b.querySelector('[data-chart]').innerHTML = svg(ww, hh, '<rect width="' + ww + '" height="' + hh + '" fill="#eef2f6"/><path d="' + worldPath(WORLD, f) + '" fill="' + SAND + '" stroke="#b9b2a0" stroke-width=".4"/><circle cx="' + q[0] + '" cy="' + q[1] + '" r="9" fill="' + (k === 'ok' ? GOOD : BAD) + '" stroke="#fff" stroke-width="2.5"/>');
        const names = {MRT: 'en Mauritanie', TCD: 'au Tchad', NER: 'au Niger', AGO: 'en Angola', NAM: 'en Namibie'};
        b.querySelector('[data-cap]').innerHTML = 'Le point tombe <b>' + (hit ? (names[hit.a3] || 'dans ' + hit.n) : 'dans l’Atlantique') + '</b>. Contours : Natural Earth.';
      };
      wire(b, draw); draw('swap');
      question(b.querySelector('[data-q]'), {
        prompt: 'Vos points tombent loin, mais toujours avec la même forme de nuage. Que vérifiez-vous d’abord ?',
        options: [
          {t: 'L’ordre et le signe de la longitude et de la latitude, puis le SCR', ok: true, why: 'Longitude = x, latitude = y. En Mauritanie, la longitude est <b>négative</b> (à l’ouest de Greenwich). Et les chiffres seuls ne suffisent pas : il faut le SCR pour savoir s’il s’agit de degrés ou de mètres.'},
          {t: 'La couleur des points', why: 'La couleur ne change pas la position.'},
          {t: 'La version de QGIS', why: 'Cette erreur vient presque toujours des données ou du SCR déclaré.'}
        ]
      });
    }
  });

  // Mercator : la vraie taille.
  steps.push({
    id: 'mercator', kicker: 'Déformation', title: 'La vraie taille de la Mauritanie',
    lead: 'Mercator conserve les angles : parfait pour naviguer. Mais il gonfle ce qui s’éloigne de l’équateur. Faites remonter le pays vers le nord.',
    build(b) {
      const ww = K.narrow() ? 400 : 680, hh = K.narrow() ? 330 : 470;
      const mb = [-Math.PI, Math.PI, -mercY(82), -mercY(-58)], eb = [-2.74, 2.74, -1.36, 1.36];
      const mrt = worldBy('MRT').rings, grl = worldBy('GRL').rings, lat0 = 20;
      const moved = a => { const lam0 = -10.5 * RAD, ang = a * RAD; return r => r.map(p => { const l = p[0] * RAD - lam0, ph = p[1] * RAD; const x = Math.cos(ph) * Math.cos(l), y = Math.cos(ph) * Math.sin(l), z = Math.sin(ph); const x2 = x * Math.cos(ang) - z * Math.sin(ang), z2 = x * Math.sin(ang) + z * Math.cos(ang); return [(Math.atan2(y, x2) + lam0) / RAD, Math.asin(Math.max(-1, Math.min(1, z2))) / RAD]; }); };
      let mode = 'merc';
      b.innerHTML = '<div class="row" style="gap:10px;flex-wrap:wrap">' + chips([['merc', 'Mercator'], ['earth', 'Aires égales (Equal Earth)']], 'merc') + '</div>' +
        '<div class="viz main"><div class="row" style="gap:12px"><label class="small" for="m-lat">Latitude de la silhouette</label><input id="m-lat" type="range" min="0" max="52" value="0" style="flex:1;accent-color:' + ACC + '"><b class="small" data-lat></b></div><div data-chart></div><div class="viz-caption" data-cap></div></div><div data-q></div>';
      const draw = () => {
        const a = +b.querySelector('#m-lat').value, pr = PROJ[mode], f = fitProj(pr, ww, hh, mode === 'merc' ? mb : eb);
        const shifted = mrt.map(moved(a));
        const ratio = areaOf(shifted, f) / areaOf(mrt, f);
        b.querySelector('[data-lat]').textContent = fr(lat0 + a) + '° N';
        b.querySelector('[data-chart]').innerHTML = svg(ww, hh, '<path d="' + worldPath(NOANT, f) + '" fill="#e9ebef" stroke="#fff" stroke-width=".4"/><path d="' + dOf(grl, f) + '" fill="' + BLUE + '" fill-opacity=".55"/><path d="' + dOf(mrt, f) + '" fill="' + ACC + '" fill-opacity=".35"/>' +
          '<path d="' + dOf(shifted, f) + '" fill="' + ACC + '" stroke="#fff" stroke-width="1"/>');
        b.querySelector('[data-cap]').innerHTML = 'Mauve : la Mauritanie, même territoire. ' + (ratio < 1.05 ? 'Sa surface <b>ne change pas</b> : seule sa forme se déforme.' : 'Elle paraît <b>' + fr(ratio, 1) + ' fois</b> plus grande qu’à sa place.') + ' Bleu : le Groenland. Contours : Natural Earth.';
      };
      wire(b, k => { mode = k; draw(); });
      b.querySelector('#m-lat').addEventListener('input', draw); draw();
      const f = fitProj(PROJ.merc, ww, hh, mb), r = areaOf(grl.map(x => x.map(p => [p[0], Math.min(p[1], 82)])), f) / areaOf(mrt, f);
      question(b.querySelector('[data-q]'), {
        prompt: 'En Mercator, le Groenland paraît environ ' + fr(Math.round(r)) + ' fois plus grand que la Mauritanie. Et en réalité ?',
        options: [
          {t: 'Environ 2 fois', ok: true, why: '2,17 millions de km² contre 1,03 million. Passez en aires égales pour le voir. La Mauritanie, c’est à peu près <b>la France et l’Espagne réunies</b>. Sur une carte web, en Web Mercator, elle paraît pourtant bien plus petite qu’elles.'},
          {t: 'Environ 5 fois', why: 'Moins que cela. Passez la carte en aires égales.'},
          {t: 'Autant que sur la carte', why: 'Justement non : Mercator multiplie les surfaces quand on s’éloigne de l’équateur.'}
        ]
      });
    }
  });

  // Tissot : choisir, c'est renoncer.
  steps.push({
    id: 'projections', kicker: 'Déformation', title: 'Choisir, c’est renoncer',
    lead: 'Sur le globe, ces cercles sont tous identiques : 1 000 km de diamètre. Observez ce que chaque projection en fait.',
    build(b) {
      const ww = K.narrow() ? 400 : 680, hh = K.narrow() ? 280 : 400;
      const P4 = {merc: ['Mercator', [-Math.PI, Math.PI, -mercY(80), -mercY(-70)], 'Conserve les <b>angles</b> et les formes locales. Surfaces fausses.'], earth: ['Equal Earth', [-2.74, 2.74, -1.36, 1.36], 'Conserve les <b>surfaces</b>. Formes déformées sur les bords.'], azi: ['Azimutale équidistante (Nouakchott)', [-Math.PI, Math.PI, -Math.PI, Math.PI], 'Conserve les <b>distances depuis un point</b>, ici Nouakchott. Le reste se déforme.'], plate: ['Plate carrée', [-Math.PI, Math.PI, -Math.PI / 2, Math.PI / 2], 'Simple : degrés = x et y. Rien de conservé, sauf les méridiens. Souvent le défaut des logiciels en EPSG:4326.']};
      const circle = (lon, lat, km = 500) => { const out = [], d = km / 6371, f1 = lat * RAD, l1 = lon * RAD; for (let t = 0; t < 360; t += 15) { const a = t * RAD, f2 = Math.asin(Math.sin(f1) * Math.cos(d) + Math.cos(f1) * Math.sin(d) * Math.cos(a)), l2 = l1 + Math.atan2(Math.sin(a) * Math.sin(d) * Math.cos(f1), Math.cos(d) - Math.sin(f1) * Math.sin(f2)); out.push([l2 / RAD, f2 / RAD]); } return out; };
      const CIRC = []; for (let la = -60; la <= 75; la += 30 ) for (let lo = -160; lo <= 160; lo += 40) CIRC.push(circle(lo, la));
      b.innerHTML = chips(Object.entries(P4).map(([k, v]) => [k, v[0]]), 'merc') + '<div class="viz main"><div data-chart></div><div class="viz-caption" data-cap></div></div><div data-q></div>';
      const draw = k => {
        const f = fitProj(PROJ[k], ww, hh, P4[k][1]);
        const cs = k === 'azi' ? NOANT.filter(c => !['RUS', 'FJI', 'NZL', 'CAN', 'USA', 'AUS', 'IDN', 'PNG', 'JPN', 'PHL'].includes(c.a3) || true) : NOANT;
        const safe = c => c.rings.filter(r => { if (k !== 'azi') return true; const pts = r.map(f); return pts.every((q, i) => Math.hypot(q[0] - pts[(i + 1) % pts.length][0], q[1] - pts[(i + 1) % pts.length][1]) < ww / 5); });
        const land = cs.map(c => dOf(safe(c), f)).join('');
        b.querySelector('[data-chart]').innerHTML = svg(ww, hh, (k === 'azi' ? '<circle cx="' + ww / 2 + '" cy="' + hh / 2 + '" r="' + hh / 2 + '" fill="#eef2f6"/>' : '') + '<path d="' + land + '" fill="' + SAND + '" stroke="#b9b2a0" stroke-width=".4"/>' +
          CIRC.map(c => '<path d="' + ring(c, f) + '" fill="' + ACC + '" fill-opacity=".35" stroke="' + ACC + '" stroke-width=".8"/>').join(''));
        b.querySelector('[data-cap]').innerHTML = P4[k][2] + ' Contours : Natural Earth.';
      };
      wire(b, draw); draw('merc');
      question(b.querySelector('[data-q]'), {
        prompt: 'Vous coloriez les pays du monde selon leur densité de population. Quelle projection prenez-vous ?',
        options: [
          {t: 'Une projection à aires égales', ok: true, why: 'En aplats, l’œil lit la surface. Une projection à aires égales évite de donner à la Russie et au Canada un poids inventé. Pour <b>mesurer</b> en Mauritanie : UTM, en mètres. Pour un fond web : Web Mercator. <mark>Le choix de la projection fait partie du message.</mark>'},
          {t: 'Mercator, tout le monde la connaît', why: 'Elle gonfle le Nord : le lecteur verrait surtout les pays du Nord.'},
          {t: 'L’azimutale centrée sur Nouakchott', why: 'Idéale pour les distances depuis Nouakchott, pas pour comparer des surfaces.'}
        ]
      });
    }
  });

  /* ======================= Partie 4 · Composer la carte ======================= */

  const popCol = v => { const t = Math.min(1, Math.log10(v + 1) / 5.2), a = [245, 233, 200], d = [122, 44, 110], m = (x, y) => Math.round(x + (y - x) * t * t); return 'rgb(' + m(a[0], d[0]) + ',' + m(a[1], d[1]) + ',' + m(a[2], d[2]) + ')'; };
  steps.push({
    id: 'couches', kicker: 'Couches', title: 'L’empilement des arguments',
    lead: 'Un SIG empile des couches : un fond, un thème, des annotations. Comme dans QGIS, celle du haut se dessine par-dessus. Ici, tout a disparu. Réparez la carte.',
    build(b) {
      const [ww, hh] = SIZE(), f = mapF(ww, hh), nk = f([-15.96, 18.09]);
      const cell = (k => { const a = f([0, 0]), c = f([.2, .2]); return [Math.abs(c[0] - a[0]) + .4, Math.abs(c[1] - a[1]) + .4]; })();
      const LY = {
        fond: {t: 'Fond : le pays en aplat', d: () => country(f, SAND, SAND, 1)},
        pop: {t: 'Thème : population', d: () => D.grid.map(g => { const q = f([g[0], g[1]]); return '<rect x="' + (q[0] - cell[0] / 2).toFixed(1) + '" y="' + (q[1] - cell[1] / 2).toFixed(1) + '" width="' + cell[0].toFixed(1) + '" height="' + cell[1].toFixed(1) + '" fill="' + popCol(g[2]) + '"/>'; }).join('')},
        lim: {t: 'Contexte : limites des wilayas', d: () => country(f, 'none', '#6b7280', .7)},
        ann: {t: 'Annotation : Nouakchott', d: () => '<circle cx="' + nk[0] + '" cy="' + nk[1] + '" r="16" fill="none" stroke="' + BAD + '" stroke-width="2.5"/><text x="' + (nk[0] + 22) + '" y="' + (nk[1] + 5) + '" font-weight="700" fill="' + BAD + '" style="' + halo + '">Nouakchott : 30 % des habitants</text>'}
      };
      let order = ['fond', 'lim', 'ann', 'pop'], on = {fond: true, pop: true, lim: true, ann: true};
      b.innerHTML = '<div class="layers-wrap"><div class="layers-panel"><p class="small"><b>Couches</b> (haut = devant)</p><ol data-list></ol><p class="small" data-msg></p></div><div class="viz main"><div data-chart></div><div class="viz-caption">Population : Kontur 2023 (CC BY), grille de 0,2°. Limites : ANSADE / OCHA.</div></div></div>';
      const draw = () => {
        b.querySelector('[data-list]').innerHTML = order.map((k, i) => '<li><label><input type="checkbox" data-c="' + k + '"' + (on[k] ? ' checked' : '') + '> ' + LY[k].t + '</label><span><button type="button" class="chip" data-u="' + i + '" aria-label="Monter"' + (i ? '' : ' disabled') + '>↑</button> <button type="button" class="chip" data-d="' + i + '" aria-label="Descendre"' + (i < order.length - 1 ? '' : ' disabled') + '>↓</button></span></li>').join('');
        b.querySelector('[data-chart]').innerHTML = svgMap(ww, hh, order.slice().reverse().filter(k => on[k]).map(k => LY[k].d()).join(''));
        b.querySelectorAll('[data-u]').forEach(x => x.addEventListener('click', () => { const i = +x.dataset.u; [order[i - 1], order[i]] = [order[i], order[i - 1]]; draw(); }));
        b.querySelectorAll('[data-d]').forEach(x => x.addEventListener('click', () => { const i = +x.dataset.d; [order[i + 1], order[i]] = [order[i], order[i + 1]]; draw(); }));
        b.querySelectorAll('[data-c]').forEach(x => x.addEventListener('change', () => { on[x.dataset.c] = x.checked; draw(); }));
        const good = order.indexOf('ann') === 0 && order.indexOf('fond') === 3 && order.indexOf('pop') === 2;
        const m = b.querySelector('[data-msg]');
        if (order.join() === 'ann,lim,pop,fond') { m.innerHTML = '<b style="color:' + GOOD + '">✓ De bas en haut : le fond, le thème, le contexte, le guidage.</b> Chaque couche sert un argument.'; K.confetti(b.querySelector('.layers-panel')); }
        else m.textContent = order[0] === 'fond' ? 'Le fond opaque est devant : il cache tout. Faites-le descendre.' : good ? 'Presque : et les limites, au-dessus ou au-dessous de la population ?' : 'Que doit-on voir en premier ?';
      };
      draw();
    }
  });

  // Hiérarchie : d'une carte « tout à la fois » à une carte qui parle.
  steps.push({
    id: 'hierarchie', kicker: 'Composer', title: 'Focus, contexte, voix',
    lead: 'Le lecteur ne doit pas chercher l’information : c’est à vous de la lui imposer.',
    build(b) {
      const [ww, hh] = SIZE(), f = mapF(ww, hh);
      const south = D.grid.filter(g => g[1] < 18.6).reduce((a, g) => a + g[2], 0), total = D.grid.reduce((a, g) => a + g[2], 0), pct = Math.round(100 * south / total);
      const cell = (() => { const a = f([0, 0]), c = f([.2, .2]); return [Math.abs(c[0] - a[0]) + .4, Math.abs(c[1] - a[1]) + .4]; })();
      const rects = col => D.grid.map(g => { const q = f([g[0], g[1]]); return '<rect x="' + (q[0] - cell[0] / 2).toFixed(1) + '" y="' + (q[1] - cell[1] / 2).toFixed(1) + '" width="' + cell[0].toFixed(1) + '" height="' + cell[1].toFixed(1) + '" fill="' + col(g) + '"/>'; }).join('');
      const y1 = f([-10, 18.6])[1], x1 = f([-17, 18.6])[0], x2 = f([-5, 18.6])[0];
      K.scrolly(b, {
        steps: [
          '<p>Une carte faite pour l’exemple.</p>' + ask('Qu’est-ce qui cloche ? Quelle est son histoire ?'),
          '<p>Rien ne ressort, et il n’y a pas d’histoire : un fond chargé, un rectangle de relief sans raison, une légende en noms de fichiers, pas de titre.</p>',
          '<p><b>1. Focus.</b> Une seule donnée, en couleurs vives : la population.</p>',
          '<p><b>2. Contexte.</b> Les limites, désaturées, fines. On les voit si on les cherche.</p>',
          '<p><b>3. Voix.</b> Un titre qui affirme, une ligne qui guide.</p>'
        ],
        render(el, i) {
          if (i < 2) { el.innerHTML = '<img src="assets/td3/a-ne-pas-faire.jpg" alt="Carte surchargée : fond OpenStreetMap, rectangle de relief, points rouges, légende en noms de fichiers" style="width:100%;border:1px solid #d9dce2;border-radius:8px"><p class="viz-caption">Fond : © contributeurs OpenStreetMap.</p>'; return; }
          const ctx = i >= 3 ? country(f, 'none', '#c3c7cf', .6) : '';
          const voice = i >= 4 ? '<line x1="' + x1 + '" x2="' + x2 + '" y1="' + y1 + '" y2="' + y1 + '" stroke="' + INK + '" stroke-dasharray="4 4"/><text x="' + (x2 - 4) + '" y="' + (y1 - 8) + '" text-anchor="end" font-size="14" fill="' + INK + '" style="' + halo + '">au sud de cette ligne : ' + pct + ' % des habitants</text>' +
            '<text x="10" y="26" font-weight="700" font-size="' + (K.narrow() ? 17 : 22) + '" fill="' + INK + '">La Mauritanie vit au sud</text>' : '';
          el.innerHTML = svgMap(ww, hh, rects(g => popCol(g[2])) + ctx + voice) + '<p class="viz-caption">Population : Kontur 2023 (CC BY). Limites : ANSADE / OCHA.</p>';
        }
      });
    }
  });

  // Bertin.
  const ZONE = {'Tiris Zemmour': 'Nord', 'Dakhlet Nouadhibou': 'Nord', Adrar: 'Nord', Inchiri: 'Nord', 'Nouakchott Nord': 'Nouakchott', 'Nouakchott Ouest': 'Nouakchott', 'Nouakchott Sud': 'Nouakchott', Trarza: 'Fleuve', Brakna: 'Fleuve', Gorgol: 'Fleuve', Guidimagha: 'Fleuve', Tagant: 'Est', Assaba: 'Est', 'Hodh El Gharbi': 'Est', 'Hodh Chargui': 'Est'};
  const ZCOL = {Nord: '#c9a227', Nouakchott: ACC, Fleuve: '#3f8f7d', Est: '#c8693f'};
  const VALS = t => { const a = 9.8, z = 22.4, r = (t - a) / (z - a), m = (x, y) => Math.round(x + (y - x) * r); return 'rgb(' + m(240, 80) + ',' + m(228, 38) + ',' + m(241, 84) + ')'; };
  steps.push({
    id: 'bertin', kicker: 'Bertin', title: 'L’alphabet du cartographe',
    lead: 'Jacques Bertin (1967) : un petit nombre de variables visuelles, chacune bonne pour un type de donnée. Passez de l’une à l’autre.',
    build(b) {
      const [ww, hh] = K.narrow() ? [400, 420] : [520, 530], f = mapF(ww, hh);
      const V = {
        taille: ['Taille', 'Nombre de candidats → <b>taille</b> : idéale pour les <b>quantités</b>.', () => country(f, '#eceef2') + W.slice().sort((a, c) => c.cand - a.cand).map(w => { const q = f(w.c); return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (Math.sqrt(w.cand / 12008) * 34).toFixed(1) + '" fill="' + ACC + '" fill-opacity=".7" stroke="#fff"/>'; }).join('')],
        valeur: ['Valeur', 'Taux d’admission → <b>valeur</b>, du clair au foncé : idéale pour une <b>intensité</b>, un ordre.', () => country(f, w => VALS(w.taux))],
        teinte: ['Teinte', 'Grande zone → <b>teinte</b> : idéale pour une <b>catégorie</b>, sans ordre.', () => country(f, w => ZCOL[ZONE[w.n]])],
        orient: ['Orientation', 'Grande zone → <b>orientation</b> : elle distingue des catégories, mais se lit mal.', () => '<defs>' + Object.keys(ZCOL).map((z, i) => '<pattern id="or' + i + '" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(' + [0, 45, 90, 135][i] + ')"><line x1="0" y1="0" x2="0" y2="9" stroke="' + INK + '" stroke-width="2"/></pattern>').join('') + '</defs>' + country(f, w => 'url(#or' + Object.keys(ZCOL).indexOf(ZONE[w.n]) + ')', INK, 1)],
        grain: ['Grain', 'Taux → <b>grain</b> : plus les motifs sont denses, plus la valeur est forte. Utile en noir et blanc.', () => '<defs>' + [10, 7, 5, 3.5].map((s, i) => '<pattern id="gr' + i + '" width="' + s + '" height="' + s + '" patternUnits="userSpaceOnUse"><circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="1.1" fill="' + INK + '"/></pattern>').join('') + '</defs>' + country(f, w => 'url(#gr' + Math.min(3, Math.floor((w.taux - 9.8) / 3.2)) + ')', INK, 1)]
      };
      b.innerHTML = chips(Object.entries(V).map(([k, v]) => [k, v[0]]), 'taille') + '<div class="viz main"><div data-chart></div><div class="viz-caption" data-cap></div></div><div data-q></div>';
      const draw = k => { b.querySelector('[data-chart]').innerHTML = svgMap(ww, hh, V[k][2]()); b.querySelector('[data-cap]').innerHTML = V[k][1]; };
      wire(b, draw); draw('taille');
      question(b.querySelector('[data-q]'), {
        prompt: 'Pour montrer le taux d’admission par wilaya, une palette arc-en-ciel (rouge, jaune, vert, bleu) serait-elle une bonne idée ?',
        options: [
          {t: 'Non : un taux a un ordre, la teinte n’en a pas', ok: true, why: 'Le jaune n’est ni « plus » ni « moins » que le bleu. Pour un ordre : la <b>valeur</b>, une seule teinte du clair au foncé.'},
          {t: 'Oui : plus de couleurs, plus de nuances', why: 'Le lecteur devrait consulter la légende pour chaque wilaya. Il ne voit plus d’un coup d’œil qui est au-dessus.'},
          {t: 'Oui, si la légende est grande', why: 'Une grande légende ne rend pas l’ordre visible sur la carte.'}
        ]
      });
    }
  });

  // Choroplèthe : le même chiffre, trois cartes.
  function breaksOf(vals, n, mode) {
    const s = vals.slice().sort((a, c) => a - c), lo = s[0], hi = s[s.length - 1];
    if (mode === 'eq') return Array.from({length: n - 1}, (_, i) => lo + (hi - lo) * (i + 1) / n);
    if (mode === 'q') return Array.from({length: n - 1}, (_, i) => s[Math.ceil((i + 1) * s.length / n) - 1]);
    // Jenks : programmation dynamique, minimise la variance dans les classes.
    const m = s.length, c = Array.from({length: m + 1}, () => new Array(n + 1).fill(Infinity)), bk = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
    c[0][0] = 0;
    const cost = (i, j) => { let sm = 0, s2 = 0; for (let k = i; k < j; k++) { sm += s[k]; s2 += s[k] * s[k]; } return s2 - sm * sm / (j - i); };
    for (let j = 1; j <= m; j++) for (let k = 1; k <= n; k++) for (let i = k - 1; i < j; i++) { const v = c[i][k - 1] + cost(i, j); if (v < c[j][k]) { c[j][k] = v; bk[j][k] = i; } }
    const out = []; let j = m; for (let k = n; k > 1; k--) { j = bk[j][k]; out.unshift(s[j - 1]); }
    return out;
  }
  const shades = n => Array.from({length: n}, (_, i) => { const t = n === 1 ? 1 : i / (n - 1), m = (x, y) => Math.round(x + (y - x) * t); return 'rgb(' + m(240, 80) + ',' + m(228, 38) + ',' + m(241, 84) + ')'; });
  steps.push({
    id: 'choroplethe', kicker: 'Aplats', title: 'Mêmes chiffres, autre histoire',
    lead: 'Une carte en aplats (choroplèthe) range les valeurs en classes. Qui décide des classes ? Vous. Essayez.',
    build(b) {
      const [ww, hh] = K.narrow() ? [400, 420] : [500, 510], f = mapF(ww, hh);
      const MODES = [['eq', 'Intervalle égal'], ['q', 'Quantile'], ['j', 'Ruptures naturelles (Jenks)'], ['m', 'Le seuil du ministre']];
      const NAT = 100 * W.reduce((a, w) => a + w.adm, 0) / TOT.cand;
      let mode = 'eq';
      b.innerHTML = chips(MODES, 'eq') + '<div class="viz main"><div class="row" style="gap:12px;margin-top:6px" data-classes><label class="small" for="c-n">Classes</label><input id="c-n" type="range" min="2" max="7" value="5" style="flex:1;accent-color:' + ACC + '"><b class="small" data-nn></b></div>' +
        '<div class="row" style="gap:12px;margin-top:6px" data-seuil hidden><label class="small" for="c-s">« En difficulté » sous</label><input id="c-s" type="range" min="10" max="23" step=".5" value="17" style="flex:1;accent-color:' + BAD + '"><b class="small" data-ss></b></div><div data-chart></div><div class="viz-caption" data-cap></div></div><div data-q></div>';
      const legend = rows => rows.map(([c, t], i) => '<rect x="10" y="' + (14 + i * 22) + '" width="18" height="16" fill="' + c + '"/><text x="34" y="' + (27 + i * 22) + '" font-size="14" fill="' + INK + '">' + t + '</text>').join('');
      const draw = () => {
        const seuil = mode === 'm';
        b.querySelector('[data-classes]').hidden = seuil; b.querySelector('[data-seuil]').hidden = !seuil;
        if (seuil) {
          const s = +b.querySelector('#c-s').value, low = W.filter(w => w.taux < s);
          b.querySelector('[data-ss]').textContent = fr(s, 1) + ' %';
          b.querySelector('[data-chart]').innerHTML = svgMap(ww, hh, country(f, w => w.taux < s ? BAD : GREY) + legend([[BAD, 'moins de ' + fr(s, 1) + ' %'], [GREY, fr(s, 1) + ' % ou plus']]));
          b.querySelector('[data-cap]').innerHTML = '<b>' + low.length + ' wilaya' + (low.length > 1 ? 's' : '') + ' « en difficulté »</b>' + (low.length ? ' : ' + low.map(w => w.n).join(', ') : '') + '. Moyenne nationale : ' + fr(NAT, 1) + ' %. ' + SRC_BAC;
          return;
        }
        const n = +b.querySelector('#c-n').value; b.querySelector('[data-nn]').textContent = n;
        const vals = W.map(w => w.taux), br = breaksOf(vals, n, mode), col = shades(n);
        const cls = v => { let i = 0; while (i < br.length && v > br[i]) i++; return i; };
        const edges = [Math.min(...vals), ...br, Math.max(...vals)], counts = col.map((_, i) => W.filter(w => cls(w.taux) === i).length);
        const rows = col.map((c, i) => [c, (edges[i] === edges[i + 1] ? fr(edges[i], 1) : fr(edges[i], 1) + ' – ' + fr(edges[i + 1], 1)) + ' %']).reverse();
        b.querySelector('[data-chart]').innerHTML = svgMap(ww, hh, country(f, w => col[cls(w.taux)]) + legend(rows));
        b.querySelector('[data-cap]').innerHTML = 'Wilayas par classe, du clair au foncé : <b>' + counts.join(' · ') + '</b>. Taux d’admission. ' + SRC_BAC;
      };
      wire(b, k => { mode = k; draw(); });
      b.querySelector('#c-n').addEventListener('input', draw); b.querySelector('#c-s').addEventListener('input', draw); draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'Un ministre veut annoncer « seulement deux wilayas en difficulté ». Peut-il obtenir cette carte sans toucher aux chiffres ?',
        options: [
          {t: 'Oui : il suffit de choisir les seuils', ok: true, why: 'Comme l’axe d’un graphique, les seuils sont un choix éditorial. Annoncez la méthode, préférez des seuils qui ont un sens (la moyenne nationale, par exemple) et <b>colorez des taux, pas des nombres bruts</b> : sinon, l’aplat montre surtout la population.'},
          {t: 'Non : les données décident de la carte', why: 'Passez d’un mode à l’autre : les chiffres ne bougent pas, les classes si.'},
          {t: 'Seulement en changeant de projection', why: 'La projection ne change ni les valeurs ni les classes.'}
        ]
      });
    }
  });

  // Échelle.
  steps.push({
    id: 'echelle', kicker: 'Échelle', title: 'Grande échelle, petit territoire',
    lead: 'Une carte sur une feuille de 20 cm. Zoomez : les objets changent, et l’échelle aussi.',
    build(b) {
      const [ww, hh] = K.narrow() ? [400, 400] : [560, 520];
      const LV = [['pays', 'Le pays', D.bounds], ['reg', 'Le Sud-Ouest', [-17.2, 15.9, -13.9, 18.9]], ['ville', 'Nouakchott', [-16.15, 17.93, -15.75, 18.3]], ['quart', 'Un quartier', [-16.0, 18.07, -15.93, 18.14]]];
      b.innerHTML = chips(LV.map(l => [l[0], l[1]]), 'pays') + '<div class="viz main"><div data-chart style="overflow:hidden"></div><div class="viz-caption" data-cap></div></div><div data-q></div>';
      const draw = k => {
        const L = LV.find(x => x[0] === k), f = fitBox(L[2], ww, hh), km = f.kmPerPx, wKm = ww * km;
        const denom = Math.round(wKm * 1000 / .2), rd = Math.pow(10, Math.floor(Math.log10(denom))), den = Math.round(denom / rd * 2) / 2 * rd;
        const nice = [1, 2, 5, 10, 20, 50, 100, 200, 500].find(x => x / km > 70) || 500, barPx = nice / km;
        const moug = k !== 'pays' ? D.nkc.map(m => '<path d="' + dOf(m.rings, f) + '" fill="' + (k === 'reg' ? ACC : '#e8dcea') + '" stroke="' + ACC + '" stroke-width="' + (k === 'reg' ? .4 : 1.4) + '"/>').join('') : '';
        const labels = k === 'ville' ? D.nkc.map(m => { const r = m.rings[0], c = r.reduce((a, p) => [a[0] + p[0] / r.length, a[1] + p[1] / r.length], [0, 0]), q = f(c); return '<text x="' + q[0] + '" y="' + q[1] + '" text-anchor="middle" font-size="13" style="' + halo + '">' + esc(m.n) + '</text>'; }).join('') : '';
        const pts = k === 'ville' || k === 'quart' ? D.health.map(h => { const q = f(h); return '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (k === 'quart' ? 7 : 3.5) + '" fill="' + BAD + '" fill-opacity=".8" stroke="#fff" stroke-width=".6"/>'; }).join('') : '';
        const dot = k === 'pays' ? (() => { const q = f([-15.96, 18.09]); return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="5" fill="' + ACC + '"/><text x="' + (q[0] + 9) + '" y="' + (q[1] + 5) + '" font-weight="700" style="' + halo + '">Nouakchott</text>'; })() : '';
        b.querySelector('[data-chart]').innerHTML = svgMap(ww, hh, '<rect width="' + ww + '" height="' + hh + '" fill="#eef2f6"/>' + country(f, SAND, '#b9b2a0', 1) + moug + pts + dot + labels +
          '<rect x="12" y="' + (hh - 48) + '" width="' + (barPx + 54) + '" height="38" fill="#fff" fill-opacity=".85" rx="4"/><rect x="20" y="' + (hh - 22) + '" width="' + barPx + '" height="6" fill="' + INK + '"/><text x="20" y="' + (hh - 28) + '" font-size="13">' + fr(nice) + ' km</text>');
        b.querySelector('[data-cap]').innerHTML = 'Sur 20 cm, cette vue représente environ ' + fr(wKm < 10 ? wKm : Math.round(wKm)) + ' km : échelle d’environ <b>1:' + fr(den) + '</b>. Limites ANSADE / OCHA ; lieux de santé © contributeurs OpenStreetMap.';
      };
      wire(b, draw); draw('pays');
      question(b.querySelector('[data-q]'), {
        prompt: 'Laquelle est à la plus <b>grande</b> échelle : 1:50 000 ou 1:5 000 000 ?',
        options: [
          {t: '1:50 000 : une petite fraction, un petit territoire, beaucoup de détails', ok: true, why: '1/50 000 est plus grand que 1/5 000 000. <b>Grande échelle = petit territoire</b>, l’inverse du langage courant (« à grande échelle »). Préférez une <b>barre d’échelle</b> : elle reste juste si la carte est agrandie, pas le « 1:50 000 ».'},
          {t: '1:5 000 000 : elle couvre plus de territoire', why: 'C’est le piège : en cartographie, couvrir plus de territoire, c’est une petite échelle. Comparez les fractions.'},
          {t: 'Les deux, cela dépend de la feuille', why: 'L’échelle est justement le rapport entre la feuille et le terrain.'}
        ]
      });
    }
  });

  // Étiquettes.
  steps.push({
    id: 'etiquettes', kicker: 'Étiquettes', title: 'Nommer sans encombrer',
    lead: 'Mêmes villes, deux étiquetages. Lequel lisez-vous ?',
    build(b) {
      const [ww, hh] = K.narrow() ? [400, 420] : [540, 550], f = mapF(ww, hh);
      const base = country(f, SAND, '#cdc6b4', .8) + D.lines.rail.map(l => '<path d="' + line(l, f) + '" fill="none" stroke="#555" stroke-width="1.6" stroke-dasharray="4 3"/>').join('');
      const dots = CHEFS.map(c => { const q = f([c[1], c[2]]); return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (c[0] === 'Nouakchott' ? 5 : 3.5) + '" fill="' + INK + '"/>'; }).join('');
      const bad = CHEFS.map((c, i) => { const q = f([c[1], c[2]]); return '<text x="' + q[0] + '" y="' + (q[1] + 2) + '" text-anchor="middle" font-size="17" font-weight="700" fill="' + ['#c0392b', '#2471a3', '#1e8449'][i % 3] + '" transform="rotate(' + [0, -18, 14][i % 3] + ' ' + q[0] + ' ' + q[1] + ')">' + c[0].toUpperCase() + '</text>'; }).join('') +
        W.map(w => { const q = f(w.c); return '<text x="' + q[0] + '" y="' + q[1] + '" text-anchor="middle" font-size="15" fill="#c0392b">' + w.n.toUpperCase() + '</text>'; }).join('');
      const place = {Nouakchott: 'r', Rosso: 'r', Nouadhibou: 'r', Sélibaby: 'r', Kaédi: 'r'};
      const good = CHEFS.map(c => { const q = f([c[1], c[2]]), left = place[c[0]] === 'l'; return '<text x="' + (q[0] + (left ? -7 : 7)) + '" y="' + (q[1] - 4) + '" text-anchor="' + (left ? 'end' : 'start') + '" font-size="' + (c[0] === 'Nouakchott' ? 16 : 13) + '" font-weight="' + (c[0] === 'Nouakchott' ? 700 : 400) + '" fill="' + INK + '" style="' + halo + '">' + c[0] + '</text>'; }).join('');
      const zones = [['Tiris Zemmour', -9.9, 24.1], ['Hodh Chargui', -7.7, 18], ['Adrar', -11.2, 20.7]].map(([n, lon, lat]) => { const q = f([lon, lat]); return '<text x="' + q[0] + '" y="' + q[1] + '" text-anchor="middle" font-size="12" letter-spacing="3" fill="#8b8676">' + n.toUpperCase() + '</text>'; }).join('');
      b.innerHTML = chips([['bad', 'Carte A'], ['good', 'Carte B']], 'bad') + '<div class="viz main"><div data-chart></div><div class="viz-caption">Villes : positions approximatives. Limites : ANSADE / OCHA ; voie ferrée © contributeurs OpenStreetMap.</div></div>' +
        '<aside class="info-box"><h3>Trois règles</h3><p><b>Point</b> : en haut à droite du symbole, sans le toucher. <b>Ligne</b> : le long de l’objet, au-dessus. <b>Zone</b> : à l’intérieur, en majuscules espacées qui s’étirent avec la surface.</p><p>Une <b>hiérarchie</b> : la taille suit l’importance. Un <b>halo</b> pour se détacher du fond. Et on n’étiquette que ce qui sert l’histoire.</p></aside>';
      const draw = k => { b.querySelector('[data-chart]').innerHTML = svgMap(ww, hh, base + (k === 'good' ? zones + dots + good : dots + bad)); };
      wire(b, draw); draw('bad');
    }
  });

  /* ======================= Partie 5 · Les cartogrammes ======================= */

  // Dorling : retour à la carte du début.
  function dorling(items, iters = 500) {
    const pts = items.map(i => ({...i, x: i.x0, y: i.y0}));
    for (let t = 0; t < iters; t++) {
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], d = pts[j], dx = d.x - a.x || .01, dy = d.y - a.y || .01, L = Math.hypot(dx, dy), o = a.r + d.r + 2 - L;
        if (o > 0) { const ux = dx / L * o / 2, uy = dy / L * o / 2; a.x -= ux; a.y -= uy; d.x += ux; d.y += uy; }
      }
      pts.forEach(p => { p.x += (p.x0 - p.x) * .012; p.y += (p.y0 - p.y) * .012; });
    }
    return pts;
  }
  steps.push({
    id: 'dorling', kicker: 'Cartogrammes', title: 'Distordre pour mieux voir',
    lead: 'Si l’on parle de gens, pourquoi montrer des déserts vides ? Revoici la carte du début.',
    build(b) {
      const [ww, hh] = SIZE(), f = mapF(ww, hh);
      const R = K.narrow() ? 58 : 88;
      const pts = dorling(W.map(w => { const q = f(w.c); return {n: w.n, x0: q[0], y0: q[1], r: Math.sqrt(w.cand / 12008) * R, taux: w.taux, cand: w.cand}; }));
      const k = (() => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; pts.forEach(p => { x0 = Math.min(x0, p.x - p.r); x1 = Math.max(x1, p.x + p.r); y0 = Math.min(y0, p.y - p.r); y1 = Math.max(y1, p.y + p.r); }); const s = Math.min(1, (ww - 10) / (x1 - x0), (hh - 10) / (y1 - y0)); return {s, x: (ww - (x1 - x0) * s) / 2 - x0 * s, y: (hh - (y1 - y0) * s) / 2 - y0 * s}; })();
      let host = null;
      const shortName = n => n.replace('Nouakchott ', 'Nkc ').replace('Dakhlet Nouadhibou', 'Nouadhibou').replace('Hodh El Gharbi', 'H. Gharbi').replace('Hodh Chargui', 'H. Chargui').replace('Tiris Zemmour', 'T. Zemmour');
      K.scrolly(b, {
        steps: [
          '<p>La carte du début. Le lecteur voit un désert.</p>',
          '<p>Plaçons un cercle sur chaque wilaya, dont la <b>surface</b> suit le nombre de candidats. Les cercles de Nouakchott se chevauchent.</p>',
          '<p>Écartons-les juste ce qu’il faut. C’est un <b>cartogramme de Dorling</b> : plus de biais de surface, et les voisins restent à peu près voisins.</p>' + ask('Quelle histoire raconte maintenant la carte ?'),
          '<p>On ajoute une variable : la <b>couleur</b> donne le taux d’admission. On voit à la fois le poids et le résultat. Essayez de le lire sur la carte du début !</p>'
        ],
        render(el, i) {
          if (!host) {
            el.innerHTML = svgMap(ww, hh, '<g data-land>' + country(f, GREY) + '</g>' + pts.map((p, j) => '<g data-c="' + j + '" style="transition:transform .8s"><circle r="' + (p.r * k.s).toFixed(1) + '" style="transition:fill .6s,opacity .5s" stroke="#fff" stroke-width="1"/><text text-anchor="middle" dy=".35em" font-size="' + (p.r * k.s > 26 ? 12.5 : 0) + '" fill="#fff" font-weight="700">' + (p.r * k.s > 26 ? shortName(p.n) : '') + '</text></g>').join(''));
            host = el;
          }
          const land = el.querySelector('[data-land]'); land.style.transition = 'opacity .6s'; land.style.opacity = i >= 2 ? .12 : 1;
          el.querySelectorAll('[data-c]').forEach((g, j) => {
            const p = pts[j], c = g.querySelector('circle');
            const x = i >= 2 ? p.x * k.s + k.x : p.x0, y = i >= 2 ? p.y * k.s + k.y : p.y0;
            g.style.transform = 'translate(' + x + 'px,' + y + 'px)';
            c.style.opacity = i === 0 ? 0 : .92;
            c.style.fill = i >= 3 ? VALS(p.taux) : ACC;
            g.querySelector('text').style.opacity = i >= 2 ? 1 : 0;
            g.querySelector('text').style.fill = i >= 3 && p.taux < 16 ? INK : '#fff';
          });
        }
      });
      b.insertAdjacentHTML('beforeend', '<p class="viz-caption">Surface des cercles proportionnelle au nombre de candidats. ' + SRC_BAC + '</p>');
    }
  });

  // Cartogramme continu.
  steps.push({
    id: 'caoutchouc', kicker: 'Cartogrammes', title: 'La carte en caoutchouc',
    lead: 'Cartogramme continu : chaque wilaya s’étire ou se contracte jusqu’à ce que sa surface suive la donnée, sans rupture avec ses voisines. Tirez le curseur.',
    build(b) {
      const [ww, hh] = SIZE(), C = D.carto;
      let v = 'pop';
      b.innerHTML = chips([['pop', 'Selon la population'], ['cand', 'Selon les candidats au bac']], 'pop') + '<div class="viz main"><div class="row" style="gap:12px"><label class="small" for="k-t">Le territoire</label><input id="k-t" type="range" min="0" max="100" value="0" style="flex:1;accent-color:' + ACC + '"><span class="small">Les gens</span></div><div data-chart></div><div class="viz-caption">Algorithme de Gastner et Newman (2004), surfaces approximatives : à environ 10 % près pour Nouakchott, moins justes pour les petites wilayas peu peuplées. Population : Kontur 2023 ; ' + SRC_BAC + '</div></div><div data-q></div>';
      const bounds = polys => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; polys.forEach(rs => rs.forEach(r => r.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }))); return [x0, y0, x1, y1]; };
      const draw = () => {
        const t = +b.querySelector('#k-t').value / 100, e = t * t * (3 - 2 * t), to = C[v];
        const polys = C.base.map((rs, i) => rs.map((r, j) => r.map((p, m) => [p[0] + (to[i][j][m][0] - p[0]) * e, p[1] + (to[i][j][m][1] - p[1]) * e])));
        const f = fitBox(bounds(polys), ww, hh);
        const lab = (name, n) => { const pts = polys[W.findIndex(w => w.n === name)][0], c = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]), q = f(c); return n ? '<text x="' + q[0] + '" y="' + q[1] + '" text-anchor="middle" font-weight="700" font-size="14" style="' + halo + '">' + n + '</text>' : ''; };
        b.querySelector('[data-chart]').innerHTML = svgMap(ww, hh, W.map((w, i) => '<path d="' + dOf(polys[i], f) + '" fill="' + (isNkc(w) ? ACC : GREY) + '" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>').join('') + (e > .55 ? lab('Nouakchott Ouest', 'Nouakchott') + lab('Tiris Zemmour', '') : ''));
      };
      wire(b, k => { v = k; draw(); });
      b.querySelector('#k-t').addEventListener('input', draw); draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'Que perd-on avec cette carte ?',
        options: [
          {t: 'Les formes familières : il faut connaître le pays pour la lire', ok: true, why: 'L’impact visuel est immédiat : <mark>Nouakchott prend sa place, le Nord fond.</mark> Mais le lecteur ne reconnaît plus le pays, et les distances n’existent plus. Elle fonctionne mieux à côté de la vraie carte, ou en animation, comme ici.'},
          {t: 'Les données', why: 'Les données sont là : c’est même leur valeur qui fixe la surface.'},
          {t: 'Rien : elle est meilleure dans tous les cas', why: 'Pour aller d’Atar à Zouérat, elle ne vous sert à rien.'}
        ]
      });
    }
  });

  // Grille hexagonale.
  const HEX = {'Tiris Zemmour': [3, 0], 'Dakhlet Nouadhibou': [1.5, 1], Adrar: [2.5, 1], Inchiri: [1, 2], Tagant: [3, 2], 'Hodh Chargui': [4, 2], 'Nouakchott Nord': [.5, 3], Trarza: [1.5, 3], Brakna: [2.5, 3], Assaba: [3.5, 3], 'Hodh El Gharbi': [4.5, 3], 'Nouakchott Ouest': [0, 4], 'Nouakchott Sud': [1, 4], Gorgol: [3, 4], Guidimagha: [3.5, 5]};
  steps.push({
    id: 'hexagones', kicker: 'Cartogrammes', title: 'Une wilaya, une case',
    lead: 'Cartogramme hexagonal : chaque unité pèse le même poids visuel. Classique pour les élections : le Royaume-Uni, les États-Unis.',
    build(b) {
      const ww = K.narrow() ? 400 : 560, s = K.narrow() ? 37 : 52, hw = s * Math.sqrt(3), hh = s * 9.9;
      const hexPath = (cx, cy) => { let d = ''; for (let i = 0; i < 6; i++) { const a = (60 * i - 30) * RAD; d += (i ? 'L' : 'M') + (cx + s * Math.cos(a)).toFixed(1) + ' ' + (cy + s * Math.sin(a)).toFixed(1); } return d + 'Z'; };
      const short = n => n.replace('Nouakchott ', 'Nkc ').replace('Dakhlet Nouadhibou', 'Nouadhibou').replace('Hodh El Gharbi', 'H. Gharbi').replace('Hodh Chargui', 'H. Chargui').replace('Tiris Zemmour', 'T. Zemmour');
      const cells = W.map(w => { const [c, r] = HEX[w.n], cx = hw * .8 + c * hw, cy = s * 1.1 + r * s * 1.5; return '<path d="' + hexPath(cx, cy) + '" fill="' + VALS(w.taux) + '" stroke="#fff" stroke-width="2"/><text x="' + cx + '" y="' + (cy - 3) + '" text-anchor="middle" font-size="' + (K.narrow() ? 10.5 : 12.5) + '" fill="' + (w.taux < 16 ? INK : '#fff') + '">' + short(w.n) + '</text><text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="' + (K.narrow() ? 12 : 15) + '" font-weight="700" fill="' + (w.taux < 16 ? INK : '#fff') + '">' + fr(w.taux, 1) + ' %</text>'; }).join('');
      b.innerHTML = '<div class="viz main">' + svg(ww, hh, cells) + '<div class="viz-caption">Taux d’admission par wilaya. Plus de surface trompeuse, et une place pour chaque étiquette. ' + SRC_BAC + '</div></div><div data-q></div>';
      question(b.querySelector('[data-q]'), {
        prompt: 'Une élection a été gagnée dans 12 wilayas sur 15, mais les trois de Nouakchott pèsent plus de 30 % des voix. Quelle carte choisir pour montrer <b>qui a gagné où</b> sans tromper ?',
        options: [
          {t: 'Un cartogramme : la géographie ment sur le poids des gens', ok: true, why: 'Sur une carte classique, le désert fait gagner celui qui l’emporte dans les grandes wilayas vides. <b>Quand les unités comptent par leur population, ou à égalité entre elles</b>, utilisez un cartogramme. Quand la question est <b>où</b> (un fleuve, une route, une distance), gardez la vraie carte.'},
          {t: 'La carte classique des wilayas', why: 'L’œil lirait la surface : le Tiris Zemmour et ses 68 000 habitants pèseraient bien plus que Nouakchott.'},
          {t: 'Un camembert par wilaya', why: 'Quinze petits camemberts : un cauchemar à comparer (CM 2).'}
        ]
      });
    }
  });

  /* ======================= Partie 6 · Outils ======================= */

  steps.push({
    id: 'outils', kicker: 'Outils', title: 'Quel outil pour quelle carte ?',
    lead: 'Le récit peut être statique ou exploré : l’outil suit la question.',
    build(b) {
      b.innerHTML = '<div class="viz"><table class="data"><thead><tr><th>Outil</th><th>Force</th><th>Pour…</th></tr></thead><tbody>' +
        '<tr><td><b>QGIS</b></td><td>Logiciel libre, à la souris, avec des centaines d’outils.</td><td>Explorer, analyser, publier une belle carte. <b>Notre prochain TD.</b></td></tr>' +
        '<tr><td><b>GeoPandas</b></td><td>Python : la même chaîne en code, reproductible.</td><td>Refaire la carte chaque mois, joindre de gros tableaux.</td></tr>' +
        '<tr><td><b>Bokeh</b></td><td>Cartes interactives dans le navigateur, vues liées.</td><td>Laisser le lecteur explorer sur le web.</td></tr></tbody></table></div><div data-q></div>';
      question(b.querySelector('[data-q]'), {
        prompt: 'Une ONG veut un rapport PDF avec une carte soignée de l’accès aux soins. Que prenez-vous ?',
        options: [
          {t: 'QGIS', ok: true, why: 'Une carte statique, une mise en page soignée, une analyse à la demande : c’est son terrain. Si elle revient chaque mois, passez à GeoPandas. Si le lecteur doit explorer : Bokeh.'},
          {t: 'Bokeh', why: 'Le survol et le zoom ne survivent pas à un PDF.'},
          {t: 'Un tableur', why: 'Il ne sait pas calculer une distance à un point ni composer une carte.'}
        ]
      });
    }
  });

  steps.push({
    id: 'retenir', kicker: 'À retenir', title: 'Ce que vous emportez',
    lead: 'Huit idées à garder.',
    build(b) {
      b.innerHTML = '<ol class="recap">' + [
        'Un <b>SIG</b> relie des formes à une table : on interroge l’espace, pas seulement des lignes.',
        '<b>Vecteur</b> (point, ligne, polygone) pour les objets, <b>raster</b> (pixels) pour ce qui varie partout. Tout dépend de l’échelle et de la question.',
        'Sans <b>SCR</b>, des coordonnées ne sont que des nombres. <mark>Avant de mesurer : des mètres, pas des degrés.</mark>',
        'Toute <b>projection</b> déforme : surfaces, angles ou distances. Ce choix fait partie du message : l’ONU a voté sur Mercator en 2026.',
        'Empilez : fond, thème, annotation. <b>Focus, contexte, voix</b> : le lecteur ne cherche pas, vous lui montrez.',
        '<b>Bertin</b> : taille pour les quantités, valeur pour un ordre, teinte pour les catégories.',
        'En aplats : des <b>taux</b>, pas des nombres bruts. Les seuils sont un choix éditorial, à annoncer.',
        'Quand la géographie ment sur les gens, utilisez un <b>cartogramme</b> : Nouakchott retrouve ses 57 % de candidats.'
      ].map(x => '<li><span>' + x + '</span></li>').join('') + '</ol>';
    }
  });

  /* ======================= Pour aller plus loin ======================= */

  steps.push({
    id: 'pascarte', kicker: 'Faut-il une carte ?', title: 'Parfois, pas de carte',
    lead: 'Quelles sont les trois wilayas qui ont le moins de candidats ? Répondez avec chaque visuel.',
    build(b) {
      const [ww, hh] = K.narrow() ? [400, 420] : [560, 480], f = mapF(ww, hh);
      const sorted = W.slice().sort((a, c) => c.cand - a.cand);
      const bars = sorted.map((w, i) => { const y = 14 + i * 30, x = K.narrow() ? 132 : 170, L = (ww - x - 60) * w.cand / 12008; return '<text x="' + (x - 8) + '" y="' + (y + 14) + '" text-anchor="end" font-size="14">' + w.n + '</text><rect x="' + x + '" y="' + y + '" width="' + L + '" height="20" fill="' + (i > 11 ? ACC : GREY2) + '"/><text x="' + (x + L + 6) + '" y="' + (y + 15) + '" font-size="13">' + fr(w.cand) + '</text>'; }).join('');
      const col = w => { const t = Math.log10(w.cand / 388) / Math.log10(12008 / 388), m = (x, y) => Math.round(x + (y - x) * t); return 'rgb(' + m(240, 80) + ',' + m(228, 38) + ',' + m(241, 84) + ')'; };
      b.innerHTML = chips([['carte', 'Carte'], ['barres', 'Barres triées']], 'carte') + '<div class="viz main"><div data-chart></div><div class="viz-caption">Nombre de candidats. ' + SRC_BAC + '</div></div>' + M.note('lion', '<p><b>Une carte répond à « où ? ».</b> Si le lieu ne compte pas dans la question, des barres triées font mieux : Inchiri, Guidimagha, Tiris Zemmour se lisent d’un coup d’œil.</p>');
      const draw = k => { b.querySelector('[data-chart]').innerHTML = k === 'carte' ? svgMap(ww, hh, country(f, col)) : svg(ww, 14 + 15 * 30, bars); };
      wire(b, draw); draw('carte');
    }
  });

  steps.push({
    id: 'snow', kicker: 'Retour au CM 1', title: 'John Snow, en couches',
    lead: 'La carte de 1854 est un SIG avant l’heure : des lignes, des points. Ajoutons un raster : pour chaque case, la pompe la plus proche.',
    build(b) {
      const S = window.DS_DATA && window.DS_DATA.snow; if (!S) return;
      const ww = K.narrow() ? 400 : 620, hh = ww, xs = S.streets.flat().map(p => p[0]), ys = S.streets.flat().map(p => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), s = Math.min(ww / (x1 - x0), hh / (y1 - y0));
      const f = p => [(p[0] - x0) * s, hh - (p[1] - y0) * s];
      const near = p => { let k = 0, best = 1e9; S.pumps.forEach((q, i) => { const d = Math.hypot(p[0] - q.x, p[1] - q.y); if (d < best) { best = d; k = i; } }); return k; };
      const on = {zone: false, rues: true, morts: true, pompes: true};
      const n = 60, px = ww / n, cells = []; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const p = [x0 + (i + .5) * px / s, y0 + (j + .5) * px / s]; if (near(p) === S.broad) cells.push([i * px, hh - (j + 1) * px]); }
      b.innerHTML = '<div class="viz main"><div class="row" style="gap:6px;flex-wrap:wrap">' + [['zone', 'Raster : plus proche de Broad Street', false], ['rues', 'Lignes : rues', true], ['morts', 'Points : décès', true], ['pompes', 'Points : pompes', true]].map(([k, t, v]) => '<button type="button" class="chip" data-l="' + k + '" aria-pressed="' + v + '">' + t + '</button>').join('') + '</div><div data-chart></div><div class="viz-caption">' + fr(S.nearBroad) + ' décès sur ' + fr(S.deaths.length) + ' (' + fr(100 * S.nearBroad / S.deaths.length) + ' %) sont plus proches de Broad Street, à vol d’oiseau. Données : HistData.</div></div>';
      const draw = () => {
        b.querySelector('[data-chart]').innerHTML = svg(ww, hh,
          (on.zone ? cells.map(c => '<rect x="' + c[0].toFixed(1) + '" y="' + c[1].toFixed(1) + '" width="' + (px + .5) + '" height="' + (px + .5) + '" fill="' + MARK + '" fill-opacity=".45"/>').join('') : '') +
          (on.rues ? S.streets.map(l => '<path d="' + line(l, f) + '" stroke="#c7cad1" stroke-width="1.2" fill="none"/>').join('') : '') +
          (on.morts ? S.deaths.map(d => { const q = f(d); return '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="2" fill="' + BAD + '" fill-opacity=".75"/>'; }).join('') : '') +
          (on.pompes ? S.pumps.map((p, i) => { const q = f([p.x, p.y]); return '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (i === S.broad ? 8 : 5) + '" fill="' + (i === S.broad ? ACC : INK) + '" stroke="#fff"/>'; }).join('') : ''));
      };
      b.querySelectorAll('[data-l]').forEach(c => c.addEventListener('click', () => { on[c.dataset.l] = !on[c.dataset.l]; c.setAttribute('aria-pressed', on[c.dataset.l]); draw(); }));
      draw();
    }
  });

  const QUIZ = [
    {prompt: 'Le relief d’un massif : vecteur ou raster ?', options: [{t: 'Raster', ok: true, why: 'Une valeur partout : une grille d’altitudes.'}, {t: 'Vecteur', why: 'Sauf pour les courbes de niveau, calculées à partir du raster.'}]},
    {prompt: 'Un tampon de « 5 » sur une couche en EPSG:4326, c’est :', options: [{t: '5 degrés, soit plus de 500 km', ok: true, why: 'L’unité est celle du SCR. Reprojetez d’abord.'}, {t: '5 km', why: 'L’unité est le degré, pas le kilomètre.'}, {t: '5 mètres', why: 'L’unité est le degré.'}]},
    {prompt: 'Vous comparez la taille de la Mauritanie et de la France sur une carte web. Vous croyez…', options: [{t: 'Une carte déformée : Web Mercator gonfle la France', ok: true, why: 'Plus on monte en latitude, plus Mercator agrandit.'}, {t: 'La carte : elle est officielle', why: 'Toutes les cartes web partagent cette déformation.'}]},
    {prompt: 'Le nombre de candidats par wilaya, sur une carte :', options: [{t: 'Des cercles proportionnels', ok: true, why: 'Un nombre brut se montre en taille.'}, {t: 'Des aplats de couleur', why: 'Pour des aplats : un taux ou une densité.'}]},
    {prompt: 'Vous voulez que le lecteur voie d’abord Nouakchott. Elle est minuscule. Vous…', options: [{t: 'Ajoutez un carton (zoom) ou un cartogramme', ok: true, why: 'Deux bonnes façons de lui rendre sa place.'}, {t: 'Agrandissez le titre', why: 'Le titre guide, mais la carte ne la montre toujours pas.'}]}
  ];
  steps.push({
    id: 'quiz3', kicker: 'Quiz', title: 'Cinq questions éclair',
    lead: 'Réponses à voix haute.',
    build(b) { QUIZ.forEach(q => { const h = document.createElement('div'); b.appendChild(h); question(h, q); }); }
  });

  const GLOSS = [['Système d’information géographique (SIG)', 'Geographic Information System (GIS)'], ['Système de coordonnées de référence (SCR)', 'Coordinate Reference System (CRS)'], ['Couche', 'Layer'], ['Table attributaire', 'Attribute table'], ['Tampon', 'Buffer'], ['Jointure', 'Join'], ['Carte choroplèthe (en aplats)', 'Choropleth map'], ['Mise en page', 'Print layout'], ['Carton', 'Inset map'], ['Cartogramme', 'Cartogram'], ['Ombrage', 'Hillshade'], ['Courbes de niveau', 'Contours']];
  window.DS_LESSONS = window.DS_LESSONS || {};
  window.DS_LESSONS.cm3 = {
    id: 'cm3',
    title: 'Le SIG comme outil de storytelling',
    lede: 'Une carte n’est pas un miroir : c’est un récit. Apprenons à la construire, et à ne pas nous laisser raconter n’importe quoi.',
    model: '<span>Terre</span><i>→</i><span>Donnée</span><i>→</i><span>Projection</span><i>→</i><span>Composition</span><i>→</i><span>Récit</span>',
    minutes: 90,
    plan: {invisible: 5, sig: 5, simplifier: 4, vecteurs: 4, raster: 5, deuxvues: 4, formats: 3, corriger: 5, pelure: 4, coordonnees: 5, mercator: 6, projections: 5, couches: 5, hierarchie: 5, bertin: 5, choroplethe: 6, echelle: 4, etiquettes: 3, dorling: 5, caoutchouc: 4, hexagones: 4, outils: 3, retenir: 3},
    reserve: {pascarte: 4, snow: 5, quiz3: 6},
    parts: [
      {title: 'Une carte est un récit', from: 'invisible'},
      {title: 'De la Terre à la donnée', from: 'simplifier'},
      {title: 'Aplatir la Terre', from: 'corriger'},
      {title: 'Composer la carte', from: 'couches'},
      {title: 'Les cartogrammes', from: 'dorling'},
      {title: 'Interactivité et outils', from: 'outils'},
      {title: 'À retenir', from: 'retenir'},
      {title: 'Pour aller plus loin', from: 'pascarte'}
    ],
    endAt: 'retenir',
    footer: '<section class="foot-block"><h3>À faire avant le TD 2</h3><ol class="recap">' +
      '<li><span><b>Installez QGIS</b> sur votre ordinateur depuis <a href="https://qgis.org/download/" target="_blank" rel="noopener">qgis.org</a>, et vérifiez qu’il se lance.</span></li>' +
      '<li><span>Ouvrez une carte web et trouvez la Mauritanie et la France. Laquelle paraît la plus grande ? Laquelle l’est vraiment ?</span></li>' +
      '<li><span>Trouvez dans un média une carte en aplats. Colore-t-elle des taux ou des nombres bruts ?</span></li></ol>' +
      '<p class="small">Au TD 2 : QGIS (couches, jointure, tampon, une carte prête à publier), puis la même chaîne en code, avec GeoPandas et Bokeh.</p></section>' +
      '<details class="foot-details"><summary>Lexique français ↔ anglais</summary><table class="data"><thead><tr><th>Français</th><th>English</th></tr></thead><tbody>' + GLOSS.map(g => '<tr><td>' + g[0] + '</td><td>' + g[1] + '</td></tr>').join('') + '</tbody></table></details>' +
      '<details class="foot-details"><summary>Bibliographie</summary><ul class="biblio">' +
      '<li>Jacques Bertin, <i>Sémiologie graphique</i>, Mouton / Gauthier-Villars, 1967.</li>' +
      '<li>Mark Monmonier, <i>How to Lie with Maps</i>, University of Chicago Press, 1991.</li>' +
      '<li>Assemblée générale des Nations unies, résolution « Correct the Map », 4 septembre 2026 (164 voix pour, 1 contre, 6 abstentions).</li>' +
      '<li>Kenneth Field, <i>Cartography.</i>, Esri Press, 2018.</li>' +
      '<li>John Krygier, Denis Wood, <i>Making Maps</i>, Guilford Press.</li>' +
      '<li>Ian Heywood, Sarah Cornelius, Steve Carver, <i>An Introduction to Geographical Information Systems</i>, Pearson.</li>' +
      '<li>Jami Dennis, Michael N. DeMers, <i>GIS For Dummies</i>, 2<sup>e</sup> éd., Wiley, 2025.</li>' +
      '<li>Michael T. Gastner, M. E. J. Newman, « Diffusion-based method for producing density-equalizing maps », <i>PNAS</i>, 101(20), 2004.</li>' +
      '<li>Daniel Dorling, <i>Area Cartograms: Their Use and Creation</i>, CATMOG 59, 1996.</li>' +
      '<li>Bojan Šavrič, Tom Patterson, Bernhard Jenny, « The Equal Earth map projection », <i>International Journal of Geographical Information Science</i>, 33(3), 2019.</li></ul></details>',
    steps
  };
})();
