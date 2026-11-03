/* TD extra (id td2) · Visualisations interactives avec Bokeh : non fait en séance, placé en fin de plan.
   D'après bokeh.ipynb (2025-2026) : ColumnDataSource et survol, série temporelle, barres, histogramme,
   widgets et CustomJS, carte de la Mauritanie. Refait sur des données mauritaniennes réelles
   (bac 2015-2025 du dépôt public rimdata, météo de Nouakchott 2020-2024). */
(function () {
  const W25 = [['Adrar', 'Atar', 1022, 17.4, 20.52, -13.05], ['Assaba', 'Kiffa', 2982, 14.6, 16.62, -11.40], ['Brakna', 'Aleg', 1761, 14.0, 17.05, -13.92],
    ['Dakhlet Nouadhibou', 'Nouadhibou', 2763, 18.5, 20.94, -17.04], ['Gorgol', 'Kaédi', 1917, 19.0, 16.15, -13.50], ['Guidimagha', 'Sélibaby', 799, 9.8, 15.16, -12.18],
    ['Hodh Chargui', 'Néma', 1269, 22.4, 16.62, -7.26], ['Hodh El Gharbi', 'Aïoun', 3339, 17.6, 16.66, -9.61], ['Inchiri', 'Akjoujt', 388, 16.5, 19.75, -14.39],
    ['Nouakchott Nord', 'Dar Naïm', 9368, 21.5, 18.13, -15.93], ['Nouakchott Ouest', 'Tevragh Zeina', 8943, 22.2, 18.10, -15.99], ['Nouakchott Sud', 'Arafat', 12008, 18.7, 18.03, -15.96],
    ['Tagant', 'Tidjikja', 1374, 16.2, 18.56, -11.43], ['Tiris Zemmour', 'Zouérat', 831, 17.8, 22.73, -12.47], ['Trarza', 'Rosso', 4384, 14.5, 16.51, -15.81]];
  const SERIE = {SN: [7.5, 5.4, 8.9, 16.1, 8.8, 20.1, 8.8, 11.1, 16.1, 23.3, 17.3], M: [18, 17.6, 19.1, 24.4, 22.6, 28.9, 20.2, 29.3, 32.2, 41.6, 40.8], LM: [2.8, 2.3, 3.3, 2, 1, 1.9, 3.3, 4.2, 4.8, 10, 10.4], LO: [8.4, 6.4, 6.4, 13.8, 6.3, 9, 8.8, 21.1, 18.1, 24.8, 25.1]};
  const TEMP = [21.5, 25.4, 24.2, 24.7, 25, 27.7, 27, 28.7, 29.7, 30.4, 26.7, 22, 22.4, 22.4, 23.2, 24.9, 24.3, 26.7, 25.6, 28.9, 29.6, 28.9, 26.1, 23.5, 23.2, 23.1, 22.4, 22.7, 25.1, 27.9, 26.5, 28.2, 30.2, 29.1, 26.3, 23.4, 22.2, 22.1, 24.8, 24.6, 26, 27.3, 28.2, 28.3, 30.4, 29.3, 26.8, 23, 23.2, 24.5, 23.3, 25.2, 25.1, 26.2, 26.6, 28.3, 27.9, 29.5, 26.5, 22.8];
  const NOTES = window.DS_DATA2 ? window.DS_DATA2.notes2025.n : [];
  const col = i => '[' + W25.map(r => typeof r[i] === 'string' ? '"' + r[i] + '"' : r[i]).join(', ') + ']';

  const SETUP = 'import numpy as np\nimport pandas as pd\n\n# Convertit longitude et latitude en coordonnées Web Mercator (celles des fonds de carte)\ndef wmerc(lon, lat):\n    k = 20037508.34\n    x = lon * k / 180.0\n    y = np.log(np.tan((90 + lat) * np.pi / 360.0)) * k / np.pi\n    return x, y\n\n' +
    '# Bac 2025 par wilaya. Chef-lieu : coordonnées approximatives.\nwilayas = pd.DataFrame({\n    "wilaya": ' + col(0) + ',\n    "chef_lieu": ' + col(1) + ',\n    "candidats": ' + col(2) + ',\n    "taux": ' + col(3) + ',\n    "lat": ' + col(4) + ',\n    "lon": ' + col(5) + ',\n})\n\n' +
    '# Taux d’admission (%) par série, 2015-2025\nseries = pd.DataFrame({"annee": list(range(2015, 2026)), ' + Object.keys(SERIE).map(k => '"' + k + '": [' + SERIE[k].join(', ') + ']').join(', ') + '})\n\n' +
    '# Température moyenne mensuelle à Nouakchott, 2020-2024\ntemp = pd.DataFrame({"mois": pd.date_range("2020-01-01", periods=60, freq="MS"), "temp": [' + TEMP.join(', ') + ']})\n\n' +
    '# Notes du bac 2025 : nombre de candidats par tranche de 0,1 point (0–0,1 ; 0,1–0,2 ; … ; 19,9–20)\nnotes_01 = [' + NOTES.join(', ') + ']\nwilayas.head()';

  const E1_GIVEN = 'from bokeh.plotting import figure, show\nfrom bokeh.models import ColumnDataSource\n\nsource = ColumnDataSource(wilayas)          # 1. les données, dans une « source »\np = figure(width=650, height=380,          # 2. la zone de dessin et ses outils\n           title="Bac 2025 : candidats et taux d’admission par wilaya",\n           x_axis_label="Candidats", y_axis_label="Taux d’admission (%)",\n           tools="pan,wheel_zoom,box_zoom,reset,save")\np.scatter(x="candidats", y="taux", source=source, size=12, color="#b8bcc6")   # 3. un glyphe\nshow(p)';
  const E1 = 'from bokeh.models import HoverTool\n\n# 1. Une colonne « couleur » : mauve ("#8a4f8c") pour les trois wilayas de Nouakchott, gris ("#b8bcc6") sinon\nwilayas["couleur"] = "#b8bcc6"\n...\nsource = ColumnDataSource(wilayas)\np = figure(width=650, height=380, title="Bac 2025 : Nouakchott en tête, par le nombre et par le taux",\n           x_axis_label="Candidats", y_axis_label="Taux d’admission (%)", tools="pan,wheel_zoom,box_zoom,reset,save")\n# 2. Les points, colorés par la colonne « couleur »\n...\n# 3. Une infobulle : wilaya, chef-lieu, candidats avec séparateur de milliers ({0,0}), taux en %\n...\nshow(p)';
  const CHECK_E1 = 'import __main__\nfrom bokeh.models import HoverTool\n_p = __main__._ds_bokeh[-1] if __main__._ds_bokeh else None\n_r = _p.renderers[0] if _p is not None and getattr(_p, "renderers", None) else None\n_h = [t for t in (_p.tools if _p is not None else []) if isinstance(t, HoverTool)]\n_tt = str(_h[0].tooltips) if _h else ""\n_data = _r.data_source.data if _r is not None else {}\n[(_p is not None, "Un graphique montré avec show()"),\n ("couleur" in _data and len(set(_data["couleur"])) == 2 and list(_data["couleur"]).count("#8a4f8c") == 3, "Trois wilayas en mauve : celles de Nouakchott"),\n (_r is not None and "couleur" in str(_r.glyph.fill_color), "Les points prennent la couleur de la colonne"),\n ("@wilaya" in _tt and "@chef_lieu" in _tt, "Infobulle : wilaya et chef-lieu"),\n ("@candidats{0,0}" in _tt.replace(" ", "") and "@taux" in _tt, "Infobulle : candidats {0,0} et taux")]';

  const E2 = 'from bokeh.plotting import figure, show\nfrom bokeh.models import ColumnDataSource, HoverTool, BoxAnnotation\n\nsource_t = ColumnDataSource(temp)\np = figure(width=700, height=320, x_axis_type="datetime", title="Nouakchott : la chaleur culmine en septembre-octobre",\n           y_axis_label="°C", tools="pan,wheel_zoom,box_zoom,reset")\n# 1. La courbe (line) et des points (scatter) de la température\n...\n# 2. Une infobulle : le mois au format 2023-09 (@mois{%Y-%m}, formatters={"@mois": "datetime"}) et la température\n...\n# 3. Enclosure : un fond coloré (BoxAnnotation) sur septembre-octobre de chaque année, 2020 à 2024\n...\nshow(p)';
  const CHECK_E2 = 'import __main__\nfrom bokeh.models import HoverTool, BoxAnnotation, DatetimeAxis, Line\n_p = __main__._ds_bokeh[-1] if __main__._ds_bokeh else None\n_lines = [r for r in (_p.renderers if _p is not None else []) if isinstance(getattr(r, "glyph", None), Line)]\n_h = [t for t in (_p.tools if _p is not None else []) if isinstance(t, HoverTool)]\n_boxes = [a for a in (list(_p.center) + list(_p.renderers) if _p is not None else []) if isinstance(a, BoxAnnotation)]\n[(_p is not None and isinstance(_p.xaxis[0], DatetimeAxis), "Un axe du temps (datetime)"),\n (len(_lines) >= 1, "Une courbe de la température"),\n (bool(_h) and "datetime" in str(_h[0].formatters), "Infobulle avec le mois au format date"),\n (len(_boxes) >= 5, "Cinq fonds colorés, un par année")]';

  const E3 = 'from bokeh.plotting import figure, show\nfrom bokeh.models import ColumnDataSource, Select, CustomJS\nfrom bokeh.layouts import column\n\n# La source affichée : au départ, la série SN\nsource_s = ColumnDataSource(dict(annee=series["annee"], taux=series["SN"]))\np = figure(width=650, height=320, title="Taux d’admission au bac par série (%)", y_range=(0, 45),\n           tools="hover,reset", tooltips=[("Année", "@annee"), ("Taux", "@taux %")])\np.line("annee", "taux", source=source_s, line_width=3, color="#8a4f8c")\np.scatter("annee", "taux", source=source_s, size=8, color="#8a4f8c")\nmenu = Select(title="Série", value="SN", options=["SN", "M", "LM", "LO"])\n\n# À vous : le code JavaScript exécuté quand on change de série.\n# « toutes » est un objet {SN: [...], M: [...], LM: [...], LO: [...]} ; la série choisie est cb_obj.value.\ncode = """\n    ...\n"""\nmenu.js_on_change("value", CustomJS(args=dict(source=source_s, toutes=series.drop(columns="annee").to_dict("list")), code=code))\nshow(column(menu, p))';
  const CHECK_E3 = 'import __main__\nfrom bokeh.models import Select\n_l = __main__._ds_bokeh[-1] if __main__._ds_bokeh else None\n_sel = [m for m in (_l.select({"type": Select}) if _l is not None else [])]\n_cb = [c for s in _sel for cbs in s.js_property_callbacks.values() for c in cbs]\n_code = _cb[0].code if _cb else ""\n[(bool(_sel), "Un menu (Select) dans la mise en page"),\n (bool(_cb), "Un CustomJS branché sur le menu"),\n ("..." not in _code and "cb_obj.value" in _code, "Le code lit la série choisie (cb_obj.value)"),\n ("toutes" in _code and "source" in _code, "Le code remplace les données de la source")]';

  const E4 = 'from bokeh.plotting import figure, show\nfrom bokeh.models import ColumnDataSource, LinearColorMapper, ColorBar, HoverTool\nfrom bokeh.palettes import PuOr11\n\nwilayas["x"], wilayas["y"] = wmerc(wilayas["lon"], wilayas["lat"])\n# Taille des points : l’AIRE doit suivre le nombre de candidats, donc le rayon suit sa racine carrée\nwilayas["taille"] = ...\nsource_m = ColumnDataSource(wilayas)\np = figure(width=650, height=620, x_axis_type="mercator", y_axis_type="mercator",\n           x_range=(-1950000, -650000), y_range=(1650000, 2750000),\n           title="Bac 2025 : taux d’admission par wilaya", tools="pan,wheel_zoom,reset")\np.add_tile("OpenStreetMap Mapnik")\n# 1. Couleur selon le taux : palette divergente PuOr11, centrée sur la moyenne nationale 18,8 % (low=8.8, high=28.8)\nmapper = ...\n# 2. Les points : size="taille", fill_color={"field": "taux", "transform": mapper}\n...\n# 3. Une infobulle (wilaya, chef-lieu, taux) et une barre de couleurs (ColorBar) à droite\n...\nshow(p)';
  const CHECK_E4 = 'import __main__\nfrom bokeh.models import TileRenderer, LinearColorMapper, ColorBar, HoverTool, MercatorAxis\n_p = __main__._ds_bokeh[-1] if __main__._ds_bokeh else None\n_rs = list(_p.renderers) if _p is not None else []\n_pts = [r for r in _rs if hasattr(r, "glyph") and len(r.data_source.data.get("taux", [])) == 15]\n_fc = str(_pts[0].glyph.fill_color) if _pts else ""\n_h = [t for t in (_p.tools if _p is not None else []) if isinstance(t, HoverTool)]\n_cbar = [a for a in (list(_p.right) + list(_p.center) if _p is not None else []) if isinstance(a, ColorBar)]\n_m = _pts[0].glyph.fill_color.transform if _pts and hasattr(_pts[0].glyph.fill_color, "transform") else None\n[(_p is not None and isinstance(_p.xaxis[0], MercatorAxis) and any(isinstance(r, TileRenderer) for r in _rs), "Un fond de carte en Web Mercator"),\n (bool(_pts) and "taille" in str(_pts[0].glyph.size), "15 points, taille selon les candidats"),\n (isinstance(_m, LinearColorMapper) and abs((_m.low + _m.high) / 2 - 18.8) < 0.3, "Couleur du taux, centrée sur 18,8 %"),\n (bool(_h) and "@wilaya" in str(_h[0].tooltips), "Une infobulle"),\n (bool(_cbar), "Une barre de couleurs")]';

  const E5 = 'from bokeh.plotting import figure, show\nfrom bokeh.models import ColumnDataSource\nfrom bokeh.layouts import row\n\nsource_l = ColumnDataSource(wilayas)\noutils = "box_select,lasso_select,tap,reset"\np1 = figure(width=330, height=420, title="Candidats et taux", tools=outils,\n            x_axis_label="Candidats", y_axis_label="Taux (%)")\np1.scatter("candidats", "taux", source=source_l, size=11, color="#8a4f8c", nonselection_alpha=0.15)\n# À vous : un deuxième graphique, des barres horizontales par wilaya (hbar), sur LA MÊME source,\n# avec y_range=list(wilayas["wilaya"]) et les mêmes outils. Sélectionnez à gauche : les barres s’allument à droite.\np2 = figure(width=330, height=420, title="Taux par wilaya", tools=outils)   # complétez : y_range=…\n...   # p2.hbar(...)\nshow(row(p1, p2))';
  const CHECK_E5 = 'import __main__\nfrom bokeh.plotting import figure as _F\n_l = __main__._ds_bokeh[-1] if __main__._ds_bokeh else None\n_figs = list(_l.select({"type": _F})) if _l is not None else []\n_srcs = [r.data_source for f in _figs for r in f.renderers if hasattr(r, "data_source")]\n[(len(_figs) == 2, "Deux graphiques côte à côte"),\n (len(_srcs) >= 2 and all(s is _srcs[0] for s in _srcs), "Les deux graphiques partagent la même source"),\n (any("HBar" in type(r.glyph).__name__ for f in _figs for r in f.renderers if hasattr(r, "glyph")), "Des barres horizontales dans le second graphique")]';

  const E6 = 'from bokeh.plotting import figure, show\nfrom bokeh.models import ColumnDataSource, Slider, CustomJS\nfrom bokeh.layouts import column\n\ndef classes(pas):\n    """Regroupe les tranches de 0,1 point en classes de « pas » points."""\n    k = int(round(pas * 10))\n    gauche = [i / 10 for i in range(0, 200, k)]\n    return dict(left=gauche, right=[g + pas for g in gauche], top=[sum(notes_01[i:i + k]) for i in range(0, 200, k)])\n\nsource_h = ColumnDataSource(classes(2))\np = figure(width=650, height=320, title="Notes du bac 2025", x_range=(0, 20), tools="reset")\np.quad(left="left", right="right", top="top", bottom=0, source=source_h, color="#b8bcc6", line_color="white")\ncurseur = Slider(start=0.1, end=2, step=0.1, value=2, title="Largeur des classes (points)")\n\n# À vous : en JavaScript, recalculez left, right et top à partir de « fines » (notes_01) et de cb_obj.value\ncode = """\n    ...\n"""\ncurseur.js_on_change("value", CustomJS(args=dict(source=source_h, fines=notes_01), code=code))\nshow(column(curseur, p))';
  const CHECK_E6 = 'import __main__\nfrom bokeh.models import Slider\n_l = __main__._ds_bokeh[-1] if __main__._ds_bokeh else None\n_sl = list(_l.select({"type": Slider})) if _l is not None else []\n_cb = [c for s in _sl for cbs in s.js_property_callbacks.values() for c in cbs]\n_code = _cb[0].code if _cb else ""\n[(bool(_sl) and bool(_cb), "Un curseur branché sur un CustomJS"),\n ("..." not in _code and "cb_obj.value" in _code and "fines" in _code, "Le code regroupe les tranches selon la largeur choisie")]';

  const PROMPT = 'Tu es mon tuteur Bokeh (Python et un peu de JavaScript pour CustomJS). Ne me donne jamais le code complet. Pose-moi une question à la fois, donne un indice court (nom d’un objet ou d’un paramètre), et laisse-moi écrire le code.';

  window.DS_TD = window.DS_TD || {};
  window.DS_TD.td2 = {
    id: 'td2',
    title: 'Bokeh : l’interaction au service du récit',
    lede: 'Survol, zoom, menus, curseurs et cartes : des graphiques qu’on explore. Et une règle : l’interaction doit ajouter du sens.',
    model: '<span>Données</span><i>→</i><span>ColumnDataSource</span><i>→</i><span>Glyphes</span><i>→</i><span>Outils</span>',
    howto: '<div class="mascot-note mascot-note-dog">' + window.Mascots.mascot('dog') + '<div class="mascot-note-text">' +
      '<p><b>Le code s’exécute dans votre navigateur</b>, Bokeh compris : <code>show(p)</code> affiche le graphique sous la cellule. Les graphiques sont interactifs : zoomez, survolez, sélectionnez. Les <b>vérifications</b> (✓ / ✗) apparaissent dessous.</p></div></div>' +
      '<p class="small">Usage de l’IA : <span class="ai-badge is-off">Sans IA</span> <span class="ai-badge is-hint">IA : indices seulement</span> <span class="ai-badge is-on">IA autorisée</span></p>' +
      '<details class="foot-details"><summary>Consigne à copier pour un tuteur IA (indices seulement)</summary><p class="td-prompt">' + PROMPT + '</p></details>',
    exercises: [
      {
        id: 'premier', title: 'Un premier graphique interactif', minutes: 20,
        lead: 'Les 15 wilayas en 2025 : nombre de candidats et taux d’admission. Explorez, puis faites parler le graphique.',
        parts: [
          {cell: {id: 't2-data', code: SETUP, setup: true, label: 'Les données du TD : wilayas, séries, températures, notes'}},
          {phase: 'Prédire', ai: 'off'},
          {ask: 'Qu’est-ce qu’un graphique Bokeh permet que Matplotlib ne permet pas ? Citez deux gestes du lecteur.'},
          {phase: 'Explorer', ai: 'off'},
          {p: 'Trois étapes : une <b>source</b> (`ColumnDataSource`), une <b>figure</b> avec ses outils, un <b>glyphe</b>. Exécutez, puis zoomez et déplacez-vous.'},
          {cell: {id: 't2-given', code: E1_GIVEN}},
          {phase: 'Construire · couleur et infobulle', ai: 'hint'},
          {cell: {id: 't2-e1', code: E1, check: CHECK_E1}},
          {phase: 'Justifier', ai: 'off'},
          {ask: 'L’infobulle remplace quoi, sur un graphique statique ? Quel risque si l’on met tout dans l’infobulle ?'}
        ]
      },
      {
        id: 'temps', title: 'Le temps, avec une enclosure', minutes: 20,
        lead: 'Cinq ans de températures à Nouakchott. Un axe du temps, une infobulle datée, et un fond pour la saison chaude.',
        parts: [
          {phase: 'Prédire', ai: 'off'},
          {ask: 'Quel mois est le plus chaud chaque année ? Le même chaque année ? (Souvenez-vous du CM 1.)'},
          {phase: 'Construire', ai: 'hint'},
          {cell: {id: 't2-e2', code: E2, check: CHECK_E2}},
          {phase: 'Interpréter', ai: 'off'},
          {ask: 'Survolez les pics : septembre ou octobre ? Une année fait-elle exception ?'}
        ]
      },
      {
        id: 'menu', title: 'Un menu qui raconte', minutes: 25,
        lead: 'Un seul graphique, quatre séries du bac : le lecteur choisit. Cette fois, une ligne de JavaScript fait le travail.',
        parts: [
          {phase: 'Prédire', ai: 'off'},
          {ask: 'Dans quelle série le taux a-t-il le plus augmenté entre 2015 et 2025 ? Notez votre pari.'},
          {phase: 'Construire · le CustomJS', ai: 'hint'},
          {p: 'Bokeh ne relance pas Python quand on change de série : c’est le navigateur qui réagit, en JavaScript. Le menu appelle votre code avec `cb_obj` (le menu lui-même).'},
          {cell: {id: 't2-e3', code: E3, check: CHECK_E3}},
          {phase: 'Justifier', ai: 'off'},
          {ask: 'Votre pari était-il juste ? Ce menu est-il utile ici, ou du « théâtre de l’interactivité » (CM 4) ? Comparez avec quatre courbes sur un seul graphique.'}
        ]
      },
      {
        id: 'carte', title: 'La carte du bac', minutes: 25,
        lead: 'Les 15 wilayas sur un fond de carte : la taille dit le nombre de candidats, la couleur dit le taux.',
        parts: [
          {phase: 'Prédire', ai: 'off'},
          {ask: 'Si le rayon des cercles était proportionnel au nombre de candidats, Nouakchott Sud (12 008) paraîtrait combien de fois plus « gros » que Tiris Zemmour (831) ? Et avec une aire proportionnelle ?'},
          {phase: 'Construire', ai: 'hint'},
          {cell: {id: 't2-e4', code: E4, check: CHECK_E4}},
          {phase: 'Interpréter', ai: 'off'},
          {ask: 'Quelle histoire la carte raconte-t-elle que le nuage de points de l’exercice 1 ne racontait pas ?'}
        ]
      },
      {
        id: 'vues', title: 'Des vues liées', minutes: 15, extra: true,
        lead: 'Deux graphiques, une seule source : sélectionnez dans l’un, l’autre suit.',
        parts: [
          {phase: 'Construire', ai: 'on'},
          {cell: {id: 't2-e5', code: E5, check: CHECK_E5}},
          {note: 'Vues liées : une sélection se propage à tous les graphiques qui partagent la source. C’est le cœur d’un tableau de bord (CM 4).', mascot: 'dog'}
        ]
      },
      {
        id: 'classes', title: 'Le curseur des classes', minutes: 15, extra: true,
        lead: 'Le pic à 10 du CM 2, en direct : un curseur change la largeur des classes de l’histogramme.',
        parts: [
          {phase: 'Construire', ai: 'on'},
          {cell: {id: 't2-e6', code: E6, check: CHECK_E6}},
          {ask: 'À partir de quelle largeur de classes le pic à 10 devient-il visible ?'}
        ]
      }
    ],
    questions: {}
  };
})();
