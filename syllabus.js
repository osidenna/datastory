/* Structure du site : 5 CM et 4 TD de 1 h 30, plus un TD extra (Bokeh, non fait en séance, n: 'extra'). Les 6 TP sont gérés à part, hors du site.
   Les id restent ceux des fichiers : td3 est affiché TD 2, td2 est affiché TD extra.
   « from » = support de l'an dernier dont la séance est tirée. status : 'ready' | 'soon'. */
window.DS_SYLLABUS = {
  title: 'Data storytelling et communication des résultats',
  short: 'Data storytelling',
  edition: '2026–2027',
  program: 'DEML',
  teacher: 'Oumoukelthoum Sidenna',
  sessions: [
    {id: 'cm1', type: 'CM', n: 1, title: 'Principes du data storytelling', status: 'ready',
      gist: 'Données, visualisation, narration : les trois piliers.', from: 'lecture1.pdf'},
    {id: 'td1', type: 'TD', n: 1, title: 'Matplotlib, Seaborn, Altair', status: 'ready',
      gist: 'Un même graphique, trois bibliothèques, trois philosophies.', from: 'td1.ipynb'},
    {id: 'cm2', type: 'CM', n: 2, title: 'Formes de visualisation et principes d’efficacité', status: 'ready',
      gist: 'Choisir le bon graphique, data-ink, Gestalt, couleur.', from: 'lecture2.pdf'},
    {id: 'cm3', type: 'CM', n: 3, title: 'Le SIG comme outil de storytelling', status: 'soon',
      gist: 'Vecteurs, rasters, projections, composition, cartogrammes.', from: 'cm3.pdf'},
    {id: 'td3', type: 'TD', n: 2, title: 'Raconter avec une carte : QGIS, GeoPandas, Bokeh', status: 'soon',
      gist: 'Partie 1 : couches, jointure, tampon, mise en page dans QGIS. Partie 2 : la même chaîne en code, résultats électoraux et carte interactive.', from: 'td3-intro.pdf, td3.zip, GeoPandas.ipynb'},
    {id: 'cm4', type: 'CM', n: 4, title: 'D3.js pour le data storytelling', status: 'soon',
      gist: 'Quand aucune bibliothèque ne raconte ce que vous voulez : le graphique sur mesure pour le web.', from: 'nouveau'},
    {id: 'td-d3', type: 'TD', n: 3, title: 'Un récit en D3.js', status: 'soon',
      gist: 'SVG, échelles, axes, survol : un graphique construit à la main.', from: 'nouveau'},
    {id: 'cm5', type: 'CM', n: 5, title: 'Dashboards : no-code et code', status: 'soon',
      gist: 'État, logique, vues ; ce que le no-code cache, et quand il suffit.', from: 'cm4.pptx'},
    {id: 'td-dash', type: 'TD', n: 4, title: 'Un dashboard, sans code puis en code', status: 'soon',
      gist: 'Trois paramètres directeurs, des vues liées, deux chemins.', from: 'nouveau'},
    {id: 'td2', type: 'TD', n: 'extra', title: 'Visualisations interactives avec Bokeh', status: 'ready',
      gist: 'En plus du programme : survol, zoom, curseurs, à votre rythme.', from: 'bokeh.ipynb'}
  ]
};
