/* TD 1 · Matplotlib, Seaborn, Altair
   D'après td1.ipynb (2025-2026), dont les exercices venaient de C. Nussbaumer Knaflic,
   « Storytelling with Data: Let's Practice! » (ex. 2.2, 2.12, 2.13). Ici refaits sur des données
   mauritaniennes réelles (résultats du bac 2015-2025, dépôt public rimdata). */
(function () {
  const K = window.Kit;
  const {svg, fr, scale, path} = K;
  const ACC = '#8a4f8c', G1 = '#b8bcc6', G2 = '#dfe2e7', INK = '#1d2433';

  const ADMIS = [3134, 2667, 3975, 6445, 3245, 7200, 3742, 5655, 6735, 10422, 10002];
  const CAND = [41986, 45026, 49993, 50045, 44717, 49755, 46587, 47251, 44861, 47217, 53148];
  const TAUX = [7.5, 5.9, 8.0, 12.9, 7.3, 14.5, 8.0, 12.0, 15.0, 22.1, 18.8];
  const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const DEC = {Admis: [7.5, 18.8], Sessionnaire: [7.9, 13.3], 'Ajourné': [84.7, 67.9]};
  const DCOL = {Admis: ACC, Sessionnaire: G1, 'Ajourné': G2};
  const list = a => '[' + a.join(', ') + ']';

  /* ---------- Quatre vues des mêmes données (exercice 2) ---------- */
  function option(kind) {
    const W = 320, H = 210, names = Object.keys(DEC);
    let s = '';
    if (kind === 'A') {
      [0, 1].forEach(j => {
        const cx = 78 + j * 150, cy = 112, r = 56;
        let a0 = -Math.PI / 2;
        names.forEach(n => {
          const v = DEC[n][j], a1 = a0 + v / 100 * 2 * Math.PI, big = a1 - a0 > Math.PI ? 1 : 0;
          s += '<path d="M' + cx + ' ' + cy + 'L' + (cx + r * Math.cos(a0)).toFixed(1) + ' ' + (cy + r * Math.sin(a0)).toFixed(1) + 'A' + r + ' ' + r + ' 0 ' + big + ' 1 ' + (cx + r * Math.cos(a1)).toFixed(1) + ' ' + (cy + r * Math.sin(a1)).toFixed(1) + 'Z" fill="' + DCOL[n] + '" stroke="#fff" stroke-width="1.5"/>';
          const am = (a0 + a1) / 2, lr = v > 20 ? r * .55 : r + 16;
          s += '<text x="' + (cx + lr * Math.cos(am)).toFixed(1) + '" y="' + (cy + lr * Math.sin(am) + 4).toFixed(1) + '" text-anchor="middle" style="font-size:11px;fill:' + (v > 20 ? INK : INK) + '">' + fr(v, 1) + '</text>';
          a0 = a1;
        });
        s += '<text x="' + cx + '" y="24" text-anchor="middle" class="lbl-strong">' + (j ? 2025 : 2015) + '</text>';
      });
    } else if (kind === 'B') {
      const y = scale(0, 90, H - 30, 14), gw = 90;
      names.forEach((n, i) => {
        [0, 1].forEach(j => {
          const x = 30 + i * (gw + 10) + j * 38, v = DEC[n][j];
          s += '<rect x="' + x + '" y="' + y(v) + '" width="34" height="' + (y(0) - y(v)) + '" fill="' + (j ? (n === 'Admis' ? ACC : '#8f95a1') : G2) + '"/>' +
            '<text x="' + (x + 17) + '" y="' + (y(v) - 4) + '" text-anchor="middle" style="font-size:11px">' + fr(v, 1) + '</text>';
        });
        s += '<text x="' + (30 + i * (gw + 10) + 36) + '" y="' + (H - 12) + '" text-anchor="middle">' + n + '</text>';
      });
      s += '<text x="30" y="14" style="font-size:11px">clair : 2015 · foncé : 2025</text>';
    } else if (kind === 'C') {
      const x = scale(0, 100, 50, W - 10);
      [0, 1].forEach(j => {
        let acc = 0; const y = 50 + j * 80;
        s += '<text x="44" y="' + (y + 24) + '" text-anchor="end" class="lbl-strong">' + (j ? 2025 : 2015) + '</text>';
        names.forEach(n => {
          const v = DEC[n][j];
          s += '<rect x="' + x(acc) + '" y="' + y + '" width="' + (x(acc + v) - x(acc)) + '" height="40" fill="' + DCOL[n] + '" stroke="#fff"/>';
          if (v > 10) s += '<text x="' + ((x(acc) + x(acc + v)) / 2) + '" y="' + (y + 25) + '" text-anchor="middle" style="font-size:11px;fill:' + (n === 'Admis' ? '#fff' : INK) + '">' + fr(v, 1) + '</text>';
          acc += v;
        });
        const small = names.filter(n => DEC[n][j] <= 10);
        if (small.length) s += '<text x="' + x(0) + '" y="' + (y + 56) + '" style="font-size:11px">' + small.map(n => n + ' ' + fr(DEC[n][j], 1)).join(' · ') + '</text>';
      });
      s += '<text x="50" y="30" style="font-size:11px">Admis · Sessionnaire · Ajourné (= 100 %)</text>';
    } else {
      const y = scale(0, 90, H - 16, 20), x0 = 80, x1 = 200;
      s += '<text x="' + x0 + '" y="14" text-anchor="middle" class="lbl-strong">2015</text><text x="' + x1 + '" y="14" text-anchor="middle" class="lbl-strong">2025</text>';
      names.forEach(n => {
        const [a, b] = DEC[n], c = n === 'Admis' ? ACC : '#8f95a1';
        s += '<path d="M' + x0 + ' ' + y(a) + 'L' + x1 + ' ' + y(b) + '" stroke="' + c + '" stroke-width="2.5" fill="none"/><circle cx="' + x0 + '" cy="' + y(a) + '" r="4" fill="' + c + '"/><circle cx="' + x1 + '" cy="' + y(b) + '" r="4" fill="' + c + '"/>' +
          '<text x="' + (x0 - 8) + '" y="' + (y(a) + (n === 'Sessionnaire' ? 12 : n === 'Admis' ? -3 : 4)) + '" text-anchor="end" style="font-size:11px;fill:' + c + '">' + fr(a, 1) + '</text>' +
          '<text x="' + (x1 + 8) + '" y="' + (y(b) + (n === 'Sessionnaire' ? 8 : n === 'Admis' ? 0 : 4)) + '" style="font-size:11px;fill:' + c + '">' + fr(b, 1) + ' ' + n + '</text>';
      });
    }
    return svg(W, H, s);
  }
  const OPTIONS = '<div class="options-4">' + ['A · Deux camemberts', 'B · Barres groupées', 'C · Barres empilées à 100 %', 'D · Graphique de pente'].map((t, i) =>
    '<figure><figcaption><b>' + t + '</b></figcaption>' + option('ABCD'[i]) + '</figure>').join('') + '</div>';


  /* ---------- Cible de l'exercice 3 : le graphique du CM 1 ---------- */
  function target() {
    const W = 680, H = 330, l = 46, r = 78, t = 74, b = 36, x = scale(2015, 2025, l, W - r), y = scale(0, 25, H - b, t);
    let s = '<text class="title" x="0" y="22">Le taux d’admission au bac a presque triplé depuis 2015</text><text class="subtitle" x="0" y="44">Part des candidats déclarés admis, en %</text>';
    s += K.yAxis(y, [0, 5, 10, 15, 20, 25], l, W - r, v => v + ' %');
    [2015, 2020, 2025].forEach(v => { s += '<text x="' + x(v) + '" y="' + (H - b + 20) + '" text-anchor="middle">' + v + '</text>'; });
    s += '<path d="' + path(YEARS.map((v, i) => [x(v), y(TAUX[i])])) + '" fill="none" stroke="' + G1 + '" stroke-width="2.5"/>';
    s += '<circle cx="' + x(2015) + '" cy="' + y(7.5) + '" r="6" fill="' + ACC + '"/><circle cx="' + x(2024) + '" cy="' + y(22.1) + '" r="6" fill="' + ACC + '"/>' +
      '<text x="' + x(2015) + '" y="' + (y(7.5) - 12) + '" text-anchor="middle" class="lbl-accent">7,5 %</text><text x="' + x(2024) + '" y="' + (y(22.1) - 12) + '" text-anchor="middle" class="lbl-accent">22,1 %</text>' +
      '<path d="M' + x(2018.6) + ' ' + y(21) + 'Q' + x(2021.4) + ' ' + y(26.5) + ' ' + x(2023.78) + ' ' + y(22.5) + '" fill="none" stroke="' + INK + '" stroke-width="1.2" marker-end="url(#tarr)"/>' +
      '<defs><marker id="tarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + INK + '"/></marker></defs>' +
      '<text x="' + x(2018.4) + '" y="' + y(21.6) + '" text-anchor="end" class="lbl-strong">× 3 en 9 ans</text>';
    return svg(W, H, s);
  }

  /* ---------- Code des cellules ---------- */
  const WILAYAS = {
    'Adrar': [6.2, 4, 6.2, 7.4, 5.1, null, 4.7, 5.2, 6.5, 22.5, 17.4], 'Assaba': [6.6, 7.9, 11, 17.3, 6.1, null, 3.8, 6.5, 10.5, 18.5, 14.6],
    'Brakna': [4, 3.4, 4.5, 3, 2.8, null, 2.3, 3.7, 10.8, 13.4, 14], 'Dakhlet Nouadhibou': [9.6, 6.4, 9.5, 13.5, 9.4, null, 10.1, 9.9, 17, 17.8, 18.5],
    'Gorgol': [5.1, 5.1, 5.3, 8.2, 4.6, null, 4.2, 5, 9.3, 18.2, 19], 'Guidimagha': [2.1, 1.4, 2.9, 5.4, 1.7, null, 2.8, 9.2, 5.5, 13.1, 9.8],
    'Hodh Chargui': [5.4, 4.9, 13.9, 25.5, 3.3, null, 2.8, 3.7, 11.5, 22.5, 22.4], 'Hodh El Gharbi': [5.6, 5.8, 8.1, 10.4, 2.7, null, 5, 9.7, 12.8, 23.1, 17.6],
    'Inchiri': [10.7, 4.7, 9.3, 22.8, 5.9, null, 2.7, 8.3, 10.1, 22.5, 16.5], 'Nouakchott Nord': [5.5, 4.1, 4.6, 7.5, 6.3, null, 9.9, 16.4, 18.2, 22.9, 21.5],
    'Nouakchott Ouest': [11, 9.9, 12.2, 19, 12.2, null, 13.2, 17.5, 19.5, 29.3, 22.2], 'Nouakchott Sud': [7.2, 5, 7.2, 11.7, 8.8, null, 8.9, 12.9, 14.4, 21.7, 18.7],
    'Tagant': [4.2, 4.9, 8.1, 15.8, 7.8, null, 4.8, 9.2, 8.3, 19.4, 16.2], 'Tiris Zemmour': [11.5, 11.3, 11.5, 13.1, 9, null, 8.8, 12, 16.6, 20.9, 17.8],
    'Trarza': [6.6, 4.7, 6.6, 15.2, 5.5, null, 6.4, 9.3, 15, 18.5, 14.5]
  };
  const pyList = a => '[' + a.map(v => v == null ? 'None' : v).join(', ') + ']';
  const SETUP1 = 'import pandas as pd\n\n# Admis au bac par année (résultats officiels 2015-2025)\nadmis = pd.DataFrame({\n    "annee": ' + list(YEARS) + ',\n    "admis": ' + list(ADMIS) + ',\n})\nadmis';
  const SETUP4 = 'import pandas as pd\n\n# Taux d’admission (%) par wilaya et par année. None : pas de donnée (2020 manque dans le fichier).\nannees = ' + list(YEARS) + '\ntaux_wilaya = {\n' +
    Object.keys(WILAYAS).map(w => '    "' + w + '": ' + pyList(WILAYAS[w]) + ',').join('\n') + '\n}\n\n# Format « long » : une ligne par (wilaya, année)\nlignes = [(w, a, t) for w, valeurs in taux_wilaya.items() for a, t in zip(annees, valeurs) if t is not None]\nbac_wilaya = pd.DataFrame(lignes, columns=["wilaya", "annee", "taux"])\nbac_wilaya.head()';
  const STYLE_TABLE = '# Le tableau en couleur (« heatmapping ») : la couleur fait le travail de l’œil\nadmis.style.background_gradient(cmap="Purples", subset=["admis"]).format({"admis": "{:,}"})';
  const MPL_BAR = 'import matplotlib.pyplot as plt\nplt.rcdefaults()\n\nfig, ax = plt.subplots(figsize=(7, 3.5))\nax.bar(admis["annee"], admis["admis"], color="#8a4f8c")  # 1. dessiner les barres\nax.set_title("Admis au bac par année")                     # 2. puis le titre\nax.set_xlabel("Année")                                     # 3. puis les axes, un par un\nax.set_ylabel("Admis")\nplt.show()';
  const MPL_DEFI = 'fig, ax = plt.subplots(figsize=(7, 3.5))\n# 1. Remplacez par une liste de 11 couleurs : gris ("#b8bcc6") partout, mauve ("#8a4f8c") pour 2024\ncouleurs = "#b8bcc6"\nax.bar(admis["annee"], admis["admis"], color=couleurs)\n# 2. Écrivez la valeur de 2024 au-dessus de sa barre (ax.text ou ax.bar_label)\n...\n# 3. Retirez le cadre en haut et à droite ; donnez un titre qui dit le message (loc="left")\n...\nplt.show()';
  const CHECK_DEFI = 'import matplotlib, matplotlib.pyplot as _plt\n_ax = _plt.gcf().axes\n_a = _ax[0] if _ax else None\n_b = [p for p in _a.patches if p.get_height() > 0] if _a else []\n_c = [matplotlib.colors.to_hex(p.get_facecolor()) for p in _b]\n_odd = [i for i, c in enumerate(_c) if _c.count(c) == 1]\n_t = "".join(t.get_text() for t in _a.texts).replace("\\u202f", "").replace(" ", "").replace(",", "") if _a else ""\n[(len(_b) == 11, "Onze barres, de 2015 à 2025"),\n (len(_b) == 11 and _odd == [9], "Une seule barre en couleur : 2024"),\n ("10422" in _t, "La valeur de 2024 (10 422) est écrite"),\n (_a is not None and not _a.spines["top"].get_visible() and not _a.spines["right"].get_visible(), "Cadre haut et droit retirés"),\n (_a is not None and len(_a.get_title() + _a.get_title(loc="left")) >= 25, "Un titre qui dit le message")]';
  const SNS_LINE = 'import seaborn as sns\n\n# À vous, sans modèle : la courbe des admis avec sns.lineplot, des marqueurs ronds, un titre.\n# Indice : sns.lineplot(data=..., x=..., y=..., marker=..., ax=ax)\nfig, ax = plt.subplots(figsize=(7, 3.5))\n...\nplt.show()';
  const CHECK_LINE = 'import matplotlib.pyplot as _plt\n_ax = _plt.gcf().axes\n_l = [l for a in _ax for l in a.get_lines() if len(l.get_xdata()) == 11]\n[(len(_ax) == 1, "Une figure, un seul axe"),\n (len(_l) >= 1, "Une courbe de 11 points (2015 à 2025)"),\n (any(str(l.get_marker()) not in ("None", "", " ") for l in _l), "Des marqueurs sur les points")]';
  const ALT = 'import altair as alt\n\n# On décrit ce qu’on veut voir : une marque et des encodages.\n# À vous : seule 2024 en mauve, les autres en gris (alt.condition), et une infobulle.\n# Gardez le nom « graphique ».\ngraphique = alt.Chart(admis).mark_bar().encode(\n    x=alt.X("annee:O", title="Année"),\n    y=alt.Y("admis:Q", title="Admis"),\n    # color=alt.condition(..., alt.value("#8a4f8c"), alt.value("#b8bcc6")),\n    # tooltip=[...],\n).properties(title="Admis au bac par année", width=480, height=220)\ngraphique';
  const CHECK_ALT = '_d = graphique.to_dict()\n_e = _d.get("encoding", {})\n[("condition" in _e.get("color", {}), "La couleur dépend d’une condition (alt.condition)"),\n ("tooltip" in _e, "Une infobulle au survol")]';

  const STACK = 'import matplotlib.pyplot as plt\nplt.rcdefaults()\n\ndecisions = {"Admis": (7.5, 18.8), "Sessionnaire": (7.9, 13.3), "Ajourné": (84.7, 67.9)}\ncouleurs = {"Admis": "#8a4f8c", "Sessionnaire": "#b8bcc6", "Ajourné": "#dfe2e7"}\n\nfig, ax = plt.subplots(figsize=(8, 2.6))\ngauche = [0, 0]   # où commence le prochain segment, pour 2015 et pour 2025\nfor nom, valeurs in decisions.items():\n    # À vous : ax.barh(["2015", "2025"], valeurs, left=gauche, color=couleurs[nom], label=nom)\n    # écrivez chaque valeur au milieu de son segment, puis avancez « gauche »\n    ...\nax.set_xlim(0, 100)\nax.set_title("Répartition des décisions du bac (%)", loc="left")\nplt.show()';
  const CHECK_STACK = 'import matplotlib.pyplot as _plt\n_ax = _plt.gcf().axes\n_a = _ax[0] if _ax else None\n_r = [p for p in _a.patches if p.get_width() > 0] if _a else []\n_rows = {}\nfor _p in _r:\n    _rows.setdefault(round(_p.get_y(), 2), []).append(_p.get_width())\n[(len(_r) == 6, "Six segments : 3 décisions × 2 années"),\n (len(_rows) == 2 and all(abs(sum(v) - 100) < 0.5 for v in _rows.values()), "Chaque barre fait 100 %"),\n (_a is not None and len(_a.texts) >= 6, "Une valeur dans chaque segment")]';
  const SLOPE = 'import matplotlib.pyplot as plt\nplt.rcdefaults()\n\nfig, ax = plt.subplots(figsize=(4.5, 5))\nfor nom, (v2015, v2025) in decisions.items():\n    couleur = "#8a4f8c" if nom == "Admis" else "#b8bcc6"\n    ax.plot([0, 1], [v2015, v2025], marker="o", color=couleur, linewidth=2.5)\n    # À vous : la valeur au début, « valeur + nom » au bout (ax.text)\n    ...\n\nax.set_xticks([0, 1], ["2015", "2025"])\nax.set_xlim(-0.3, 1.7)\n# À vous : retirez le cadre (haut, droite, gauche) et les graduations verticales\n...\nax.set_title("La part d’admis a plus que doublé en dix ans", loc="left")\nplt.show()';
  const CHECK_SLOPE = 'import matplotlib.pyplot as _plt\n_ax = _plt.gcf().axes\n_a = _ax[0] if _ax else None\n[(_a is not None and len(_a.get_lines()) >= 3, "Trois lignes : Admis, Sessionnaire, Ajourné"),\n (_a is not None and len(_a.texts) >= 6, "Une étiquette à chaque bout (6 textes au moins)"),\n (_a is not None and not any(_a.spines[s].get_visible() for s in ("top", "right", "left")), "Cadre retiré (haut, droite, gauche)"),\n (_a is not None and len(_a.get_title() + _a.get_title(loc="left")) > 20, "Un titre qui dit le message")]';

  const BAD = 'import matplotlib.pyplot as plt\nplt.rcdefaults()\n\nannees = ' + list(YEARS) + '\ncandidats = ' + list(CAND) + '\ntaux = ' + list(TAUX) + '\n\nfig, ax1 = plt.subplots(figsize=(8, 4))\nax1.bar(annees, candidats, color="#4472C4", label="Candidats")\nax1.set_ylim(40000, 54000)\nax1.set_ylabel("Candidats")\nax2 = ax1.twinx()\nax2.plot(annees, taux, color="#ED7D31", marker="o", label="Taux d’admission (%)")\nax2.set_ylabel("Taux (%)")\nfor a, t in zip(annees, taux):\n    ax2.text(a, t + 0.6, f"{t}%", ha="center", color="#ED7D31")\nax1.set_xticks(annees, annees, rotation=45)\nax1.grid(True)\nfig.legend(loc="upper center", ncol=2)\nax1.set_title("Candidats et taux d’admission au bac")\nplt.show()';
  const GOOD = 'fig, ax = plt.subplots(figsize=(8, 4))\n# 1. La courbe du taux en gris clair ("#b8bcc6"), épaisseur 2,5\n...\n# 2. Les points 2015 et 2024 en mauve ("#8a4f8c") avec leur valeur au-dessus\n...\n# 3. L’annotation « × 3 en 9 ans » avec une flèche courbe (ax.annotate, arrowprops=dict(..., connectionstyle="arc3,rad=-0.2"))\n...\n# 4. Axe vertical de 0 à 25 ; pas de cadre en haut ni à droite\n...\n# 5. Le titre-message et le sous-titre, alignés à gauche\n...\nplt.show()';
  const CHECK_GOOD = 'import matplotlib, matplotlib.pyplot as _plt\nfrom matplotlib.colors import to_rgb as _rgb, rgb_to_hsv as _hsv\n_f = _plt.gcf(); _ax = _f.axes; _a = _ax[0] if _ax else None\n_gris = lambda c: _hsv(_rgb(c))[1] < 0.15 and _hsv(_rgb(c))[2] > 0.5\n_l11 = [l for l in (_a.get_lines() if _a else []) if len(l.get_xdata()) == 11]\n_pts = 0\nif _a is not None:\n    for _k in _a.collections:\n        _fc = _k.get_facecolors()\n        if len(_fc) and not _gris(_fc[0]): _pts += len(_k.get_offsets())\n    for _l in _a.get_lines():\n        if len(_l.get_xdata()) <= 2 and not _gris(_l.get_color()) and str(_l.get_marker()) not in ("None", ""): _pts += len(_l.get_xdata())\n_txt = [t.get_text() for t in (_a.texts if _a else [])]\n_arrow = any(getattr(t, "arrow_patch", None) is not None for t in (_a.texts if _a else []))\n_titres = " ".join([_a.get_title(), _a.get_title(loc="left")] + [t.get_text() for t in _f.texts] + ([_f._suptitle.get_text()] if _f._suptitle else [])).lower() if _a else ""\n[(len(_ax) == 1, "Un seul axe vertical"),\n (len(_l11) >= 1 and _gris(_l11[0].get_color()), "La courbe du taux, en gris"),\n (_pts == 2, "Deux points en couleur (2015 et 2024)"),\n (any("7,5" in t or "7.5" in t for t in _txt) and any("22,1" in t or "22.1" in t for t in _txt), "Les valeurs 7,5 et 22,1 écrites"),\n (_arrow and any("3" in t and ("×" in t or "x" in t.lower()) for t in _txt), "L’annotation « × 3 en 9 ans » avec une flèche"),\n (_a is not None and abs(_a.get_ylim()[0]) < 1e-9 and abs(_a.get_ylim()[1] - 25) < 0.5, "Axe vertical de 0 à 25"),\n (_a is not None and not _a.spines["top"].get_visible() and not _a.spines["right"].get_visible(), "Cadre haut et droit retirés"),\n ("tripl" in _titres, "Le titre-message (« presque triplé »)")]';

  const HEAT = 'import seaborn as sns\nimport matplotlib.pyplot as plt\nplt.rcdefaults()\n\n# 1. Du format long au format large : une ligne par wilaya, une colonne par année (pivot)\ntable = ...\n# 2. Triez les wilayas par taux en 2025, du plus haut au plus bas\ntable = ...\n# 3. La carte de chaleur : valeurs écrites (annot, fmt=".0f"), palette divergente\n#    centrée sur la moyenne nationale 2025, 18,8 % (center=18.8)\nfig, ax = plt.subplots(figsize=(9, 6))\n...\nax.set_title("Taux d’admission au bac par wilaya (%)", loc="left")\nplt.show()';
  const CHECK_HEAT = 'import matplotlib.pyplot as _plt, pandas as _pd\nfrom matplotlib.collections import QuadMesh as _QM\n_ok = isinstance(table, _pd.DataFrame) and table.shape == (15, 10)\n_ord = _ok and 2025 in table.columns and list(table.index) == list(table.sort_values(2025, ascending=False).index)\n_ax = _plt.gcf().axes\n_qm = [c for a in _ax for c in a.collections if isinstance(c, _QM)]\nfrom matplotlib.colors import rgb_to_hsv as _hsv\n_div = False\nif _qm:\n    _cm, _n = _qm[0].get_cmap(), _qm[0].norm\n    _p = (18.8 - _n.vmin) / (_n.vmax - _n.vmin) if _n.vmax > _n.vmin else 0.5\n    _lo, _md, _hi = [_hsv(_cm(v)[:3]) for v in (0.0, min(max(_p, 0), 1), 1.0)]\n    _div = _md[2] > max(_lo[2], _hi[2]) - 0.02 and _md[1] < min(_lo[1], _hi[1])\n[(_ok, "Un tableau de 15 wilayas × 10 années"),\n (_ord, "Wilayas triées par taux 2025, du plus haut au plus bas"),\n (bool(_qm), "Une carte de chaleur"),\n (_div, "Une palette divergente, la plus claire à 18,8 %"),\n (sum(len(a.texts) for a in _ax) >= 150, "Les 150 valeurs écrites dans les cases")]';

  const ALT_SURVOL = 'import altair as alt\n\n# Quinze courbes, une par wilaya. Au survol, une seule s’allume, les autres restent grises.\nsurvol = alt.selection_point(fields=["wilaya"], on="mouseover", nearest=True)\n# À vous : complétez la couleur (alt.condition avec « survol ») et l’infobulle, puis ajoutez la sélection (.add_params)\ngraphique = alt.Chart(bac_wilaya).mark_line(point=True).encode(\n    x=alt.X("annee:O", title="Année"),\n    y=alt.Y("taux:Q", title="Taux d’admission (%)"),\n    detail="wilaya:N",\n    # color=...,\n    # tooltip=[...],\n).properties(width=480, height=280)\ngraphique';
  const CHECK_SURVOL = '_d = graphique.to_dict()\n_e = _d.get("encoding", {})\n[("params" in _d, "Une sélection ajoutée (add_params)"),\n ("condition" in _e.get("color", {}), "La couleur dépend de la sélection"),\n ("tooltip" in _e, "Une infobulle")]';

  const AI_CODE = '# Code produit par une IA pour la demande : « Montre la part des admis au bac 2025 »\nimport matplotlib.pyplot as plt\nplt.rcdefaults()\n\nparts = {"Admis": 18.8, "Sessionnaire": 13.3, "Ajourné": 67.9, "Admis (2e session)": 5.0}\n\nfig, ax = plt.subplots(figsize=(5, 5))\nax.pie(parts.values(), labels=parts.keys(), autopct="%1.1f%%", shadow=True,\n       explode=[0.1] * len(parts), colors=plt.cm.rainbow([0, .33, .66, 1]))\nax.set_title("Résultats")\nplt.show()';
  const CHECK_AI = 'import matplotlib.pyplot as _plt\nfrom matplotlib.patches import Wedge as _W\n_ax = _plt.gcf().axes\n[(set(parts) == {"Admis", "Sessionnaire", "Ajourné"}, "Aucune catégorie inventée (3 décisions seulement)"),\n (abs(sum(parts.values()) - 100) < 0.2, "Les parts font bien 100 %"),\n (not any(isinstance(p, _W) for a in _ax for p in a.patches), "Plus de camembert"),\n (any(len(a.get_title() + a.get_title(loc="left")) >= 25 for a in _ax), "Un titre qui dit le message")]';

  const STYLE = 'import matplotlib.pyplot as plt\n\ndef mon_style():\n    plt.rcdefaults()   # repartir des réglages d’origine\n    plt.rcParams.update({\n        "axes.spines.top": False,\n        "axes.spines.right": False,\n        # À vous : police (font.family), taille des titres (axes.titlesize),\n        # couleurs (axes.prop_cycle), quadrillage (axes.grid)…\n    })\n\nmon_style()\nfig, ax = plt.subplots(figsize=(7, 3.5))\nax.plot(admis["annee"], admis["admis"], marker="o")\nax.set_title("Admis au bac par année", loc="left")\nplt.show()';
  const CHECK_STYLE = 'import matplotlib.pyplot as _plt\n_r = _plt.rcParams\n[(not _r["axes.spines.top"] and not _r["axes.spines.right"], "Cadre haut et droit retirés"),\n (_r["axes.titlesize"] != "large" or _r["font.family"] != ["sans-serif"] or _r["axes.grid"] or _r["axes.prop_cycle"] != _plt.rcParamsDefault["axes.prop_cycle"], "Au moins un réglage personnel en plus (police, titre, couleurs ou quadrillage)")]';

  const PROMPT = 'Tu es mon tuteur en visualisation de données (Python, pandas, Matplotlib, Seaborn, Altair). Ne me donne jamais le code complet. Pose-moi une question à la fois, donne un indice court, et laisse-moi écrire le code. Si je me trompe, dis-moi où regarder, pas la réponse.';

  window.DS_TD = window.DS_TD || {};
  window.DS_TD.td1 = {
    id: 'td1',
    title: 'Un graphique, trois bibliothèques',
    lede: 'Le même graphique écrit en Matplotlib, en Seaborn et en Altair. Puis choisir, critiquer, reproduire, et préparer les données soi-même.',
    model: '<span>Données</span><i>→</i><span>Encodage</span><i>→</i><span>Graphique</span>',
    howto: '<div class="mascot-note mascot-note-dog">' + window.Mascots.mascot('dog') + '<div class="mascot-note-text">' +
      '<p><b>Le code s’exécute dans votre navigateur</b> : rien à installer. Bouton ▶ ou Maj + Entrée. La première exécution charge Python (environ 20 s). Les cellules précédentes d’un exercice s’exécutent automatiquement. Les <b>vérifications</b> (✓ / ✗) apparaissent sous la figure.</p></div></div>' +
      '<p class="small">Les badges indiquent l’usage permis de l’IA : <span class="ai-badge is-off">Sans IA</span> <span class="ai-badge is-hint">IA : indices seulement</span> <span class="ai-badge is-on">IA autorisée</span></p>' +
      '<details class="foot-details"><summary>Consigne à copier pour un tuteur IA (indices seulement)</summary><p class="td-prompt">' + PROMPT + '</p></details>',
    exercises: [
      {
        id: 'visualisez', title: 'Visualisez !', minutes: 20,
        lead: 'Combien de candidats ont été admis au bac chaque année ? Le même tableau, montré de plusieurs façons.',
        parts: [
          {phase: 'Prédire', ai: 'off'},
          {cell: {id: 'e1-data', code: SETUP1, setup: true, label: 'Les données : admis au bac, 2015 à 2025'}},
          {table: {head: ['Année', 'Admis'], rows: YEARS.map((y, i) => [String(y), fr(ADMIS[i])])}},
          {ask: 'Lisez ce tableau pendant 30 secondes. Notez sur papier <b>deux choses intéressantes</b>. Combien d’effort cela vous a-t-il demandé ?'},
          {phase: 'Le tableau en couleur, puis Matplotlib (impératif)', ai: 'off'},
          {cell: {id: 'e1-style', code: STYLE_TABLE}},
          {p: 'Matplotlib : on dit à la machine <b>comment</b> dessiner, étape par étape. Exécutez ce modèle.'},
          {cell: {id: 'e1-mpl-bar', code: MPL_BAR}},
          {phase: 'Défi 1 · Mettre 2024 en valeur (Matplotlib)', ai: 'hint'},
          {cell: {id: 'e1-mpl-defi', code: MPL_DEFI, check: CHECK_DEFI}},
          {phase: 'Défi 2 · Seaborn, sans modèle', ai: 'hint'},
          {p: 'Seaborn part d’un tableau (`data=`) et de noms de colonnes, avec de meilleurs réglages par défaut.'},
          {cell: {id: 'e1-sns-line', code: SNS_LINE, check: CHECK_LINE}},
          {phase: 'Défi 3 · Altair, l’approche déclarative', ai: 'hint'},
          {p: 'On décrit <b>ce qu’on veut montrer</b> : une marque et des encodages. L’infobulle vient presque gratuitement.'},
          {cell: {id: 'e1-alt', code: ALT, check: CHECK_ALT}},
          {phase: 'Justifier', ai: 'off'},
          {table: {head: ['', 'Matplotlib', 'Seaborn', 'Altair'], rows: [
            ['Philosophie', 'impérative : <i>comment</i> dessiner', 'statistique, bons réglages par défaut', 'déclarative : <i>quoi</i> montrer'],
            ['Interaction', 'non', 'non', 'oui (survol, zoom, sélection)'],
            ['Idéal pour', 'tout contrôler', 'explorer vite', 'le web, l’interaction']]}},
          {ask: 'Tableau coloré, barres ou courbe : lequel montre le mieux l’évolution ? Et lequel montre le mieux 2024 ? Deux lignes.'}
        ]
      },
      {
        id: 'choisir', title: 'Quel graphique choisiriez-vous ?', minutes: 20,
        lead: 'La répartition des décisions du bac en 2015 et en 2025, vue de quatre façons. Les données sont exactement les mêmes.',
        parts: [
          {phase: 'Observer', ai: 'off'},
          {html: '<div class="viz">' + OPTIONS + '<div class="viz-caption">Part des candidats, en %. Résultats du bac 2015 et 2025 (dépôt public rimdata).</div></div>'},
          {ol: ['Que voit-on facilement dans chaque option ? Que peut-on comparer ?', 'Qu’est-ce qui est difficile ? Quelles limites ?', 'Pour communiquer ce résultat, quelle option choisiriez-vous, et pourquoi ?']},
          {q: 'pente'},
          {phase: 'Construire · Option C, les barres empilées à 100 %', ai: 'hint'},
          {cell: {id: 'e2-stack', code: STACK, check: CHECK_STACK}},
          {phase: 'Construire · Option D, le graphique de pente', ai: 'hint'},
          {cell: {id: 'e2-slope', code: SLOPE, check: CHECK_SLOPE}}
        ]
      },
      {
        id: 'probleme', title: 'Qu’est-ce qui ne va pas ?', minutes: 20,
        lead: 'Un graphique comme on en voit dans beaucoup de rapports. Exécutez-le, critiquez-le, puis reproduisez la version du CM 1.',
        parts: [
          {cell: {id: 'e3-bad', code: BAD}},
          {phase: 'Auditer', ai: 'off'},
          {ask: 'Listez sur papier <b>trois choses qui ne vont pas</b>. Pour chacune : comment la corriger ?'},
          {details: 'Ce qu’on pouvait repérer (après votre liste)', body: '<ul class="biblio">' + [
            '<b>Deux axes verticaux</b> : deux messages en un, et l’œil compare des choses qui ne se comparent pas.',
            '<b>L’axe des barres commence à 40 000</b> : les barres de 2025 paraissent plus de 6 fois plus hautes que celles de 2015, pour 27 % de candidats en plus (facteur de mensonge ≈ 21).',
            '<b>Couleurs par défaut</b>, aucune hiérarchie : rien ne dit où regarder.',
            '<b>Dates inclinées</b>, quadrillage lourd, légende loin des données.',
            '<b>Titre descriptif</b> : il dit ce que montre le graphique, pas ce qu’il faut en retenir.'].map(x => '<li>' + x + '</li>').join('') + '</ul>'},
          {phase: 'Reproduire · le graphique du CM 1', ai: 'hint'},
          {p: 'Voici la cible. Reproduisez-la aussi fidèlement que possible. Les variables `annees` et `taux` existent déjà. Huit vérifications vous guident.'},
          {html: '<div class="viz">' + target() + '<div class="viz-caption">La cible : le graphique d’ouverture du CM 1.</div></div>'},
          {cell: {id: 'e3-good', code: GOOD, check: CHECK_GOOD}},
          {phase: 'Justifier', ai: 'off'},
          {ask: 'Deux lignes : qu’avez-vous retiré du graphique de départ, et pourquoi le message passe-t-il mieux ?'}
        ]
      },
      {
        id: 'chaleur', title: 'La carte de chaleur des wilayas', minutes: 20,
        lead: 'Avant le graphique, les données : passer du format long au format large avec pandas, trier, puis dessiner.',
        parts: [
          {cell: {id: 'e4-data', code: SETUP4, setup: true, label: 'Les données : taux d’admission par wilaya et par année'}},
          {phase: 'Prédire', ai: 'off'},
          {ask: 'Le tableau `bac_wilaya` a une ligne par (wilaya, année). Combien de lignes et de colonnes aura le tableau large, une ligne par wilaya ? Pourquoi pas 11 colonnes ?'},
          {phase: 'Construire', ai: 'hint'},
          {cell: {id: 'e4-heat', code: HEAT, check: CHECK_HEAT}},
          {phase: 'Interpréter', ai: 'off'},
          {ask: 'Trouvez deux histoires dans votre carte. Pour chacune, écrivez le titre-message que vous lui donneriez.'},
          {note: 'Une palette <b>divergente</b> a un centre qui a du sens : ici la moyenne nationale. Au-dessus d’une couleur, au-dessous de l’autre.', mascot: 'lion'}
        ]
      },
      {
        id: 'survol', title: 'Altair interactif : le survol', minutes: 15, extra: true,
        lead: 'Quinze courbes, c’est un spaghetti. Avec une sélection au survol, une seule s’allume à la fois.',
        parts: [
          {phase: 'Construire', ai: 'on'},
          {cell: {id: 'e5-survol', code: ALT_SURVOL, check: CHECK_SURVOL}},
          {note: 'L’interaction doit ajouter du sens : ici, elle remplace la légende et défait le spaghetti.', mascot: 'dog'}
        ]
      },
      {
        id: 'audit-ia', title: 'Auditer un code écrit par une IA', minutes: 15, extra: true,
        lead: 'Une IA a reçu la demande : « Montre la part des admis au bac 2025 ». Voici son code.',
        parts: [
          {phase: 'Auditer', ai: 'off'},
          {cell: {id: 'e6-ai', code: AI_CODE, check: CHECK_AI}},
          {ask: 'Trouvez au moins <b>trois problèmes</b>, dont un qui touche aux <b>données</b> elles-mêmes. Additionnez les parts.'},
          {phase: 'Corriger', ai: 'on'},
          {p: 'Corrigez directement la cellule ci-dessus, puis exécutez-la : les vérifications passent au vert quand tout est réglé.'},
          {note: 'Une IA peut inventer une catégorie ou un chiffre avec assurance. Vérifier les données, c’est le premier pilier.', mascot: 'ghost'}
        ]
      },
      {
        id: 'style', title: 'Votre style', minutes: 10, extra: true,
        lead: 'Un style cohérent se règle une fois pour toutes. Écrivez votre fonction `mon_style()`.',
        parts: [
          {phase: 'Construire', ai: 'on'},
          {cell: {id: 'e7-style', code: STYLE, check: CHECK_STYLE}},
          {note: 'Gardez cette fonction : appliquée partout, elle donne à tous vos graphiques la même identité. Elle peut devenir votre propre petite bibliothèque.', mascot: 'dog'}
        ]
      }
    ],
    questions: {
      pente: {
        prompt: 'Message : « la part d’admis a plus que doublé en dix ans ». Quelle option le montre le mieux ?', cols: 2,
        options: [
          {t: 'A · Deux camemberts', why: 'Il faut comparer des angles entre deux cercles : l’œil y est mauvais.'},
          {t: 'B · Barres groupées', why: 'Lisible, mais il faut comparer des paires de barres. La pente dit directement « en hausse ».'},
          {t: 'C · Barres empilées à 100 %', why: 'Bien pour le tout, mais seules les extrémités se comparent facilement.'},
          {t: 'D · Graphique de pente', ok: true, why: 'Une ligne par décision : la pente montre le sens et l’ampleur du changement, et la couleur isole le message.'}
        ]
      }
    }
  };
})();
