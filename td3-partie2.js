/* TD 3 · Partie 2 : la même carte en code, avec GeoPandas et Bokeh (exécutés dans le navigateur).
   D'après GeoPandas.ipynb (2025-2026) : joindre les résultats électoraux de 2024 aux moughataas.
   Données : dist/assets/td3/py/ (scripts/build-data-td3-partie2.py). Résultats électoraux : rimdata. */
(function () {
  const T = window.DS_TD.td3;

  const SETUP = `import numpy as np
import pandas as pd
import geopandas as gpd
import matplotlib.pyplot as plt
from pyodide.http import pyfetch

# Copie les fichiers du TD dans le dossier de travail de Python
for nom in ["monde.geojson", "wilayas.geojson", "moughataas.geojson", "sante_osm.geojson",
            "population_points.csv", "elections_2024.csv", "resultats_moughataas.csv", "bac_2025_wilayas.csv"]:
    r = await pyfetch("assets/td3/py/" + nom)
    with open(nom, "wb") as f:
        f.write(await r.bytes())

def formes(gdf):
    """Pour Bokeh : les x et les y de chaque forme. Les parties d'une même forme sont séparées par NaN."""
    xs, ys = [], []
    for g in gdf.geometry:
        x, y = [], []
        for partie in (g.geoms if g.geom_type == "MultiPolygon" else [g]):
            a, b = partie.exterior.xy
            x += list(a) + [float("nan")]
            y += list(b) + [float("nan")]
        xs.append(x[:-1])
        ys.append(y[:-1])
    return xs, ys

print("Fichiers prêts.")`;

  const E_MONDE = `monde = gpd.read_file("monde.geojson")
print(monde.crs, "·", len(monde), "pays")
monde = monde[monde["continent"] != "Antarctica"]   # en Mercator, le pôle Sud part à l'infini

# 1. Surface en km² vue par Mercator (EPSG:3857) : colonne "km2_mercator"
#    .to_crs(...) change de projection, .area donne des m²
...
# 2. Surface en km² vue par Equal Earth (EPSG:8857) : colonne "km2_equal"
...
# 3. Surface de l'Afrique ÷ surface du Groenland, pour chaque projection
rapport_mercator = ...
rapport_equal = ...
print("Mercator :", rapport_mercator, "· Equal Earth :", rapport_equal)`;
  const CHECK_MONDE = `_m = globals().get("monde")
_a = globals().get("rapport_mercator"); _b = globals().get("rapport_equal")
_num = lambda x: isinstance(x, (int, float, np.floating))
[(_m is not None and "km2_mercator" in _m.columns and "km2_equal" in _m.columns, "Deux colonnes de surface"),
 (_m is not None and "km2_equal" in _m.columns and abs(_m.loc[_m["pays"] == "Mauritania", "km2_equal"].iloc[0] / 1e6 - 1.05) < 0.03, "Mauritanie en Equal Earth : environ 1,05 million de km²"),
 (_num(_a) and abs(_a - 0.93) < 0.03, "En Mercator, l'Afrique paraît à peine aussi grande que le Groenland"),
 (_num(_b) and abs(_b - 13.6) < 0.3, "En réalité, environ 14 fois plus grande (avec ces contours simplifiés)")]`;

  const E_GONFLE = `wilayas = gpd.read_file("wilayas.geojson")
# Essayez d'abord : wilayas.area   → que signifient ces nombres ? (regardez wilayas.crs)

# 1. Colonne "gonflement" : surface en Mercator ÷ surface en Equal Earth, pour chaque wilaya
...
# 2. Triez et affichez : nom (ADM1_EN) et gonflement
...
# 3. Une carte de ce gonflement, en Equal Earth, avec une légende
...
plt.show()`;
  const CHECK_GONFLE = `_w = globals().get("wilayas")
_g = _w.set_index("ADM1_EN")["gonflement"] if _w is not None and "gonflement" in _w.columns else None
[(_g is not None, "Une colonne gonflement"),
 (_g is not None and abs(_g["Tiris Zemmour"] - 1.21) < 0.01, "Tiris Zemmour : surface gonflée d'environ 21 %"),
 (_g is not None and abs(_g["Guidimagha"] - 1.08) < 0.01, "Guidimagha : environ 8 %"),
 (len(plt.get_fignums()) > 0, "Une carte dessinée")]`;

  const E_AGG = `e = pd.read_csv("elections_2024.csv")
print(len(e), "lignes :", e["commune"].nunique(), "noms de communes,", e["candidate"].nunique(), "candidats")

# Une erreur tentante. Exécutez-la, puis regardez le résultat :
print("Participation « naïve » :", round(100 * e["nb_votes"].sum() / e["registered_voters"].sum(), 1), "%")

# 1. Les voix exprimées par moughataa
exprimes = ...
# 2. Inscrits, nuls et neutres par moughataa. Ces colonnes se répètent pour chaque candidat :
#    gardez une seule ligne par commune avec drop_duplicates(["wilaya", "moughataa", "commune"])
autres = ...
# 3. Le tableau "res" : une ligne par moughataa, avec les colonnes "exprimes" et "participation" (%)
#    participation = (exprimes + nuls + neutres) ÷ inscrits
res = ...
res.sort_values("participation").head()`;
  const CHECK_AGG = `_r = globals().get("res")
_ok = isinstance(_r, pd.DataFrame) and "participation" in _r.columns and "exprimes" in _r.columns
_i = _r.set_index("moughataa") if _ok and "moughataa" in _r.columns else _r
[(_ok and len(_r) == 67, "67 lignes : 63 moughataas et 4 lignes à l'étranger"),
 (_ok and int(_r["exprimes"].sum()) == 988829, "988 829 voix exprimées au total"),
 (_ok and abs(_i.loc["Boumdeid", "participation"] - 72.4) < 0.1, "Boumdeid : 72,4 %"),
 (_ok and abs(_i.loc["Bennechab", "participation"] - 32.0) < 0.1, "Bennechab : 32,0 %")]`;

  const E_JOIN = `moughataas = gpd.read_file("moughataas.geojson")
print(moughataas.columns.tolist())

# 4. Joignez res à moughataas : on garde toutes les formes et les colonnes de res.
#    Le nom de la moughataa s'appelle ADM2_EN d'un côté, moughataa de l'autre.
carte = ...

# 5. Quelles lignes de res n'ont trouvé aucune forme ? Une liste de noms.
absentes = ...
print(absentes)`;
  const CHECK_JOIN = `_c = globals().get("carte"); _a = globals().get("absentes")
[(isinstance(_c, gpd.GeoDataFrame) and len(_c) == 63, "63 formes, et c'est toujours un GeoDataFrame"),
 (isinstance(_c, gpd.GeoDataFrame) and "participation" in _c.columns and _c["participation"].notna().all(), "Aucune moughataa sans résultat"),
 (_a is not None and not isinstance(_a, type(...)) and set(_a) == {"Afrique", "Amerique", "Asie", "Europe"}, "Quatre lignes sans forme : les votes à l'étranger")]`;

  const E_CARTE = `# 6. La carte publiée : pas de cadre, un titre qui affirme, une légende lisible, une source.
#    Le paramètre scheme= demande une bibliothèque absente ici : faites vos classes avec pd.cut.
carte["classe"] = pd.cut(carte["participation"], bins=[30, 45, 50, 55, 60, 75])

fig, ax = plt.subplots(figsize=(8, 8))
...
plt.show()`;
  const CHECK_CARTE = `_ax = plt.gcf().axes[0] if plt.get_fignums() and plt.gcf().axes else None
_t = _ax.get_title() + _ax.get_title(loc="left") if _ax is not None else ""
[(_ax is not None and len(_ax.collections) > 0, "Une carte"),
 (_ax is not None and not _ax.axison, "Pas de cadre ni d'axes (ax.set_axis_off())"),
 (len(_t) > 25 and any(c.isdigit() for c in _t), "Un titre qui affirme, avec un chiffre"),
 (_ax is not None and _ax.get_legend() is not None, "Une légende"),
 (_ax is not None and (len(plt.gcf().texts) > 0 or len(_ax.texts) > 0), "Une source sur la figure")]`;

  const E_CHAINE = `sante = gpd.read_file("sante_osm.geojson")
wilayas = gpd.read_file("wilayas.geojson").to_crs(32628)      # des mètres, dès le début
pop = pd.read_csv("population_points.csv")
pop = gpd.GeoDataFrame(pop, geometry=gpd.points_from_xy(pop["lon"], pop["lat"]), crs=4326).to_crs(32628)

# 1. sante_pays : les points situés dans une wilaya (gpd.sjoin, predicate="within")
sante_pays = ...
# 2. soins : hôpitaux, cliniques et cabinets médicaux de sante_pays
soins = ...
# 3. zone : tampon de 5 km autour de soins, fusionné en une seule forme (.buffer puis .union_all)
zone = ...
# 4. pop_w : chaque point de population, avec le nom de sa wilaya (sjoin)
pop_w = ...
# 5. Table "resultat" par wilaya (index ADM1_EN), colonnes pop_tot, pop_5km et part_5km (%)
resultat = ...
print(len(sante_pays), len(soins), round(zone.area / 1e6))
resultat.sort_values("part_5km", ascending=False)`;
  const CHECK_CHAINE = `_r = globals().get("resultat")
_ok = isinstance(_r, pd.DataFrame) and "part_5km" in _r.columns
_z = globals().get("zone")
[(len(globals().get("sante_pays", [])) == 315, "315 points dans le pays, comme dans QGIS"),
 (len(globals().get("soins", [])) == 54, "54 lieux de soins"),
 (hasattr(_z, "area") and abs(_z.area / 1e6 - 2175) < 40, "Une zone d'environ 2 180 km² : des mètres, pas des degrés"),
 (_ok and abs(_r.loc["Nouakchott Sud", "part_5km"] - 72.2) < 1.5, "Nouakchott Sud : environ 72 %"),
 (_ok and abs(100 * _r["pop_5km"].sum() / _r["pop_tot"].sum() - 31.1) < 0.3, "Tout le pays : 31,1 %, le chiffre de QGIS")]`;

  const E_ACCES = `# 6. Une fonction : part (%) de la population à moins de km kilomètres d'un point de "types".
#    types=None : tous les points de sante_pays. Réutilisez pop_w et sante_pays.
def acces(types, km):
    ...

SOINS = ["hospital", "clinic", "doctors"]
for t, km in [(SOINS, 5), (None, 5), (SOINS, 10), (["hospital"], 10)]:
    print(t, km, "km :", acces(t, km), "%")`;
  const CHECK_ACCES = `_f = globals().get("acces")
_v = lambda *a: float(_f(*a)) if _f(*a) is not None else -1
_S = ["hospital", "clinic", "doctors"]
[(abs(_v(_S, 5) - 31.1) < 0.3, "Lieux de soins, 5 km : 31,1 %"),
 (abs(_v(None, 5) - 38.0) < 0.5, "Tous les points, 5 km : environ 38 %"),
 (abs(_v(_S, 10) - 35.4) < 0.5, "Lieux de soins, 10 km : environ 35 %"),
 (abs(_v(["hospital"], 10) - 31.8) < 0.5, "Hôpitaux, 10 km : environ 32 %")]`;

  const LOAD_CARTE = `from bokeh.plotting import figure, show
from bokeh.models import ColumnDataSource, LinearColorMapper, ColorBar, HoverTool
from bokeh.palettes import Purples256

# Le tableau propre de l'exercice précédent, joint aux moughataas, en Equal Earth
carte = gpd.read_file("moughataas.geojson").to_crs(8857)
res = pd.read_csv("resultats_moughataas.csv", index_col="moughataa")
candidats = [c for c in res.columns if c not in ("registered_voters", "nb_null_votes", "nb_neutral_votes")]
res["exprimes"] = res[candidats].sum(axis=1)
res["participation"] = 100 * (res["exprimes"] + res["nb_null_votes"] + res["nb_neutral_votes"]) / res["registered_voters"]
carte = carte.merge(res, left_on="ADM2_EN", right_index=True)
print("Points du contour :", carte.geometry.count_coordinates().sum())
`;
  const E_BOKEH = LOAD_CARTE + `
# 1. Simplifiez les contours à 1 km près dans "legere" (.simplify) : le navigateur vous dira merci
legere = carte.copy()
...
print("Après simplification :", legere.geometry.count_coordinates().sum())

xs, ys = formes(legere)
source = ColumnDataSource(dict(xs=xs, ys=ys, moughataa=legere["ADM2_EN"], wilaya=legere["ADM1_EN"],
                               participation=legere["participation"], exprimes=legere["exprimes"]))
p = figure(width=650, height=650, match_aspect=True, title="Présidentielle 2024 : la participation par moughataa",
           tools="pan,wheel_zoom,reset", x_axis_location=None, y_axis_location=None)
p.grid.visible = False
# 2. Un LinearColorMapper du clair au foncé (Purples256[::-1], de 30 à 75)
mapper = ...
# 3. p.patches("xs", "ys", ...) coloré par la participation, contours blancs
...
# 4. Une infobulle : moughataa, wilaya, participation (@participation{0.0} %), voix exprimées ({0,0})
...
# 5. Une barre de couleurs à droite
...
show(p)`;
  const CHECK_BOKEH = `import __main__
from bokeh.models import HoverTool, ColorBar, Patches
_p = __main__._ds_bokeh[-1] if __main__._ds_bokeh else None
_rs = [r for r in (_p.renderers if _p is not None else []) if isinstance(getattr(r, "glyph", None), Patches)]
_h = [t for t in (_p.tools if _p is not None else []) if isinstance(t, HoverTool)]
_tt = str(_h[0].tooltips) if _h else ""
_l = globals().get("legere")
[(len(_rs) == 1 and len(_rs[0].data_source.data["xs"]) == 63, "63 formes (patches)"),
 (_l is not None and _l.geometry.count_coordinates().sum() < 6000, "Des contours simplifiés"),
 (_rs and "participation" in str(_rs[0].glyph.fill_color), "Couleur selon la participation"),
 ("@moughataa" in _tt and "@participation" in _tt, "Une infobulle"),
 (_p is not None and any(isinstance(a, ColorBar) for a in _p.right), "Une barre de couleurs")]`;

  const E_MENU = LOAD_CARTE + `from bokeh.models import Select, CustomJS, TapTool
from bokeh.layouts import row, column

carte["geometry"] = carte.geometry.simplify(1000)
xs, ys = formes(carte)
donnees = dict(xs=xs, ys=ys, moughataa=carte["ADM2_EN"], exprimes=carte["exprimes"])
for c in candidats:                                   # une colonne par candidat : sa part des voix (%)
    donnees[c] = 100 * carte[c] / carte["exprimes"]
donnees["part"] = donnees[candidats[0]]               # la colonne affichée
source = ColumnDataSource(donnees)

mapper = LinearColorMapper(palette=Purples256[::-1], low=0, high=100)
outils = "pan,wheel_zoom,tap,box_select,reset"
carte_v = figure(width=430, height=430, match_aspect=True, tools=outils, x_axis_location=None, y_axis_location=None,
                 tooltips=[("Moughataa", "@moughataa"), ("Part des voix", "@part{0.0} %")])
carte_v.grid.visible = False
carte_v.patches("xs", "ys", source=source, fill_color={"field": "part", "transform": mapper}, line_color="white", nonselection_fill_alpha=0.15)

# 1. Un second graphique sur LA MÊME source : voix exprimées (x) et part (y), un point par moughataa
nuage = ...
# 2. Un menu (Select) avec les candidats, et son CustomJS : la colonne "part" prend les valeurs du candidat choisi
menu = ...
code = """
    ...
"""
...
show(column(menu, row(carte_v, nuage)))`;
  const CHECK_MENU = `import __main__
from bokeh.models import Select
from bokeh.plotting import figure as _F
_l = __main__._ds_bokeh[-1] if __main__._ds_bokeh else None
_figs = list(_l.select({"type": _F})) if _l is not None else []
_srcs = [r.data_source for f in _figs for r in f.renderers if hasattr(r, "data_source")]
_sel = list(_l.select({"type": Select})) if _l is not None else []
_cb = [c for s in _sel for cbs in s.js_property_callbacks.values() for c in cbs]
_code = _cb[0].code if _cb else ""
[(len(_figs) == 2, "Deux vues"),
 (len(_srcs) >= 2 and all(s is _srcs[0] for s in _srcs), "Les deux vues partagent la même source : la sélection se propage"),
 (bool(_sel) and len(_sel[0].options) == 7, "Un menu avec les 7 candidats"),
 ("..." not in _code and "cb_obj.value" in _code and "part" in _code and ("change.emit" in _code or "source.data =" in _code), "Le CustomJS remplace la colonne part et prévient Bokeh")]`;

  const E_SURFACE = LOAD_CARTE + `
# 1. Colonne "tete" : le candidat arrivé en tête dans chaque moughataa (idxmax)
...
# 2. Colonne "km2" : surface en km² (carte est déjà en Equal Earth)
...
# 3. Table "bilan" par candidat en tête : nombre de moughataas (n), part de la surface (%), et, en dernière
#    colonne, "voix" : la part nationale des voix de CE candidat dans les 63 moughataas (%)
bilan = ...
bilan`;
  const CHECK_SURFACE = `_b = globals().get("bilan")
_ok = isinstance(_b, pd.DataFrame) and {"n", "voix"} <= set(_b.columns)
_s = [c for c in _b.columns if c not in ("n", "voix")][0] if _ok else None
_g = "Mohamed Cheikh Ghazouani"
[(_ok and len(_b) == 2 and _b.loc[_g, "n"] == 57, "Deux candidats en tête ; l'un dans 57 moughataas sur 63"),
 (_ok and abs(_b.loc[_g, _s] - 98.3) < 0.3, "98,3 % de la surface"),
 (_ok and abs(_b.loc[_g, "voix"] - 56.5) < 0.3, "56,5 % des voix")]`;

  const E_DORLING = `from bokeh.plotting import figure, show
from bokeh.models import ColumnDataSource, HoverTool

def separer(x, y, r, tours=400):
    """Écarte les cercles qui se chevauchent, en les ramenant un peu vers leur place d'origine."""
    x, y = np.array(x, float), np.array(y, float)
    x0, y0 = x.copy(), y.copy()
    for _ in range(tours):
        for i in range(len(x)):
            dx, dy = x - x[i], y - y[i]
            d = np.hypot(dx, dy) + 1e-6
            o = r + r[i] - d
            o[i] = 0
            j = o > 0
            x[j] += dx[j] / d[j] * o[j] / 2
            y[j] += dy[j] / d[j] * o[j] / 2
            x[i] -= (dx[j] / d[j] * o[j] / 2).sum()
            y[i] -= (dy[j] / d[j] * o[j] / 2).sum()
        x += (x0 - x) * 0.01
        y += (y0 - y) * 0.01
    return x, y

# 1. Colonne "rayon" (en mètres de carte) : l'AIRE du cercle suit les voix exprimées.
#    La plus grande moughataa a un rayon de 110 km.
...
# 2. Séparez les cercles à partir des centres des moughataas : x, y = separer(...)
...
# 3. Dessinez : p.circle(x=..., y=..., radius=...), couleur selon le candidat en tête, infobulle
...
show(p)`;
  const CHECK_DORLING = `import __main__
_p = __main__._ds_bokeh[-1] if __main__._ds_bokeh else None
_rs = [r for r in (_p.renderers if _p is not None else []) if type(getattr(r, "glyph", None)).__name__ == "Circle"]
_c = globals().get("carte")
_k = _c["rayon"] ** 2 / _c["exprimes"] if _c is not None and "rayon" in _c.columns else None
[(bool(_rs) and len(_rs[0].data_source.data["x"]) == 63, "63 cercles"),
 (_k is not None and _k.std() / _k.mean() < 0.001, "L'aire des cercles, pas leur rayon, suit les voix"),
 (_c is not None and "rayon" in _c.columns and abs(_c["rayon"].max() - 110000) < 1, "Le plus grand cercle : 110 km de rayon")]`;

  const E_CURSEUR = `from bokeh.plotting import figure, show
from bokeh.models import ColumnDataSource, LinearColorMapper, Slider, CustomJS, HoverTool
from bokeh.palettes import Purples256
from bokeh.layouts import column

sante = gpd.read_file("sante_osm.geojson")
wilayas = gpd.read_file("wilayas.geojson").to_crs(32628)
pop = pd.read_csv("population_points.csv")
pop = gpd.GeoDataFrame(pop, geometry=gpd.points_from_xy(pop["lon"], pop["lat"]), crs=4326).to_crs(32628)
pop_w = gpd.sjoin(pop, wilayas[["ADM1_EN", "geometry"]], predicate="within")
soins = sante[sante["amenity"].isin(["hospital", "clinic", "doctors"])].to_crs(32628)
soins = soins[soins.within(wilayas.union_all())]
tot = pop_w.groupby("ADM1_EN")["population"].sum()

legere = wilayas.copy()
legere["geometry"] = legere.geometry.simplify(1000)
xs, ys = formes(legere)
donnees = dict(xs=xs, ys=ys, wilaya=legere["ADM1_EN"])

# 1. Pour chaque rayon de 5, 10, 15, 20, 25, 30 km : une colonne "r5", "r10", … avec la part (%) de chaque wilaya
#    (dans l'ordre de legere). Astuce : .reindex(legere["ADM1_EN"]).fillna(0)
...
donnees["part"] = donnees["r5"]
source = ColumnDataSource(donnees)
mapper = LinearColorMapper(palette=Purples256[::-1], low=0, high=100)
p = figure(width=600, height=600, match_aspect=True, tools="pan,wheel_zoom,reset", x_axis_location=None, y_axis_location=None,
           title="Part de la population près d’un lieu de soins cartographié", tooltips=[("Wilaya", "@wilaya"), ("Part", "@part{0.0} %")])
p.grid.visible = False
p.patches("xs", "ys", source=source, fill_color={"field": "part", "transform": mapper}, line_color="white")

# 2. Un curseur de 5 à 30 km, pas de 5, branché sur un CustomJS
curseur = ...
...
show(column(curseur, p))`;
  const CHECK_CURSEUR = `import __main__
from bokeh.models import Slider
_l = __main__._ds_bokeh[-1] if __main__._ds_bokeh else None
_sl = list(_l.select({"type": Slider})) if _l is not None else []
_cb = [c for s in _sl for cbs in s.js_property_callbacks.values() for c in cbs]
_code = _cb[0].code if _cb else ""
_d = globals().get("donnees", {})
_i = list(_d.get("wilaya", [])).index("Nouakchott Sud") if "wilaya" in _d else 0
[(all(("r%d" % k) in _d for k in (5, 10, 15, 20, 25, 30)), "Six colonnes, de r5 à r30"),
 ("r5" in _d and abs(list(_d["r5"])[_i] - 72.2) < 1.5, "r5 : Nouakchott Sud à environ 72 %"),
 ("r30" in _d and list(_d["r30"])[_i] > 99, "r30 : Nouakchott Sud presque entière"),
 (bool(_cb) and "cb_obj.value" in _code and "..." not in _code, "Le curseur change la colonne affichée")]`;

  const EX_BOKEH = `from bokeh.plotting import figure, show
from bokeh.models import ColumnDataSource, LinearColorMapper, ColorBar, HoverTool
from bokeh.palettes import Purples256

wil = gpd.read_file("wilayas.geojson").to_crs(8857)
wil = wil.merge(pd.read_csv("bac_2025_wilayas.csv"), left_on="ADM1_EN", right_on="wilaya")
wil["geometry"] = wil.geometry.simplify(1000)
xs, ys = formes(wil)

# 1. La source : les colonnes que Bokeh peut lire (les x et les y de chaque forme, et les valeurs)
source = ColumnDataSource(dict(xs=xs, ys=ys, nom=wil["wilaya"], taux=wil["taux"]))
# 2. La figure : un cadre vide, avec ses outils
p = figure(width=520, height=520, match_aspect=True, title="Bac 2025 : le taux de réussite par wilaya",
           tools="pan,wheel_zoom,reset", x_axis_location=None, y_axis_location=None)
p.grid.visible = False
# 3. Le passage des valeurs aux couleurs
mapper = LinearColorMapper(palette=Purples256[::-1], low=0, high=wil["taux"].max())
# 4. Les formes, colorées par une colonne de la source
p.patches("xs", "ys", source=source, fill_color={"field": "taux", "transform": mapper}, line_color="white")
# 5. L'infobulle : "@colonne" lit la source, le format des nombres est entre accolades
p.add_tools(HoverTool(tooltips=[("Wilaya", "@nom"), ("Réussite", "@taux{0.0} %")]))
# 6. La légende
p.add_layout(ColorBar(color_mapper=mapper, title="%"), "right")
show(p)`;
  const EX_MENU = `from bokeh.plotting import figure, show
from bokeh.models import ColumnDataSource, Select, CustomJS
from bokeh.layouts import column

bac = pd.read_csv("bac_2025_wilayas.csv").sort_values("taux")
source = ColumnDataSource(dict(wilaya=bac["wilaya"], taux=bac["taux"], candidats=bac["candidats"], valeur=bac["taux"]))

p = figure(y_range=list(bac["wilaya"]), width=560, height=380, title="Bac 2025", toolbar_location=None)
p.hbar(y="wilaya", right="valeur", source=source, height=0.7, color="#8a4f8c")

menu = Select(title="Afficher", value="taux", options=["taux", "candidats"])
# Ce code tourne dans le navigateur, en JavaScript : Python n'est plus là pour répondre
menu.js_on_change("value", CustomJS(args=dict(source=source), code="""
    source.data.valeur = source.data[cb_obj.value];   // la colonne affichée prend les valeurs choisies
    source.change.emit();                             // on prévient Bokeh : redessine
"""))
show(column(menu, p))`;

  const PART2 = [
    {
      id: 'correct-map', title: 'Correct the Map, en quelques lignes', minutes: 20,
      partHead: {k: 'Partie 2', t: 'La même carte, en code : GeoPandas et Bokeh'},
      lead: 'Le 4 septembre 2026, l’ONU a encouragé l’abandon de Mercator. Ne la croyez pas sur parole : mesurez.',
      parts: [
        {note: '<b>Cette partie se fait ici, dans la page</b> : Python, GeoPandas et Bokeh tournent dans votre navigateur, sans installation. La première exécution prend environ 30 s.', mascot: 'dog'},
        {cell: {id: 't3-data', code: SETUP, setup: true, label: 'Les fichiers de la partie 2'}},
        {phase: 'Prédire', ai: 'off'},
        {q: 'pred-afrique'},
        {phase: 'Construire', ai: 'hint'},
        {p: 'Une même forme, deux surfaces : tout dépend du SCR dans lequel on la mesure.'},
        {cell: {id: 't3-monde', code: E_MONDE, check: CHECK_MONDE}},
        {p: 'Et chez nous ? Mercator gonfle-t-il toutes les wilayas de la même façon ?'},
        {cell: {id: 't3-gonfle', code: E_GONFLE, check: CHECK_GONFLE}},
        {phase: 'Justifier', ai: 'on'},
        {ask: 'Mercator gonfle Tiris Zemmour de 21 % et Guidimagha de 8 %. Sur une carte en aplats du pays, en quoi est-ce gênant ? Et pour un tampon de 5 km à Néma, quelle projection prendriez-vous, et pourquoi ?'}
      ]
    },
    {
      id: 'elections', title: 'Présidentielle 2024 : du tableau à la carte', minutes: 25,
      lead: 'Le fichier des résultats par commune, joint aux moughataas. Deux pièges réels vous attendent.',
      parts: [
        {phase: 'Prédire', ai: 'off'},
        {q: 'pred-inscrits'},
        {phase: 'Construire', ai: 'hint'},
        {cell: {id: 't3-agg', code: E_AGG, check: CHECK_AGG}},
        {cell: {id: 't3-join', code: E_JOIN, check: CHECK_JOIN}},
        {cell: {id: 't3-carte', code: E_CARTE, check: CHECK_CARTE}},
        {phase: 'Justifier', ai: 'on'},
        {ask: 'Les 14 217 voix exprimées à l’étranger n’ont pas de forme sur votre carte. Faut-il les ignorer ? Écrivez la phrase qui l’annonce au lecteur. Et pourquoi une carte de la <b>participation</b> en aplats est-elle défendable, là où une carte du <b>nombre de voix</b> ne le serait pas ?'}
      ]
    },
    {
      id: 'chaine', title: 'La partie 1, en douze lignes', minutes: 20,
      lead: 'Tampon, sélection, comptage : refaites l’analyse de QGIS en code. Si tout va bien, vous retrouvez le même chiffre.',
      parts: [
        {phase: 'Prédire', ai: 'off'},
        {ask: 'Votre collègue demande : « et avec les pharmacies ? et à 10 km ? ». Combien de clics dans QGIS ? Et dans un script ?'},
        {phase: 'Construire', ai: 'hint'},
        {cell: {id: 't3-chaine', code: E_CHAINE, check: CHECK_CHAINE}},
        {p: 'Maintenant, répondez à votre collègue.'},
        {cell: {id: 't3-acces', code: E_ACCES, check: CHECK_ACCES}},
        {phase: 'Justifier', ai: 'on'},
        {ask: 'Dans QGIS, le tableau de l’exercice « Changer la définition » donne 38,7 % pour tous les points à 5 km, et votre fonction environ 38 %. Lequel est faux ? Trouvez ce qui diffère entre les deux calculs. Puis : quand choisir QGIS, quand choisir un script ?'}
      ]
    },
    {
      id: 'bokeh-carte', title: 'Une carte qu’on survole', minutes: 20,
      lead: 'Bokeh dessine dans le navigateur : le lecteur survole, zoome, explore. Lisez ses six briques sur le bac, puis reprenez-les sur le vote.',
      parts: [
        {cell: {id: 't3-exbokeh', code: EX_BOKEH, label: 'Exemple : le bac par wilaya. Exécutez, survolez, zoomez'}},
        {phase: 'Prédire', ai: 'off'},
        {q: 'pred-simplifier'},
        {phase: 'Construire', ai: 'hint'},
        {cell: {id: 't3-bokeh', code: E_BOKEH, check: CHECK_BOKEH}},
        {phase: 'Justifier', ai: 'on'},
        {ask: 'Que voit-on sans survoler ? Qu’est-ce que l’infobulle ajoute ? Si le survol disparaissait (une impression, un PDF), que faudrait-il écrire sur la carte ?'}
      ]
    },
    {
      id: 'bokeh-menu', title: 'Un menu, deux vues', minutes: 20, extra: true,
      lead: 'Choisissez un candidat : la carte change. Sélectionnez une moughataa : le nuage de points répond.',
      parts: [
        {p: 'Un widget change une colonne de la source, et le graphique suit. Deux graphiques sur la même source partagent aussi leur sélection.'},
        {cell: {id: 't3-exmenu', code: EX_MENU, label: 'Exemple : un menu sur le bac'}},
        {phase: 'Construire', ai: 'hint'},
        {cell: {id: 't3-menu', code: E_MENU, check: CHECK_MENU}},
        {phase: 'Justifier', ai: 'on'},
        {ask: 'Passez d’un candidat à l’autre. Dans le nuage, sélectionnez les moughataas les plus à droite : où sont-elles sur la carte ? Qu’est-ce que cette seconde vue montre que la carte ne peut pas montrer ?'}
      ]
    },
    {
      id: 'surface-voix', title: '98 % de la carte, 56 % des voix', minutes: 20, extra: true,
      lead: 'Le CM l’annonçait : la géographie ment sur le poids des gens. Voici la preuve, puis le remède.',
      parts: [
        {cell: {id: 't3-surface', code: E_SURFACE, check: CHECK_SURFACE}},
        {p: 'Le remède : un cartogramme de Dorling, avec les voix pour surface.'},
        {cell: {id: 't3-dorling', code: E_DORLING, check: CHECK_DORLING}},
        {ask: 'Comparez avec la carte classique des moughataas. Laquelle choisiriez-vous pour répondre à « qui a gagné où ? » Et que perd le cartogramme ?'}
      ]
    },
    {
      id: 'curseur-rayon', title: 'Un curseur pour le rayon', minutes: 15, extra: true,
      lead: 'Dans QGIS, chaque rayon demandait une nouvelle analyse. Ici, le lecteur tire un curseur.',
      parts: [
        {cell: {id: 't3-curseur', code: E_CURSEUR, check: CHECK_CURSEUR}},
        {ask: 'Tirez jusqu’à 30 km. Quelles wilayas ne bougent jamais ? Est-ce une conclusion sur la santé, ou sur le fichier ?'}
      ]
    }
  ];

  T.exercises.push(...PART2);
  Object.assign(T.questions, {
    'pred-afrique': {
      prompt: 'Sur une carte en Mercator, le Groenland et l’Afrique paraissent à peu près de même taille. L’Afrique est en réalité plus grande de combien ?',
      options: [
        {t: 'Environ 2 fois', why: 'Bien plus. Mesurez-le ci-dessous.'},
        {t: 'Environ 5 fois', why: 'Encore plus. Mesurez-le ci-dessous.'},
        {t: 'Environ 14 fois', ok: true, why: 'Environ 30 millions de km² contre 2,2 millions. Vérifions-le en code.'}
      ]
    },
    'pred-inscrits': {
      prompt: 'Le fichier a <b>une ligne par commune et par candidat</b>. Chaque ligne répète le nombre d’inscrits de la commune. Si vous faites la somme de <code>registered_voters</code> :',
      options: [
        {t: 'Vous obtenez 7 fois trop d’inscrits, car il y a 7 candidats', ok: true, why: 'Et une participation 7 fois trop petite : 7,3 % au lieu de 55,4 %. Le même piège se cache dans les nuls et les neutres.'},
        {t: 'Vous obtenez le bon total', why: 'Chaque commune apparaît une fois par candidat : ses inscrits sont comptés plusieurs fois.'},
        {t: 'Python refuse', why: 'Non, et c’est bien le danger : pas d’erreur, juste un chiffre faux.'}
      ]
    },
    'pred-simplifier': {
      prompt: 'Les contours des moughataas ont des dizaines de milliers de points. Votre carte Bokeh les envoie tous au navigateur. Que se passe-t-il si on les simplifie à 1 km près, sur une carte du pays ?',
      options: [
        {t: 'Le lecteur ne voit presque pas la différence, et la carte devient bien plus légère', ok: true, why: 'À cette échelle, 1 km fait moins d’un pixel. La généralisation du CM n’est pas qu’un choix de lecture : elle sert aussi la vitesse.'},
        {t: 'Les chiffres de la carte changent', why: 'Les valeurs viennent du tableau, pas du tracé. Seule la forme dessinée change.'},
        {t: 'Il faut garder tous les points pour rester honnête', why: 'Aucune carte ne garde tout : c’est toujours une question d’échelle.'}
      ]
    }
  });
})();
