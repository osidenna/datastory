/* Mascottes reprises du site SID34 (style approuvé par l'enseignante) :
   fantôme = piège, chat = « À votre avis ? », chien = exemple, lion = à retenir.
   Elles clignent de temps en temps et suivent le pointeur. */
(function () {
  const INK = '#1d2433';
  const dotEyes = (lx, rx, y, r = 2.4) => '<g class="m-look"><g class="m-eyes"><circle cx="' + lx + '" cy="' + y + '" r="' + r + '" fill="' + INK + '"/><circle cx="' + rx + '" cy="' + y + '" r="' + r + '" fill="' + INK + '"/></g></g>';
  const happyEyes = (lx, rx, y) => '<g class="m-look"><path d="M' + (lx - 3) + ' ' + (y + 1) + 'q3-3.6 6 0M' + (rx - 3) + ' ' + (y + 1) + 'q3-3.6 6 0" fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/></g>';
  const blush = (lx, rx, y, color) => '<circle cx="' + lx + '" cy="' + y + '" r="1.6" fill="' + color + '"/><circle cx="' + rx + '" cy="' + y + '" r="1.6" fill="' + color + '"/>';
  const oMouth = (x, y) => '<ellipse cx="' + x + '" cy="' + y + '" rx="2.4" ry="3.1" fill="' + INK + '"/>';
  const smile = (x, y, w = 5) => '<path d="M' + (x - w) + ' ' + y + 'q' + w + ' ' + (w * .9) + ' ' + (2 * w) + ' 0" fill="' + INK + '"/>';
  const mane = (() => {
    const pts = [], n = 26;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + i / n * 2 * Math.PI, out = i % 2 === 0, jitter = [0, 1.6, -1, 2.2, .4, -1.4][i % 6];
      const r = out ? 25 + jitter : 20.5;
      pts.push((50 + r * Math.cos(a) * 1.06).toFixed(1) + ',' + (41 + r * Math.sin(a) * .92).toFixed(1));
    }
    return pts.join(' ');
  })();
  const MASCOTS = {
    ghost: {
      body: '<path d="M25 90V48a25 25 0 0 1 50 0v42q-4.17 6-8.33 0q-4.17 6-8.33 0q-4.17 6-8.33 0q-4.17 6-8.33 0q-4.17 6-8.33 0q-4.17 6-8.33 0Z" fill="#e8392a"/><path d="M62 26a25 25 0 0 1 13 22v42q-4.2 6-8.3 0V48a25 25 0 0 0-4.7-22Z" fill="#c92b1e" opacity=".55"/>',
      rest: dotEyes(42.5, 57.5, 50, 2.3) + blush(37.5, 62.5, 55, '#b81d12') + oMouth(50, 59),
      reveal: happyEyes(42.5, 57.5, 50) + blush(37.5, 62.5, 55, '#ff8a7a') + smile(50, 57, 4.5)
    },
    cat: {
      body: '<path d="M70 86q16 0 12-14-2-5 3-7" fill="none" stroke="#9d6a9f" stroke-width="4.5" stroke-linecap="round"/>' +
        '<rect x="39" y="62" width="22" height="24" rx="11" fill="#b98fba"/><ellipse cx="50" cy="74" rx="6.5" ry="8" fill="#9d6a9f"/><rect x="43" y="80" width="4.4" height="11" rx="2.2" fill="#9d6a9f"/><rect x="52.6" y="80" width="4.4" height="11" rx="2.2" fill="#9d6a9f"/>' +
        '<g transform="rotate(-10 50 44)"><path d="M30 38 31 17 45 27ZM70 38 69 17 55 27Z" fill="#9d6a9f"/><path d="M33 32 33.6 22 40.5 27.4ZM67 32 66.4 22 59.5 27.4Z" fill="#f2b6c0"/><ellipse cx="50" cy="44" rx="22" ry="19" fill="#b98fba"/>FACE</g>',
      rest: dotEyes(42, 58, 42, 2.3) + blush(37, 63, 48, '#f2a3b3') + '<path d="M48.2 47h3.6L50 49Z" fill="' + INK + '"/>' + oMouth(50, 52.5).replace('rx="2.4" ry="3.1"', 'rx="1.8" ry="2.3"'),
      reveal: happyEyes(42, 58, 42) + blush(37, 63, 48, '#f2a3b3') + '<path d="M48.2 47h3.6L50 49Z" fill="' + INK + '"/>' + smile(50, 50.5, 4)
    },
    dog: {
      body: '<path d="M62 74q12-2 12-14" fill="none" stroke="#c98a4b" stroke-width="4.5" stroke-linecap="round"/>' +
        '<rect x="38" y="62" width="24" height="24" rx="12" fill="#dfa565"/><ellipse cx="50" cy="75" rx="7" ry="8" fill="#f3dcbc"/><rect x="42.5" y="80" width="5" height="11" rx="2.5" fill="#c98a4b"/><rect x="52.5" y="80" width="5" height="11" rx="2.5" fill="#c98a4b"/>' +
        '<ellipse cx="50" cy="43" rx="21" ry="19.5" fill="#dfa565"/><path d="M34 27Q22 26 22 42q0 9 7 10 5-2 6-12 1-8-1-13ZM66 27Q78 26 78 42q0 9-7 10-5-2-6-12-1-8 1-13Z" fill="#7a4b2c"/><ellipse cx="50" cy="51" rx="10" ry="7.5" fill="#f3dcbc"/>FACE',
      rest: dotEyes(42, 58, 41, 2.3) + '<ellipse cx="50" cy="48" rx="3.4" ry="2.5" fill="' + INK + '"/>' + oMouth(50, 54).replace('rx="2.4" ry="3.1"', 'rx="1.8" ry="2.2"') + blush(35.5, 64.5, 47, '#e88d6d'),
      reveal: happyEyes(42, 58, 41) + '<ellipse cx="50" cy="48" rx="3.4" ry="2.5" fill="' + INK + '"/><path d="M45.5 52q4.5 4 9 0" fill="none" stroke="' + INK + '" stroke-width="1.8" stroke-linecap="round"/><path d="M48 53.6h4v3.6a2 2 0 0 1-4 0Z" fill="#ef7f8f"/>' + blush(35.5, 64.5, 47, '#e88d6d')
    },
    lion: {
      body: '<path d="M39 80q-12 4-11-8 1-6 6-5" fill="none" stroke="#d9902c" stroke-width="3.6" stroke-linecap="round"/>' +
        '<rect x="40" y="60" width="20" height="25" rx="10" fill="#f0a73a"/><ellipse cx="50" cy="73" rx="6" ry="8.5" fill="#c9862a"/><rect x="44" y="80" width="4" height="12" rx="2" fill="#e09a30"/><rect x="52" y="80" width="4" height="12" rx="2" fill="#e09a30"/>' +
        '<path d="M31 27 34 14 42 22ZM69 27 66 14 58 22Z" fill="#d9902c"/><polygon points="' + mane + '" fill="#f0a73a"/>FACE',
      rest: dotEyes(43, 57, 39, 2.3) + blush(38.5, 61.5, 44, '#d98a2a') + '<path d="M48.6 43h2.8L50 44.6Z" fill="' + INK + '"/>' + oMouth(50, 49),
      reveal: happyEyes(43, 57, 39) + blush(38.5, 61.5, 44, '#e9785a') + '<path d="M48.6 43h2.8L50 44.6Z" fill="' + INK + '"/>' + smile(50, 47, 4)
    }
  };
  const LABEL = {ghost: 'Fantôme : attention au piège', cat: 'Chat curieux : à votre avis ?', dog: 'Chien : exemple guidé', lion: 'Lion : à retenir'};

  function mascot(kind, opts = {}) {
    const m = MASCOTS[kind];
    const face = '<g class="mascot-face mascot-rest">' + m.rest + '</g><g class="mascot-face mascot-reveal">' + m.reveal + '</g>';
    return '<svg class="mascot mascot-' + kind + (opts.className ? ' ' + opts.className : '') + '" viewBox="0 0 100 100" ' +
      (opts.label ? 'role="img" aria-label="' + LABEL[kind] + '"' : 'aria-hidden="true" focusable="false"') + '>' +
      (m.body.includes('FACE') ? m.body.replace('FACE', face) : m.body + face) + '</svg>';
  }
  function note(kind, html) {
    return '<div class="mascot-note mascot-note-' + kind + '">' + mascot(kind) + '<div class="mascot-note-text">' + html + '</div></div>';
  }

  function startLife() {
    if (!window.matchMedia || window.__mascotLife) return;
    window.__mascotLife = true;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const live = () => [...document.querySelectorAll('svg.mascot')].filter(m => m.getClientRects().length);
    let px = null, py = null, frame = 0;
    const look = () => {
      frame = 0;
      if (reduce.matches || px === null) return;
      for (const m of live()) {
        const r = m.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height * .42), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160);
        const t = 'translate(' + (dx / d * 2.4 * k).toFixed(2) + 'px,' + (dy / d * 1.9 * k).toFixed(2) + 'px)';
        m.querySelectorAll('.m-look').forEach(g => { g.style.transform = t; });
      }
    };
    addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; if (!frame) frame = requestAnimationFrame(look); }, {passive: true});
    setInterval(() => {
      if (reduce.matches || document.hidden) return;
      for (const m of live()) if (Math.random() < .16) { m.classList.add('blinking'); setTimeout(() => m.classList.remove('blinking'), 190); }
    }, 900);
  }
  startLife();
  window.Mascots = {mascot, note, INK};
})();
