/* Exemples publics du TD 3 : changer une mesure, puis défendre une sélection.
   Données agrégées du cours ; aucun corrigé enseignant n'est chargé ici. */
(function () {
  const d3 = window.d3;
  const ACC = '#8a4f8c', GREY = '#d9dce2';
  const fr = (v, n = 0) => Number(v).toLocaleString('fr-FR', {maximumFractionDigits: n});
  const duration = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
  function tooltip(host) {
    const tip = d3.select(host).append('div').attr('class', 'd4-tip').attr('role', 'tooltip').style('opacity', 0);
    return {
      show(ev, d, lines) {
        tip.selectAll('*').remove();
        tip.append('b').text(d.label);
        lines.forEach(s => tip.append('div').text(s));
        tip.style('opacity', 1);
        this.move(ev);
      },
      move(ev) {
        const [x, y] = d3.pointer(ev, host);
        tip.style('left', Math.max(4, Math.min(x + 12, host.clientWidth - tip.node().offsetWidth - 4)) + 'px')
          .style('top', Math.max(4, y - 12) + 'px');
      },
      hide() { tip.style('opacity', 0); }
    };
  }
  function ranking(host, options) {
    const narrow = host.clientWidth < 500;
    const W = narrow ? 400 : 680, H = 390, M = {l: narrow ? 145 : 222, r: narrow ? 62 : 80, t: 12, b: 38};
    const svg = d3.select(host).append('svg').attr('viewBox', '0 0 ' + W + ' ' + H).attr('role', 'group')
      .attr('aria-label', options.label);
    const zone = svg.append('g').attr('transform', 'translate(' + M.l + ',' + M.t + ')');
    const bars = zone.append('g'), axis = zone.append('g').attr('transform', 'translate(0,' + (H - M.t - M.b) + ')');
    const tip = tooltip(host);
    let revision = 0;
    return function draw(rows, max, format, first = false) {
      const token = ++revision;
      host.dataset.motion = 'running'; tip.hide();
      const x = d3.scaleLinear().domain([0, max || 1]).range([0, W - M.l - M.r]);
      const y = d3.scaleBand().domain(rows.map(d => d.id)).range([0, H - M.t - M.b]).padding(.22);
      const groups = bars.selectAll('g.story-rank-row').data(rows, d => d.id).join(
        enter => {
          const g = enter.append('g').attr('class', 'story-rank-row').attr('transform', d => 'translate(0,' + y(d.id) + ')').style('opacity', 0);
          g.append('rect').attr('width', 0);
          g.append('text').attr('class', 'story-rank-name').attr('x', -10).attr('text-anchor', 'end');
          g.append('text').attr('class', 'story-rank-value');
          return g;
        },
        update => update,
        exit => exit.interrupt().transition().duration(first ? 0 : duration() / 2).style('opacity', 0).remove()
      );
      groups.attr('tabindex', 0).attr('role', 'button').attr('aria-label', d => d.label + ' : ' + format(d.value) + '. Sélectionner pour lire les détails.')
        .on('pointerenter', (e, d) => {
          groups.style('opacity', r => r.id === d.id ? 1 : .35);
          tip.show(e, d, options.details(d)); options.hover?.(d);
        })
        .on('pointermove', e => tip.move(e))
        .on('pointerleave', () => { groups.style('opacity', 1); tip.hide(); options.hover?.(null); })
        .on('click', (e, d) => options.select?.(d))
        .on('keydown', (e, d) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); options.select?.(d); } });
      groups.select('.story-rank-name').attr('y', y.bandwidth() / 2 + 4)
        .text(d => d.label.length > (narrow ? 20 : 27) ? d.label.slice(0, narrow ? 19 : 26) + '…' : d.label);
      groups.select('.story-rank-value').attr('y', y.bandwidth() / 2 + 4).text(d => format(d.value));
      groups.select('rect').attr('height', y.bandwidth()).attr('rx', 2).attr('fill', d => d.accent ? ACC : GREY);
      const ms = first ? 0 : duration();
      const movement = groups.interrupt().transition().duration(ms).style('opacity', 1).attr('transform', d => 'translate(0,' + y(d.id) + ')');
      const widths = groups.select('rect').interrupt().transition().duration(ms).attr('width', d => x(d.value));
      groups.select('.story-rank-value').interrupt().transition().duration(ms).attr('x', d => x(d.value) + 7);
      axis.interrupt().transition().duration(ms).call(d3.axisBottom(x).ticks(4).tickFormat(format));
      Promise.all([movement.end(), widths.end()]).then(() => { if (revision === token) host.dataset.motion = 'idle'; }).catch(() => {});
    };
  }
  async function library(host) {
    const cats = await d3.csv('data/categories.csv', d3.autoType);
    if (!host.isConnected) return;
    const base = cats.filter(d => d.livres >= 30).sort((a, b) => b.prets - a.prets).slice(0, 12)
      .map(d => ({...d, id: d.categorie, label: d.categorie, ratio: d.prets / d.livres}));
    host.classList.add('td-story');
    host.innerHTML = '<p class="story-eyebrow">Exemple à manipuler · survolez, puis changez de mesure</p><h3 data-head></h3>' +
      '<div class="story-controls"><button type="button" class="chip" data-metric="prets" aria-pressed="true">Nombre de prêts</button><button type="button" class="chip" data-metric="ratio" aria-pressed="false">Prêts par livre en rayon</button></div>' +
      '<div data-plot></div><p data-detail class="story-reading" aria-live="polite">Survolez une barre pour lire les prêts, le stock et leur rapport.</p>' +
      '<p class="story-source">Les mêmes 12 catégories dans les deux vues, parmi celles d’au moins 30 livres. Source : Iqraa Ma3i, prêts 2024–2026. Ce rapport décrit l’usage du stock ; il n’explique pas à lui seul la demande.</p>';
    let mode = 'prets';
    const details = d => [fr(d.prets) + ' prêts · ' + fr(d.livres) + ' livres en rayon', fr(d.ratio, 2) + ' prêt(s) par livre'];
    const read = d => { host.querySelector('[data-detail]').textContent = d ? d.label + ' : ' + details(d).join(' ; ') : 'Survolez une barre pour lire les prêts, le stock et leur rapport.'; };
    const draw = ranking(host.querySelector('[data-plot]'), {label: 'Prêts par catégorie : changer de mesure', details, hover: read, select: read});
    function update(first = false) {
      const rows = base.map(d => ({...d, value: d[mode]})).sort((a, b) => b.value - a.value);
      rows.forEach((d, i) => { d.accent = i < 2; });
      host.querySelector('[data-head]').textContent = mode === 'prets' ? 'Les romans dominent en nombre de prêts' : 'Par livre en rayon, philosophie et psychologie passent devant';
      host.querySelectorAll('[data-metric]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.metric === mode)));
      draw(rows, d3.max(rows, d => d.value), d => fr(d, mode === 'prets' ? 0 : 2), first);
    }
    host.querySelectorAll('[data-metric]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.metric; update(); }));
    update(true);
  }
  async function restaurants(host) {
    const raw = await d3.csv('data/restaurants.csv', d3.autoType);
    if (!host.isConnected) return;
    const all = raw.map(d => ({...d, id: [d.nom, d.lat, d.lng].join('|'), label: d.nom}));
    const rated = all.filter(d => d.note != null && d.nb_avis > 0);
    // Le tri stable reproduit ici le « top 10 » naïf, sans départager les ex aequo.
    const naive = rated.slice().sort((a, b) => b.note - a.note).slice(0, 10);
    const perfect = rated.filter(d => d.note === 5);
    host.classList.add('td-story');
    host.innerHTML = '<p class="story-eyebrow">Une histoire en trois actes · choisissez, survolez, comparez</p><h3 data-head></h3>' +
      '<div class="story-controls story-stages"><button type="button" class="chip" data-stage="0" aria-pressed="true">1 · La promesse</button><button type="button" class="chip" data-stage="1" aria-pressed="false">2 · Les preuves</button><button type="button" class="chip" data-stage="2" aria-pressed="false">3 · Votre règle</button></div>' +
      '<p data-lead class="story-reading" aria-live="polite"></p>' +
      '<div data-policy class="story-policy" hidden><label>Périmètre <select data-type aria-label="Type de lieu"><option value="restaurant">Restaurants identifiés</option><option value="café">Cafés identifiés</option><option value="tous">Tous les lieux, types inconnus compris</option></select></label><label>Au moins <output data-min>50</output> avis <input data-threshold aria-label="Nombre minimum d’avis" type="range" min="1" max="100" value="50"></label><label><input data-closed type="checkbox" checked> Écarter les fiches signalées fermées</label></div>' +
      '<div data-ledger class="story-ledger" hidden aria-live="polite"></div><div data-plot></div>' +
      '<div class="story-selection" data-selection aria-live="polite">Cliquez une adresse pour garder ses détails pendant que vous changez de règle.</div>' +
      '<p class="story-source">Source : fiches Google Maps, fusion du 7 novembre 2026. Une note est une moyenne d’avis ; le fichier ne donne ni leur distribution, ni les prix, ni les horaires. Le seuil est un choix éditorial, pas un niveau de confiance calculé.</p>';
    let stage = 0, selected = null, current = null;
    const detail = d => [fr(d.note, 1) + ' / 5 · ' + fr(d.nb_avis) + ' avis', 'Type : ' + (d.type === 'inconnu' ? 'non renseigné' : d.type), d.actualise === 'oui' ? 'Fiche relue le 7 novembre 2026' : 'Date de relecture inconnue'];
    function readSelection(hovered = null) {
      const d = hovered || selected;
      const el = host.querySelector('[data-selection]');
      if (!d) { el.textContent = 'Cliquez une adresse pour garder ses détails pendant que vous changez de règle.'; return; }
      let reason = '';
      if (stage === 2 && current) {
        if (!current.scope.some(r => r.id === d.id)) reason = 'Hors du type de lieu choisi.';
        else if (current.excludeClosed && d.ferme) reason = 'Écartée : fiche signalée fermée.';
        else if (d.nb_avis < current.min) reason = 'Écartée : moins de ' + current.min + ' avis.';
        else reason = 'Retenue par cette règle ; son rang dépend de la note, puis du nombre d’avis.';
      }
      el.textContent = (hovered ? 'Survol · ' : 'Votre sélection · ') + d.label + ' — ' + detail(d).join(' ; ') + (reason ? ' — ' + reason : '');
    }
    const draw = ranking(host.querySelector('[data-plot]'), {label: 'Notes et avis : construire une sélection argumentée', details: detail, hover: readSelection, select: d => { selected = d; readSelection(); }});
    function update(first = false) {
      host.querySelectorAll('[data-stage]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.stage === stage)));
      host.querySelector('[data-policy]').hidden = stage !== 2;
      host.querySelector('[data-ledger]').hidden = stage !== 2;
      let rows, max, format;
      if (stage === 0) {
        rows = naive.map(d => ({...d, value: d.note, accent: false})); max = 5; format = v => fr(v, 1) + ' / 5';
        host.querySelector('[data-head]').textContent = 'Dix « meilleurs »… parmi ' + perfect.length + ' lieux ex aequo à 5,0';
        host.querySelector('[data-lead]').textContent = 'Pourquoi ces dix-là ? Le fichier est alphabétique : à note égale, le tri garde les premiers. Survolez une barre avant de choisir une adresse.';
      } else if (stage === 1) {
        rows = naive.map(d => ({...d, value: d.nb_avis, accent: d.nb_avis >= 10})); max = d3.max(rows, d => d.value); format = v => fr(v) + ' avis';
        host.querySelector('[data-head]').textContent = naive.filter(d => d.nb_avis < 10).length + ' de ces dix lieux ont moins de 10 avis';
        host.querySelector('[data-lead]').textContent = 'Les mêmes dix lieux, dans le même ordre. Les barres montrent maintenant les avis : ' + naive.filter(d => d.nb_avis === 1).length + ' notes parfaites ne reposent que sur une personne. La moyenne seule efface cette différence.';
      } else {
        const type = host.querySelector('[data-type]').value, min = +host.querySelector('[data-threshold]').value;
        const excludeClosed = host.querySelector('[data-closed]').checked;
        const scope = type === 'tous' ? all : all.filter(d => d.type === type);
        const closed = excludeClosed ? scope.filter(d => d.ferme).length : 0;
        const eligible = scope.filter(d => !excludeClosed || !d.ferme);
        const noRating = eligible.filter(d => d.note == null || d.nb_avis <= 0).length;
        const below = eligible.filter(d => d.note != null && d.nb_avis > 0 && d.nb_avis < min).length;
        const kept = eligible.filter(d => d.note != null && d.nb_avis >= min)
          .sort((a, b) => d3.descending(a.note, b.note) || d3.descending(a.nb_avis, b.nb_avis) || a.nom.localeCompare(b.nom, 'fr'));
        current = {scope, min, excludeClosed};
        host.querySelector('[data-min]').textContent = min;
        host.querySelector('[data-head]').textContent = kept.length + ' adresses retenues : notre règle doit rester visible';
        host.querySelector('[data-lead]').textContent = 'Comparez 10, 50 puis 100 avis. Qui entre, qui sort ? Gardez une adresse sélectionnée et expliquez son sort. Les huit premières sont affichées ; toutes les exclusions sont comptées.';
        const ledger = host.querySelector('[data-ledger]');
        ledger.replaceChildren();
        [['Dans le périmètre', scope.length], ['Signalées fermées', closed], ['Sans note', noRating], ['Sous le seuil', below], ['Retenues', kept.length]].forEach(([label, n]) => {
          const tile = document.createElement('div'); const count = document.createElement('b'), text = document.createElement('span'); count.textContent = fr(n); text.textContent = label; tile.append(count, text); ledger.append(tile);
        });
        rows = kept.slice(0, 8).map(d => ({...d, value: d.note, accent: true})); max = 5; format = v => fr(v, 1) + ' / 5';
      }
      readSelection(); draw(rows, max, format, first);
    }
    host.querySelectorAll('[data-stage]').forEach(b => b.addEventListener('click', () => { stage = +b.dataset.stage; update(); }));
    host.querySelector('[data-type]').addEventListener('change', () => update());
    host.querySelector('[data-threshold]').addEventListener('input', () => update());
    host.querySelector('[data-closed]').addEventListener('change', () => update());
    update(true);
  }
  window.DS_TD_DEMOS = {library, restaurants};
})();
