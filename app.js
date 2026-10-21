/* Routeur et rendu : accueil (plan des séances) et pages de leçon.
   Leçon = suite d'étapes révélées une à une (« Continuer »), ou toutes d'un coup (« Tout afficher »).
   « Présenter » : une étape par écran, flèches du clavier, Échap pour sortir. */
(function () {
  const S = window.DS_SYLLABUS, L = window.DS_LESSONS || {}, M = window.Mascots;
  const app = document.getElementById('app'), bar = document.querySelector('.progress');
  const esc = window.Kit.esc;
  const PROF = /(^|[?&])prof\b/.test(location.search);

  function home() {
    document.title = S.short + ' · ' + S.program;
    bar.style.width = '0';
    const counts = {CM: 0, TD: 0};
    S.sessions.forEach(s => counts[s.type]++);
    app.innerHTML = '<main class="home">' +
      '<section class="home-hero"><div><h1>' + S.title + '</h1>' +
      '<p>Transformer une analyse en un message que l’on voit, que l’on comprend et que l’on retient. Sur des données mauritaniennes réelles.</p>' +
      '<p class="home-meta">' + esc(S.teacher) + ' · ' + S.program + ' · ' + S.edition + ' · ' + S.sessions.length + '&nbsp;séances de 1&nbsp;h&nbsp;30</p></div></section>' +
      '<div class="legend-types"><span><span class="badge badge-CM">CM</span> cours (' + counts.CM + ')</span><span><span class="badge badge-TD">TD</span> travaux dirigés (' + counts.TD + ')</span></div>' +
      '<ol class="plan">' + S.sessions.map((s, i) => {
        const inner = '<span class="plan-num">' + (i + 1) + '</span><span class="badge badge-' + s.type + '">' + s.type + ' ' + s.n + '</span>' +
          '<span><span class="plan-title">' + s.title + '</span><span class="plan-gist">' + s.gist + '</span></span>' +
          '<span class="plan-status ' + s.status + '">' + (s.status === 'ready' ? 'Ouvrir →' : 'À venir') + '</span>';
        return '<li class="' + s.status + '">' + (s.status === 'ready' && L[s.id] ? '<a href="#/' + s.id + '">' + inner + '</a>' : '<div class="plan-row">' + inner + '</div>') + '</li>';
      }).join('') + '</ol></main>';
    window.scrollTo(0, 0);
  }

  function lesson(id) {
    const les = L[id], ses = S.sessions.find(s => s.id === id);
    if (!les) return home();
    document.title = ses.type + ' ' + ses.n + ' · ' + les.title;
    const key = 'ds-unlock-' + id;
    let unlocked = 1;
    try { unlocked = Math.max(1, Math.min(les.steps.length, +localStorage.getItem(key) || 1)); } catch (e) { /* stockage indisponible */ }
    app.innerHTML = '<main class="lesson"><header class="lesson-head"><div class="crumbs"><a href="#/">Le cours</a> / ' + ses.type + ' ' + ses.n + '</div>' +
      '<h1>' + les.title + '</h1><p class="lede">' + les.lede + '</p>' +
      '<div class="lesson-tools"><button class="tool" data-present>▶ Présenter</button><button class="tool" data-all>Tout afficher</button><button class="tool" data-restart>Recommencer</button><span class="small" style="align-self:center">' + les.steps.length + ' activités</span></div></header>' +
      '<div data-steps></div></main><div class="present-bar"><button data-prev aria-label="Étape précédente">←</button><span data-pos></span><button data-next aria-label="Étape suivante">→</button><button data-exit>Quitter</button></div>';
    const host = app.querySelector('[data-steps]');
    const nodes = [];
    const build = i => {
      const st = les.steps[i];
      const sec = document.createElement('section');
      sec.className = 'step'; sec.id = st.id;
      // Repère de temps réservé à l'enseignante : ouvrir le site avec ?prof (ex. …/datastory/?prof#/cm1).
      let cue = '';
      if (PROF && les.plan) {
        const before = les.steps.slice(0, i).reduce((acc, x) => acc + (les.plan[x.id] || 0), 0), m = les.plan[st.id];
        cue = m ? '<span class="prof-cue">≈ ' + m + ' min · ' + before + '→' + (before + m) + ' min</span>'
          : (les.reserve && les.reserve[st.id] ? '<span class="prof-cue">≈ ' + les.reserve[st.id] + ' min · en plus</span>' : '');
      }
      sec.innerHTML = '<div class="step-kicker"><span class="n">' + (i + 1) + ' / ' + les.steps.length + '</span><span>' + st.kicker + '</span>' + cue + '</div>' +
        '<h2>' + st.title + '</h2><p class="step-lead">' + st.lead + '</p><div class="step-body"></div>' +
        (i < les.steps.length - 1 ? '<div class="continue"><button class="btn btn-primary">' + (st.next || 'Continuer') + '</button></div>' : '<p class="done-note">Fin du CM.</p>');
      host.appendChild(sec);
      const body = sec.querySelector('.step-body');
      st.build(body);
      // En projection : visuel principal à gauche, question et commandes à droite.
      if (body.querySelector(':scope > .main')) body.classList.add('split');
      const c = sec.querySelector('.continue button');
      if (c) c.addEventListener('click', () => { c.parentNode.hidden = true; reveal(i + 1, true); });
      nodes[i] = sec;
      return sec;
    };
    const save = () => { try { localStorage.setItem(key, unlocked); } catch (e) { /* rien */ } };
    const progress = () => { bar.style.width = (100 * unlocked / les.steps.length) + '%'; };
    function reveal(i, scroll) {
      if (i >= les.steps.length) return;
      if (!nodes[i]) { const s = build(i); if (scroll) s.classList.add('is-new'); }
      unlocked = Math.max(unlocked, i + 1); save(); progress();
      if (scroll) nodes[i].scrollIntoView({behavior: 'smooth', block: 'start'});
    }
    for (let i = 0; i < unlocked; i++) { build(i); if (i < unlocked - 1) { const c = nodes[i].querySelector('.continue'); if (c) c.hidden = true; } }
    progress();
    app.querySelector('[data-all]').addEventListener('click', () => {
      for (let i = 0; i < les.steps.length; i++) { reveal(i, false); const c = nodes[i].querySelector('.continue'); if (c) c.hidden = true; }
    });
    app.querySelector('[data-restart]').addEventListener('click', () => { try { localStorage.removeItem(key); } catch (e) { /* rien */ } lesson(id); });

    // Projection
    let cur = 0;
    const pos = app.querySelector('[data-pos]');
    const go = i => {
      cur = Math.max(0, Math.min(les.steps.length - 1, i));
      reveal(cur, false);
      nodes.forEach((n, j) => n && n.classList.toggle('is-current', j === cur));
      const plan = les.plan || {}, mins = plan[les.steps[cur].id];
      const before = les.steps.slice(0, cur).reduce((acc, st) => acc + (plan[st.id] || 0), 0);
      pos.textContent = (cur + 1) + ' / ' + les.steps.length + (mins ? ' · ≈ ' + mins + ' min · repère ' + before + '→' + (before + mins) + ' min' : '');
      window.scrollTo(0, 0);
    };
    const key2 = e => {
      if (!document.body.classList.contains('present')) return;
      if (e.target.matches && e.target.matches('input')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(cur - 1); }
      if (e.key === 'Escape') exit();
    };
    const exit = () => { document.body.classList.remove('present'); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); nodes[cur] && nodes[cur].scrollIntoView(); };
    app.querySelector('[data-present]').addEventListener('click', () => {
      document.body.classList.add('present');
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
      const vis = nodes.findIndex(n => n && n.getBoundingClientRect().bottom > 120);
      go(vis < 0 ? 0 : vis);
    });
    app.querySelector('[data-prev]').addEventListener('click', () => go(cur - 1));
    app.querySelector('[data-next]').addEventListener('click', () => go(cur + 1));
    app.querySelector('[data-exit]').addEventListener('click', exit);
    document.onkeydown = key2;
    const hash = location.hash.split('/')[2];
    if (hash) { const i = les.steps.findIndex(s => s.id === hash); if (i >= 0) { reveal(i, false); setTimeout(() => nodes[i].scrollIntoView(), 50); return; } }
    window.scrollTo(0, 0);
  }

  function route() {
    document.body.classList.remove('present');
    const id = (location.hash.split('/')[1] || '').trim();
    if (id && L[id]) lesson(id); else home();
  }
  addEventListener('hashchange', route);
  route();
})();
