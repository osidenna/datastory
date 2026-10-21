/* CM 1 · Principes du data storytelling
   Contenu tiré de lecture1.pdf (2025-2026), refait façon Brilliant : prédire, manipuler, comparer.
   Toutes les données sont réelles (dist/data-cm1.js, généré par scripts/build-data.py). */
(function () {
  const K = window.Kit, M = window.Mascots, D = window.DS_DATA;
  const {fr, pct, scale, svg, path, yAxis, question, esc} = K;
  const ACC = '#8a4f8c', GREY = '#a3a8b3', GREY2 = '#cfd3da', INK = '#1d2433', BAD = '#b4532a', GOOD = '#2e6b4f';
  const SRC_BAC = 'Source : résultats du bac 2015–2025, dépôt public <a href="https://github.com/binorassocies/rimdata" target="_blank" rel="noopener">rimdata</a> ; taux = décisions « Admis » / candidats.';
  const bac = D.bac;
  const at = y => bac.taux[bac.years.indexOf(y)];

  // Générateur pseudo-aléatoire déterministe : mêmes grilles pour tout le monde.
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* ---------- Graphique du taux d'admission : quatre états (piliers) ---------- */
  function bacChart(st) {
    const W = 680, H = 330, l = 46, r = 78, t = st.N ? 74 : 40, b = 36;
    const x = scale(2015, 2025, l, W - r), y = scale(0, 25, H - b, t);
    let s = '';
    if (st.N) {
      s += '<text class="title" x="0" y="22">' + (st.D ? 'Le taux d’admission au bac a presque triplé depuis 2015' : 'Le bac va de mieux en mieux !') + '</text>';
      s += '<text class="subtitle" x="0" y="44">' + (st.D ? 'Part des candidats déclarés admis, en %' : 'Croyez-nous sur parole.') + '</text>';
    } else if (st.V) {
      s += '<text x="0" y="20" style="font-size:13px;fill:#6e7380">Taux d’admission par année</text>';
    }
    if (st.V) {
      s += yAxis(y, [0, 5, 10, 15, 20, 25], l, W - r, v => v + ' %');
      s += bac.years.map(yr => '<text x="' + x(yr) + '" y="' + (H - b + 20) + '" text-anchor="middle">' + (st.N && yr % 5 && yr !== 2024 ? '' : yr) + '</text>').join('');
    }
    if (st.D && st.V) {
      const pts = bac.years.map((yr, i) => [x(yr), y(bac.taux[i])]);
      if (!st.N) {
        s += '<path class="draw" d="' + path(pts) + '" fill="none" stroke="#4472C4" stroke-width="2.5"/>';
        s += pts.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#4472C4"/>').join('');
      } else {
        s += '<path class="draw" d="' + path(pts) + '" fill="none" stroke="' + GREY + '" stroke-width="2.5"/>';
        const p15 = [x(2015), y(at(2015))], p24 = [x(2024), y(at(2024))], p25 = [x(2025), y(at(2025))];
        s += '<circle cx="' + p15[0] + '" cy="' + p15[1] + '" r="6" fill="' + ACC + '"/><circle cx="' + p24[0] + '" cy="' + p24[1] + '" r="6" fill="' + ACC + '"/><circle cx="' + p25[0] + '" cy="' + p25[1] + '" r="4" fill="' + GREY + '"/>';
        s += '<text class="lbl-accent" x="' + (p15[0] + 4) + '" y="' + (p15[1] + 24) + '" style="font-size:14px">7,5 %</text>';
        s += '<text class="lbl-accent" x="' + (p24[0] + 10) + '" y="' + (p24[1] - 10) + '" style="font-size:14px">22,1 %</text>';
        s += '<text x="' + (p25[0] + 8) + '" y="' + (p25[1] + 4) + '">18,8 %</text>';
        s += '<g class="fade-in"><path d="M' + x(2018.6) + ' ' + y(21) + 'Q' + x(2021.4) + ' ' + y(26.5) + ' ' + x(2023.78) + ' ' + y(22.5) + '" fill="none" stroke="' + INK + '" stroke-width="1.2" marker-end="url(#arr)"/>' +
          '<text x="' + x(2018.4) + '" y="' + y(21.6) + '" text-anchor="end" class="lbl-strong" style="font-size:15px">× 3 en 9 ans</text></g>';
        s += '<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + INK + '"/></marker></defs>';
      }
    } else if (st.V && !st.D) {
      s += '<text x="' + (W / 2) + '" y="' + (H / 2 + 10) + '" text-anchor="middle" style="font:700 64px Bitter;fill:#e5e7eb">?</text>';
    } else if (st.D && !st.V) {
      const lines = st.N
        ? ['En 2015, 7,5 % des candidats ont été admis.', 'En 2024, 22,1 %, puis 18,8 % en 2025.', 'Le taux a presque triplé en neuf ans.']
        : bac.years.map((yr, i) => yr + ' : ' + fr(bac.taux[i], 1) + ' %');
      s += lines.map((L, i) => st.N
        ? '<text x="0" y="' + (110 + i * 34) + '" style="font:400 19px Bitter;fill:' + INK + '">' + L + '</text>'
        : '<text x="' + (i < 6 ? 30 : 330) + '" y="' + (70 + (i % 6) * 34) + '" style="font:400 17px Roboto;fill:' + INK + '">' + L + '</text>').join('');
    } else if (!st.D && !st.V && !st.N) {
      s += '<text x="' + (W / 2) + '" y="' + (H / 2) + '" text-anchor="middle" style="font-size:15px">Activez un pilier.</text>';
    }
    return svg(W, H, s);
  }
  const PILLAR_VERDICT = {
    '': '',
    'D': 'Des données brutes : exactes, mais personne ne voit la tendance.',
    'V': 'Une visualisation sans données : une coquille vide.',
    'N': 'Une histoire sans données : une opinion.',
    'DV': 'Données + visualisation : on voit, mais on ne sait pas quoi retenir.',
    'DN': 'Données + narration : un bon texte, mais l’œil ne voit rien.',
    'VN': 'Visualisation + narration sans données : de la propagande.',
    'DVN': 'Les trois piliers : on voit, on comprend, on retient.'
  };

  /* ---------- Avion (biais du survivant) ---------- */
  function planeSVG() {
    const holes = [
      // ailes (hors moteurs)
      [70, 168], [86, 160], [58, 176], [150, 148], [160, 152], [140, 156], [92, 172], [128, 160], [76, 180],
      [330, 168], [314, 160], [342, 176], [250, 148], [240, 152], [260, 156], [308, 172], [272, 160], [324, 180], [232, 140],
      // fuselage, partie centrale
      [196, 110], [205, 128], [192, 150], [208, 176], [198, 196], [204, 214], [195, 232], [206, 98], [200, 168],
      // queue
      [150, 268], [164, 262], [236, 264], [250, 270], [200, 262], [140, 274]
    ];
    const zones = {
      ailes: '<path class="plane-zone" data-z="0" d="M182 128L28 172L30 192L182 160ZM218 128L372 172L370 192L218 160Z"/>',
      fuselage: '<path class="plane-zone" data-z="1" d="M182 84h36v170h-36Z"/>',
      queue: '<path class="plane-zone" data-z="2" d="M186 250L124 268L124 284L186 272ZM214 250L276 268L276 284L214 272Z"/>',
      moteurs: '<g><ellipse class="plane-zone" data-z="3" cx="112" cy="152" rx="16" ry="24"/><ellipse class="plane-zone" data-z="3" cx="288" cy="152" rx="16" ry="24"/></g>'
    };
    const body =
      '<path d="M182 128L28 172L30 192L182 160ZM218 128L372 172L370 192L218 160Z" fill="#e8eaee" stroke="#9aa0aa" stroke-width="1.5"/>' +
      '<path d="M186 250L124 268L124 284L186 272ZM214 250L276 268L276 284L214 272Z" fill="#e8eaee" stroke="#9aa0aa" stroke-width="1.5"/>' +
      '<path d="M200 16C214 16 222 50 222 90V250C222 272 212 290 200 292C188 290 178 272 178 250V90C178 50 186 16 200 16Z" fill="#eef0f3" stroke="#9aa0aa" stroke-width="1.5"/>' +
      '<ellipse cx="200" cy="58" rx="10" ry="16" fill="#cfd6e0" stroke="#9aa0aa"/>' +
      '<ellipse cx="112" cy="152" rx="13" ry="21" fill="#d9dce2" stroke="#9aa0aa" stroke-width="1.5"/><ellipse cx="288" cy="152" rx="13" ry="21" fill="#d9dce2" stroke="#9aa0aa" stroke-width="1.5"/>' +
      '<path d="M100 130h24M276 130h24" stroke="#9aa0aa" stroke-width="2.5" stroke-linecap="round"/>';
    const dots = holes.map(h => '<circle cx="' + h[0] + '" cy="' + h[1] + '" r="3.4" fill="' + BAD + '"/>').join('');
    return svg(400, 300, body + '<g class="holes">' + dots + '</g>' + zones.ailes + zones.fuselage + zones.queue + zones.moteurs, 'plane');
  }

  /* ---------- Étapes ---------- */
  const steps = [];

  // 1. Ouverture : tableau chronométré, puis histoire.
  steps.push({
    id: 'ouverture', kicker: 'Ouverture', title: 'Facts tell, stories sell',
    lead: 'Vous avez <b>5 secondes</b> pour lire ce tableau. Prêts ?',
    build(b) {
      const rows = bac.years.map((yr, i) => '<tr><td>' + yr + '</td><td>' + fr(bac.candidats[i]) + '</td><td>' + fr(bac.admis[i]) + '</td><td>' + fr(bac.taux[i], 1) + '</td></tr>').join('');
      b.innerHTML = '<div class="row"><button class="btn btn-primary" data-go>Lancer le chrono</button><span class="timer" aria-live="polite"></span></div>' +
        '<div class="main"><div class="viz"><table class="data blurred" aria-hidden="true"><thead><tr><th>Année</th><th>Candidats</th><th>Admis</th><th>Taux (%)</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="viz-caption">' + SRC_BAC + '</div></div><div data-story hidden></div></div><div data-q></div>';
      const table = b.querySelector('table'), timer = b.querySelector('.timer'), go = b.querySelector('[data-go]');
      go.addEventListener('click', () => {
        go.disabled = true; table.classList.remove('blurred'); table.removeAttribute('aria-hidden');
        let left = 5; timer.textContent = left + ' s';
        const iv = setInterval(() => {
          left--; timer.textContent = left > 0 ? left + ' s' : 'Temps écoulé !';
          if (left <= 0) { clearInterval(iv); table.classList.add('blurred'); go.disabled = false; go.textContent = 'Revoir 5 s'; }
        }, 1000);
      });
      question(b.querySelector('[data-q]'), {
        prompt: 'Qu’est-ce qui a changé entre 2015 et 2024 ?',
        options: [
          {t: 'Le taux d’admission a baissé', why: 'Il est passé de 7,5 % à 22,1 %. Difficile à voir dans un tableau, n’est-ce pas ?'},
          {t: 'Le taux est resté autour de 8 %', why: 'Il est autour de 8 % jusqu’en 2017 seulement : en 2024, il atteint 22,1 %.'},
          {t: 'Le taux d’admission a presque triplé', ok: true, why: 'De 7,5 % à 22,1 % : × 2,9. Le graphique ci-dessous le montre en un coup d’œil.'},
          {t: 'Le nombre de candidats a doublé', why: '41 986 → 47 217 candidats : + 12 % seulement. Le chiffre qui a bougé, c’est le taux.'}
        ],
        cols: 2,
        onSolved() {
          const st = b.querySelector('[data-story]');
          st.hidden = false; st.parentNode.classList.add('has-story');
          st.innerHTML = '<div class="viz">' + bacChart({D: 1, V: 1, N: 1}) + '<div class="viz-caption">' + SRC_BAC + '</div></div>' +
            M.note('lion', '<p><b>Les faits informent, les histoires convainquent.</b> Mêmes données, même vérité : seule la forme a changé.</p>');
        }
      });
    }
  });

  // 2. Fondations historiques : la carte de John Snow (Londres, 1854), en défilement.
  steps.push({
    id: 'john-snow', kicker: 'Fondations historiques', title: 'Londres, 1854 : d’où vient le choléra ?',
    lead: 'Faites défiler : la carte raconte l’histoire.',
    build(b) {
      const S = D.snow, xs = S.streets.flat().map(p => p[0]), ys = S.streets.flat().map(p => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const k = 34, pad = 14, W = (x1 - x0) * k + 2 * pad, H = (y1 - y0) * k + 2 * pad;
      const X = v => pad + (v - x0) * k, Y = v => pad + (y1 - v) * k;
      const near = S.deaths.map(([dx, dy]) => {
        let best = 0, bd = Infinity;
        S.pumps.forEach((p, i) => { const d2 = (p.x - dx) ** 2 + (p.y - dy) ** 2; if (d2 < bd) { bd = d2; best = i; } });
        return best;
      });
      const pct = Math.round(100 * S.nearBroad / S.deaths.length);
      const halo = 'paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round';
      const draw = st => {
        const colour = st >= 4;
        let s = '<rect width="' + W + '" height="' + H + '" fill="#fbfaf7"/>';
        s += S.streets.map(l => '<path d="' + path(l.map(p => [X(p[0]), Y(p[1])])) + '" fill="none" stroke="#cfd3da" stroke-width="2.4" stroke-linecap="round"/>').join('');
        s += S.deaths.map(([dx, dy], i) => '<circle cx="' + X(dx).toFixed(1) + '" cy="' + Y(dy).toFixed(1) + '" r="2.8" fill="' + (colour ? (near[i] === S.broad ? ACC : GREY) : INK) + '" opacity="' + (colour && near[i] !== S.broad ? .5 : .85) + '"/>').join('');
        if (st >= 2) S.pumps.forEach((p, i) => {
          const cx = X(p.x), cy = Y(p.y), on = st >= 3 && i === S.broad;
          s += '<path class="fade-in" d="M' + cx + ' ' + (cy - 11) + 'L' + (cx + 10) + ' ' + (cy + 8) + 'L' + (cx - 10) + ' ' + (cy + 8) + 'Z" fill="' + (on ? ACC : '#2f6f9f') + '" stroke="#fff" stroke-width="1.5"/>';
          if (on) s += '<circle cx="' + cx + '" cy="' + cy + '" r="24" fill="none" stroke="' + ACC + '" stroke-width="2.5"/>' +
            '<text x="' + (cx + 30) + '" y="' + (cy + 6) + '" class="lbl-accent" style="font-size:17px;' + halo + '">Broad Street</text>';
          if (on && st >= 5) s += '<text x="' + (cx + 30) + '" y="' + (cy + 28) + '" style="font-size:14px;fill:' + INK + ';' + halo + '">poignée retirée le 8 septembre</text>';
        });
        return svg(W, H, s, 'snow');
      };
      K.scrolly(b, {
        steps: [
          '<p>Fin août 1854, quartier de Soho, à Londres. En quelques jours, le choléra tue <b>' + S.deaths.length + ' personnes</b>. John Snow place chaque décès sur une carte.</p>',
          '<p>Les médecins de l’époque accusent l’<b>air vicié</b> (les « miasmes »).</p><span class="sc-ask">Si c’était l’air, à quoi ressemblerait la carte ?</span>',
          '<p>Snow, lui, soupçonne l’<b>eau</b>. Il ajoute les <b>13 pompes</b> du quartier.</p><span class="sc-ask">Quelle pompe soupçonnez-vous ?</span>',
          '<p>La pompe de <b>Broad Street</b>, au cœur de l’épidémie.</p>',
          '<p><b>' + pct + ' % des décès</b> (' + S.nearBroad + ' sur ' + S.deaths.length + ') sont plus proches, à vol d’oiseau, de cette pompe que de toutes les autres.</p>',
          '<p>Le 8 septembre 1854, Snow obtient qu’on <b>retire la poignée</b> de la pompe.</p><p>Des données (les décès), une visualisation (la carte), une narration (la pompe) : l’un des premiers grands <mark>récits de données</mark>.</p>'
        ],
        render(el, i) { el.innerHTML = draw(i) + '<div class="viz-caption">Chaque point = un décès relevé par John Snow. Données : paquet R <i>HistData</i>, d’après la carte de Snow.</div>'; }
      });
    }
  });

  // 3. Les trois piliers, en défilement.
  steps.push({
    id: 'piliers', kicker: 'Les 3 piliers', title: 'Données, visualisation, narration',
    lead: 'Faites défiler : on ajoute, puis on retire, un pilier à la fois.',
    build(b) {
      const states = [{D: 1}, {D: 1, V: 1}, {D: 1, V: 1, N: 1}, {V: 1, N: 1}, {N: 1}, {D: 1, V: 1, N: 1}];
      K.scrolly(b, {
        steps: [
          '<p><b>Données</b> seules : exactes… mais muettes. Qui voit la tendance ?</p>',
          '<p>+ <b>Visualisation</b> : on voit la tendance.</p><span class="sc-ask">Mais que faut-il retenir ?</span>',
          '<p>+ <b>Narration</b> : un titre qui dit le message, deux points en couleur, une annotation.</p>',
          '<p>Retirons les <b>données</b> : une belle histoire… sur rien.</p>',
          '<p>Retirons aussi la <b>visualisation</b> : il ne reste qu’une opinion.</p>',
          '<p><mark>Il faut les trois piliers.</mark> Données : sur quoi on s’appuie. Visualisation : comment on montre. Narration : l’histoire qu’on raconte.</p>'
        ],
        render(el, i) {
          const st = states[i], key = ['D', 'V', 'N'].filter(k => st[k]).join('');
          el.innerHTML = bacChart(st) + '<p class="small" style="margin:8px 0 0"><b>' + PILLAR_VERDICT[key] + '</b></p>';
        }
      });
      const q = document.createElement('div'); b.appendChild(q);
      question(q, {
        prompt: 'Un graphique superbe, au message clair… construit sur un sondage de 20 personnes de la même classe. Quel pilier est fragile ?',
        options: [
          {t: 'Les données', ok: true, why: 'Tout repose sur les données. Belle forme + belle histoire sur un mauvais échantillon = belle erreur.'},
          {t: 'La visualisation', why: 'La forme est réussie, d’après l’énoncé. Le problème est en amont.'},
          {t: 'La narration', why: 'Le message est clair. Mais clair ne veut pas dire vrai.'}
        ]
      });
    }
  });

  // 4. Pilier données : les avions.
  steps.push({
    id: 'avions', kicker: 'Pilier données', title: 'Où blinder les avions ?',
    lead: '1943. Chaque point rouge est un impact de balle relevé sur les bombardiers <b>revenus</b> de mission. On peut blinder une seule zone.',
    build(b) {
      b.innerHTML = '<div class="viz main" style="max-width:520px;margin-inline:auto">' + planeSVG() + '<div class="viz-caption">Schéma d’après l’étude d’Abraham Wald.</div></div><div data-q></div><div data-after hidden></div>';
      const opts = ['Les ailes', 'Le fuselage', 'La queue', 'Les moteurs'];
      const q = question(b.querySelector('[data-q]'), {
        prompt: 'Où ajouter du blindage ?', mascot: 'cat', cols: 2,
        options: [
          {t: opts[0], why: 'Les avions touchés aux ailes sont… revenus. Ces impacts ne les ont pas abattus.'},
          {t: opts[1], why: 'Les avions touchés au fuselage sont revenus : ces impacts sont survivables.'},
          {t: opts[2], why: 'Même piège : on ne voit que les impacts qui n’ont pas empêché le retour.'},
          {t: opts[3], ok: true, why: 'Aucun avion revenu n’a d’impact sur les moteurs : ceux qui y ont été touchés ne sont pas rentrés. Il faut blinder là où les données sont <b>absentes</b>.'}
        ],
        onSolved() {
          b.querySelectorAll('.plane-zone[data-z="3"]').forEach(z => z.classList.add('is-answer'));
          const a = b.querySelector('[data-after]'); a.hidden = false;
          a.innerHTML = M.note('ghost', '<p><b>Biais du survivant.</b> Les données sont incomplètes par défaut. Devant un jeu de données, demandez-vous toujours : <mark>qui ou quoi n’est pas représenté ?</mark></p>');
        }
      });
      const zones = [...b.querySelectorAll('.plane-zone')];
      zones.forEach(z => z.addEventListener('click', () => {
        if (q.solved) return;
        zones.forEach(o => o.classList.toggle('is-picked', o.dataset.z === z.dataset.z));
        q.box.querySelectorAll('.q-option')[+z.dataset.z].click();
      }));
      q.box.querySelectorAll('.q-option').forEach((o, i) => o.addEventListener('click', () => {
        if (!q.solved) zones.forEach(z => z.classList.toggle('is-picked', +z.dataset.z === i));
      }));
    }
  });

  // 5. Qui manque ? Le fichier des prénoms.
  steps.push({
    id: 'qui-manque', kicker: 'Pilier données', title: 'Qui manque dans ce fichier ?',
    lead: 'Un fichier contient ' + fr(D.prenoms.total) + ' prénoms mauritaniens avec l’année de naissance. Voici leur répartition.',
    build(b) {
      const h = D.prenoms.hist, W = 680, H = 260, l = 50, r = 16, t = 20, bt = 34;
      const x = scale(1960, 2011, l, W - r), y = scale(0, 12000, H - bt, t), bw = (x(1) - x(0)) * .82;
      let s = yAxis(y, [0, 4000, 8000, 12000], l, W - r);
      h.years.forEach((yr, i) => { if (yr >= 1960 && yr <= 2010) s += '<rect class="grow" style="animation-delay:' + ((yr - 1960) * 12) + 'ms" x="' + (x(yr) - bw / 2) + '" y="' + y(h.n[i]) + '" width="' + bw + '" height="' + (y(0) - y(h.n[i])) + '" fill="' + GREY + '"/>'; });
      [1960, 1970, 1980, 1990, 2000, 2010].forEach(yr => { s += '<text x="' + x(yr) + '" y="' + (H - bt + 20) + '" text-anchor="middle">' + yr + '</text>'; });
      s += '<g data-late hidden><rect x="' + x(2007.5) + '" y="' + t + '" width="' + (x(2011) - x(2007.5)) + '" height="' + (y(0) - t) + '" fill="' + BAD + '" opacity=".08"/>' +
        '<text x="' + x(2009.2) + '" y="' + (t + 16) + '" text-anchor="middle" style="fill:' + BAD + ';font-weight:700">vide</text></g>';
      b.innerHTML = '<div class="viz main">' + svg(W, H, s) + '<div class="viz-caption">Nombre de personnes par année de naissance dans le fichier.</div></div><div data-q></div>';
      question(b.querySelector('[data-q]'), {
        prompt: 'Que nous apprend ce fichier sur les prénoms donnés aux enfants nés en 2015 ?',
        options: [
          {t: 'Ils sont plus variés qu’avant', why: 'Regardez à droite de 2007 : il n’y a presque personne.'},
          {t: 'Rien : ils sont absents du fichier', ok: true, why: 'Le fichier s’arrête en pratique en 2007. Avant de conclure, on se demande <b>qui a été collecté</b>, et comment.'},
          {t: 'Fatima reste le prénom n° 1', why: 'C’est vrai dans le fichier… pour les personnes nées entre 1975 et 2007. Pas en 2015.'},
          {t: 'Il y en a moins : la natalité baisse', why: 'La chute après 1996 vient de la façon dont le fichier a été constitué, pas de la natalité. Piège classique.'}
        ],
        onSolved() { b.querySelector('[data-late]').removeAttribute('hidden'); }
      });
    }
  });

  // 6. Biais de confirmation : le mois le plus chaud à Nouakchott.
  steps.push({
    id: 'nouakchott', kicker: 'Pilier données', title: '« Let the dataset change your mindset »',
    lead: 'Prédiction d’abord : quel est le mois le plus chaud à Nouakchott ? Votez avant de voir les données.',
    build(b) {
      const m = D.meteo;
      b.innerHTML = '<div class="row" data-months style="gap:6px">' + K.MOIS.map((mo, i) => '<button class="chip" data-m="' + i + '">' + mo + '</button>').join('') + '</div>' +
        '<div class="viz main"><div data-chart></div><div class="viz-caption">Température moyenne quotidienne par mois, Nouakchott, ' + m.periode[0].slice(0, 4) + '–' + m.periode[1].slice(0, 4) + '.</div></div><div data-after></div>';
      const W = 680, H = 280, l = 40, r = 10, t = 28, bt = 30;
      const x = i => l + (W - l - r) / 12 * (i + .5), y = scale(0, 32, H - bt, t), bw = (W - l - r) / 12 * .7;
      const hot = m.temp.indexOf(Math.max(...m.temp));
      const draw = pick => {
        let s = yAxis(y, [0, 10, 20, 30], l, W - r, v => v + ' °C');
        s += K.MOIS.map((mo, i) => '<text x="' + x(i) + '" y="' + (H - bt + 18) + '" text-anchor="middle"' + (i === hot && pick != null ? ' class="lbl-accent"' : '') + '>' + mo + '</text>').join('');
        if (pick == null) s += '<text x="' + (W / 2) + '" y="' + (H / 2) + '" text-anchor="middle" style="font:700 54px Bitter;fill:#e5e7eb">?</text>';
        else {
          m.temp.forEach((v, i) => {
            s += '<rect class="grow" style="animation-delay:' + i * 50 + 'ms" x="' + (x(i) - bw / 2) + '" y="' + y(v) + '" width="' + bw + '" height="' + (y(0) - y(v)) + '" fill="' + (i === hot ? ACC : GREY2) + '"' + (i === pick && i !== hot ? ' stroke="' + BAD + '" stroke-width="2.5"' : '') + '/>';
            if (i === hot || i === pick || i === 6) s += '<text x="' + x(i) + '" y="' + (y(v) - 7) + '" text-anchor="middle" class="' + (i === hot ? 'lbl-accent' : 'lbl-strong') + '">' + fr(v, 1) + '</text>';
          });
          if (pick !== hot) s += '<text x="' + x(pick) + '" y="' + (y(m.temp[pick]) - 24) + '" text-anchor="middle" style="fill:' + BAD + ';font-weight:700">prédiction</text>';
        }
        b.querySelector('[data-chart]').innerHTML = svg(W, H, s);
      };
      draw(null);
      b.querySelectorAll('[data-m]').forEach(c => c.addEventListener('click', () => {
        const pick = +c.dataset.m;
        b.querySelectorAll('[data-m]').forEach(o => { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); o.disabled = true; });
        draw(pick);
        const ok = pick === hot;
        b.querySelector('[data-after]').innerHTML = (ok
          ? '<div class="q-feedback ok revealed">' + M.mascot('cat') + '<p><strong>Bien vu !</strong>Septembre : ' + fr(m.temp[hot], 1) + ' °C en moyenne, octobre juste derrière. Juillet n’est qu’à ' + fr(m.temp[6], 1) + ' °C.</p></div>'
          : '<div class="q-feedback ko">' + M.mascot('ghost') + '<p><strong>Surprise : c’est septembre, talonné par octobre.</strong>' + fr(m.temp[hot], 1) + ' °C en moyenne, contre ' + fr(m.temp[pick], 1) + ' °C en ' + K.MOIS_LONG[pick] + '. L’océan tempère l’été à Nouakchott.</p></div>') +
          M.note('lion', '<p><b>Biais de confirmation :</b> on cherche dans les données ce qu’on croit déjà. N’essayez pas de prouver que vous avez raison : <mark>cherchez ce que les données disent vraiment.</mark></p>');
      }));
    }
  });

  // 7. Pilier visualisation : la complexité inutile.
  function complexChart() {
    const W = 680, H = 360, l = 54, r = 50, t = 40, bt = 86;
    const x = scale(2014.5, 2025.5, l, W - r), yl = scale(0, 60000, H - bt, t), yr = scale(0, 45, H - bt, t);
    const cols = {SN: '#4472C4', M: '#5B9BD5', LM: '#70AD47', LO: '#4BACC6'};
    let s = '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#f2f2f2"/>';
    s += '<text x="' + W / 2 + '" y="22" text-anchor="middle" style="font:700 15px Roboto;fill:#333">Bac 2015-2025 : candidats et taux d’admission par série</text>';
    [0, 10000, 20000, 30000, 40000, 50000, 60000].forEach(v => { s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + yl(v) + '" y2="' + yl(v) + '" stroke="#bbb"/><text x="' + (l - 6) + '" y="' + (yl(v) + 4) + '" text-anchor="end" style="font-size:10px">' + v + '</text>'; });
    [0, 15, 30, 45].forEach(v => { s += '<text x="' + (W - r + 6) + '" y="' + (yr(v) + 4) + '" style="font-size:10px">' + v + '%</text>'; });
    bac.years.forEach((yy, i) => { s += '<rect x="' + (x(yy) - 16) + '" y="' + yl(bac.candidats[i]) + '" width="32" height="' + (yl(0) - yl(bac.candidats[i])) + '" fill="#9DC3E6"/>'; });
    Object.keys(cols).forEach((k, j) => {
      const pts = bac.years.map((yy, i) => [x(yy), yr(bac.serie[k][i])]);
      s += '<path d="' + path(pts) + '" fill="none" stroke="' + cols[k] + '" stroke-width="2"/>';
      s += pts.map(p => j % 2 ? '<rect x="' + (p[0] - 3.5) + '" y="' + (p[1] - 3.5) + '" width="7" height="7" fill="' + cols[k] + '"/>' : '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" fill="' + cols[k] + '"/>').join('');
    });
    bac.years.forEach(yy => { s += '<text transform="translate(' + x(yy) + ' ' + (H - bt + 12) + ') rotate(-60)" text-anchor="end" style="font-size:10px">' + yy + '</text>'; });
    const leg = [['Candidats', '#9DC3E6'], ['SN', cols.SN], ['M', cols.M], ['LM', cols.LM], ['LO', cols.LO]];
    leg.forEach((g, i) => { s += '<rect x="' + (150 + i * 82) + '" y="' + (H - 18) + '" width="10" height="10" fill="' + g[1] + '"/><text x="' + (164 + i * 82) + '" y="' + (H - 9) + '" style="font-size:10px">' + g[0] + '</text>'; });
    return svg(W, H, s);
  }
  function simpleChart(year) {
    const i = bac.years.indexOf(year);
    const rows = Object.keys(bac.serie).map(k => [k, bac.serie[k][i]]).sort((a, c) => c[1] - a[1]);
    const names = {SN: 'Sciences naturelles (SN)', M: 'Mathématiques (M)', LM: 'Lettres modernes (LM)', LO: 'Lettres originelles (LO)'};
    const W = 680, H = 230, l = 200, r = 70, t = 46;
    const x = scale(0, 45, l, W - r);
    let s = '<text class="title" x="0" y="20">En ' + year + ', la série M a le meilleur taux d’admission</text>';
    rows.forEach((rw, j) => {
      const yy = t + j * 44;
      s += '<text x="' + (l - 10) + '" y="' + (yy + 20) + '" text-anchor="end" class="' + (j ? '' : 'lbl-strong') + '" style="font-size:14px">' + names[rw[0]] + '</text>';
      s += '<rect class="fade-in" x="' + l + '" y="' + (yy + 4) + '" width="' + (x(rw[1]) - l) + '" height="26" fill="' + (j ? GREY2 : ACC) + '"/>';
      s += '<text x="' + (x(rw[1]) + 8) + '" y="' + (yy + 22) + '" class="' + (j ? 'lbl-strong' : 'lbl-accent') + '" style="font-size:14px">' + fr(rw[1], 1) + ' %</text>';
    });
    return svg(W, H, s);
  }
  steps.push({
    id: 'complexite', kicker: 'Pilier visualisation', title: 'La complexité inutile',
    lead: 'Une seule question : <b>en 2024, quelle série a le meilleur taux d’admission ?</b> Répondez avec ce graphique.',
    build(b) {
      b.innerHTML = '<div class="viz main"><div data-chart>' + complexChart() + '</div><div class="viz-caption">' + SRC_BAC + '</div></div>' +
        '<div class="row"><button class="btn" data-simple>Simplifier</button><span class="small">D’abord sans simplifier.</span></div><div data-q></div><div data-after></div>';
      const btn = b.querySelector('[data-simple]');
      let simple = false;
      btn.addEventListener('click', () => {
        simple = !simple;
        b.querySelector('[data-chart]').innerHTML = simple ? simpleChart(2024) : complexChart();
        btn.textContent = simple ? 'Revoir la version chargée' : 'Simplifier';
      });
      question(b.querySelector('[data-q]'), {
        prompt: 'En 2024, quelle série a le meilleur taux d’admission ?', cols: 2,
        options: [
          {t: 'SN', why: 'SN : 23,3 %. Les quatre lignes bleues se ressemblent trop pour être lues.'},
          {t: 'M', ok: true, why: 'M : 41,6 %, loin devant LO (24,8 %) et SN (23,3 %). Avec « Simplifier », la réponse saute aux yeux.'},
          {t: 'LM', why: 'LM est la plus basse : 10,0 %. La légende, loin des lignes, oblige à des allers-retours.'},
          {t: 'LO', why: 'LO : 24,8 %, deuxième. Deux axes verticaux, quatre bleus : l’œil se perd.'}
        ],
        onSolved() {
          b.querySelector('[data-after]').innerHTML = M.note('lion', '<p><b>Une question, un graphique.</b> Vouloir tout montrer sur une seule figure crée de la confusion. Parfois, <mark>un simple tableau ou un classement suffit.</mark></p>');
        }
      });
    }
  });

  // 8. La forme avant la fonction ? Course contre la montre.
  function radial(rows, done) {
    const W = 600, H = 600, cx = 300, cy = 300, r0 = 50, k = 5.4;
    let s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r0 + '" fill="none" stroke="#eee"/>';
    rows.forEach((d, i) => {
      const a = -Math.PI / 2 + i / rows.length * 2 * Math.PI, r1 = r0 + d.taux * k;
      const c = 'hsl(' + Math.round(i / rows.length * 330) + ' 70% 55%)';
      const x1 = cx + r1 * Math.cos(a), y1 = cy + r1 * Math.sin(a), lx = cx + (r1 + 14) * Math.cos(a), ly = cy + (r1 + 14) * Math.sin(a);
      const deg = a * 180 / Math.PI, flip = Math.cos(a) < 0;
      s += '<g class="pick" data-w="' + esc(d.w) + '" style="cursor:pointer">' +
        '<line x1="' + (cx + r0 * Math.cos(a)) + '" y1="' + (cy + r0 * Math.sin(a)) + '" x2="' + x1 + '" y2="' + y1 + '" stroke="' + c + '" stroke-width="3"/>' +
        '<circle cx="' + x1 + '" cy="' + y1 + '" r="9" fill="' + c + '"/>' +
        '<text transform="translate(' + lx + ' ' + ly + ') rotate(' + (flip ? deg + 180 : deg) + ')" text-anchor="' + (flip ? 'end' : 'start') + '" dy="4" style="font-size:11px;fill:#444">' + esc(d.w) + '</text>' +
        '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + (r1 + 120) * Math.cos(a)) + '" y2="' + (cy + (r1 + 120) * Math.sin(a)) + '" stroke="transparent" stroke-width="22"/></g>';
    });
    return svg(W, H, s);
  }
  function sortedBars(rows) {
    const sorted = rows.slice().sort((a, c) => c.taux - a.taux);
    const W = 680, row = 25, H = sorted.length * row + 10, l = 160, r = 60;
    const x = scale(0, 25, l, W - r);
    let s = '';
    sorted.forEach((d, j) => {
      const y = 4 + j * row;
      s += '<g class="pick" data-w="' + esc(d.w) + '" style="cursor:pointer"><rect x="0" y="' + y + '" width="' + W + '" height="' + row + '" fill="transparent"/>' +
        '<text x="' + (l - 8) + '" y="' + (y + 17) + '" text-anchor="end" style="font-size:13px;fill:#1d2433">' + esc(d.w) + '</text>' +
        '<rect x="' + l + '" y="' + (y + 4) + '" width="' + (x(d.taux) - l) + '" height="' + (row - 8) + '" fill="' + GREY2 + '"/>' +
        '<text x="' + (x(d.taux) + 6) + '" y="' + (y + 17) + '" style="font-size:12px">' + fr(d.taux, 1) + ' %</text></g>';
    });
    return svg(W, H, s);
  }
  steps.push({
    id: 'forme', kicker: 'Pilier visualisation', title: 'Joli, ou lisible ?',
    lead: 'Défi chronométré : <b>quelle wilaya a le 3<sup>e</sup> meilleur taux d’admission en 2025 ?</b> Levez la main dès que vous savez. Deux manches, deux graphiques.',
    build(b) {
      const rows = bac.wilaya2025;
      const target = rows.slice().sort((a, c) => c.taux - a.taux)[2].w;
      const res = [];
      b.innerHTML = '<div class="row"><button class="btn btn-primary" data-start>Manche 1 : partez !</button><span class="timer" aria-live="polite"></span></div>' +
        '<div class="viz main" data-stage style="min-height:120px"><p class="small" style="margin:0">Le graphique apparaîtra au départ du chrono.</p></div><div data-result></div>';
      const stage = b.querySelector('[data-stage]'), timer = b.querySelector('.timer'), start = b.querySelector('[data-start]'), out = b.querySelector('[data-result]');
      let t0 = 0, errors = 0, iv = 0, round = 0;
      const run = () => {
        round++; errors = 0; start.disabled = true; out.innerHTML = '';
        stage.innerHTML = (round === 1 ? '<div style="max-width:560px;margin:auto">' + radial(rows) + '</div>' : sortedBars(rows)) +
          '<div class="viz-caption">Taux d’admission au bac 2025 par wilaya. ' + SRC_BAC + '</div>';
        t0 = performance.now();
        iv = setInterval(() => { timer.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s'; }, 100);
        stage.querySelectorAll('.pick').forEach(g => g.addEventListener('click', () => {
          if (g.dataset.w !== target) { errors++; timer.textContent += ' · raté (' + g.dataset.w + ')'; return; }
          clearInterval(iv);
          const sec = (performance.now() - t0) / 1000;
          res.push({sec, errors});
          timer.textContent = sec.toFixed(1) + ' s';
          g.querySelectorAll('rect,circle').forEach(n => { if (n.getAttribute('fill') !== 'transparent') n.setAttribute('fill', ACC); });
          if (round === 1) { start.disabled = false; start.textContent = 'Manche 2 : partez !'; out.innerHTML = '<p class="small">Trouvé : <b>' + esc(target) + '</b>. Passez à la manche 2.</p>'; }
          else finish();
        }));
      };
      const finish = () => {
        start.hidden = true;
        out.innerHTML = '<div class="viz"><table class="data"><thead><tr><th>Graphique</th><th>Temps</th><th>Erreurs</th></tr></thead><tbody>' +
          '<tr><td>Radial, multicolore</td><td>' + fr(res[0].sec, 1) + ' s</td><td>' + res[0].errors + '</td></tr>' +
          '<tr><td>Barres triées</td><td>' + fr(res[1].sec, 1) + ' s</td><td>' + res[1].errors + '</td></tr></tbody></table></div>' +
          M.note('lion', '<p><b>La lisibilité prime toujours.</b> Ne choisissez pas un graphique parce qu’il est joli : l’œil compare bien mieux des <mark>longueurs alignées et triées</mark> que des rayons et des couleurs.</p>');
      };
      start.addEventListener('click', run);
    }
  });

  // 9. Pilier narration : quatre styles.
  const STYLES = ['Analytique', 'Littéraire', 'Numérique', 'Journalistique'];
  const TEXTS = [
    {s: 3, t: '<b>Bac 2024 : plus d’un candidat sur cinq admis, un record depuis 2015.</b>'},
    {s: 0, t: 'Sur 47 217 candidats en 2024, 10 422 ont été déclarés admis (22,1 %), soit 7,1 points de plus qu’en 2023. Avant de conclure, il faut vérifier si la hausse vaut pour toutes les séries et toutes les wilayas.'},
    {s: 2, t: '2023 : 15,0 % · 2024 : 22,1 % · écart : + 7,1 pts · candidats : 47 217 · admis : 10 422'},
    {s: 1, t: 'Ce matin de juillet, devant les listes affichées, elle cherchait son nom. Dix ans plus tôt, sa sœur n’avait eu qu’une chance sur treize. Cette fois…'}
  ];
  steps.push({
    id: 'narration', kicker: 'Pilier narration', title: 'Quatre façons de raconter',
    lead: 'Même résultat, quatre textes. Quel style pour chacun ?',
    build(b) {
      const pick = TEXTS.map(() => -1);
      b.innerHTML = '<div class="styles-grid">' + TEXTS.map((x, i) => '<div class="style-card" data-i="' + i + '"><p>' + x.t + '</p><div class="row">' +
        STYLES.map((s, j) => '<button class="chip" data-s="' + j + '">' + s + '</button>').join('') + '</div></div>').join('') + '</div>' +
        '<div class="row" style="margin-top:12px"><button class="btn btn-primary" data-check disabled>Vérifier</button></div><div data-after></div>';
      const check = b.querySelector('[data-check]');
      b.querySelectorAll('.style-card').forEach(card => card.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
        const i = +card.dataset.i; pick[i] = +c.dataset.s;
        card.querySelectorAll('.chip').forEach(o => { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); o.classList.remove('is-right', 'is-wrong'); });
        check.disabled = pick.includes(-1);
      })));
      check.addEventListener('click', () => {
        let good = 0;
        b.querySelectorAll('.style-card').forEach(card => {
          const i = +card.dataset.i, c = card.querySelector('[data-s="' + pick[i] + '"]');
          const ok = pick[i] === TEXTS[i].s; good += ok;
          c.classList.add(ok ? 'is-right' : 'is-wrong');
          if (!ok) card.querySelector('[data-s="' + TEXTS[i].s + '"]').classList.add('is-right');
        });
        const after = b.querySelector('[data-after]');
        after.innerHTML = (good === 4 ? '<div class="q-feedback ok revealed">' + M.mascot('cat') + '<p><strong>4 sur 4 !</strong>Vous savez reconnaître les styles.</p></div>'
          : '<div class="q-feedback ko">' + M.mascot('ghost') + '<p><strong>' + good + ' sur 4.</strong>Les bonnes réponses sont en vert.</p></div>');
        if (good === 4) K.confetti(b);
        question(after, {
          prompt: 'Lequel convient le mieux pour présenter des résultats ?',
          options: STYLES.map((s, j) => ({t: s, ok: j === 3,
            why: [
              'Rigoureux, mais dense : réservé aux lecteurs qui veulent la preuve.',
              'Captivant, mais lent : le message arrive à la fin.',
              'Des chiffres bruts, sans histoire : au lecteur de tout faire.',
              'Il va droit au but avec un <b>lead</b> : le message d’abord, les détails ensuite.'][j]}))
        });
      });
    }
  });

  // 10. La pyramide inversée.
  const PYR = [
    {lvl: 0, t: 'Plus d’un candidat sur cinq admis au bac 2024 : un record depuis 2015.'},
    {lvl: 1, t: 'La série M atteint 41,6 % ; les Lettres modernes restent à 10,0 %.'},
    {lvl: 2, t: 'Données : résultats 2015–2025, ' + fr(bac.candidats.reduce((a, c) => a + c, 0)) + ' candidatures ; taux = décisions « Admis » / candidats.'}
  ];
  const PYR_SLOTS = ['L’essentiel (le « lead »)', 'Les détails clés', 'Le contexte, la méthode'];
  steps.push({
    id: 'pyramide', kicker: 'Pilier narration', title: 'La pyramide inversée',
    lead: 'Ne gardez pas le meilleur pour la fin. <b>Dans quel ordre</b> le public doit-il lire ces trois blocs ?',
    build(b) {
      const order = [2, 0, 1];
      b.innerHTML = '<div class="viz"><div class="pyramid">' + PYR_SLOTS.map((s, i) => '<div class="pyr-slot" data-slot="' + i + '" style="width:' + (100 - i * 22) + '%">' + s + '</div>').join('') + '</div>' +
        '<div class="pyr-pool">' + order.map(i => '<button class="pyr-card" data-c="' + i + '">' + PYR[i].t + '</button>').join('') + '</div></div><div data-after></div>' +
        '<div class="row"><button class="btn btn-ghost" data-reset>Recommencer</button></div>';
      let n = 0, wrong = 0;
      const slots = [...b.querySelectorAll('.pyr-slot')];
      b.querySelectorAll('.pyr-card').forEach(c => c.addEventListener('click', () => {
        const i = +c.dataset.c;
        slots[n].innerHTML = '<span><small style="display:block;color:#6e7380;font-size:11px;letter-spacing:.06em;text-transform:uppercase">' + PYR_SLOTS[n] + '</small>' + PYR[i].t + '</span>'; slots[n].classList.add('filled');
        if (i !== n) { wrong++; slots[n].style.borderColor = BAD; slots[n].style.background = '#f6e4dc'; }
        c.disabled = true; n++;
        if (n === 3) b.querySelector('[data-after]').innerHTML = wrong
          ? '<div class="q-feedback ko">' + M.mascot('ghost') + '<p><strong>Pas dans le bon ordre.</strong>D’abord le message (le record), puis ce qui l’appuie, enfin la méthode pour ceux qui veulent vérifier.</p></div>'
          : '<div class="q-feedback ok revealed">' + M.mascot('cat') + '<p><strong>Parfait.</strong>Le lecteur pressé s’arrête après la 1<sup>re</sup> ligne… et repart avec l’essentiel.</p></div>';
        if (n === 3 && !wrong) K.confetti(b);
      }));
      b.querySelector('[data-reset]').addEventListener('click', () => {
        n = 0; wrong = 0;
        slots.forEach((s, i) => { s.textContent = PYR_SLOTS[i]; s.className = 'pyr-slot'; s.style.borderColor = ''; s.style.background = ''; });
        b.querySelectorAll('.pyr-card').forEach(c => { c.disabled = false; });
        b.querySelector('[data-after]').innerHTML = '';
      });
    }
  });

  // 11. L'effet madeleine de Proust : votre prénom.
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  steps.push({
    id: 'madeleine', kicker: 'Émotion', title: 'L’effet « madeleine de Proust »',
    lead: 'Les chiffres seuls sont froids. Donnez un <b>prénom</b> : le vôtre, ou celui d’un proche.',
    build(b) {
      const P = D.prenoms, idx = {};
      Object.keys(P.noms).forEach(n => { idx[norm(n)] = n; });
      const sugg = ['Fatima', 'Mariem', 'Ahmed', 'Cheikh', 'Aicha', 'Sidi Mohamed', 'Oum Kelthoum', 'Brahim'].filter(n => P.noms[n]);
      b.innerHTML = '<form class="name-input" autocomplete="off"><input type="text" placeholder="Prénom" aria-label="Prénom"><button class="btn btn-primary">Voir</button></form>' +
        '<div class="suggest">' + sugg.map(n => '<button class="chip" data-n="' + n + '">' + n + '</button>').join('') + '</div>' +
        '<div class="viz main" data-viz hidden><div data-chart></div><div class="viz-caption">Personnes portant ce prénom pour 1 000 personnes nées la même année dans le fichier, 1980–2005.</div></div><div data-q></div>';
      const y0 = 1980, y1 = 2005, off = y0 - P.y0;
      let asked = false;
      const show = raw => {
        const key = idx[norm(raw)], viz = b.querySelector('[data-viz]'), ch = b.querySelector('[data-chart]');
        viz.hidden = false;
        if (!key) { ch.innerHTML = '<p style="margin:0">« ' + esc(raw) + ' » apparaît moins de 15 fois dans le fichier. Essayez une autre orthographe (ex. <i>Mariem</i>, <i>Meriem</i>).</p>'; return; }
        const n = P.noms[key].n, share = [];
        for (let yy = y0; yy <= y1; yy++) share.push(1000 * n[yy - P.y0] / P.naissances[yy - P.y0]);
        const total = n.reduce((a, c) => a + c, 0), peak = share.indexOf(Math.max(...share)), mx = Math.max(...share);
        const W = 680, H = 280, l = 44, r = 20, t = 64, bt = 30;
        const x = scale(y0, y1, l, W - r), y = scale(0, mx * 1.15, H - bt, t);
        const step = mx > 40 ? 20 : mx > 16 ? 5 : mx > 6 ? 2 : mx > 2 ? 1 : .5;
        const ticks = []; for (let v = 0; v <= mx * 1.15; v += step) ticks.push(v);
        let s = '<text class="title" x="0" y="20">' + esc(key) + ' : ' + fr(total) + ' personne' + (total > 1 ? 's' : '') + '</text>' +
          '<text class="subtitle" x="0" y="42">Le plus fréquent en ' + (y0 + peak) + ' : ' + fr(share[peak], 1) + ' naissances sur 1 000.</text>';
        s += yAxis(y, ticks, l, W - r, v => fr(v, step < 1 ? 1 : 0));
        [1980, 1985, 1990, 1995, 2000, 2005].forEach(yy => { s += '<text x="' + x(yy) + '" y="' + (H - bt + 18) + '" text-anchor="middle">' + yy + '</text>'; });
        const pts = share.map((v, i) => [x(y0 + i), y(v)]);
        s += '<path d="' + path([[x(y0), y(0)], ...pts, [x(y1), y(0)]]) + 'Z" fill="' + ACC + '" opacity=".12"/>';
        s += '<path class="draw" d="' + path(pts) + '" fill="none" stroke="' + ACC + '" stroke-width="2.5"/>';
        s += '<circle cx="' + pts[peak][0] + '" cy="' + pts[peak][1] + '" r="5" fill="' + ACC + '"/>';
        ch.innerHTML = svg(W, H, s);
        if (!asked) {
          asked = true;
          question(b.querySelector('[data-q]'), {
            prompt: 'Pourquoi ce graphique retient-il plus l’attention qu’un tableau de 300 prénoms ?',
            options: [
              {t: 'Il est plus précis', why: 'Le tableau contiendrait exactement les mêmes nombres.'},
              {t: 'Il parle de vous : un souvenir, une émotion', ok: true, why: 'Un message reste gravé s’il évoque une émotion ou un souvenir familier. Racontez l’histoire <b>humaine</b> derrière le chiffre : créez votre « madeleine ».'},
              {t: 'Il utilise de la couleur', why: 'La couleur attire l’œil, mais elle ne rend pas un message mémorable.'}
            ]
          });
        }
      };
      b.querySelector('form').addEventListener('submit', e => { e.preventDefault(); const v = b.querySelector('input').value.trim(); if (v) show(v); });
      b.querySelectorAll('[data-n]').forEach(c => c.addEventListener('click', () => { b.querySelector('input').value = c.dataset.n; show(c.dataset.n); }));
    }
  });

  // 12. Une classe de 30 : rendre le pourcentage humain.
  function classroom(n, total = 30) {
    const W = 600, H = 300, cols = 10, cw = W / cols, rh = 96;
    let s = '';
    for (let i = 0; i < total; i++) {
      const cx = cw * (i % cols) + cw / 2, cy = 30 + Math.floor(i / cols) * rh, on = i < n;
      const c = on ? ACC : GREY2;
      s += '<g class="fade-in" style="animation-delay:' + i * 25 + 'ms"><circle cx="' + cx + '" cy="' + cy + '" r="13" fill="' + c + '"/>' +
        '<path d="M' + (cx - 20) + ' ' + (cy + 52) + 'v-10a20 20 0 0 1 40 0v10Z" fill="' + c + '"/></g>';
    }
    return svg(W, H, s);
  }
  steps.push({
    id: 'classe', kicker: 'Émotion', title: 'Une classe de 30 élèves',
    lead: '« 18,8 % d’admis » reste abstrait. Imaginez une classe de terminale de <b>30 élèves</b>.',
    build(b) {
      const W25 = Object.fromEntries(bac.wilaya2025.map(d => [d.w, d.taux]));
      const cases = [['Mauritanie 2025', at(2025)], ['Mauritanie 2015', at(2015)], ['Guidimagha 2025', W25['Guidimagha']], ['Hodh Chargui 2025', W25['Hodh Chargui']], ['Nouakchott Ouest 2025', W25['Nouakchott Ouest']]];
      b.innerHTML = '<div class="viz main"><div data-chart></div><p class="small" data-cap style="margin:6px 0 0"></p><div class="viz-caption">Élèves admis sur 30, arrondi du taux d’admission réel. ' + SRC_BAC + '</div></div>' +
        '<div class="row" style="gap:6px">' + cases.map((c, i) => '<button class="chip" data-c="' + i + '">' + c[0] + '</button>').join('') + '</div><div data-q></div>';
      const show = i => {
        const [lab, r] = cases[i], n = Math.round(30 * r / 100);
        b.querySelector('[data-chart]').innerHTML = classroom(n);
        b.querySelector('[data-cap]').innerHTML = '<b>' + lab + ' : ' + n + ' élève' + (n > 1 ? 's' : '') + ' sur 30</b> (' + fr(r, 1) + ' %).';
        b.querySelectorAll('[data-c]').forEach(c => c.setAttribute('aria-pressed', +c.dataset.c === i ? 'true' : 'false'));
      };
      b.querySelectorAll('[data-c]').forEach(c => c.addEventListener('click', () => show(+c.dataset.c)));
      show(0);
      question(b.querySelector('[data-q]'), {
        prompt: 'À Guidimagha, dans une classe de 30, combien d’élèves ont eu le bac en 2025 ?', cols: 2,
        options: [
          {t: '3', ok: true, why: '9,8 % de 30 ≈ 3 élèves. À Hodh Chargui, 7. Dit comme ça, l’écart entre wilayas devient concret.'},
          {t: '6', why: '6, c’est la moyenne nationale (18,8 %). Guidimagha est la wilaya la plus basse : 9,8 %.'},
          {t: '9', why: 'Ce serait 30 %. Guidimagha est à 9,8 %.'},
          {t: '12', why: 'Ce serait 40 %, presque le taux de la série M (40,8 %). Guidimagha : 9,8 %.'}
        ],
        onSolved() {
          show(2);
          b.querySelector('[data-q]').insertAdjacentHTML('beforeend', M.note('lion', '<p><b>Traduisez les pourcentages en personnes.</b> « 3 élèves sur 30 » se voit et se retient ; « 9,8 % » se lit et s’oublie.</p>'));
        }
      });
    }
  });

  // 13. Attributs pré-attentifs : compter les 7.
  steps.push({
    id: 'preattentif', kicker: 'Voir sans lire', title: 'Combien de 7 ?',
    lead: 'Comptez les <b>7</b> dans la grille. Levez la main dès que vous avez le nombre. Deux manches.',
    build(b) {
      const grid = (seed, sevens) => {
        const r = rng(seed), cells = [];
        for (let i = 0; i < 84; i++) { let d; do { d = Math.floor(r() * 10); } while (d === 7); cells.push(d); }
        const pos = new Set(); while (pos.size < sevens) pos.add(Math.floor(r() * 84));
        pos.forEach(p => { cells[p] = 7; });
        return cells;
      };
      const rounds = [{cells: grid(11, 9), color: false}, {cells: grid(29, 8), color: true}];
      const times = [];
      b.innerHTML = '<div class="row"><button class="btn btn-primary" data-start>Manche 1</button><span class="timer"></span></div>' +
        '<div class="viz main"><div class="numgrid blurred" data-grid aria-hidden="true">' + rounds[0].cells.map(d => '<span>' + d + '</span>').join('') + '</div></div>' +
        '<form class="name-input" data-form hidden><input type="number" min="0" max="84" placeholder="Nombre de 7" aria-label="Nombre de 7"><button class="btn btn-primary">Valider</button></form><div data-after></div>';
      const g = b.querySelector('[data-grid]'), start = b.querySelector('[data-start]'), timer = b.querySelector('.timer'), form = b.querySelector('[data-form]'), after = b.querySelector('[data-after]');
      let r = 0, t0 = 0, iv = 0;
      start.addEventListener('click', () => {
        const R = rounds[r];
        g.innerHTML = R.cells.map(d => '<span' + (d === 7 && R.color ? ' class="hit"' : '') + '>' + d + '</span>').join('');
        g.classList.remove('blurred'); form.hidden = false; start.disabled = true; after.innerHTML = '';
        form.querySelector('input').value = ''; form.querySelector('input').focus({preventScroll: true});
        t0 = performance.now(); iv = setInterval(() => { timer.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s'; }, 100);
      });
      form.addEventListener('submit', e => {
        e.preventDefault();
        const v = +form.querySelector('input').value, truth = rounds[r].cells.filter(d => d === 7).length;
        clearInterval(iv);
        const sec = (performance.now() - t0) / 1000; times.push({sec, ok: v === truth, v, truth});
        form.hidden = true; r++;
        if (r === 1) {
          g.classList.add('blurred');
          after.innerHTML = '<p class="small">' + (v === truth ? 'Juste' : 'Il y en avait ' + truth) + ', en ' + fr(sec, 1) + ' s. Manche 2 : même consigne.</p>';
          start.disabled = false; start.textContent = 'Manche 2';
        } else {
          start.hidden = true;
          after.innerHTML = '<div class="viz"><table class="data"><thead><tr><th>Manche</th><th>Temps</th><th>Réponse</th></tr></thead><tbody>' +
            times.map((x, i) => '<tr><td>' + (i ? 'Les 7 en couleur' : 'Sans aide') + '</td><td>' + fr(x.sec, 1) + ' s</td><td>' + (x.ok ? 'juste' : x.v + ' (vrai : ' + x.truth + ')') + '</td></tr>').join('') + '</tbody></table></div>' +
            M.note('lion', '<p><b>Attributs pré-attentifs.</b> La <mark>couleur</mark>, la <mark>taille</mark> et la <mark>position</mark> sont traitées avant même la lecture. Utilisez-les pour guider l’œil vers le message, et seulement vers lui.</p>');
        }
      });
    }
  });

  // 14. Réduire la charge cognitive : désencombrer.
  const CLUTTER = [
    ['bg', 'Fond gris'], ['grid', 'Quadrillage épais'], ['shadow', 'Ombre « 3D »'], ['markers', 'Un marqueur par point'],
    ['legend', 'Légende inutile'], ['rot', 'Dates inclinées'], ['border', 'Cadre']
  ];
  function trendChart(on, story) {
    const T = D.trend, n = T.values.length, W = 680, H = story ? 320 : 300, l = 40, r = 14, t = story ? 70 : 34, bt = on.rot ? 52 : 30;
    const x = scale(0, n - 1, l, W - r), y = scale(0, 100, H - bt, t);
    let s = '';
    if (on.bg) s += '<rect width="' + W + '" height="' + H + '" fill="#e9e9e9"/>';
    if (on.border) s += '<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" fill="none" stroke="#333" stroke-width="2"/>';
    if (story) s += '<text class="title" x="0" y="22">Chaque été, la Mauritanie cherche « Bac »</text><text class="subtitle" x="0" y="44">Intérêt de recherche Google pour « Bac » (100 = maximum). En couleur : le pic de chaque année.</text>';
    else s += '<text x="' + (on.bg ? 12 : 0) + '" y="20" style="font:700 14px Roboto;fill:#333">Google Trends - Bac - Mauritanie - 2004-2024</text>';
    [0, 25, 50, 75, 100].forEach(v => {
      s += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="' + (on.grid ? '#777' : '#eceef1') + '" stroke-width="' + (on.grid ? 1.4 : 1) + '"/>';
      s += '<text x="' + (l - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>';
    });
    if (on.grid) for (let i = 0; i < n; i += 12) s += '<line x1="' + x(i) + '" x2="' + x(i) + '" y1="' + t + '" y2="' + y(0) + '" stroke="#777" stroke-width="1.2"/>';
    for (let i = 0; i < n; i += 24) {
      const lab = T.dates[i].slice(0, 4);
      s += on.rot ? '<text transform="translate(' + x(i) + ' ' + (H - bt + 12) + ') rotate(-45)" text-anchor="end">' + T.dates[i] + '</text>'
        : '<text x="' + x(i) + '" y="' + (H - bt + 18) + '" text-anchor="middle">' + lab + '</text>';
    }
    const pts = T.values.map((v, i) => [x(i), y(v)]);
    if (on.shadow) s += '<path d="' + path(pts.map(p => [p[0] + 5, p[1] + 6])) + '" fill="none" stroke="#999" stroke-width="3" opacity=".6"/>';
    s += '<path d="' + path(pts) + '" fill="none" stroke="' + (story ? GREY : '#4472C4') + '" stroke-width="' + (story ? 1.6 : 2.2) + '"/>';
    if (on.markers) s += pts.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.6" fill="#ED7D31"/>').join('');
    if (on.legend) s += '<rect x="' + (W - 120) + '" y="' + (t + 4) + '" width="100" height="26" fill="#fff" stroke="#999"/><line x1="' + (W - 112) + '" x2="' + (W - 92) + '" y1="' + (t + 17) + '" y2="' + (t + 17) + '" stroke="#4472C4" stroke-width="2"/><text x="' + (W - 86) + '" y="' + (t + 21) + '" style="fill:#333">Bac</text>';
    if (story) {
      const peaks = {};
      T.values.forEach((v, i) => { const yr = T.dates[i].slice(0, 4); if (v > 0 && (!peaks[yr] || v > T.values[peaks[yr]])) peaks[yr] = i; });
      Object.values(peaks).forEach(i => { s += '<circle class="fade-in" cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="4" fill="' + ACC + '"/>'; });
      const top = T.values.indexOf(100);
      s += '<text x="' + (pts[top][0] - 8) + '" y="' + (pts[top][1] + 4) + '" text-anchor="end" class="lbl-accent">oct. 2020 : année Covid</text>';
    }
    return svg(W, H, s);
  }
  steps.push({
    id: 'charge', kicker: 'Charge cognitive', title: 'Retirez tout ce qui ne sert pas',
    lead: 'Faites défiler : chaque paragraphe retire un élément qui demande un effort au cerveau.',
    build(b) {
      const all = CLUTTER.map(c => c[0]);
      const off = [[], ['bg', 'border'], ['bg', 'border', 'shadow'], ['bg', 'border', 'shadow', 'grid'], ['bg', 'border', 'shadow', 'grid', 'markers'], all, all];
      K.scrolly(b, {
        steps: [
          '<p>Le graphique tel qu’on le reçoit souvent : Google Trends, recherches « Bac » en Mauritanie.</p><span class="sc-ask">Que peut-on supprimer ?</span>',
          '<p>Le <b>fond gris</b> et le <b>cadre</b> : ils n’apportent aucune information.</p>',
          '<p>L’<b>ombre « 3D »</b> : elle dédouble la courbe.</p>',
          '<p>Le <b>quadrillage épais</b> devient discret : il guide sans crier.</p>',
          '<p><b>Un marqueur par point</b> : 250 ronds orange qui cachent la courbe.</p>',
          '<p>La <b>légende</b> (une seule série !) et les <b>dates inclinées</b>.</p><p>« La perfection est atteinte non quand il n’y a plus rien à ajouter, mais quand il n’y a plus rien à retirer. »</p>',
          '<p>Puis <b>une couleur, une seule</b>, pour le message : le pic de chaque année tombe en juillet, 17 années sur 19. Les exceptions (2020, 2021) racontent elles aussi une histoire.</p>'
        ],
        render(el, i) {
          const on = {}; all.forEach(k => { on[k] = !off[i].includes(k); });
          const left = all.length - off[i].length;
          el.innerHTML = trendChart(on, i === 6) + '<p class="small" style="margin:8px 0 0">' + (left ? 'Éléments superflus restants : <b>' + left + '</b>' : 'Plus rien à retirer.') + '</p>' +
            '<div class="viz-caption">Google Trends, recherches « Bac » en Mauritanie, ' + D.trend.dates[0].slice(0, 4) + '–' + D.trend.dates[D.trend.dates.length - 1].slice(0, 4) + '.</div>';
        }
      });
    }
  });

  // 15. Gestalt : légende ou étiquettes directes ?
  function serieChart(st) {
    const W = 680, H = 330, l = 54, r = st.prox ? 190 : 20, t = 24, bt = st.prox ? 34 : 74;
    const x = scale(2015, 2025, l, W - r), y = scale(0, 45, H - bt, t);
    const cols = {SN: '#4e79a7', M: '#59a14f', LM: '#e15759', LO: '#b07aa1'};
    const names = {SN: 'Sciences nat. (SN)', M: 'Maths (M)', LM: 'Lettres mod. (LM)', LO: 'Lettres orig. (LO)'};
    let s = yAxis(y, [0, 15, 30, 45], l, W - r, v => v + ' %');
    [2015, 2020, 2025].forEach(yy => { s += '<text x="' + x(yy) + '" y="' + (H - bt + 20) + '" text-anchor="middle">' + yy + '</text>'; });
    Object.keys(cols).forEach(k => {
      const c = st.sim ? (k === 'LM' ? ACC : GREY2) : cols[k];
      const pts = bac.years.map((yy, i) => [x(yy), y(bac.serie[k][i])]);
      s += '<path d="' + path(pts) + '" fill="none" stroke="' + c + '" stroke-width="' + (st.sim && k === 'LM' ? 3.2 : 2.2) + '"/>';
      if (st.prox) {
        const last = pts[pts.length - 1];
        s += '<text x="' + (last[0] + 8) + '" y="' + (last[1] + 5) + '" style="font-size:13px;font-weight:700;fill:' + (st.sim && k !== 'LM' ? '#8a8f99' : c) + '">' + names[k] + '</text>';
      }
    });
    if (!st.prox) {
      const keys = Object.keys(cols);
      s += '<rect x="' + l + '" y="' + (H - 30) + '" width="' + (W - l - 20) + '" height="26" fill="none" stroke="#d1d5db"/>';
      keys.forEach((k, i) => { s += '<line x1="' + (l + 14 + i * 150) + '" x2="' + (l + 34 + i * 150) + '" y1="' + (H - 17) + '" y2="' + (H - 17) + '" stroke="' + (st.sim ? (k === 'LM' ? ACC : GREY2) : cols[k]) + '" stroke-width="3"/><text x="' + (l + 40 + i * 150) + '" y="' + (H - 12) + '" style="font-size:12px">' + names[k] + '</text>'; });
    }
    return svg(W, H, s);
  }
  steps.push({
    id: 'gestalt', kicker: 'Gestalt', title: 'Légende ou étiquettes ?',
    lead: 'Faites défiler : deux principes de la Gestalt, appliqués au même graphique.',
    build(b) {
      const states = [{prox: false, sim: false}, {prox: true, sim: false}, {prox: true, sim: true}];
      K.scrolly(b, {
        steps: [
          '<p>Taux d’admission au bac par série, avec une légende en bas.</p><span class="sc-ask">Quelle série a le taux le plus bas en 2025 ? Combien d’allers-retours vers la légende ?</span>',
          '<p><mark>Proximité</mark> : ce qui est proche est perçu comme lié. L’étiquette se place au bout de sa ligne ; la légende disparaît.</p>',
          '<p><mark>Similarité</mark> : ce qui se ressemble forme un groupe. Le gris pour le contexte, une couleur pour le message : <b>Lettres modernes, 10,4 %</b>.</p>'
        ],
        render(el, i) { el.innerHTML = serieChart(states[i]) + '<div class="viz-caption">Taux d’admission au bac par série. ' + SRC_BAC + '</div>'; }
      });
    }
  });

  // 16. Connaître son audience.
  steps.push({
    id: 'audience', kicker: 'Audience', title: 'À qui parlez-vous ?',
    lead: 'Deux diapositives, deux publics. Qui reçoit laquelle ?',
    build(b) {
      const A = '<div class="mini-slide"><h4>Bac 2024 : 1 candidat sur 5 admis, un record</h4><div style="font:700 34px/1 Bitter;color:' + ACC + ';margin:10px 0">22,1 %</div><div>Point d’attention : Lettres modernes, 10 %.</div><div style="margin-top:6px;font-weight:700">Décision proposée : soutien ciblé LM.</div></div>';
      const Bs = '<div class="mini-slide"><h4>Méthode et données</h4><div>' + fr(bac.candidats.reduce((a, c) => a + c, 0)) + ' candidatures 2015–2025 ; taux = « Admis » / candidats.</div>' +
        '<table class="data" style="font-size:10px;margin-top:6px"><tr><td>SN</td><td>23,3</td><td>M</td><td>41,6</td></tr><tr><td>LM</td><td>10,0</td><td>LO</td><td>24,8</td></tr></table><div style="margin-top:4px">Limite : les « sessionnaires » (2<sup>e</sup> session) comptent comme non admis.</div></div>';
      const who = [['Le ministre', 'veut le « so what ? » tout de suite', 0], ['L’analyste', 'veut valider votre méthode', 1]];
      b.innerHTML = '<div class="slides-2"><div><div class="small"><b>Diapo A</b></div>' + A + '</div><div><div class="small"><b>Diapo B</b></div>' + Bs + '</div></div>' +
        '<div class="audience">' + who.map((w, i) => '<div class="audience-row" data-i="' + i + '"><b>' + w[0] + '</b><span class="small">' + w[1] + '</span><span class="row" style="gap:6px;margin-left:auto"><button class="chip" data-v="0">Diapo A</button><button class="chip" data-v="1">Diapo B</button></span></div>').join('') + '</div><div data-after></div>';
      const ans = [-1, -1];
      b.querySelectorAll('.audience-row').forEach(row => row.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
        const i = +row.dataset.i; ans[i] = +c.dataset.v;
        row.querySelectorAll('.chip').forEach(o => { o.classList.remove('is-right', 'is-wrong'); o.setAttribute('aria-pressed', 'false'); });
        c.classList.add(ans[i] === who[i][2] ? 'is-right' : 'is-wrong');
        if (ans[0] === 0 && ans[1] === 1) {
          b.querySelector('[data-after]').innerHTML = '<div class="q-feedback ok revealed">' + M.mascot('cat') + '<p><strong>C’est ça.</strong>L’exécutif veut le message et la décision ; l’analyste veut pouvoir vérifier. Même données, deux histoires.</p></div>';
        } else if (ans[i] !== who[i][2]) {
          b.querySelector('[data-after]').innerHTML = '<div class="q-feedback ko">' + M.mascot('ghost') + '<p><strong>Hmm.</strong>' + (i === 0 ? 'Un ministre a deux minutes : il lui faut le message et la décision, pas la méthode.' : 'L’analyste ne se contente pas d’un grand chiffre : il veut la méthode et les limites.') + '</p></div>';
        }
      })));
    }
  });

  // 17. Même chiffre, deux unes : l'éthique du récit.
  function uneChart(kind, zero) {
    const W = 340, H = 220, l = 40, r = 12, t = 14, bt = 26;
    let s = '';
    if (kind === 'A') {
      const yrs = [2023, 2024, 2025], lo = zero ? 0 : 14, hi = 23;
      const y = scale(lo, hi, H - bt, t), bw = 56, x = i => l + 34 + i * 90;
      s += yAxis(y, zero ? [0, 5, 10, 15, 20] : [14, 16, 18, 20, 22], l, W - r, v => v + ' %');
      yrs.forEach((yy, i) => {
        const v = at(yy);
        s += '<rect x="' + x(i) + '" y="' + y(v) + '" width="' + bw + '" height="' + (y(lo) - y(v)) + '" fill="' + (yy === 2025 ? BAD : GREY2) + '"/>' +
          '<text x="' + (x(i) + bw / 2) + '" y="' + (y(v) - 6) + '" text-anchor="middle" class="lbl-strong">' + fr(v, 1) + '</text>' +
          '<text x="' + (x(i) + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + yy + '</text>';
      });
    } else {
      const x = scale(2015, 2025, l, W - r - 10), y = scale(0, 25, H - bt, t);
      s += yAxis(y, [0, 10, 20], l, W - r, v => v + ' %');
      s += '<path d="' + path(bac.years.map((yy, i) => [x(yy), y(bac.taux[i])])) + '" fill="none" stroke="' + GREY + '" stroke-width="2"/>';
      s += '<circle cx="' + x(2025) + '" cy="' + y(at(2025)) + '" r="5" fill="' + GOOD + '"/><text x="' + (x(2025) - 8) + '" y="' + (y(at(2025)) + 20) + '" text-anchor="end" style="fill:' + GOOD + ';font-weight:700">18,8 %</text>';
      [2015, 2025].forEach(yy => { s += '<text x="' + x(yy) + '" y="' + (H - 8) + '" text-anchor="middle">' + yy + '</text>'; });
    }
    return svg(W, H, s);
  }
  steps.push({
    id: 'deux-unes', kicker: 'Éthique', title: 'Même chiffre, deux unes',
    lead: 'Bac 2025 : 18,8 % d’admis. Faites défiler : deux journaux, deux titres.',
    build(b) {
      const une = (k, title, zero, hidden) => '<div class="une"' + (hidden ? ' style="opacity:.25"' : '') + '><div class="une-mast">' + (k === 'A' ? 'LE QUOTIDIEN' : 'L’HEBDO') + '</div><h4>' + (hidden ? '…' : title) + '</h4>' + (hidden ? '<div style="height:150px"></div>' : uneChart(k, zero)) + '</div>';
      K.scrolly(b, {
        steps: [
          '<p>Le journal A titre : <b>« Le bac s’effondre en 2025 »</b>.</p>',
          '<p>La même semaine, le journal B : <b>« 2025 : deuxième meilleur taux depuis 2015 »</b>.</p><span class="sc-ask">Lequel ment ?</span>',
          '<p>Regardez l’axe du journal A : il commence à <b>14 %</b>. Remettons-le à zéro.</p>',
          '<p><b>Aucun ne ment.</b> Recul de 3,3 points <i>et</i> deuxième meilleur taux en 11 ans.</p><p>C’est le choix de la <mark>période</mark> et de l’<mark>axe</mark> qui fabrique l’histoire.</p>'
        ],
        render(el, i) {
          el.innerHTML = '<div class="unes">' + une('A', 'Le bac s’effondre en 2025', i >= 2) + une('B', '2025 : deuxième meilleur taux depuis 2015', false, i === 0) + '</div><div class="viz-caption">' + SRC_BAC + '</div>';
        }
      });
      b.insertAdjacentHTML('beforeend', M.note('ghost', '<p><b>Le pouvoir du conteur.</b> Les données ne mentent pas ; le cadrage choisit. Choisissez la période et l’axe pour <mark>éclairer</mark>, pas pour impressionner. Suite au CM 2 : le « facteur de mensonge ».</p>'));
    }
  });

  // 18. À retenir.
  steps.push({
    id: 'retenir', kicker: 'À retenir', title: 'Ce que vous emportez',
    lead: 'Sept idées à garder.',
    build(b) {
      b.innerHTML = '<ol class="recap">' + [
        'Il faut les <b>trois piliers</b> : données, visualisation, narration.',
        'Interrogez les données : <mark>qui manque ?</mark> Méfiez-vous du biais du survivant et du biais de confirmation.',
        '<b>Une question, un graphique.</b> La lisibilité passe avant la beauté.',
        'Commencez par l’essentiel (<b>pyramide inversée</b>), ancrez le chiffre dans l’humain (<b>madeleine</b>).',
        'Couleur, taille, position guident l’œil ; <b>retirez</b> ce qui ne sert pas le message.',
        'Adaptez-vous au <b>public</b> : l’exécutif veut le « so what ? », l’analyste la méthode.',
        'Mêmes données, plusieurs histoires : choisissez la <b>période</b> et l’<b>axe</b> pour éclairer, pas pour impressionner.'
      ].map(x => '<li><span>' + x + '</span></li>').join('') + '</ol>' +
        M.note('dog', '<p><b>Prochaine séance : TD 1.</b> Le même graphique en Matplotlib, Seaborn et Altair. Venez avec Python et un notebook qui fonctionne.</p>');
    }
  });

  /* ---------- Réserve : à utiliser s'il reste du temps ---------- */

  // R1. Trouvez l'histoire : carte de chaleur wilayas × années, en défilement.
  function heat(focus) {
    const WY = bac.wilayaYears, years = bac.years, i25 = years.indexOf(2025);
    const rows = Object.keys(WY).sort((a, c) => WY[c][i25] - WY[a][i25]);
    const W = 680, l = 168, top = 26, cw = (W - l) / years.length, rh = 23, H = top + rows.length * rh + 4;
    const col = v => { const t = Math.min(1, v / 30); return 'rgb(' + Math.round(255 - t * (255 - 138)) + ',' + Math.round(255 - t * (255 - 79)) + ',' + Math.round(255 - t * (255 - 140)) + ')'; };
    let s = years.map((y, j) => '<text x="' + (l + cw * j + cw / 2) + '" y="16" text-anchor="middle"' + (focus.col === j ? ' class="lbl-accent"' : '') + '>' + String(y).slice(2) + '</text>').join('');
    rows.forEach((w, r) => {
      const y = top + r * rh;
      s += '<text x="' + (l - 8) + '" y="' + (y + 16) + '" text-anchor="end"' + (focus.row === w ? ' class="lbl-accent"' : '') + '>' + esc(w) + '</text>';
      years.forEach((yy, j) => {
        const v = WY[w][j], on = focus.cells ? focus.cells.some(c => c[0] === w && c[1] === j) : (focus.col == null || focus.col === j) && (focus.row == null || focus.row === w);
        const x = l + cw * j;
        s += '<g opacity="' + (on ? 1 : .22) + '"><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + (cw - 2) + '" height="' + (rh - 2) + '" fill="' + (v == null ? '#fff' : col(v)) + '" stroke="' + (v == null ? BAD : 'none') + '" stroke-dasharray="3 2"/>' +
          (v == null ? '' : '<text x="' + (x + cw / 2) + '" y="' + (y + 16) + '" text-anchor="middle" style="font-size:11px;fill:' + (v > 17 ? '#fff' : INK) + '">' + fr(v, 0) + '</text>') + '</g>';
      });
    });
    return svg(W, H, s, 'heat');
  }
  steps.push({
    id: 'histoire', kicker: 'Explorer', title: 'Trouvez l’histoire',
    lead: 'Taux d’admission (%) par wilaya et par année, du plus haut au plus bas en 2025. Où est l’histoire ?',
    build(b) {
      const WY = bac.wilayaYears, yrs = bac.years, j = y => yrs.indexOf(y), names = Object.keys(WY);
      const lowest = yrs.map((y, k) => names.filter(w => WY[w][k] != null).sort((a, c) => WY[a][k] - WY[c][k])[0]);
      const guidi = lowest.map((w, k) => w === 'Guidimagha' ? k : -1).filter(k => k >= 0);
      const known = yrs.filter((y, k) => names.some(w => WY[w][k] != null)).length;
      const min24 = Math.min(...names.map(w => WY[w][j(2024)]));
      const stories = [
        {focus: {}, html: '<p>Laissez la classe chercher d’abord.</p><span class="sc-ask">Quelle case, quelle ligne, quelle colonne vous arrête ?</span>'},
        {focus: {col: j(2020)}, html: '<p><b>Une colonne vide</b> : en 2020, aucune wilaya n’est renseignée dans le fichier.</p><span class="sc-ask">Qui manque ? Pourquoi ?</span>'},
        {focus: {cells: [['Hodh Chargui', j(2018)], ['Hodh Chargui', j(2019)], ['Inchiri', j(2018)], ['Inchiri', j(2019)]]}, html: '<p><b>2018, un pic isolé</b> : Hodh Chargui ' + fr(WY['Hodh Chargui'][j(2018)], 1) + ' %, Inchiri ' + fr(WY['Inchiri'][j(2018)], 1) + ' %… puis ' + fr(WY['Hodh Chargui'][j(2019)], 1) + ' % et ' + fr(WY['Inchiri'][j(2019)], 1) + ' % en 2019.</p>'},
        {focus: {row: 'Nouakchott Nord'}, html: '<p><b>Nouakchott Nord</b> : de ' + fr(WY['Nouakchott Nord'][0], 1) + ' % en 2015 à ' + fr(WY['Nouakchott Nord'][j(2024)], 1) + ' % en 2024, une montée régulière.</p>'},
        {focus: {cells: guidi.map(k => ['Guidimagha', k])}, html: '<p><b>Guidimagha</b> : la wilaya la plus basse ' + guidi.length + ' années sur ' + known + '.</p>'},
        {focus: {col: j(2024)}, html: '<p><b>2024</b> : toutes les wilayas dépassent ' + fr(Math.floor(min24), 0) + ' %. Une année record partout.</p><p>Explorer pour trouver les perles ; <mark>expliquer pour les montrer</mark>. On en reparle au CM 2.</p>'}
      ];
      K.scrolly(b, {
        steps: stories.map(x => x.html),
        render(el, i) { el.innerHTML = heat(stories[i].focus) + '<div class="viz-caption">' + SRC_BAC + '</div>'; }
      });
    }
  });

  // R2. Pourquoi le taux a-t-il triplé ? Ce que les données disent… et ne disent pas.
  steps.push({
    id: 'pourquoi', kicker: 'Interpréter', title: 'Pourquoi le taux a-t-il triplé ?',
    lead: 'Toutes les séries progressent entre 2015 et 2025. Les données expliquent-elles pourquoi ?',
    build(b) {
      const i15 = 0, i25 = bac.years.indexOf(2025);
      const rows = [['Ensemble', bac.taux[i15], bac.taux[i25], bac.candidats[i15], bac.candidats[i25]]].concat(
        ['SN', 'M', 'LM', 'LO'].map(k => [k, bac.serie[k][i15], bac.serie[k][i25], bac.candSerie[k][i15], bac.candSerie[k][i25]]));
      const W = 680, l = 110, r = 150, t = 30, rh = 44, H = t + rows.length * rh;
      const x = scale(0, 45, l, W - r);
      let s = '<text x="' + l + '" y="16" style="font-weight:700;fill:' + GREY + '">● 2015</text><text x="' + (l + 70) + '" y="16" class="lbl-accent">● 2025</text><text x="' + (W - 4) + '" y="16" text-anchor="end">candidats 2015 → 2025</text>';
      rows.forEach((rw, k) => {
        const y = t + k * rh + 18;
        s += '<text x="' + (l - 10) + '" y="' + (y + 5) + '" text-anchor="end" class="lbl-strong">' + rw[0] + '</text>' +
          '<line x1="' + x(rw[1]) + '" x2="' + x(rw[2]) + '" y1="' + y + '" y2="' + y + '" stroke="' + GREY2 + '" stroke-width="4"/>' +
          '<circle cx="' + x(rw[1]) + '" cy="' + y + '" r="7" fill="' + GREY + '"/><circle cx="' + x(rw[2]) + '" cy="' + y + '" r="7" fill="' + ACC + '"/>' +
          '<text x="' + (x(rw[2]) + 12) + '" y="' + (y + 5) + '" class="lbl-accent">' + fr(rw[2], 1) + ' %</text>' +
          '<text x="' + (W - 4) + '" y="' + (y + 5) + '" text-anchor="end">' + fr(rw[3]) + ' → ' + fr(rw[4]) + '</text>';
      });
      b.innerHTML = '<div class="viz main">' + svg(W, H, s) + '<div class="viz-caption">Taux d’admission par série, 2015 et 2025, et nombre de candidats. ' + SRC_BAC + '</div></div><div data-q></div>';
      question(b.querySelector('[data-q]'), {
        prompt: 'Ces données prouvent-elles que les élèves sont meilleurs qu’en 2015 ?',
        options: [
          {t: 'Oui : toutes les séries progressent', why: 'Elles progressent, oui. Mais un examen plus facile ou une notation plus large donneraient exactement le même graphique.'},
          {t: 'Oui : la série M dépasse 40 %', why: 'La série M a aussi deux fois moins de candidats (2 806 → 1 550) : elle est peut-être plus sélective. Ce n’est pas une preuve.'},
          {t: 'Non : elles montrent ce qui a changé, pas pourquoi', ok: true, why: 'Élèves mieux préparés ? Examen plus facile ? Notation ? Choix des séries ? Les données ne tranchent pas. Un récit honnête <b>le dit</b>.'}
        ]
      });
    }
  });

  // R3. Duel de prénoms : la classe vote, on révèle.
  steps.push({
    id: 'duel', kicker: 'Jeu', title: 'Duel de prénoms',
    lead: 'Dans le fichier des 132 015 prénoms, lequel est le plus fréquent ? La classe vote, on révèle.',
    build(b) {
      const N = D.prenoms.duel, pairs = [['Fatima', 'Mariem'], ['Aicha', 'Khadija'], ['Zeineb', 'Amina'], ['Cheikh', 'Brahim'], ['Sidi Mohamed', 'Mohamed lemine'], ['Ahmed', 'Mohamed']];
      let k = 0, score = 0;
      b.innerHTML = '<div class="viz main" data-duel></div>';
      const box = b.querySelector('[data-duel]');
      const show = () => {
        const [a, c] = pairs[k];
        box.innerHTML = '<p class="small" style="margin:0 0 10px">Duel ' + (k + 1) + ' / ' + pairs.length + ' · score de la classe : ' + score + '</p>' +
          '<div class="slides-2">' + [a, c].map(n => '<button class="pyr-card" data-n="' + esc(n) + '" style="font:700 26px/1.2 Bitter;text-align:center;padding:22px">' + esc(n) + '</button>').join('') + '</div><div data-res></div>';
        box.querySelectorAll('[data-n]').forEach(btn => btn.addEventListener('click', () => {
          const win = N[a] >= N[c] ? a : c, ok = btn.dataset.n === win;
          if (ok) score++;
          box.querySelectorAll('[data-n]').forEach(x => { x.disabled = true; x.style.opacity = 1; x.style.borderColor = x.dataset.n === win ? GOOD : '#d1d5db'; x.style.background = x.dataset.n === win ? '#e3efe8' : '#fff'; });
          const mx = Math.max(N[a], N[c]);
          const bars = [a, c].map(n => '<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="width:150px;text-align:right;font-weight:700">' + esc(n) + '</span><span style="height:22px;width:' + (60 * N[n] / mx) + '%;background:' + (n === win ? ACC : GREY2) + '"></span><span>' + fr(N[n]) + '</span></div>').join('');
          const last = k === pairs.length - 1;
          box.querySelector('[data-res]').innerHTML = '<div style="margin-top:12px">' + bars + '</div>' +
            (last ? M.note('ghost', '<p><b>Mohamed, si rare ?</b> Seulement ' + fr(N.Mohamed) + ' « Mohamed » seuls… mais <b>' + fr(D.prenoms.contientMohamed) + '</b> prénoms contiennent « Mohamed » (Sidi Mohamed, Mohamed Lemine…). <mark>La définition change l’histoire.</mark></p>') +
              '<p class="small">Score final de la classe : <b>' + score + ' / ' + pairs.length + '</b>.</p>'
              : '<div class="row" style="margin-top:10px"><button class="btn btn-primary" data-next>Duel suivant</button></div>');
          if (ok) K.confetti(box);
          const nx = box.querySelector('[data-next]');
          if (nx) nx.addEventListener('click', () => { k++; show(); });
        }));
      };
      show();
    }
  });

  // R4. Quiz éclair : une question à la fois.
  const QUIZ = [
    {prompt: 'Wald, 1943 : où faut-il blinder les avions ?', options: [{t: 'Là où il y a le plus d’impacts'}, {t: 'Là où il n’y a pas d’impacts', ok: true, why: 'Les avions touchés là ne sont pas revenus.'}, {t: 'Partout un peu'}]},
    {prompt: 'Une visualisation sans données, c’est…', options: [{t: 'Une opinion'}, {t: 'Une coquille vide', ok: true, why: 'Et une histoire sans données, une opinion.'}, {t: 'Un tableau de bord'}]},
    {prompt: 'Le style de narration le plus adapté pour présenter des résultats ?', options: [{t: 'Littéraire'}, {t: 'Numérique'}, {t: 'Journalistique', ok: true, why: 'Le message d’abord : le « lead ».'}]},
    {prompt: 'L’attribut pré-attentif le plus fort ?', options: [{t: 'La couleur', ok: true, why: 'À utiliser pour attirer l’œil sur l’essentiel, et seulement lui.'}, {t: 'La police'}, {t: 'La légende'}]},
    {prompt: 'Lequel retient-on le mieux ?', options: [{t: '« 9,8 % d’admis »'}, {t: '« 3 élèves sur 30 »', ok: true, why: 'Un pourcentage traduit en personnes devient concret.'}]},
    {prompt: 'Un diagramme en barres dont l’axe commence à 14 %…', options: [{t: 'Est plus précis'}, {t: 'Exagère les différences', ok: true, why: '« If zero is not the start, the truth falls apart. »'}, {t: 'Ne change rien'}]}
  ];
  steps.push({
    id: 'quiz', kicker: 'Quiz', title: 'Quiz éclair',
    lead: 'Six questions, réponses à voix haute.',
    build(b) {
      let k = 0, good = 0;
      const next = () => {
        const host = document.createElement('div'); b.appendChild(host);
        const q = QUIZ[k];
        question(host, Object.assign({}, q, {
          prompt: (k + 1) + ' / ' + QUIZ.length + ' · ' + q.prompt,
          onAnswer(ok) { if (ok) good++; },
          onSolved() {
            k++;
            const more = document.createElement('div'); more.className = 'row'; host.appendChild(more);
            if (k < QUIZ.length) { more.innerHTML = '<button class="btn btn-primary">Question suivante</button>'; more.firstChild.addEventListener('click', () => { more.remove(); next(); }); }
            else more.innerHTML = '<p class="small"><b>' + good + ' / ' + QUIZ.length + '</b> du premier coup.</p>';
          }
        }));
      };
      next();
    }
  });

  window.DS_LESSONS = window.DS_LESSONS || {};
  window.DS_LESSONS.cm1 = {
    id: 'cm1',
    title: 'Principes du data storytelling',
    lede: 'Pourquoi un même chiffre peut passer inaperçu ou marquer les esprits.',
    minutes: 90,
    // Minutes prévues par étape en classe (affichées en mode Présenter).
    plan: {ouverture: 5, 'john-snow': 7, piliers: 5, avions: 6, 'qui-manque': 4, nouakchott: 4, complexite: 5, forme: 5, narration: 6,
      pyramide: 4, madeleine: 5, classe: 5, preattentif: 4, charge: 5, gestalt: 5, audience: 4, 'deux-unes': 6, retenir: 3},
    // Réserve (hors des 90 min), à piocher s'il reste du temps.
    reserve: {histoire: 8, pourquoi: 6, duel: 6, quiz: 6},
    steps
  };
})();
