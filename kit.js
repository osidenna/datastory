/* Boîte à outils des leçons : petits graphiques SVG, questions « À votre avis ? », confettis.
   Aucune bibliothèque externe : tout est dessiné à la main pour garder la maîtrise du rendu. */
(function () {
  const M = window.Mascots;
  const NS = 'http://www.w3.org/2000/svg';
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const fr = (x, d = 0) => Number(x).toLocaleString('fr-FR', {minimumFractionDigits: d, maximumFractionDigits: d});
  const pct = (x, d = 1) => fr(x, d) + ' %';
  const scale = (d0, d1, r0, r1) => { const f = v => r0 + (v - d0) / (d1 - d0) * (r1 - r0); f.inv = p => d0 + (p - r0) / (r1 - r0) * (d1 - d0); return f; };
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const svg = (w, h, inner, cls = '') => '<svg class="chart ' + cls + '" viewBox="0 0 ' + w + ' ' + h + '" role="img">' + inner + '</svg>';
  const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const MOIS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  // Axe vertical léger : graduations en gris, lignes de grille très claires.
  function yAxis(y, ticks, x0, x1, fmt = v => fr(v)) {
    return '<g class="grid">' + ticks.map(t => '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y(t) + '" y2="' + y(t) + '"/>').join('') + '</g>' +
      '<g>' + ticks.map(t => '<text x="' + (x0 - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + fmt(t) + '</text>').join('') + '</g>';
  }

  function confetti(host) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#f6cd4c', '#8a4f8c', '#2e6b4f', '#b4532a', '#ffe27a'];
    const r = host.getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = (r.width * (.15 + Math.random() * .3)) + 'px';
      c.style.top = '30px';
      c.style.background = colors[i % colors.length];
      c.style.setProperty('--dx', (Math.random() * 220 - 60) + 'px');
      c.style.setProperty('--dy', (Math.random() * -90 - 10) + 'px');
      c.style.setProperty('--r', (Math.random() * 540) + 'deg');
      host.appendChild(c);
      setTimeout(() => c.remove(), 1000);
    }
  }

  /* Question à choix : choisir → Vérifier → retour (chat si juste, fantôme et explication propre au choix sinon).
     opts = {prompt, options: [{t, ok, why}], cols, mascot, onAnswer(ok, i), onSolved(), reveal} */
  function question(host, opts) {
    const box = el('<div class="q" style="position:relative"></div>');
    box.innerHTML = '<div class="q-head">' + M.mascot(opts.mascot || 'cat') + '<div class="q-prompt">' + opts.prompt + '</div></div>' +
      '<div class="q-options' + (opts.cols === 2 ? ' cols-2' : '') + '">' +
      opts.options.map((o, i) => '<button type="button" class="q-option" data-i="' + i + '"><span class="q-key">' + 'ABCDEFG'[i] + '</span><span>' + o.t + '</span></button>').join('') + '</div>' +
      '<div class="q-actions"><button type="button" class="btn btn-primary q-check" disabled>Vérifier</button><button type="button" class="btn btn-ghost q-show">Voir la réponse</button></div>' +
      '<div class="q-fb-slot"></div>';
    host.appendChild(box);
    let pick = -1, solved = false;
    const btns = [...box.querySelectorAll('.q-option')];
    const check = box.querySelector('.q-check'), show = box.querySelector('.q-show'), slot = box.querySelector('.q-fb-slot');
    const right = opts.options.findIndex(o => o.ok);
    btns.forEach(b => b.addEventListener('click', () => {
      if (solved) return;
      pick = +b.dataset.i;
      btns.forEach(x => x.classList.remove('is-selected', 'is-wrong'));
      b.classList.add('is-selected');
      check.disabled = false;
      slot.innerHTML = '';
    }));
    const finish = (ok, i, revealed) => {
      solved = true;
      btns.forEach(x => x.classList.remove('is-selected'));
      btns[right].classList.add('is-right');
      if (!ok && i >= 0) btns[i].classList.add('is-wrong');
      check.hidden = true; show.hidden = true;
      box.classList.add('revealed');
      const o = opts.options[right];
      slot.innerHTML = '<div class="q-feedback ok">' + M.mascot('cat') + '<p><strong>' + (revealed ? 'Réponse' : 'Exactement !') + '</strong>' + (o.why || '') + '</p></div>';
      if (ok) confetti(box);
      opts.onSolved && opts.onSolved(ok);
    };
    check.addEventListener('click', () => {
      if (pick < 0) return;
      const o = opts.options[pick];
      opts.onAnswer && opts.onAnswer(!!o.ok, pick);
      if (o.ok) return finish(true, pick);
      btns[pick].classList.add('is-wrong');
      slot.innerHTML = '<div class="q-feedback ko">' + M.mascot('ghost') + '<p><strong>Pas tout à fait.</strong>' + (o.why || 'Regardez encore le graphique.') + '</p></div>';
      check.disabled = true;
    });
    show.addEventListener('click', () => finish(false, -1, true));
    return {box, reveal: () => !solved && finish(false, -1, true), get solved() { return solved; }};
  }

  window.Kit = {esc, fr, pct, scale, el, svg, path, yAxis, confetti, question, css, MOIS, MOIS_LONG, NS};
})();
