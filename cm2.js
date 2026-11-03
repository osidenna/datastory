/* CM 2 · Formes de visualisation et principes d'efficacité
   Contenu tiré de lecture2.pdf (2025-2026), refait pour la projection : l'enseignante fait défiler,
   la classe répond à voix haute. Données réelles : bac 2015-2025 (rimdata), météo de Nouakchott,
   prénoms (fichier du cours), quartet d'Anscombe (1973), Datasaurus (2017). */
(function () {
  const K = window.Kit, M = window.Mascots, D = window.DS_DATA, D2 = window.DS_DATA2;
  const {fr, scale, svg, path, yAxis, question, esc} = K;
  const ACC = '#8a4f8c', GREY = '#a3a8b3', GREY2 = '#cfd3da', INK = '#1d2433', BAD = '#b4532a', GOOD = '#2e6b4f', BLUE = '#4e79a7';
  const SRC_BAC = 'Source : résultats du bac 2015–2025, dépôt public <a href="https://github.com/binorassocies/rimdata" target="_blank" rel="noopener">rimdata</a>.';
  const bac = D.bac, YRS = bac.years, at = y => bac.taux[YRS.indexOf(y)];
  const narrow = () => K.narrow(), WW = () => narrow() ? 400 : 680;
  const halo = 'paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round';
  const ask = t => '<span class="sc-ask">' + t + '</span>';
  const steps = [];

  /* ======================= Partie 1 · Pouvoir et responsabilité ======================= */

  // 1. Le mur de la honte : de vrais graphiques, très partagés (images du support 2025-2026).
  const IMG = {
    fox: ['assets/hall/fox-camembert.jpg', 'Fox News, 2009 : candidats républicains pour 2012.'],
    pa: ['assets/hall/axe-pennsylvanie.jpg', 'Compte Instagram de Donald Trump, avril 2024 (sondage Bloomberg du 8 au 15 avril).'],
    dorian: ['assets/hall/carte-ouragan.jpg', 'Maison-Blanche, 4 septembre 2019 : prévision de la NOAA pour l’ouragan Dorian.'],
    floride: ['assets/hall/floride-reuters.jpg', 'Reuters, 16 février 2014 (C. Chan), « Gun deaths in Florida », d’après le Florida Department of Law Enforcement.', 'Image reproduite dans <a href="https://www.livescience.com/45083-misleading-gun-death-chart.html" target="_blank" rel="noopener">Live Science</a>, 23 avril 2014.']
  };
  steps.push({
    id: 'honte', kicker: 'Pouvoir et responsabilité', title: 'Le mur de la honte',
    lead: 'De vrais graphiques, vus par des millions de personnes. Chacun trompe.',
    build(b) {
      const order = ['fox', 'fox', 'pa', 'pa', 'dorian', 'dorian', 'floride', 'floride'];
      K.scrolly(b, {
        steps: [
          '<p><b>Fox News, 2009.</b> Qui les électeurs républicains soutiennent-ils pour 2012 ?</p>' + ask('Qu’est-ce qui cloche ?'),
          '<p>70 + 63 + 60 = <b>193 %</b>. Les sondés pouvaient soutenir plusieurs candidats : ce ne sont pas les parts d’un tout. <mark>Pas de camembert.</mark></p>',
          '<p><b>Campagne américaine, 2024.</b> « Trump écrase Biden en Pennsylvanie ».</p>' + ask('Biden a-t-il presque deux fois moins de voix ?'),
          '<p>47 % contre 46 % : <b>un point d’écart</b>, dans la marge d’erreur d’un sondage. L’axe ne commence pas à zéro : la barre de 47 % paraît presque deux fois plus haute. Son facteur de mensonge, que l’on calcule plus bas, avoisine 30.</p>',
          '<p><b>Maison-Blanche, 4 septembre 2019.</b> La trajectoire prévue de l’ouragan Dorian.</p>' + ask('Regardez à gauche de la Floride.'),
          '<p>Le cône officiel de la NOAA a été <b>prolongé au feutre noir</b> vers l’Alabama, qui n’était pas menacé. Une carte officielle, retouchée à la main.</p>',
          '<p><b>Reuters, 2014.</b> Les meurtres par arme à feu en Floride, avant et après la loi « Stand Your Ground » de 2005.</p>' + ask('Après 2005, les meurtres baissent-ils ?'),
          '<p>Non : l’<b>axe vertical est inversé</b>, 0 en haut. Les meurtres passent d’environ 520 en 2005 à plus de 800 en 2007, mais la courbe semble plonger.</p><p>Nous allons refaire ces astuces… avec les vrais chiffres du bac.</p>'
        ],
        render(el, i) {
          const k = order[i];
          const reveal = i % 2 === 1;
          el.innerHTML = '<figure class="hall-img' + (reveal ? ' is-reveal' : '') + '"><img src="' + IMG[k][0] + '" alt="' + IMG[k][1] + '" loading="lazy"></figure><div class="viz-caption">' + IMG[k][1] + ' ' + (IMG[k][2] || 'Image reprise du support du cours.') + '</div>';
        }
      });
      b.insertAdjacentHTML('beforeend', M.note('lion', '<p><b>Les visuels font autorité.</b> On fait confiance aux graphiques : les manipuler, c’est <mark>manipuler la preuve</mark>. Honnêteté : représenter fidèlement les données. Transparence : montrer ses choix, ses limites et ses incertitudes.</p>'));
    }
  });

  // 2. Le mur de la honte, version bac.
  function hallPie(reveal) {
    const W = WW(), H = 300, r = narrow() ? 82 : 100, cx = narrow() ? 110 : W / 2, cy = 168;
    const v = {SN: 17.3, M: 40.8, LM: 10.4, LO: 25.1}, tot = 93.6, cols = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2'];
    let s = '<text class="title" x="0" y="22">Taux d’admission 2025 par série</text>', a0 = -Math.PI / 2;
    Object.keys(v).forEach((k, i) => {
      const a1 = a0 + v[k] / tot * 2 * Math.PI, big = a1 - a0 > Math.PI ? 1 : 0, am = (a0 + a1) / 2;
      s += '<path d="M' + cx + ' ' + cy + 'L' + (cx + r * Math.cos(a0)) + ' ' + (cy + r * Math.sin(a0)) + 'A' + r + ' ' + r + ' 0 ' + big + ' 1 ' + (cx + r * Math.cos(a1)) + ' ' + (cy + r * Math.sin(a1)) + 'Z" fill="' + cols[i] + '" stroke="#fff" stroke-width="2"/>' +
        '<text x="' + (cx + r * .62 * Math.cos(am)) + '" y="' + (cy + r * .62 * Math.sin(am) + 5) + '" text-anchor="middle" style="fill:#fff;font-weight:700;font-size:14px">' + k + ' ' + fr(v[k], 1) + ' %</text>';
      a0 = a1;
    });
    if (reveal) s += '<g class="fade-in"><rect x="' + (cx + r + 8) + '" y="' + (cy - 30) + '" width="' + Math.max(110, W - cx - r - 12) + '" height="58" rx="6" fill="#f6e4dc"/>' +
      '<text x="' + (cx + r + 16) + '" y="' + (cy - 8) + '" style="fill:' + BAD + ';font-weight:700">Total : 93,6 % ?</text><text x="' + (cx + r + 16) + '" y="' + (cy + 14) + '" style="fill:' + BAD + '">pas un tout</text></g>';
    return svg(W, H, s);
  }
  function hallInverted(reveal) {
    const W = WW(), H = 300, l = 46, r = 20, t = 50, b = 34;
    const x = scale(2015, 2025, l, W - r), y = scale(0, 25, t, H - b);
    let s = '<text class="title" x="0" y="22">Le bac en chute libre ?</text>';
    s += yAxis(y, [0, 5, 10, 15, 20, 25], l, W - r, v => v + ' %');
    [2015, 2020, 2025].forEach(yy => { s += '<text x="' + x(yy) + '" y="' + (H - b + 20) + '" text-anchor="middle">' + yy + '</text>'; });
    const pts = YRS.map((yy, i) => [x(yy), y(bac.taux[i])]);
    s += '<path d="' + path([[x(2015), y(0)], ...pts, [x(2025), y(0)]]) + 'Z" fill="#c0392b" opacity=".85"/>';
    if (reveal) s += '<g class="fade-in"><path d="M' + (l + 14) + ' ' + (y(0) + 4) + 'v' + (y(25) - y(0) - 12) + '" stroke="' + INK + '" stroke-width="2" marker-end="url(#ar2)"/>' +
      '<defs><marker id="ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + INK + '"/></marker></defs>' +
      '<text x="' + (l + 24) + '" y="' + (y(12)) + '" class="lbl-strong" style="' + halo + '">0 en haut, 25 % en bas</text></g>';
    return svg(W, H, s);
  }
  function hallExtra(reveal) {
    const W = WW(), H = 300, l = 46, r = 20, t = 50, b = 34;
    const x = scale(2015, 2028, l, W - r), y = scale(0, 40, H - b, t);
    let s = '<text class="title" x="0" y="22">Bac : 35 % d’admis en 2028</text>';
    s += yAxis(y, [0, 10, 20, 30, 40], l, W - r, v => v + ' %');
    [2015, 2020, 2025, 2028].forEach(yy => { s += '<text x="' + x(yy) + '" y="' + (H - b + 20) + '" text-anchor="middle">' + yy + '</text>'; });
    s += '<path d="' + path(YRS.map((yy, i) => [x(yy), y(bac.taux[i])])) + '" fill="none" stroke="' + BLUE + '" stroke-width="2.5"/>';
    s += '<path d="M' + x(2025) + ' ' + y(at(2025)) + 'Q' + x(2026.6) + ' ' + y(24) + ' ' + x(2028) + ' ' + y(35) + '" fill="none" stroke="' + BLUE + '" stroke-width="2.5" stroke-dasharray="6 5"/>' +
      '<text x="' + x(2028) + '" y="' + (y(35) - 10) + '" text-anchor="end" style="fill:' + BLUE + ';font-weight:700">35 %</text>';
    if (reveal) s += '<g class="fade-in"><rect x="' + x(2025.1) + '" y="' + t + '" width="' + (x(2028) - x(2025.1)) + '" height="' + (H - b - t) + '" fill="' + BAD + '" opacity=".1"/>' +
      '<text x="' + x(2026.5) + '" y="' + (y(4)) + '" text-anchor="middle" style="fill:' + BAD + ';font-weight:700;' + halo + '">aucune donnée</text></g>';
    return svg(W, H, s);
  }
  steps.push({
    id: 'hall', kicker: 'Pouvoir et responsabilité', title: 'À votre tour : trois graphiques truqués',
    lead: 'Les mêmes astuces, appliquées aux vrais résultats du bac. Repérez-les.',
    build(b) {
      const draw = [() => hallPie(false), () => hallPie(true), () => hallInverted(false), () => hallInverted(true), () => hallExtra(false), () => hallExtra(true)];
      K.scrolly(b, {
        steps: [
          '<p>Premier graphique.</p>' + ask('Qu’est-ce qui cloche ?'),
          '<p>Comme Fox : un <b>camembert de taux</b>. Les parts n’additionnent rien, le total fait 93,6 %. Un camembert ne montre que les parties d’un même tout.</p>',
          '<p>Deuxième graphique.</p>' + ask('Le bac s’effondre-t-il ?'),
          '<p>Comme en Floride : l’<b>axe vertical est inversé</b>, 0 en haut. Le taux qui monte semble chuter.</p>',
          '<p>Troisième graphique.</p>' + ask('D’où vient ce 35 % ?'),
          '<p>Comme la carte au feutre : les pointillés n’ont <b>aucune donnée</b> derrière, la courbe a été prolongée à la main.</p>'
        ],
        render(el, i) { el.innerHTML = draw[i]() + '<div class="viz-caption">Versions truquées pour l’exercice. ' + SRC_BAC + '</div>'; }
      });
    }
  });

  // 3. Le facteur de mensonge (promis au CM 1).
  steps.push({
    id: 'mensonge', kicker: 'Pouvoir et responsabilité', title: 'Le facteur de mensonge',
    lead: 'Bac 2024 : 22,1 % d’admis. Bac 2025 : 18,8 %. Faites monter la base de l’axe et regardez la baisse « grandir ».',
    build(b) {
      const v24 = at(2024), v25 = at(2025), real = (v24 - v25) / v24;
      b.innerHTML = '<div class="viz main"><div data-chart></div>' +
        '<div class="row" style="gap:12px;margin-top:6px"><label class="small" for="lf-base">Base de l’axe</label><input id="lf-base" type="range" min="0" max="18" step="0.5" value="0" style="flex:1;accent-color:' + ACC + '"><b data-base>0 %</b></div>' +
        '<div class="lf-panel" data-panel></div><div class="viz-caption">' + SRC_BAC + '</div></div><div data-q></div>';
      const draw = base => {
        const W = WW(), H = 260, l = 46, t = 20, bt = 34, x = i => l + 60 + i * (narrow() ? 150 : 220), bw = narrow() ? 90 : 130;
        const y = scale(base, 23, H - bt, t);
        let s = yAxis(y, [base, ...[5, 10, 15, 20].filter(v => v > base + 1)], l, W - 10, v => fr(v, v % 1 ? 1 : 0) + ' %');
        [[2024, v24], [2025, v25]].forEach(([yy, v], i) => {
          s += '<rect x="' + x(i) + '" y="' + y(v) + '" width="' + bw + '" height="' + (y(base) - y(v)) + '" fill="' + (i ? BAD : GREY2) + '"/>' +
            '<text x="' + (x(i) + bw / 2) + '" y="' + (y(v) - 8) + '" text-anchor="middle" class="lbl-strong">' + fr(v, 1) + ' %</text>' +
            '<text x="' + (x(i) + bw / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + yy + '</text>';
        });
        b.querySelector('[data-chart]').innerHTML = svg(W, H, s);
        const shown = ((v24 - base) - (v25 - base)) / (v24 - base), lf = shown / real, ok = lf >= .95 && lf <= 1.05;
        b.querySelector('[data-base]').textContent = fr(base, base % 1 ? 1 : 0) + ' %';
        b.querySelector('[data-panel]').innerHTML = '<div><small>Baisse réelle</small><b>−' + fr(100 * real, 1) + ' %</b></div><div><small>Baisse dessinée</small><b>−' + fr(100 * shown, 1) + ' %</b></div>' +
          '<div class="' + (ok ? 'is-ok' : 'is-ko') + '"><small>Facteur de mensonge</small><b>' + fr(lf, 2) + '</b></div>';
      };
      const inp = b.querySelector('#lf-base'); inp.addEventListener('input', () => draw(+inp.value)); draw(0);
      question(b.querySelector('[data-q]'), {
        prompt: 'Tufte tolère un facteur entre 0,95 et 1,05. À partir de quelle base l’axe ment-il ?', cols: 2,
        options: [
          {t: 'Dès 1 %', ok: true, why: 'Facteur = 22,1 ÷ (22,1 − base). Il dépasse 1,05 dès que la base dépasse 1,05 %. Pour des barres, l’axe commence à zéro.'},
          {t: 'À partir de 5 %', why: 'À 5 %, le facteur vaut déjà 1,29 : la baisse paraît 29 % plus forte qu’elle n’est.'},
          {t: 'À partir de 10 %', why: 'À 10 %, le facteur vaut 1,83. Le mensonge commence bien avant.'},
          {t: 'Jamais : les chiffres sont écrits', why: 'L’œil lit les longueurs avant les étiquettes. Les chiffres ne corrigent pas une barre trompeuse.'}
        ]
      });
      b.querySelector('[data-q]').insertAdjacentHTML('beforebegin', '<aside class="info-box">' +
        '<h3>Qui est Tufte ?</h3><p><b>Edward Tufte</b>, statisticien américain, professeur émérite à l’université Yale. Son livre <i>The Visual Display of Quantitative Information</i> (1983) a fondé l’étude de l’honnêteté et de l’efficacité des graphiques. On lui doit le <b>facteur de mensonge</b>, le <b>rapport encre-données</b>, le mot <i>chartjunk</i> (graphique encombré) et les <b>petits multiples</b>.</p>' +
        '<h3>Le calcul</h3><p class="formula">facteur de mensonge = <span>taille de l’effet dessiné</span> ÷ <span>taille de l’effet dans les données</span></p>' +
        '<p>L’<b>effet</b>, c’est le changement relatif : (nouvelle valeur − ancienne) ÷ ancienne. Pour des barres, on le mesure dans les données, puis sur les longueurs dessinées.</p>' +
        '<ol class="td-list"><li><b>Données</b> : de 22,1 % à 18,8 %, soit 3,3 ÷ 22,1 = <b>14,9 %</b> de baisse.</li>' +
        '<li><b>Dessin, base à 14 %</b> : les barres mesurent 22,1 − 14 = 8,1 et 18,8 − 14 = 4,8 ; la baisse dessinée vaut 3,3 ÷ 8,1 = <b>40,7 %</b>.</li>' +
        '<li><b>Facteur</b> : 40,7 ÷ 14,9 = <b>2,73</b>. La baisse paraît presque trois fois plus forte qu’elle n’est.</li></ol>' +
        '<p>Un graphique honnête a un facteur entre <b>0,95 et 1,05</b>. Ici, il vaut 22,1 ÷ (22,1 − base) : il dépasse 1,05 dès que la base dépasse 1,05 %.</p>' +
        '<p class="small">L’exemple de Tufte : en 1978, un graphique du <i>New York Times</i> sur les normes de consommation des voitures montrait une hausse de 53 % dans les données par des lignes qui grandissaient de 783 %. Facteur de mensonge : 14,8.</p></aside>');
    }
  });

  // William Playfair et l'anatomie d'un graphique.
  steps.push({
    id: 'playfair', kicker: 'Histoire', title: 'Qui a inventé les graphiques ?',
    lead: 'Barres, courbes, camemberts : ils ont un inventeur, et ils ont plus de deux siècles.',
    build(b) {
      const img = (src, alt) => '<figure class="hall-img"><img src="assets/hall/' + src + '" alt="' + alt + '" loading="lazy"></figure>';
      K.scrolly(b, {
        steps: [
          '<p>Exportations et importations de l’Angleterre avec les Antilles, 1700–1780.</p>' + ask('Qui a dessiné ce graphique, et quand ?'),
          '<p><b>William Playfair</b> (1759–1823), ingénieur et économiste écossais. Il invente la <b>courbe</b> et les <b>barres</b> en 1786 (<i>The Commercial and Political Atlas</i>), puis le <b>camembert</b> en 1801 (<i>The Statistical Breviary</i>).</p>',
          '<p>Les camemberts de Playfair : l’Empire ottoman partagé entre Asie, Afrique et Europe.</p>',
          '<p><b>L’anatomie d’un graphique</b> était déjà là : titre, cadre, axes gradués, étiquettes, légende, couleur, quadrillage. Notre travail : garder ce qui sert, retirer le reste.</p>'
        ],
        render(el, i) { el.innerHTML = (i === 2 ? img('playfair-camemberts.jpg', 'Camemberts de Playfair, 1801') : img('playfair-anatomie.jpg', 'Graphique de Playfair annoté')) + '<div class="viz-caption">William Playfair, ' + (i === 2 ? '<i>The Statistical Breviary</i>, 1801' : '<i>The Commercial and Political Atlas</i>, 1786, avec les éléments du graphique annotés') + '. Image reprise du support du cours.</div>'; }
      });
    }
  });

  // 3. Explorer pour trouver les perles, expliquer pour les montrer (promis au CM 1).
  function smallMultiples(hi) {
    const WY = bac.wilayaYears, names = Object.keys(WY).sort((a, c) => WY[c][10] - WY[a][10]);
    const cols = narrow() ? 3 : 5, W = WW(), cw = W / cols, ch = 92, H = Math.ceil(names.length / cols) * ch;
    const x = scale(2015, 2025, 8, cw - 8), y = scale(0, 30, ch - 10, 26);
    let s = '';
    names.forEach((w, k) => {
      const ox = (k % cols) * cw, oy = Math.floor(k / cols) * ch, on = w === hi;
      s += '<g transform="translate(' + ox + ' ' + oy + ')"><rect x="2" y="2" width="' + (cw - 4) + '" height="' + (ch - 4) + '" fill="' + (on ? '#f3eaf3' : '#fafafa') + '" rx="4"/>' +
        '<text x="8" y="17" style="font-size:11px;' + (on ? 'fill:' + ACC + ';font-weight:700' : '') + '">' + esc(w) + '</text>';
      let seg = [];
      const flush = () => { if (seg.length > 1) s += '<path d="' + path(seg) + '" fill="none" stroke="' + (on ? ACC : '#8f95a1') + '" stroke-width="' + (on ? 2.4 : 1.4) + '"/>'; seg = []; };
      WY[w].forEach((v, i) => { if (v == null) flush(); else seg.push([x(YRS[i]), y(v)]); });
      flush();
      s += '</g>';
    });
    return svg(W, H, s, 'heat');
  }
  function explain() {
    const W = WW(), N = narrow(), l = 42, r = N ? 92 : 110, tl = K.lines('Nouakchott Nord : de 6,3 % à 22,9 % d’admis en cinq ans', N ? 32 : 99), t = 46 + tl.length * 22, H = t + 210;
    const x = scale(2015, 2025, l, W - r), y = scale(0, 25, H - 30, t), WY = bac.wilayaYears['Nouakchott Nord'];
    let s = K.tlines(0, 22, tl.join(' '), N ? 32 : 99, 'class="title"', 22) + '<text class="subtitle" x="0" y="' + (22 + tl.length * 22) + '">Taux d’admission, en %. En gris : toute la Mauritanie.</text>';
    s += yAxis(y, [0, 10, 20], l, W - r, v => v + ' %');
    [2015, 2020, 2025].forEach(yy => { s += '<text x="' + x(yy) + '" y="' + (H - 10) + '" text-anchor="middle">' + yy + '</text>'; });
    s += '<path d="' + path(YRS.map((yy, i) => [x(yy), y(bac.taux[i])])) + '" fill="none" stroke="' + GREY2 + '" stroke-width="2.5"/>';
    let seg = [], segs = [];
    WY.forEach((v, i) => { if (v == null) { segs.push(seg); seg = []; } else seg.push([x(YRS[i]), y(v)]); }); segs.push(seg);
    segs.forEach(sg => { if (sg.length > 1) s += '<path d="' + path(sg) + '" fill="none" stroke="' + ACC + '" stroke-width="3"/>'; });
    s += '<circle cx="' + x(2019) + '" cy="' + y(WY[4]) + '" r="5" fill="' + ACC + '"/><circle cx="' + x(2024) + '" cy="' + y(WY[9]) + '" r="5" fill="' + ACC + '"/>' +
      '<text x="' + (x(2019) + 6) + '" y="' + (y(WY[4]) + 20) + '" class="lbl-accent">6,3 %</text><text x="' + (x(2024) - 8) + '" y="' + (y(WY[9]) - 10) + '" text-anchor="end" class="lbl-accent">22,9 %</text>' +
      '<text x="' + (x(2025) + 6) + '" y="' + (y(at(2025)) + 4) + '" style="fill:#8f95a1">Mauritanie</text>';
    return svg(W, H, s);
  }
  steps.push({
    id: 'explorer', kicker: 'Deux modes', title: 'Chercher les perles, puis les montrer',
    lead: 'Exploratoire : désordonné, complet, pour soi. Explicatif : propre, ciblé, pour le public.',
    build(b) {
      K.scrolly(b, {
        steps: [
          '<p><b>Explorer</b> : le taux d’admission des 15 wilayas, 2015–2025. Tout montrer, vite, sans souci de beauté.</p>' + ask('Où est la perle ?'),
          '<p>Une perle : <b>Nouakchott Nord</b> monte chaque année de 2019 à 2024, de 6,3 % à 22,9 %. (2020 manque dans le fichier.)</p>',
          '<p><b>Expliquer</b> : un seul graphique, un titre qui dit le message, une couleur, le reste en gris.</p>'
        ],
        render(el, i) { el.innerHTML = (i < 2 ? smallMultiples(i ? 'Nouakchott Nord' : null) : explain()) + '<div class="viz-caption">' + SRC_BAC + '</div>'; }
      });
    }
  });

  /* ======================= Partie 2 · Pourquoi visualiser ? ======================= */

  // 4. Le quartet d'Anscombe.
  const ANS = {
    I: [[10, 8.04], [8, 6.95], [13, 7.58], [9, 8.81], [11, 8.33], [14, 9.96], [6, 7.24], [4, 4.26], [12, 10.84], [7, 4.82], [5, 5.68]],
    II: [[10, 9.14], [8, 8.14], [13, 8.74], [9, 8.77], [11, 9.26], [14, 8.10], [6, 6.13], [4, 3.10], [12, 9.13], [7, 7.26], [5, 4.74]],
    III: [[10, 7.46], [8, 6.77], [13, 12.74], [9, 7.11], [11, 7.81], [14, 8.84], [6, 6.08], [4, 5.39], [12, 8.15], [7, 6.42], [5, 5.73]],
    IV: [[8, 6.58], [8, 5.76], [8, 7.71], [8, 8.84], [8, 8.47], [8, 7.04], [8, 5.25], [19, 12.50], [8, 5.56], [8, 7.91], [8, 6.89]]
  };
  function anscombe(show) {
    const W = WW(), cols = 2, cw = W / cols, ch = 200, H = 2 * ch, x = scale(2, 20, 34, cw - 10), y = scale(2, 14, ch - 26, 30);
    let s = '';
    Object.keys(ANS).forEach((k, i) => {
      const ox = (i % 2) * cw, oy = Math.floor(i / 2) * ch;
      s += '<g transform="translate(' + ox + ' ' + oy + ')"><rect x="3" y="3" width="' + (cw - 6) + '" height="' + (ch - 6) + '" rx="6" fill="#fafafa"/><text x="14" y="22" class="lbl-strong">Jeu ' + k + '</text>';
      if (!show) s += ['moyenne x = 9', 'moyenne y = 7,50', 'corrélation = 0,82', 'droite : y = 3 + 0,5 x'].map((t, j) => '<text x="' + cw / 2 + '" y="' + (70 + j * 26) + '" text-anchor="middle" style="font-size:14px;fill:' + INK + '">' + t + '</text>').join('');
      else {
        s += '<line x1="' + x(2) + '" x2="' + x(20) + '" y1="' + y(3 + 1) + '" y2="' + y(3 + 10) + '" stroke="' + GREY2 + '" stroke-width="2"/>';
        s += ANS[k].map(p => '<circle class="fade-in" cx="' + x(p[0]) + '" cy="' + y(p[1]) + '" r="5" fill="' + ACC + '"/>').join('');
      }
      s += '</g>';
    });
    return svg(W, H, s, 'heat');
  }
  steps.push({
    id: 'anscombe', kicker: 'Pourquoi visualiser ?', title: 'Quatre jeux, mêmes statistiques',
    lead: 'Onze points chacun. Moyennes, corrélation, droite de régression : identiques, à deux décimales près.',
    build(b) {
      K.scrolly(b, {
        steps: ['<p>Les statistiques de chaque jeu.</p>' + ask('Les quatre nuages de points se ressemblent-ils ?'),
          '<p>Une droite, une courbe, une droite avec un point aberrant, une colonne et un point isolé. <mark>Les statistiques résument ; le graphique montre.</mark></p>'],
        render(el, i) { el.innerHTML = anscombe(i === 1) + '<div class="viz-caption">F. J. Anscombe, « Graphs in Statistical Analysis », <i>The American Statistician</i>, 1973.</div>'; }
      });
    }
  });

  // 5. Ce que la moyenne ne voit pas : les notes du bac 2025.
  steps.push({
    id: 'notes', kicker: 'Pourquoi visualiser ?', title: 'Ce que la moyenne ne voit pas',
    lead: 'Bac 2025 : ' + fr(D2.notes2025.total) + ' notes. Moyenne ' + fr(D2.notes2025.moyenne, 2) + ', médiane ' + fr(D2.notes2025.mediane, 2) + '. Changez la taille des classes de l’histogramme.',
    build(b) {
      const n = D2.notes2025.n, sizes = [[20, '2 points'], [10, '1 point'], [5, '0,5 point'], [1, '0,1 point']];
      b.innerHTML = '<div class="row" style="gap:6px">' + sizes.map(([k, t], i) => '<button class="chip" data-k="' + k + '"' + (i ? '' : ' aria-pressed="true"') + '>Classes de ' + t + '</button>').join('') + '</div>' +
        '<div class="viz main"><div data-chart></div><div class="viz-caption">Nombre de candidats par classe de notes (sur 20). ' + SRC_BAC + '</div></div><div data-q></div>';
      const draw = k => {
        const W = WW(), H = 290, l = 54, r = 10, t = 30, bt = 30;
        const bins = []; for (let i = 0; i < 200; i += k) bins.push([i / 10, n.slice(i, i + k).reduce((a, c) => a + c, 0)]);
        const mx = Math.max(...bins.map(x => x[1])), x = scale(0, 20, l, W - r), y = scale(0, mx * 1.12, H - bt, t), bw = x(k / 10) - x(0);
        const tk = mx > 20000 ? 10000 : mx > 8000 ? 4000 : mx > 4000 ? 2000 : 1000;
        const ticks = []; for (let v = 0; v <= mx * 1.12; v += tk) ticks.push(v);
        let s = yAxis(y, ticks, l, W - r, v => fr(v));
        [0, 5, 10, 15, 20].forEach(v => { s += '<text x="' + x(v) + '" y="' + (H - 10) + '" text-anchor="middle">' + v + '</text>'; });
        s += bins.map(([g, c]) => '<rect x="' + (x(g) + (bw > 3 ? .5 : 0)) + '" y="' + y(c) + '" width="' + Math.max(1, bw - (bw > 3 ? 1 : 0)) + '" height="' + (y(0) - y(c)) + '" fill="' + (k === 1 && (g === 10 || g === 0) ? ACC : GREY) + '"/>').join('');
        if (k === 1) {
          s += '<text x="' + (x(10) + 8) + '" y="' + (y(n[100]) + 14) + '" class="lbl-accent" style="' + halo + '">' + fr(n[100]) + ' entre 10,0 et 10,1</text>' +
            '<line x1="' + x(9.5) + '" x2="' + x(9.5) + '" y1="' + y(150) + '" y2="' + y(1500) + '" stroke="' + INK + '" stroke-width="1"/>' +
            '<text x="' + (x(9.5) - 4) + '" y="' + (y(1500) - 4) + '" text-anchor="end" class="lbl-strong" style="' + halo + '">de 9 à 10 : ' + fr(n.slice(90, 100).reduce((a, c) => a + c, 0)) + ' en tout</text>' +
            '<text x="' + (x(0) + 8) + '" y="' + (y(n[0]) + 14) + '" class="lbl-accent" style="' + halo + '">' + fr(n[0]) + ' notes sous 0,1</text>';
        }
        b.querySelector('[data-chart]').innerHTML = svg(W, H, s);
      };
      b.querySelectorAll('[data-k]').forEach(c => c.addEventListener('click', () => {
        b.querySelectorAll('[data-k]').forEach(o => o.setAttribute('aria-pressed', o === c ? 'true' : 'false')); draw(+c.dataset.k);
      }));
      draw(20);
      question(b.querySelector('[data-q]'), {
        prompt: 'Avec des classes de 0,1 point : pourquoi si peu de notes entre 9 et 10 (environ 550 par dixième juste avant 9), et un pic juste à 10 ?',
        options: [
          {t: 'Une erreur de saisie', why: 'Une erreur produirait du bruit dispersé, pas un trou net sous 10 suivi d’un pic à 10.'},
          {t: 'Les données ne le disent pas : à vérifier', ok: true, why: 'Délibération du jury, arrondi, règle de rachat ? Le graphique pose la question ; il ne donne pas la cause. Même chose pour le pic à 0 : absents ? copies blanches ?'},
          {t: 'Les candidats visent exactement 10', why: 'Personne ne peut viser une note au dixième près. Cherchez plutôt du côté de la façon dont la note est fixée.'}
        ]
      });
      b.insertAdjacentHTML('beforeend', M.note('lion', '<p><b>Regardez la distribution, pas seulement la moyenne.</b> Avec des classes larges, le pic disparaît : <mark>essayez toujours plusieurs tailles de classes</mark>.</p>'));
    }
  });

  /* ======================= Partie 3 · Choisir le bon graphique ======================= */

  // 6. Types de données.
  const VARS = [['Série (SN, M, LM, LO)', 0], ['Décision (ajourné, sessionnaire, admis)', 1], ['Note sur 20', 2], ['Wilaya', 0], ['Année de naissance', 2], ['Mention (passable, assez bien, bien…)', 1]];
  const TYPES = ['Catégorielle', 'Ordinale', 'Quantitative'];
  steps.push({
    id: 'types', kicker: 'Choisir', title: 'Quel type de données ?',
    lead: 'Le type de la variable décide des graphiques possibles. Classez ces colonnes d’un fichier du bac.',
    build(b) {
      const pick = VARS.map(() => -1);
      b.innerHTML = '<div class="styles-grid">' + VARS.map((v, i) => '<div class="style-card" data-i="' + i + '"><p><b>' + v[0] + '</b></p><div class="row">' + TYPES.map((t, j) => '<button class="chip" data-s="' + j + '">' + t + '</button>').join('') + '</div></div>').join('') + '</div>' +
        '<div class="row" style="margin-top:12px"><button class="btn btn-primary" data-check disabled>Vérifier</button></div><div data-after></div>';
      const check = b.querySelector('[data-check]');
      b.querySelectorAll('.style-card').forEach(card => card.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
        pick[+card.dataset.i] = +c.dataset.s;
        card.querySelectorAll('.chip').forEach(o => { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); o.classList.remove('is-right', 'is-wrong'); });
        check.disabled = pick.includes(-1);
      })));
      check.addEventListener('click', () => {
        let good = 0;
        b.querySelectorAll('.style-card').forEach(card => {
          const i = +card.dataset.i, ok = pick[i] === VARS[i][1]; good += ok;
          card.querySelector('[data-s="' + pick[i] + '"]').classList.add(ok ? 'is-right' : 'is-wrong');
          if (!ok) card.querySelector('[data-s="' + VARS[i][1] + '"]').classList.add('is-right');
        });
        b.querySelector('[data-after]').innerHTML = M.note('lion', '<p><b>' + good + ' sur ' + VARS.length + '.</b> Catégorielle : des noms sans ordre. Ordinale : des catégories <mark>ordonnées</mark>. Quantitative : des nombres qu’on peut additionner ou comparer en écart.</p>');
      });
    }
  });

  // 7. Quelle relation voulez-vous montrer ?
  const REL = [
    {k: 'Comparaison', ex: 'barres'},
    {k: 'Composition', ex: 'barres 100 %, camembert'},
    {k: 'Distribution', ex: 'histogramme, boîte'},
    {k: 'Relation', ex: 'nuage de points'},
    {k: 'Évolution', ex: 'courbe'}
  ];
  const MISSIONS = [
    ['Comparer le taux d’admission des 15 wilayas en 2025', 0],
    ['Montrer comment se répartissent les décisions du bac 2025', 1],
    ['Montrer comment se répartissent les notes des candidats', 2],
    ['Voir si le nombre de candidats d’une wilaya est lié à son taux', 3],
    ['Montrer le taux d’admission de 2015 à 2025', 4]
  ];
  // Pour chaque relation : un exemple sur les données du bac, quand l'utiliser, les pièges.
  function miniChart(k) {
    const W = 340, H = 200;
    if (k === 0) { const w = bac.wilaya2025.slice().sort((a, c) => c.taux - a.taux).slice(0, 6), l = 120, x = scale(0, 25, l, W - 40);
      return svg(W, H, w.map((d, i) => '<text x="' + (l - 6) + '" y="' + (i * 30 + 22) + '" text-anchor="end" style="font-size:11px">' + esc(d.w.replace('Nouakchott', 'NKC').replace('Dakhlet ', 'D. ')) + '</text><rect x="' + l + '" y="' + (i * 30 + 9) + '" width="' + (x(d.taux) - l) + '" height="18" fill="' + (i ? GREY2 : ACC) + '"/><text x="' + (x(d.taux) + 4) + '" y="' + (i * 30 + 22) + '" style="font-size:11px">' + fr(d.taux, 1) + '</text>').join('')); }
    if (k === 1) { const v = [['Admis', 18.8, ACC], ['Sessionnaire', 13.3, '#b8bcc6'], ['Ajourné', 67.9, '#dfe2e7']], x = scale(0, 100, 10, W - 10); let a = 0;
      return svg(W, H, '<text x="10" y="40" class="lbl-strong">Décisions du bac 2025</text>' + v.map(([n, p, c]) => { const r = '<rect x="' + x(a) + '" y="60" width="' + (x(a + p) - x(a)) + '" height="50" fill="' + c + '" stroke="#fff"/><text x="' + ((x(a) + x(a + p)) / 2) + '" y="132" text-anchor="middle" style="font-size:11px">' + n + '</text><text x="' + ((x(a) + x(a + p)) / 2) + '" y="148" text-anchor="middle" class="lbl-strong">' + fr(p, 1) + ' %</text>'; a += p; return r; }).join('')); }
    if (k === 2) { const n = D2.notes2025.n, bins = []; for (let i = 0; i < 200; i += 10) bins.push(n.slice(i, i + 10).reduce((a, c) => a + c, 0));
      const mx = Math.max(...bins), x = scale(0, 20, 20, W - 10), y = scale(0, mx, H - 30, 10);
      return svg(W, H, bins.map((c, i) => '<rect x="' + (x(i) + .5) + '" y="' + y(c) + '" width="' + (x(1) - x(0) - 1) + '" height="' + (y(0) - y(c)) + '" fill="' + (i === 10 ? ACC : GREY) + '"/>').join('') + [0, 10, 20].map(v => '<text x="' + x(v) + '" y="' + (H - 12) + '" text-anchor="middle" style="font-size:11px">' + v + '</text>').join('')); }
    if (k === 3) { const w = bac.wilaya2025, x = scale(0, 13000, 30, W - 10), y = scale(5, 25, H - 20, 10);
      return svg(W, H, w.map(d => '<circle cx="' + x(d.n) + '" cy="' + y(d.taux) + '" r="5" fill="' + (d.w.startsWith('Nouakchott') ? ACC : GREY) + '"/>').join('') + '<text x="' + (W - 10) + '" y="' + (H - 4) + '" text-anchor="end" style="font-size:11px">candidats →</text><text x="30" y="12" style="font-size:11px">taux ↑</text>'); }
    const x = scale(2015, 2025, 20, W - 30), y = scale(0, 25, H - 26, 10);
    return svg(W, H, '<path d="' + path(YRS.map((yy, i) => [x(yy), y(bac.taux[i])])) + '" fill="none" stroke="' + ACC + '" stroke-width="2.5"/>' + [2015, 2020, 2025].map(v => '<text x="' + x(v) + '" y="' + (H - 8) + '" text-anchor="middle" style="font-size:11px">' + v + '</text>').join(''));
  }
  const REL_DETAIL = [
    {quand: 'Comparer des valeurs entre catégories : wilayas, séries, produits.', ou: ['<b>Verticales</b> : peu de catégories (moins de 7).', '<b>Horizontales</b> : beaucoup de catégories, ou des noms longs. Triez-les.', '<b>Empilées</b> : comparer à la fois les totaux et leur composition.'], pieges: ['Axe qui ne commence pas à zéro.', 'Trop de barres : un « zèbre ». Gardez le top 10 ou passez au tableau.', 'Plus de 3 séries groupées : impossible à comparer.']},
    {quand: 'Montrer les parties d’un même tout, qui fait 100 %.', ou: ['<b>Barres empilées à 100 %</b> : le choix le plus sûr, surtout pour comparer plusieurs touts.', '<b>Camembert</b> : seulement 2 à 4 parts, bien différentes.'], pieges: ['Parts qui ne font pas 100 % (Fox, 2009).', 'Comparer des angles ou des aires : l’œil s’y trompe.', 'La 3D, qui grossit les parts de devant.']},
    {quand: 'Voir comment se répartit une variable quantitative : étalement, pics, trous, valeurs isolées.', ou: ['<b>Histogramme</b> : une variable, des classes de même largeur.', '<b>Boîte à moustaches</b> : comparer plusieurs groupes.', '<b>Graphique en points</b> : comparer des valeurs selon deux dimensions (catégories et groupes).'], pieges: ['Une seule taille de classes : le pic à 10 peut disparaître.', 'Se fier à la moyenne seule.']},
    {quand: 'Voir si deux quantités varient ensemble, et dans quel sens.', ou: ['<b>Nuage de points</b> : un point par individu (ici une wilaya).', 'Avec beaucoup de points : transparence, petits multiples ou carte de densité.'], pieges: ['Surcharge : les points se cachent les uns les autres.', 'Corrélation n’est pas causalité.', 'Une droite de tendance sur du bruit, ou tirée par trois points.']},
    {quand: 'Montrer une tendance, une accélération, une rupture dans le temps.', ou: ['<b>Courbe</b> : temps continu, jusqu’à 4 ou 5 séries.', '<b>Petits multiples</b> au-delà.', '<b>Barres</b> si les périodes sont peu nombreuses et distinctes.'], pieges: ['Le spaghetti.', 'Le rapport d’aspect qui exagère ou écrase la pente.', 'Des intervalles irréguliers (janvier, février, décembre) placés comme s’ils étaient réguliers.']}
  ];
  function detailHTML(i) {
    const d = REL_DETAIL[i];
    return '<div class="rel-detail fade-in"><div class="rel-mini">' + miniChart(i) + '<div class="viz-caption">Exemple : données du bac.</div></div><div>' +
      '<h3>' + REL[i].k + '</h3><p><b>Quand ?</b> ' + d.quand + '</p><ul class="biblio">' + d.ou.map(x => '<li>' + x + '</li>').join('') + '</ul>' +
      '<p style="margin:10px 0 4px"><b>Pièges</b></p><ul class="biblio pieges">' + d.pieges.map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>';
  }
  steps.push({
    id: 'choisir', kicker: 'Choisir', title: 'Quelle relation voulez-vous montrer ?',
    lead: 'Avant le graphique, la question : <b>comparer, décomposer, répartir, relier ou suivre dans le temps ?</b> Ouvrez chaque famille.',
    build(b) {
      b.innerHTML = '<div class="rel-cards">' + REL.map((r, i) => '<button class="rel-card" data-r="' + i + '"><b>' + r.k + '</b><span>' + r.ex + '</span></button>').join('') + '</div><div data-detail></div>' +
        '<p class="small" style="margin-top:14px"><b>À vous :</b> pour chaque question, quelle relation ?</p>' +
        '<div class="missions">' + MISSIONS.map((m, i) => '<div class="style-card" data-m="' + i + '"><p><b>' + (i + 1) + '.</b> ' + m[0] + '</p><div class="row">' + REL.map((r, j) => '<button class="chip" data-r="' + j + '">' + r.k + '</button>').join('') + '</div></div>').join('') + '</div>';
      b.querySelectorAll('.missions .style-card').forEach(card => card.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
        const m = MISSIONS[+card.dataset.m], ok = +c.dataset.r === m[1];
        card.querySelectorAll('.chip').forEach(o => o.classList.remove('is-right', 'is-wrong'));
        c.classList.add(ok ? 'is-right' : 'is-wrong');
        if (ok) show(m[1]);
      })));
      const show = i => { b.querySelectorAll('.rel-card').forEach(r => r.classList.toggle('is-on', +r.dataset.r === i)); b.querySelector('[data-detail]').innerHTML = detailHTML(i); };
      b.querySelectorAll('.rel-card').forEach(r => r.addEventListener('click', () => show(+r.dataset.r)));
      show(0);
    }
  });

  /* ======================= Partie 4 · Chaque graphique a ses pièges ======================= */

  // 8. Barres : trop de barres.
  steps.push({
    id: 'barres', kicker: 'Barres', title: 'Trois cents barres',
    lead: 'Les prénoms du fichier, un par barre. Quel est le 5<sup>e</sup> prénom le plus fréquent ?',
    build(b) {
      const P = D.prenoms.noms, rows = Object.keys(P).map(k => [k, P[k].n.reduce((a, c) => a + c, 0)]);
      b.innerHTML = '<div class="row" style="gap:6px"><button class="chip" data-v="all" aria-pressed="true">' + rows.length + ' prénoms</button><button class="chip" data-v="alpha">Top 10, ordre alphabétique</button><button class="chip" data-v="random">Top 10, au hasard</button><button class="chip" data-v="top">Top 10, triés</button></div><div class="viz main"><div data-chart></div><div class="viz-caption">Personnes par prénom dans le fichier (nées entre 1975 et 2007).</div></div>';
      const draw = v => {
        const W = WW();
        if (v === 'all') {
          const H = 240, l = 58, x = i => l + i * (W - l - 10) / rows.length, mx = Math.max(...rows.map(r => r[1])), y = scale(0, mx, H - 20, 10);
          const sorted = rows.slice().sort((a, c) => a[0].localeCompare(c[0]));
          b.querySelector('[data-chart]').innerHTML = svg(W, H, yAxis(y, [0, 5000, 10000], l, W - 10, fr) + sorted.map((r, i) => '<rect x="' + x(i) + '" y="' + y(r[1]) + '" width="' + Math.max(.8, (W - l - 10) / rows.length - .4) + '" height="' + (y(0) - y(r[1])) + '" fill="' + GREY + '"/>').join(''));
        } else {
          let top = rows.slice().sort((a, c) => c[1] - a[1]).slice(0, 10);
          const fifth = top[4][0];
          if (v === 'alpha') top = top.slice().sort((a, c) => a[0].localeCompare(c[0]));
          if (v === 'random') top = [7, 2, 9, 0, 5, 3, 8, 1, 6, 4].map(i => top[i]);
          const l = narrow() ? 110 : 150, H = 10 * 28 + 10, x = scale(0, Math.max(...top.map(r => r[1])), l, W - 70);
          b.querySelector('[data-chart]').innerHTML = svg(W, H, top.map((r, i) => '<text x="' + (l - 8) + '" y="' + (i * 28 + 22) + '" text-anchor="end" class="' + (v === 'top' && r[0] === fifth ? 'lbl-accent' : '') + '">' + esc(r[0]) + '</text><rect x="' + l + '" y="' + (i * 28 + 8) + '" width="' + (x(r[1]) - l) + '" height="18" fill="' + (v === 'top' && r[0] === fifth ? ACC : GREY2) + '"/><text x="' + (x(r[1]) + 6) + '" y="' + (i * 28 + 22) + '">' + fr(r[1]) + '</text>').join(''));
        }
      };
      b.querySelectorAll('[data-v]').forEach(c => c.addEventListener('click', () => { b.querySelectorAll('[data-v]').forEach(o => o.setAttribute('aria-pressed', o === c ? 'true' : 'false')); draw(c.dataset.v); }));
      draw('all');
      b.insertAdjacentHTML('beforeend', M.note('lion', '<p><b>Trop de barres : un motif « zèbre ».</b> Montrez le top 10, ou passez à un tableau. Et <mark>triez</mark> : l’ordre alphabétique ou le hasard obligent l’œil à chercher.</p>'));
    }
  });

  // 9. Lignes : le spaghetti, puis le rapport d'aspect.
  function spaghetti(hi) {
    const WY = bac.wilayaYears, names = Object.keys(WY), W = WW(), H = 300, l = 42, r = narrow() ? 90 : 130, t = 16, bt = 30;
    const x = scale(2015, 2025, l, W - r), y = scale(0, 30, H - bt, t), pal = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac', '#1f77b4', '#d62728', '#2ca02c', '#9467bd', '#8c564b'];
    let s = yAxis(y, [0, 10, 20, 30], l, W - r, v => v + ' %');
    [2015, 2020, 2025].forEach(yy => { s += '<text x="' + x(yy) + '" y="' + (H - 8) + '" text-anchor="middle">' + yy + '</text>'; });
    names.forEach((w, k) => {
      const on = w === hi, c = hi ? (on ? ACC : GREY2) : pal[k];
      let seg = [], d = '';
      WY[w].forEach((v, i) => { if (v == null) { if (seg.length > 1) d += path(seg); seg = []; } else seg.push([x(YRS[i]), y(v)]); });
      if (seg.length > 1) d += path(seg);
      s += '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (on ? 3 : 1.6) + '"' + (on ? '' : ' opacity="' + (hi ? 1 : .9) + '"') + '/>';
    });
    if (hi) s += '<text x="' + (x(2025) + 6) + '" y="' + (y(WY[hi][10]) + 4) + '" class="lbl-accent">' + esc(hi) + '</text>';
    else s += '<text x="' + (x(2025) + 6) + '" y="' + (t + 10) + '" style="font-size:11px">15 couleurs,</text><text x="' + (x(2025) + 6) + '" y="' + (t + 26) + '" style="font-size:11px">15 wilayas…</text>';
    return svg(W, H, s);
  }
  steps.push({
    id: 'lignes', kicker: 'Lignes', title: 'Le spaghetti et la pente',
    lead: 'Quinze wilayas sur un même graphique : qui suit qui ?',
    build(b) {
      K.scrolly(b, {
        steps: ['<p>Quinze courbes, quinze couleurs.</p>' + ask('Où est Guidimagha ?'),
          '<p>Une couleur pour celle dont on parle, du gris pour le contexte. Sinon : des <b>petits multiples</b>, comme pour les perles.</p>'],
        render(el, i) { el.innerHTML = spaghetti(i ? 'Guidimagha' : null) + '<div class="viz-caption">Taux d’admission par wilaya. ' + SRC_BAC + '</div>'; }
      });
      const T = D2.tempMois;
      b.insertAdjacentHTML('beforeend', '<h3 style="margin-top:28px">Faut-il partir de zéro ?</h3><p class="small">Pour des barres, oui : on compare des longueurs. Pour une courbe, non : on lit une pente.</p>' +
        '<div class="viz"><div class="row" style="gap:6px"><button class="chip" data-z="0">Axe à partir de 0 °C</button><button class="chip" data-z="20" aria-pressed="true">Axe à partir de 20 °C</button></div><div data-zero></div><div class="viz-caption">Température moyenne mensuelle à Nouakchott, 2023.</div></div>');
      const drawZ = z => {
        const T = D2.tempMois.temp.slice(36, 48), W = WW(), H = 200, l = 40, x = scale(0, 11, l, W - 10), y = scale(z, 32, H - 26, 10);
        let s = yAxis(y, z ? [20, 25, 30] : [0, 10, 20, 30], l, W - 10, v => v + '°');
        s += K.MOIS.map((m, i) => i % 3 ? '' : '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + m + '</text>').join('');
        s += '<path d="' + path(T.map((v, i) => [x(i), y(v)])) + '" fill="none" stroke="' + ACC + '" stroke-width="2.5"/>';
        b.querySelector('[data-zero]').innerHTML = svg(W, H, s);
        b.querySelectorAll('[data-z]').forEach(c => c.setAttribute('aria-pressed', +c.dataset.z === z ? 'true' : 'false'));
      };
      b.querySelectorAll('[data-z]').forEach(c => c.addEventListener('click', () => drawZ(+c.dataset.z))); drawZ(20);
      b.insertAdjacentHTML('beforeend', '<h3 style="margin-top:28px">Le rapport d’aspect</h3><p class="small">Même série, même échelle : seule la hauteur du graphique change. La chaleur « explose »-t-elle à Nouakchott ?</p>' +
        '<div class="viz"><div class="row" style="gap:12px"><label class="small" for="asp">Hauteur</label><input id="asp" type="range" min="60" max="380" value="110" style="flex:1;accent-color:' + ACC + '"></div><div data-asp></div><div class="viz-caption">Température moyenne mensuelle à Nouakchott, 2020–2024.</div></div>');
      const drawA = h => {
        const W = WW(), l = 40, x = scale(0, T.temp.length - 1, l, W - 10), y = scale(20, 32, h - 8, 8);
        let s = '<text x="' + (l - 6) + '" y="' + (y(30) + 4) + '" text-anchor="end">30°</text><text x="' + (l - 6) + '" y="' + (y(22) + 4) + '" text-anchor="end">22°</text>';
        s += '<path d="' + path(T.temp.map((v, i) => [x(i), y(v)])) + '" fill="none" stroke="' + ACC + '" stroke-width="2"/>';
        b.querySelector('[data-asp]').innerHTML = svg(W, h, s);
      };
      const a = b.querySelector('#asp'); a.addEventListener('input', () => drawA(+a.value)); drawA(110);
      b.insertAdjacentHTML('beforeend', M.note('ghost', '<p><b>Étirer ou écraser un graphique change la pente perçue.</b> Ni drame, ni calme plat : choisissez une forme honnête et gardez-la pour comparer.</p>'));
    }
  });

  // 10. Nuages de points : la droite qui ment.
  steps.push({
    id: 'nuage', kicker: 'Nuage de points', title: 'Plus de candidats, plus d’admis ?',
    lead: 'Chaque point est une wilaya en 2025 : nombre de candidats et taux d’admission.',
    build(b) {
      const w = bac.wilaya2025, st = {fit: false, noNkc: false};
      b.innerHTML = '<div class="row" style="gap:6px"><button class="chip" data-t="fit">Ajouter une droite de tendance</button><button class="chip" data-t="noNkc">Retirer les 3 wilayas de Nouakchott</button></div><div class="viz main"><div data-chart></div><div class="viz-caption">' + SRC_BAC + '</div></div><div data-q></div>';
      const draw = () => {
        const W = WW(), H = 300, l = 46, r = 20, t = 20, bt = 36, pts = w.filter(d => !(st.noNkc && d.w.startsWith('Nouakchott')));
        const x = scale(0, 13000, l, W - r), y = scale(5, 25, H - bt, t);
        let s = yAxis(y, [5, 10, 15, 20, 25], l, W - r, v => v + ' %');
        [0, 5000, 10000].forEach(v => { s += '<text x="' + x(v) + '" y="' + (H - 14) + '" text-anchor="middle">' + fr(v) + '</text>'; });
        s += '<text x="' + (W - r) + '" y="' + (H - 2) + '" text-anchor="end" style="font-size:11px">candidats</text>';
        if (st.fit) {
          const n = pts.length, mx = pts.reduce((a, d) => a + d.n, 0) / n, my = pts.reduce((a, d) => a + d.taux, 0) / n;
          const sxy = pts.reduce((a, d) => a + (d.n - mx) * (d.taux - my), 0), sxx = pts.reduce((a, d) => a + (d.n - mx) ** 2, 0), syy = pts.reduce((a, d) => a + (d.taux - my) ** 2, 0);
          const sl = sxy / sxx, r0 = sxy / Math.sqrt(sxx * syy), xa = 0, xb = st.noNkc ? 5000 : 13000;
          s += '<line x1="' + x(xa) + '" x2="' + x(xb) + '" y1="' + y(my + sl * (xa - mx)) + '" y2="' + y(my + sl * (xb - mx)) + '" stroke="' + BAD + '" stroke-width="2.5"/>' +
            '<text x="' + x(xb) + '" y="' + (y(my + sl * (xb - mx)) - 10) + '" text-anchor="end" style="fill:' + BAD + ';font-weight:700;' + halo + '">r = ' + fr(r0, 2) + '</text>';
        }
        const off = {'Nouakchott Ouest': [-9, -10, 'end'], 'Nouakchott Nord': [8, 20, 'start'], 'Nouakchott Sud': [-9, -10, 'end'], 'Guidimagha': [9, -9, 'start']};
        s += pts.map(d => { const nk = d.w.startsWith('Nouakchott'), o = off[d.w]; return '<circle cx="' + x(d.n) + '" cy="' + y(d.taux) + '" r="6" fill="' + (nk ? ACC : GREY) + '"/>' + (o ? '<text x="' + (x(d.n) + o[0]) + '" y="' + (y(d.taux) + o[1]) + '" text-anchor="' + o[2] + '" style="font-size:11px;' + halo + '">' + esc(d.w.replace('Nouakchott ', 'NKC ')) + '</text>' : ''); }).join('');
        b.querySelector('[data-chart]').innerHTML = svg(W, H, s);
      };
      b.querySelectorAll('[data-t]').forEach(c => c.addEventListener('click', () => { st[c.dataset.t] = !st[c.dataset.t]; c.setAttribute('aria-pressed', st[c.dataset.t] ? 'true' : 'false'); draw(); }));
      draw();
      question(b.querySelector('[data-q]'), {
        prompt: 'Avec la droite, r = 0,45. Plus une wilaya a de candidats, plus son taux est élevé ?',
        options: [
          {t: 'Oui, la droite le montre', why: 'Retirez les trois wilayas de Nouakchott : r tombe à −0,04. Trois points font toute la pente.'},
          {t: 'Non : ce sont les trois points de Nouakchott', ok: true, why: 'Sans eux, plus aucune relation (r = −0,04). Et même avec, la cause serait plutôt la ville que le nombre de candidats : <b>corrélation n’est pas causalité</b>.'},
          {t: 'Oui, mais seulement en ville', why: 'Trois points ne suffisent pas à établir une loi. Et la droite ne dit rien de la cause.'}
        ]
      });
    }
  });

  // 11. Camembert : angles contre longueurs.
  function pieOrBars(kind, tilt) {
    const W = WW(), H = 260, data = [['Assaba', 2982], ['Dakhlet Nouadhibou', 2763], ['Hodh El Gharbi', 3339]], tot = data.reduce((a, d) => a + d[1], 0), cols = ['#4e79a7', '#f28e2b', '#59a14f'];
    let s = '';
    if (kind === 'pie') {
      const cx = W / 2, cy = 130, r = 100, ry = tilt ? 52 : 100;
      if (tilt) s += '<ellipse cx="' + cx + '" cy="' + (cy + 18) + '" rx="' + r + '" ry="' + ry + '" fill="#8a8f99"/>';
      let a0 = Math.PI * .1;
      data.forEach((d, i) => {
        const a1 = a0 + d[1] / tot * 2 * Math.PI, big = a1 - a0 > Math.PI ? 1 : 0;
        s += '<path d="M' + cx + ' ' + cy + 'L' + (cx + r * Math.cos(a0)) + ' ' + (cy + ry * Math.sin(a0)) + 'A' + r + ' ' + ry + ' 0 ' + big + ' 1 ' + (cx + r * Math.cos(a1)) + ' ' + (cy + ry * Math.sin(a1)) + 'Z" fill="' + cols[i] + '" stroke="#fff" stroke-width="2"/>';
        a0 = a1;
      });
      s += data.map((d, i) => '<rect x="' + (narrow() ? 6 : 20) + '" y="' + (190 + i * 22) + '" width="12" height="12" fill="' + cols[i] + '"/><text x="' + (narrow() ? 24 : 38) + '" y="' + (201 + i * 22) + '">' + d[0] + '</text>').join('');
    } else {
      const l = narrow() ? 140 : 170, x = scale(0, 3500, l, W - 70);
      s += data.slice().sort((a, c) => c[1] - a[1]).map((d, i) => '<text x="' + (l - 8) + '" y="' + (40 + i * 60) + '" text-anchor="end">' + d[0] + '</text><rect x="' + l + '" y="' + (20 + i * 60) + '" width="' + (x(d[1]) - l) + '" height="30" fill="' + (i ? GREY2 : ACC) + '"/><text x="' + (x(d[1]) + 6) + '" y="' + (40 + i * 60) + '" class="lbl-strong">' + fr(d[1]) + '</text>').join('');
    }
    return svg(W, H, s);
  }
  steps.push({
    id: 'camembert', kicker: 'Camembert', title: 'Angles contre longueurs',
    lead: 'Candidats au bac 2025 dans trois wilayas. Laquelle en a le plus ?',
    build(b) {
      let tilt = false;
      b.innerHTML = '<div class="viz main"><div data-chart>' + pieOrBars('pie', false) + '</div><div class="viz-caption">' + SRC_BAC + '</div></div><div class="row" style="gap:6px"><button class="chip" data-3d>Camembert en 3D</button></div><div data-q></div>';
      b.querySelector('[data-3d]').addEventListener('click', e => { tilt = !tilt; e.target.setAttribute('aria-pressed', tilt ? 'true' : 'false'); b.querySelector('[data-chart]').innerHTML = pieOrBars('pie', tilt); });
      question(b.querySelector('[data-q]'), {
        prompt: 'Laquelle de ces trois wilayas a le plus de candidats ?',
        options: [{t: 'Assaba', why: '2 982. Proche de Dakhlet Nouadhibou : sur un camembert, impossible de trancher.'}, {t: 'Dakhlet Nouadhibou', why: '2 763, la plus petite des trois.'}, {t: 'Hodh El Gharbi', ok: true, why: '3 339. Avec des barres, la réponse est immédiate.'}],
        onSolved() { b.querySelector('[data-chart]').innerHTML = pieOrBars('bars'); b.querySelector('[data-3d]').hidden = true; b.querySelector('[data-q]').insertAdjacentHTML('beforeend', M.note('lion', '<p><b>L’œil compare bien les longueurs, mal les angles et les aires.</b> Camembert : moins de 5 parts, bien distinctes, <b>de la plus grande à la plus petite en partant de midi</b>, dans le sens des aiguilles d’une montre. Jamais en 3D : la perspective grossit les parts de devant.</p>')); }
      });
    }
  });

  // 12. Tableau : quand la valeur exacte compte.
  steps.push({
    id: 'tableau', kicker: 'Tableau', title: 'Parfois, un tableau',
    lead: 'Question précise : <b>quel était le taux d’admission en 2019 ?</b>',
    build(b) {
      const line = () => { const W = WW(), H = 220, l = 46, x = scale(2015, 2025, l, W - 20), y = scale(0, 25, H - 28, 12); let s = yAxis(y, [0, 10, 20], l, W - 20, v => v + ' %'); [2015, 2020, 2025].forEach(yy => { s += '<text x="' + x(yy) + '" y="' + (H - 8) + '" text-anchor="middle">' + yy + '</text>'; }); s += '<path d="' + path(YRS.map((yy, i) => [x(yy), y(bac.taux[i])])) + '" fill="none" stroke="' + ACC + '" stroke-width="2.5"/>'; return svg(W, H, s); };
      const table = '<table class="data"><thead><tr><th>Année</th>' + YRS.slice(3, 8).map(y => '<th>' + y + '</th>').join('') + '</tr></thead><tbody><tr><td>Taux (%)</td>' + YRS.slice(3, 8).map(y => '<td' + (y === 2019 ? ' style="background:#fff3c4;font-weight:700"' : '') + '>' + fr(at(y), 1) + '</td>').join('') + '</tr></tbody></table>';
      b.innerHTML = '<div class="viz main"><div data-chart>' + line() + '</div><div class="viz-caption">' + SRC_BAC + '</div></div><div class="row"><button class="btn" data-t>Montrer le tableau</button></div>';
      b.querySelector('[data-t]').addEventListener('click', e => { b.querySelector('[data-chart]').innerHTML = table; e.target.hidden = true; b.insertAdjacentHTML('beforeend', M.note('lion', '<p><b>7,3 %.</b> Pour chercher une valeur précise, le tableau gagne. Pour voir une tendance, le graphique. Un peu de couleur rend le tableau plus lisible.</p>')); });
    }
  });

  /* ======================= Partie 5 · Perception ======================= */

  // Le catalogue des attributs pré-attentifs.
  const ATTRS = [
    ['Orientation', (x, y, odd) => '<line x1="' + (x - 7) + '" y1="' + (y + (odd ? -7 : 0)) + '" x2="' + (x + 7) + '" y2="' + (y + (odd ? 7 : 0)) + '" stroke="' + INK + '" stroke-width="3"/>'],
    ['Longueur', (x, y, odd) => '<line x1="' + x + '" y1="' + (y - (odd ? 10 : 5)) + '" x2="' + x + '" y2="' + (y + (odd ? 10 : 5)) + '" stroke="' + INK + '" stroke-width="3"/>'],
    ['Épaisseur', (x, y, odd) => '<line x1="' + x + '" y1="' + (y - 7) + '" x2="' + x + '" y2="' + (y + 7) + '" stroke="' + INK + '" stroke-width="' + (odd ? 7 : 2) + '"/>'],
    ['Taille', (x, y, odd) => '<circle cx="' + x + '" cy="' + y + '" r="' + (odd ? 8 : 4) + '" fill="' + INK + '"/>'],
    ['Forme', (x, y, odd) => odd ? '<rect x="' + (x - 5) + '" y="' + (y - 5) + '" width="10" height="10" fill="' + INK + '"/>' : '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + INK + '"/>'],
    ['Courbure', (x, y, odd) => '<path d="M' + x + ' ' + (y - 7) + (odd ? 'q8 7 0 14' : 'v14') + '" fill="none" stroke="' + INK + '" stroke-width="2.5"/>'],
    ['Marque ajoutée', (x, y, odd) => '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + INK + '"/>' + (odd ? '<line x1="' + (x - 8) + '" y1="' + (y - 8) + '" x2="' + (x + 8) + '" y2="' + (y + 8) + '" stroke="' + INK + '" stroke-width="2"/>' : '')],
    ['Enclosure', (x, y, odd) => '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + INK + '"/>' + (odd ? '<rect x="' + (x - 9) + '" y="' + (y - 9) + '" width="18" height="18" fill="none" stroke="' + INK + '" stroke-width="1.5"/>' : '')],
    ['Intensité', (x, y, odd) => '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + (odd ? INK : GREY2) + '"/>'],
    ['Teinte', (x, y, odd) => '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + (odd ? BAD : GREY) + '"/>'],
    ['Position', (x, y, odd) => '<circle cx="' + x + '" cy="' + (y + (odd ? -9 : 0)) + '" r="4.5" fill="' + INK + '"/>'],
    ['Regroupement', (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="4.5" fill="' + INK + '"/>']
  ];
  steps.push({
    id: 'preattentif2', kicker: 'Voir sans lire', title: 'Le catalogue pré-attentif',
    lead: 'Au CM 1, la couleur faisait sauter les 7 aux yeux. Elle n’est pas seule : chaque case cache un intrus. Qu’est-ce qui le distingue ?',
    build(b) {
      const tile = (a, ti) => {
        const odd = (ti * 5 + 3) % 16; let s = '';
        for (let k = 0; k < 16; k++) {
          let x = 18 + (k % 4) * 26, y = 20 + Math.floor(k / 4) * 26;
          if (a[0] === 'Regroupement') { x = 14 + (k % 4) * 22 + (k % 4 === 3 ? 18 : 0); }
          s += a[1](x, y, k === odd && a[0] !== 'Regroupement', k);
        }
        return '<button class="pa-tile" data-t="' + ti + '">' + svg(120, 120, s) + '<span class="pa-name">' + a[0] + '</span></button>';
      };
      b.innerHTML = '<div class="pa-grid">' + ATTRS.map(tile).join('') + '</div><div class="row" style="margin-top:10px"><button class="btn btn-ghost" data-all-pa>Tout révéler</button></div>';
      b.querySelectorAll('.pa-tile').forEach(t => t.addEventListener('click', () => t.classList.add('is-on')));
      b.querySelector('[data-all-pa]').addEventListener('click', () => b.querySelectorAll('.pa-tile').forEach(t => t.classList.add('is-on')));
      b.insertAdjacentHTML('beforeend', M.note('lion', '<p><b>Douze attributs, lus avant toute lecture.</b> Utilisez-en un seul pour le message ; si tout ressort, plus rien ne ressort.</p>'));
    }
  });

  // Le rapport encre-données (Tufte), mesuré en pixels.
  const JUNK = [['fond', 'Fond gris'], ['d3', 'Effet 3D'], ['grille', 'Quadrillage lourd'], ['cadre', 'Cadre'], ['legende', 'Légende'], ['arc', 'Arc-en-ciel']];
  function inkChart(on, dataOnly) {
    const W = 680, H = 300, l = 60, r = 20, t = 40, bt = 40, rows = [['SN', 17.3], ['M', 40.8], ['LM', 10.4], ['LO', 25.1]];
    const x = i => l + 30 + i * 140, y = scale(0, 45, H - bt, t), bw = 70, pal = ['#4e79a7', '#f28e2b', '#e15759', '#59a14f'];
    let s = '';
    if (!dataOnly) {
      if (on.fond) s += '<rect width="' + W + '" height="' + H + '" fill="#e6e6e6"/>';
      if (on.cadre) s += '<rect x="2" y="2" width="' + (W - 4) + '" height="' + (H - 4) + '" fill="none" stroke="#222" stroke-width="3"/>';
      s += '<text x="' + l + '" y="26" style="font:700 16px Roboto;fill:#222">Taux d’admission au bac 2025 par série (%)</text>';
      [0, 10, 20, 30, 40].forEach(v => { s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="' + (on.grille ? '#555' : '#e5e7eb') + '" stroke-width="' + (on.grille ? 2 : 1) + '"/><text x="' + (l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" style="font:12px Roboto;fill:#555">' + v + '</text>'; });
      if (on.legende) s += '<rect x="' + (W - 150) + '" y="' + t + '" width="128" height="86" fill="#fff" stroke="#333" stroke-width="1.5"/>' + rows.map((rw, i) => '<rect x="' + (W - 140) + '" y="' + (t + 10 + i * 18) + '" width="12" height="12" fill="' + (on.arc ? pal[i] : ACC) + '"/><text x="' + (W - 122) + '" y="' + (t + 21 + i * 18) + '" style="font:12px Roboto;fill:#333">Série ' + rw[0] + '</text>').join('');
      rows.forEach((rw, i) => { s += '<text x="' + (x(i) + bw / 2) + '" y="' + (H - 16) + '" text-anchor="middle" style="font:13px Roboto;fill:#333">' + rw[0] + '</text>'; });
    }
    rows.forEach((rw, i) => {
      const c = on.arc ? pal[i] : ACC;
      if (on.d3 && !dataOnly) s += '<path d="M' + (x(i) + bw) + ' ' + y(rw[1]) + 'l14 -10v' + (y(0) - y(rw[1])) + 'l-14 10Z" fill="#333" opacity=".55"/><path d="M' + x(i) + ' ' + y(rw[1]) + 'l14 -10h' + bw + 'l-14 10Z" fill="#999"/>';
      s += '<rect x="' + x(i) + '" y="' + y(rw[1]) + '" width="' + bw + '" height="' + (y(0) - y(rw[1])) + '" fill="' + c + '"/>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" class="chart" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' + s + '</svg>';
  }
  // Compte les pixels encrés d'un SVG dessiné sur un canevas blanc.
  function inkPixels(svgStr) {
    return new Promise(res => {
      const img = new Image(), url = URL.createObjectURL(new Blob([svgStr], {type: 'image/svg+xml'}));
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = 680; c.height = 300;
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 680, 300); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, 680, 300).data; let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 720) n++;
        URL.revokeObjectURL(url); res(n);
      };
      img.onerror = () => res(0);
      img.src = url;
    });
  }
  steps.push({
    id: 'encre', kicker: 'Tufte', title: 'Le rapport encre-données',
    lead: 'Encre des données : ce qui montre les données (ici, les barres). Encre totale : tout ce qui est imprimé. Retirez ce qui ne sert pas et regardez le rapport monter.',
    build(b) {
      const on = {}; JUNK.forEach(j => { on[j[0]] = true; });
      b.innerHTML = '<div class="viz main"><div data-chart></div><div class="ink-meter"><div><small>Rapport encre-données</small><b data-ratio>…</b></div><div class="meter"><i data-bar></i></div></div><div class="viz-caption">Mesuré sur les pixels du graphique : pixels des barres ÷ pixels encrés au total. ' + SRC_BAC + '</div></div>' +
        '<div class="clutter-list">' + JUNK.map(j => '<button class="chip" data-j="' + j[0] + '">✕ ' + j[1] + '</button>').join('') + '</div>';
      const draw = async () => {
        const full = inkChart(on, false);
        b.querySelector('[data-chart]').innerHTML = full;
        const [tot, dat] = await Promise.all([inkPixels(full), inkPixels(inkChart(on, true))]);
        const r = tot ? dat / tot : 0;
        b.querySelector('[data-ratio]').textContent = fr(100 * r, 0) + ' %';
        const bar = b.querySelector('[data-bar]'); bar.style.width = (100 * r) + '%'; bar.style.background = r > .6 ? GOOD : r > .35 ? '#b07d2a' : BAD;
      };
      b.querySelectorAll('[data-j]').forEach(c => c.addEventListener('click', () => {
        on[c.dataset.j] = !on[c.dataset.j]; c.setAttribute('aria-pressed', on[c.dataset.j] ? 'false' : 'true');
        c.textContent = (on[c.dataset.j] ? '✕ ' : '↺ ') + JUNK.find(j => j[0] === c.dataset.j)[1]; draw();
      }));
      draw();
      b.insertAdjacentHTML('beforeend', M.note('lion', '<p><b>« Maximiser le rapport encre-données, dans la limite du raisonnable »</b> (Tufte). Le texte, les axes et le titre restent utiles : le but n’est pas 100 %, c’est de ne garder que l’encre qui sert.</p>'));
    }
  });

  // 13. Gestalt, suite : connexion, enclosure, clôture.
  function gestalt2(st) {
    const T = D2.tempMois, W = WW(), H = 280, l = 40, r = 14, t = 20, bt = 30;
    const x = scale(0, T.temp.length - 1, l, W - r), y = scale(20, 32, H - bt, t);
    let s = '';
    if (st >= 2) T.mois.forEach((m, i) => { if (m.endsWith('-09')) s += '<rect x="' + x(i - .5) + '" y="' + t + '" width="' + (x(i + 1.5) - x(i - .5)) + '" height="' + (H - bt - t) + '" fill="#fff3c4"/>'; });
    if (st < 3) s += '<rect x="' + l + '" y="' + t + '" width="' + (W - l - r) + '" height="' + (H - bt - t) + '" fill="none" stroke="#333" stroke-width="1.5"/>';
    s += '<text x="' + (l - 6) + '" y="' + (y(30) + 4) + '" text-anchor="end">30°</text><text x="' + (l - 6) + '" y="' + (y(25) + 4) + '" text-anchor="end">25°</text><text x="' + (l - 6) + '" y="' + (y(20) + 4) + '" text-anchor="end">20°</text>';
    [2020, 2021, 2022, 2023, 2024].forEach((yy, k) => { s += '<text x="' + x(k * 12 + 5.5) + '" y="' + (H - 8) + '" text-anchor="middle">' + yy + '</text>'; });
    if (st >= 1) s += '<path d="' + path(T.temp.map((v, i) => [x(i), y(v)])) + '" fill="none" stroke="' + ACC + '" stroke-width="2"/>';
    s += T.temp.map((v, i) => '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="' + (st >= 1 ? 2.5 : 3.5) + '" fill="' + (st >= 1 ? ACC : INK) + '"/>').join('');
    if (st >= 2) s += '<text x="' + x(8.5) + '" y="' + (t + 14) + '" text-anchor="middle" style="font-size:11px;font-weight:700">sept.–oct.</text>';
    return svg(W, H, s);
  }
  steps.push({
    id: 'gestalt2', kicker: 'Gestalt', title: 'Relier, entourer, laisser ouvert',
    lead: 'Température moyenne de chaque mois à Nouakchott, 2020–2024. Trois principes de la Gestalt, un par un.',
    build(b) {
      K.scrolly(b, {
        steps: [
          '<p>Soixante points, un par mois.</p>' + ask('Voyez-vous un rythme ?'),
          '<p><mark>Connexion</mark> : reliés par une ligne, des points indépendants deviennent une évolution.</p>',
          '<p><mark>Enclosure</mark> : un fond coloré regroupe ce qui va ensemble, ici les mois les plus chauds.</p>',
          '<p><mark>Clôture</mark> : pas besoin de cadre, l’œil le referme seul. Moins d’encre, même sens.</p>'
        ],
        render(el, i) { el.innerHTML = gestalt2(i) + '<div class="viz-caption">Météo quotidienne de Nouakchott, moyennes mensuelles.</div>'; }
      });
    }
  });

  // 14. La couleur : catégorielle, séquentielle, divergente, mise en évidence, alerte.
  function colorBars(mode) {
    const w = bac.wilaya2025.slice().sort((a, c) => c.taux - a.taux), W = WW(), l = narrow() ? 130 : 160, rh = 20, H = w.length * rh + 30, x = scale(0, 25, l, W - 50), nat = at(2025);
    const pal = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac', '#1f77b4', '#d62728', '#2ca02c', '#9467bd', '#8c564b'];
    const seq = v => { const t = Math.min(1, Math.max(0, (v - 8) / 16)); return 'rgb(' + Math.round(240 - t * 102) + ',' + Math.round(230 - t * 151) + ',' + Math.round(240 - t * 100) + ')'; };
    const div = v => { const d = v - nat, t = Math.min(1, Math.abs(d) / 8); return d >= 0 ? 'rgb(' + Math.round(235 - t * 97) + ',' + Math.round(225 - t * 146) + ',' + Math.round(235 - t * 95) + ')' : 'rgb(' + Math.round(240 - t * 60) + ',' + Math.round(220 - t * 137) + ',' + Math.round(205 - t * 163) + ')'; };
    let s = '';
    w.forEach((d, i) => {
      const c = mode === 0 ? pal[i] : mode === 1 ? seq(d.taux) : mode === 2 ? div(d.taux) : mode === 3 ? (d.w === 'Guidimagha' ? ACC : GREY2) : (d.taux < 15 ? BAD : GREY2);
      s += '<text x="' + (l - 6) + '" y="' + (i * rh + 14) + '" text-anchor="end" style="font-size:12px">' + esc(d.w) + '</text><rect x="' + l + '" y="' + (i * rh + 3) + '" width="' + (x(d.taux) - l) + '" height="' + (rh - 5) + '" fill="' + c + '"/><text x="' + (x(d.taux) + 4) + '" y="' + (i * rh + 14) + '" style="font-size:11px">' + fr(d.taux, 1) + '</text>';
    });
    if (mode === 2) s += '<line x1="' + x(nat) + '" x2="' + x(nat) + '" y1="0" y2="' + (H - 24) + '" stroke="' + INK + '" stroke-dasharray="4 3"/><text x="' + x(nat) + '" y="' + (H - 8) + '" text-anchor="middle" style="font-size:11px">moyenne 18,8</text>';
    if (mode === 4) s += '<line x1="' + x(15) + '" x2="' + x(15) + '" y1="0" y2="' + (H - 24) + '" stroke="' + BAD + '" stroke-dasharray="4 3"/><text x="' + x(15) + '" y="' + (H - 8) + '" text-anchor="middle" style="font-size:11px;fill:' + BAD + '">seuil 15 %</text>';
    return svg(W, H, s, 'heat');
  }
  steps.push({
    id: 'couleur', kicker: 'Couleur', title: 'Cinq façons d’utiliser la couleur',
    lead: 'Taux d’admission 2025 par wilaya. Même graphique, la couleur seule change… et le message avec.',
    build(b) {
      let cb = false;
      const sc = K.scrolly(b, {
        steps: [
          '<p><b>Catégorielle</b> : une couleur par wilaya.</p>' + ask('Que nous disent ces couleurs ?'),
          '<p><b>Séquentielle</b> : du clair au foncé, du plus faible au plus fort. Pour une quantité.</p>',
          '<p><b>Divergente</b> : deux teintes de part et d’autre d’un centre, ici la moyenne nationale.</p>',
          '<p><b>Mise en évidence</b> : une couleur pour le message, du gris pour le reste.</p>',
          '<p><b>Alerte</b> : le rouge pour ce qui demande une action, avec parcimonie.</p>'
        ],
        render(el, i) {
          el.innerHTML = '<div class="cb-wrap' + (cb ? ' is-cb' : '') + '">' + colorBars(i) + '</div><div class="row" style="margin-top:6px"><button class="chip cb-toggle" aria-pressed="' + cb + '">Voir comme une personne daltonienne</button></div><div class="viz-caption">' + SRC_BAC + '</div>';
          el.querySelector('.cb-toggle').addEventListener('click', e => { e.stopPropagation(); cb = !cb; el.querySelector('.cb-wrap').classList.toggle('is-cb', cb); e.target.setAttribute('aria-pressed', cb); });
        }
      });
      if (!document.getElementById('cb-filter')) document.body.insertAdjacentHTML('beforeend', '<svg id="cb-filter" width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="deut"><feColorMatrix type="matrix" values="0.367 0.861 -0.228 0 0  0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0  0 0 0 1 0"/></filter></svg>');
      b.insertAdjacentHTML('beforeend', '<aside class="info-box"><h3>Décrire une couleur</h3><p><b>Teinte</b> : rouge, vert, bleu… <b>Saturation</b> : intense ou délavée. <b>Valeur</b> : claire ou foncée.</p>' +
        '<h3>À faire, à éviter</h3><ul class="biblio"><li>Une même variable garde <b>la même couleur</b> d’un graphique et d’une diapositive à l’autre.</li><li>Pas plusieurs couleurs pour une même sorte de données : une couleur doit vouloir dire quelque chose.</li><li>Une teinte <b>plus foncée</b> ou une couleur différente pour le point qui compte.</li></ul></aside>');
      b.insertAdjacentHTML('beforeend', M.note('ghost', '<p><b>Environ un homme sur douze</b> distingue mal le rouge du vert. Testez vos palettes, et ne codez jamais une information <mark>par la couleur seule</mark>.</p>'));
    }
  });

  // 15. Les étiquettes : ne faites pas tourner la tête.
  steps.push({
    id: 'texte', kicker: 'Texte', title: 'Le texte et l’espace blanc',
    lead: 'Typographie, étiquettes, espace : six défauts courants. Retirez-les un par un.',
    build(b) {
      const BADS = [['caps', 'TITRE EN MAJUSCULES'], ['fancy', 'Police fantaisie'], ['bold', 'Gras partout'], ['tiny', 'Texte minuscule'], ['tilt', 'Étiquettes penchées'], ['cramp', 'Pas d’espace blanc']];
      const on = {}; BADS.forEach(x => { on[x[0]] = true; });
      const draw = () => {
        const w = bac.wilaya2025.slice().sort((a, c) => c.taux - a.taux).slice(0, 8), W = WW(), N = narrow();
        const fs = on.tiny ? 8 : 13, fw = on.bold ? 700 : 400, ff = on.fancy ? '\'Brush Script MT\', \'Comic Sans MS\', cursive' : 'Roboto, Arial, sans-serif';
        const title = on.caps ? 'TAUX D’ADMISSION 2025 : LES 8 PREMIÈRES WILAYAS' : 'Taux d’admission 2025 : les 8 premières wilayas';
        const pad = on.cramp ? 2 : 22, gap = on.cramp ? 1 : 8;
        let s = '<text x="' + pad + '" y="' + (on.cramp ? 14 : 30) + '" style="font-family:' + ff + ';font-size:' + (on.tiny ? 11 : 18) + 'px;font-weight:700;fill:' + INK + '">' + title + '</text>';
        if (on.tilt) {
          const top = on.cramp ? 22 : 56, H = 300, l = pad, bw = (W - 2 * pad) / w.length, y = scale(0, 25, 200, top);
          w.forEach((d, i) => { s += '<rect x="' + (l + i * bw + gap / 2) + '" y="' + y(d.taux) + '" width="' + (bw - gap) + '" height="' + (y(0) - y(d.taux)) + '" fill="' + GREY + '"/><text transform="translate(' + (l + i * bw + bw / 2 + 4) + ' 208) rotate(-60)" text-anchor="end" style="font-family:' + ff + ';font-size:' + fs + 'px;font-weight:' + fw + '">' + esc(d.w) + '</text>'; });
          return svg(W, H, s, 'heat');
        }
        const top = on.cramp ? 20 : 54, rh = on.cramp ? 21 : 30, H = top + w.length * rh + pad, l = N ? 130 : 160, x = scale(0, 25, l + pad, W - pad - 50);
        w.forEach((d, i) => { const y0 = top + i * rh; s += '<text x="' + (l + pad - 8) + '" y="' + (y0 + rh / 2 + 4) + '" text-anchor="end" style="font-family:' + ff + ';font-size:' + fs + 'px;font-weight:' + fw + '">' + esc(d.w) + '</text><rect x="' + (l + pad) + '" y="' + (y0 + gap / 2) + '" width="' + (x(d.taux) - l - pad) + '" height="' + (rh - gap) + '" fill="' + GREY + '"/><text x="' + (x(d.taux) + 6) + '" y="' + (y0 + rh / 2 + 4) + '" style="font-family:' + ff + ';font-size:' + fs + 'px;font-weight:' + fw + '">' + fr(d.taux, 1) + '</text>'; });
        return svg(W, H, s, 'heat');
      };
      b.innerHTML = '<div class="viz main"><div data-chart></div><p class="small" data-left style="margin:6px 0 0"></p><div class="viz-caption">' + SRC_BAC + '</div></div><div class="clutter-list">' + BADS.map(x => '<button class="chip" data-k="' + x[0] + '">✕ ' + x[1] + '</button>').join('') + '</div>';
      const refresh = () => { b.querySelector('[data-chart]').innerHTML = draw(); const n = Object.values(on).filter(Boolean).length; b.querySelector('[data-left]').textContent = n ? 'Défauts restants : ' + n : 'Plus rien à corriger.'; };
      b.querySelectorAll('[data-k]').forEach(c => c.addEventListener('click', () => { on[c.dataset.k] = !on[c.dataset.k]; c.setAttribute('aria-pressed', on[c.dataset.k] ? 'false' : 'true'); c.textContent = (on[c.dataset.k] ? '✕ ' : '↺ ') + BADS.find(x => x[0] === c.dataset.k)[1]; refresh(); }));
      refresh();
      b.insertAdjacentHTML('beforeend', '<aside class="info-box"><h3>Règles de lisibilité</h3><ul class="biblio"><li>Une ou deux polices simples ; empattements (serif) pour les titres, sans empattement pour les étiquettes.</li><li>Pas de texte trop petit ; pas de MAJUSCULES pour des phrases ; le gras avec parcimonie, pour un seul point.</li><li>Pas de texte incliné : tournez le graphique (barres horizontales).</li><li><b>L’espace blanc n’est pas vide</b> : il sépare, met en valeur et évite le « choc du désordre ». « Le silence permet à la musique d’être entendue. »</li></ul></aside>');
    }
  });

  // Une refonte complète, puis une histoire racontée en étapes (exemples de fin du support 2025-2026).
  function refonte(st) {
    const T = D2.tempMois.temp, a23 = T.slice(36, 48), a24 = T.slice(48, 60), W = WW(), N = narrow();
    const bad = st === 0, story = st >= 4, l = 42, r = N ? 70 : 90, t = st === 6 ? 64 : 30, H = 290, bt = bad ? 46 : 28;
    const x = scale(0, 11, l, W - r), y = scale(bad ? 0 : 20, bad ? 35 : 32, H - bt, t);
    let s = '';
    if (bad) {
      s += '<text x="' + W / 2 + '" y="18" text-anchor="middle" style="font:700 14px Roboto;fill:#333">Température moyenne mensuelle</text>';
      [0, 5, 10, 15, 20, 25, 30, 35].forEach(v => { s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#999"/><text x="' + (l - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" style="font-size:10px">' + v + '</text>'; });
      K.MOIS.forEach((m, i) => { s += '<text transform="translate(' + x(i) + ' ' + (H - bt + 12) + ') rotate(-40)" text-anchor="end" style="font:italic 11px Georgia;fill:#7b3fa0">' + m + '</text>'; });
      s += '<path d="' + path(a23.map((v, i) => [x(i), y(v)])) + '" fill="none" stroke="#2e86de" stroke-width="2"/>' + a23.map((v, i) => '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3.5" fill="#2e86de"/>').join('');
      s += '<path d="' + path(a24.map((v, i) => [x(i), y(v)])) + '" fill="none" stroke="#e67e22" stroke-width="2"/>' + a24.map((v, i) => '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3.5" fill="#e67e22"/>').join('');
      s += '<rect x="' + (W / 2 - 80) + '" y="' + (H - 14) + '" width="160" height="12" fill="none"/><text x="' + (W / 2 - 40) + '" y="' + (H - 3) + '" style="font-size:10px;fill:#2e86de">— 2023</text><text x="' + (W / 2 + 10) + '" y="' + (H - 3) + '" style="font-size:10px;fill:#e67e22">— 2024</text>';
      return svg(W, H, s);
    }
    if (st === 6) s += K.tlines(0, 22, '2024 a suivi 2023… sauf en septembre, 2,5 °C plus frais', N ? 32 : 99, 'class="title"', 22);
    s += yAxis(y, [20, 25, 30], l, W - r, v => v + ' °C');
    K.MOIS.forEach((m, i) => { if (i % 2 === 0) s += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + m + '</text>'; });
    const c23 = st === 1 ? '#2e86de' : GREY2, c24 = st === 1 ? '#e67e22' : ACC;
    const show24 = !story || st >= 5, upto = st === 5 ? 8 : 12;
    s += '<path d="' + path(a23.map((v, i) => [x(i), y(v)])) + '" fill="none" stroke="' + (story && st === 4 ? GREY : c23) + '" stroke-width="2.5"/>' +
      '<text x="' + (x(11) + 6) + '" y="' + (y(a23[11]) + 14) + '" style="fill:#8f95a1;font-weight:700">2023</text>';
    if (show24) {
      s += '<path d="' + path(a24.slice(0, upto).map((v, i) => [x(i), y(v)])) + '" fill="none" stroke="' + c24 + '" stroke-width="3"/>' +
        '<text x="' + (x(upto - 1) + 6) + '" y="' + (y(a24[upto - 1]) - 6) + '" style="fill:' + c24 + ';font-weight:700">2024</text>';
    }
    if (st === 3 || st === 6) {
      s += '<circle cx="' + x(8) + '" cy="' + ((y(a23[8]) + y(a24[8])) / 2) + '" r="' + (Math.abs(y(a23[8]) - y(a24[8])) / 2 + 12) + '" fill="none" stroke="' + BAD + '" stroke-width="2"/>' +
        '<text x="' + (x(8) - 30) + '" y="' + (y(a24[8]) + 30) + '" text-anchor="end" style="fill:' + BAD + ';font-weight:700;' + halo + '">sept. : −2,5 °C</text>';
    }
    return svg(W, H, s);
  }
  steps.push({
    id: 'refonte', kicker: 'Mise en pratique', title: 'Une refonte, puis une histoire',
    lead: 'Températures mensuelles à Nouakchott, 2023 et 2024. D’abord désencombrer, puis raconter en étapes.',
    build(b) {
      K.scrolly(b, {
        steps: [
          '<p><b>Ne faites pas ce graphique.</b> Quadrillage, marqueurs, légende loin des courbes, mois en italique et penchés, axe depuis 0.</p>' + ask('Que retirez-vous en premier ?'),
          '<p><b>Désencombrer</b> : moins de quadrillage, plus de marqueurs, les noms au bout des courbes ; pour une courbe, l’axe peut partir de 20 °C.</p>',
          '<p><b>Choisir les couleurs</b> : 2024 en couleur, 2023 en gris pour le contexte.</p>',
          '<p><b>Un repère visuel</b> : l’écart qui compte, entouré.</p>',
          '<p><b>Raconter en étapes</b>, comme en réunion : d’abord le contexte, l’année dernière seule.</p>',
          '<p>Puis cette année, jusqu’en août : elle suit 2023 de près.</p>' + ask('Et ensuite ?'),
          '<p>La chute de septembre, et un <b>titre qui dit le message</b>. Chaque étape ajoute une seule idée.</p>'
        ],
        render(el, i) { el.innerHTML = refonte(i) + '<div class="viz-caption">Météo quotidienne de Nouakchott, moyennes mensuelles.</div>'; }
      });
    }
  });

  /* ======================= À retenir ======================= */
  steps.push({
    id: 'retenir', kicker: 'À retenir', title: 'Ce que vous emportez',
    lead: 'Huit idées à garder.',
    build(b) {
      b.innerHTML = '<ol class="recap">' + [
        'Un graphique fait autorité : le manipuler, c’est manipuler la preuve. Visez un <b>facteur de mensonge</b> proche de 1.',
        '<b>Explorer</b> pour soi, <b>expliquer</b> pour le public : ce ne sont pas les mêmes graphiques.',
        'Les statistiques résument, le graphique montre. Regardez la <b>distribution</b>, avec plusieurs tailles de classes.',
        'Le <b>type de données</b> et la <b>relation</b> à montrer (comparer, décomposer, répartir, relier, suivre) choisissent le graphique.',
        'Chaque graphique a ses pièges : barres trop nombreuses, spaghetti, pente trompeuse, droite sur trois points, camembert illisible.',
        'Maximisez le <b>rapport encre-données</b> : chaque pixel doit servir. Connexion, enclosure, clôture guident l’œil avec peu d’encre.',
        'La couleur a un rôle : catégories, quantités, écart, message ou alerte. <mark>Jamais par la couleur seule.</mark>',
        'Texte lisible et espace blanc ; puis on raconte <b>en étapes</b>, une idée à la fois.'
      ].map(x => '<li><span>' + x + '</span></li>').join('') + '</ol>';
    }
  });

  /* ======================= Pour aller plus loin ======================= */

  // E1. Le Datasaurus.
  steps.push({
    id: 'datasaurus', kicker: 'Explorer', title: 'Le Datasaurus',
    lead: 'Six jeux de 142 points. Mêmes moyennes, mêmes écarts-types, même corrélation (à deux décimales).',
    build(b) {
      const DS = D2.datasaurus, names = {dino: 'Dinosaure', star: 'Étoile', circle: 'Cercle', bullseye: 'Cible', x_shape: 'Croix', away: 'Nuage'};
      b.innerHTML = '<div class="row" style="gap:6px">' + Object.keys(names).map((k, i) => '<button class="chip" data-d="' + k + '"' + (i ? '' : ' aria-pressed="true"') + '>' + names[k] + '</button>').join('') + '</div>' +
        '<div class="viz main"><div data-chart></div><p class="small" style="margin:6px 0 0">Moyenne x ≈ 54,3 · moyenne y ≈ 47,8 · écarts-types ≈ 16,8 et 26,9 · corrélation ≈ −0,07</p><div class="viz-caption">J. Matejka et G. Fitzmaurice, « Same Stats, Different Graphs », CHI 2017 (paquet R datasauRus, licence MIT).</div></div>';
      const draw = k => { const W = narrow() ? 400 : 520, H = W * .8, x = scale(10, 100, 20, W - 10), y = scale(0, 100, H - 10, 10); b.querySelector('[data-chart]').innerHTML = svg(W, H, DS[k].map(p => '<circle cx="' + x(p[0]).toFixed(1) + '" cy="' + y(p[1]).toFixed(1) + '" r="3.5" fill="' + ACC + '" opacity=".85"/>').join('')); };
      b.querySelectorAll('[data-d]').forEach(c => c.addEventListener('click', () => { b.querySelectorAll('[data-d]').forEach(o => o.setAttribute('aria-pressed', o === c ? 'true' : 'false')); draw(c.dataset.d); }));
      draw('dino');
    }
  });

  // E2. Quand notre vue nous trompe.
  steps.push({
    id: 'illusions', kicker: 'Jeu', title: 'Quand notre vue nous trompe',
    lead: 'Deux illusions classiques. Votez avant de révéler.',
    build(b) {
      const W = WW(), H = 220;
      const ebb = reveal => { const c1 = W * .27, c2 = W * .73, cy = 110; let s = '';
        for (let k = 0; k < 6; k++) { const a = k / 6 * 2 * Math.PI; s += '<circle cx="' + (c1 + 62 * Math.cos(a)) + '" cy="' + (cy + 62 * Math.sin(a)) + '" r="30" fill="' + GREY2 + '"/>'; }
        for (let k = 0; k < 8; k++) { const a = k / 8 * 2 * Math.PI; s += '<circle cx="' + (c2 + 34 * Math.cos(a)) + '" cy="' + (cy + 34 * Math.sin(a)) + '" r="8" fill="' + GREY2 + '"/>'; }
        s += '<circle cx="' + c1 + '" cy="' + cy + '" r="18" fill="' + ACC + '"/><circle cx="' + c2 + '" cy="' + cy + '" r="18" fill="' + ACC + '"/>';
        if (reveal) s += '<line x1="' + c1 + '" x2="' + c2 + '" y1="' + (cy - 18) + '" y2="' + (cy - 18) + '" stroke="' + BAD + '" stroke-dasharray="4 3"/><line x1="' + c1 + '" x2="' + c2 + '" y1="' + (cy + 18) + '" y2="' + (cy + 18) + '" stroke="' + BAD + '" stroke-dasharray="4 3"/>';
        return svg(W, H, s); };
      const grad = reveal => '<defs><linearGradient id="gr1"><stop offset="0" stop-color="#111"/><stop offset="1" stop-color="#eee"/></linearGradient></defs><rect x="10" y="20" width="' + (W - 20) + '" height="120" fill="' + (reveal ? '#fff' : 'url(#gr1)') + '"/><rect x="' + W * .15 + '" y="68" width="' + W * .7 + '" height="24" fill="#888"/>';
      b.innerHTML = '<div class="viz main" data-e>' + ebb(false) + '</div><div data-q></div><h3 style="margin-top:24px">Et cette barre grise ?</h3><div class="viz" data-g>' + svg(W, 160, grad(false)) + '</div><div class="row"><button class="btn btn-ghost" data-gr>Retirer le dégradé</button></div>';
      b.querySelector('[data-gr]').addEventListener('click', e => { b.querySelector('[data-g]').innerHTML = svg(W, 160, grad(true)); e.target.hidden = true; b.insertAdjacentHTML('beforeend', M.note('ghost', '<p>La barre est <b>d’un seul gris</b>. Le fond change la teinte perçue : attention aux couleurs posées sur des fonds dégradés.</p>')); });
      question(b.querySelector('[data-q]'), {
        prompt: 'Quel cercle mauve est le plus grand ?',
        options: [{t: 'Celui de gauche', why: 'Entouré de grands cercles, il paraît petit… ou grand selon les personnes. Ils sont identiques.'}, {t: 'Celui de droite', why: 'Entouré de petits cercles, il paraît plus grand. Mais ils sont identiques.'}, {t: 'Ils sont identiques', ok: true, why: 'Même rayon. Le contexte change la taille perçue (illusion d’Ebbinghaus) : attention aux bulles entourées d’autres bulles.'}],
        onSolved() { b.querySelector('[data-e]').innerHTML = ebb(true); }
      });
    }
  });

  // E3. Quiz : quel graphique pour ces données ?
  const QUIZ = [
    {prompt: 'Les ventes de 4 produits sur 12 mois, pour voir les tendances.', options: [{t: 'Courbes', ok: true, why: 'L’évolution dans le temps : des courbes, au plus 4 ou 5.'}, {t: 'Camembert'}, {t: 'Nuage de points'}]},
    {prompt: 'La part de chaque série parmi les candidats 2025 (4 séries).', options: [{t: 'Barres empilées à 100 % ou barres', ok: true, why: 'Composition : un tout de 100 %. Camembert possible si les parts sont bien distinctes.'}, {t: 'Courbe'}, {t: 'Histogramme'}]},
    {prompt: 'L’âge des candidats au bac.', options: [{t: 'Histogramme', ok: true, why: 'Une distribution d’une variable quantitative.'}, {t: 'Camembert'}, {t: 'Courbe'}]},
    {prompt: 'Taille de la population et taux d’admission, pour 15 wilayas.', options: [{t: 'Nuage de points', ok: true, why: 'Relation entre deux quantités. Attention aux points qui font toute la pente.'}, {t: 'Barres groupées'}, {t: 'Camembert'}]},
    {prompt: 'Le taux exact de chaque wilaya, pour un rapport qu’on consultera.', options: [{t: 'Tableau', ok: true, why: 'Chercher une valeur précise : le tableau.'}, {t: 'Carte de chaleur sans chiffres'}, {t: 'Courbe'}]},
    {prompt: '15 wilayas classées par taux d’admission.', options: [{t: 'Barres horizontales triées', ok: true, why: 'Comparaison avec des noms longs.'}, {t: 'Barres verticales par ordre alphabétique'}, {t: 'Graphique radial'}]}
  ];
  steps.push({
    id: 'quiz2', kicker: 'Quiz', title: 'Quel graphique pour ces données ?',
    lead: 'Six situations, réponses à voix haute.',
    build(b) {
      let k = 0;
      const next = () => {
        const host = document.createElement('div'); b.appendChild(host); const q = QUIZ[k];
        question(host, Object.assign({}, q, {prompt: (k + 1) + ' / ' + QUIZ.length + ' · ' + q.prompt, onSolved() {
          k++; if (k < QUIZ.length) { const more = document.createElement('div'); more.className = 'row'; more.innerHTML = '<button class="btn btn-primary">Question suivante</button>'; host.appendChild(more); more.firstChild.addEventListener('click', () => { more.remove(); next(); }); }
        }}));
      };
      next();
    }
  });

  const GLOSS = [['Facteur de mensonge', 'Lie factor'], ['Exploratoire / explicatif', 'Exploratory / explanatory'], ['Quartet d’Anscombe', 'Anscombe’s quartet'],
    ['Histogramme, classe', 'Histogram, bin'], ['Variable catégorielle, ordinale, quantitative', 'Categorical, ordinal, quantitative variable'],
    ['Graphique spaghetti', 'Spaghetti chart'], ['Petits multiples', 'Small multiples'], ['Rapport d’aspect', 'Aspect ratio'], ['Surcharge de points', 'Overplotting'],
    ['Corrélation n’est pas causalité', 'Correlation is not causation'], ['Camembert', 'Pie chart'], ['Connexion, enclosure, clôture', 'Connection, enclosure, closure'],
    ['Palette catégorielle, séquentielle, divergente', 'Categorical, sequential, diverging palette'], ['Daltonisme', 'Color blindness'], ['Rapport encre-données', 'Data-ink ratio']];
  window.DS_LESSONS = window.DS_LESSONS || {};
  window.DS_LESSONS.cm2 = {
    id: 'cm2',
    title: 'Formes de visualisation et principes d’efficacité',
    lede: 'Choisir le graphique qui dit vrai, et le dessiner pour qu’il se lise d’un coup d’œil.',
    model: '<span>Question</span><i>→</i><span>Type de données</span><i>→</i><span>Graphique</span>',
    minutes: 90,
    plan: {honte: 7, hall: 4, mensonge: 8, playfair: 3, explorer: 5, anscombe: 5, notes: 7, types: 4, choisir: 9, barres: 4, lignes: 7, nuage: 5, camembert: 4, tableau: 2, preattentif2: 4, encre: 6, gestalt2: 4, couleur: 7, texte: 5, refonte: 8, retenir: 3},
    reserve: {datasaurus: 6, illusions: 5, quiz2: 7},
    parts: [
      {title: 'Pouvoir et responsabilité', from: 'honte'},
      {title: 'Pourquoi visualiser ?', from: 'anscombe'},
      {title: 'Choisir le bon graphique', from: 'types'},
      {title: 'Chaque graphique a ses pièges', from: 'barres'},
      {title: 'La perception', from: 'preattentif2'},
      {title: 'Mise en pratique', from: 'refonte'},
      {title: 'À retenir', from: 'retenir'},
      {title: 'Pour aller plus loin', from: 'datasaurus'}
    ],
    endAt: 'retenir',
    footer: '<section class="foot-block"><h3>À faire avant le CM 3</h3><ol class="recap">' +
      '<li><span>Trouvez dans un média un graphique à barres dont l’axe ne commence pas à zéro. Calculez son facteur de mensonge.</span></li>' +
      '<li><span>Trouvez un camembert. Aurait-il fallu des barres ? Pourquoi ?</span></li>' +
      '<li><span>Refaites l’un des deux, à la main ou en Python.</span></li></ol>' +
      '<p class="small">Au CM 3 : raconter avec une carte.</p></section>' +
      '<details class="foot-details"><summary>Lexique français ↔ anglais</summary><table class="data"><thead><tr><th>Français</th><th>English</th></tr></thead><tbody>' + GLOSS.map(g => '<tr><td>' + g[0] + '</td><td>' + g[1] + '</td></tr>').join('') + '</tbody></table></details>' +
      '<details class="foot-details"><summary>Bibliographie</summary><ul class="biblio">' +
      '<li>Edward R. Tufte, <i>The Visual Display of Quantitative Information</i>, Graphics Press, 1983 (facteur de mensonge, rapport encre-données).</li>' +
      '<li>Cole Nussbaumer Knaflic, <i>Storytelling with Data</i>, Wiley, 2015.</li>' +
      '<li>Dona M. Wong, <i>The Wall Street Journal Guide to Information Graphics</i>, W. W. Norton, 2010.</li>' +
      '<li>F. J. Anscombe, « Graphs in Statistical Analysis », <i>The American Statistician</i>, 27(1), 1973.</li>' +
      '<li>Justin Matejka, George Fitzmaurice, « Same Stats, Different Graphs », CHI 2017.</li>' +
      '<li>Choisir un graphique selon ses données : <a href="https://www.data-to-viz.com" target="_blank" rel="noopener">data-to-viz.com</a>.</li></ul></details>',
    steps
  };
})();
