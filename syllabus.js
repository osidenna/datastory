/* Structure du site : 5 CM et 5 TD de 1 h 30 (format 2025-2026). Les 6 TP sont gérés à part, hors du site.
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
    {id: 'td1', type: 'TD', n: 1, title: 'Matplotlib, Seaborn, Altair', status: 'soon',
      gist: 'Un même graphique, trois bibliothèques, trois philosophies.', from: 'td1.ipynb'},
    {id: 'cm2', type: 'CM', n: 2, title: 'Formes de visualisation et principes d’efficacité', status: 'soon',
      gist: 'Choisir le bon graphique, data-ink, Gestalt, couleur.', from: 'lecture2.pdf'},
    {id: 'td2', type: 'TD', n: 2, title: 'Visualisations interactives avec Bokeh', status: 'soon',
      gist: 'Survol, zoom, curseurs : l’interaction au service du récit.', from: 'bokeh.ipynb'},
    {id: 'cm3', type: 'CM', n: 3, title: 'Le SIG comme outil de storytelling', status: 'soon',
      gist: 'Vecteurs, rasters, projections, cartogrammes.', from: 'cm3.pdf'},
    {id: 'td3', type: 'TD', n: 3, title: 'Cartes électorales avec GeoPandas', status: 'soon',
      gist: 'Joindre résultats et moughataas, cartes choroplèthes.', from: 'GeoPandas.ipynb'},
    {id: 'td4', type: 'TD', n: 4, title: 'Cartographier la Mauritanie avec QGIS', status: 'soon',
      gist: 'Population, relief, bâtiments et santé en couches.', from: 'td3-intro.pdf, td3.zip'},
    {id: 'cm4', type: 'CM', n: 4, title: 'Dashboards : approche Python', status: 'soon',
      gist: 'État, logique, vues ; vues liées ; théâtre de l’interactivité.', from: 'cm4.pptx'},
    {id: 'td5', type: 'TD', n: 5, title: 'Construire un petit dashboard', status: 'soon',
      gist: 'Trois paramètres directeurs, des vues liées.', from: 'nouveau'},
    {id: 'cm5', type: 'CM', n: 5, title: 'Outils BI, données qualitatives, crowdsourcing', status: 'soon',
      gist: 'Ce que le « no-code » cache, et quand il suffit.', from: 'annoncé dans cm4.pptx'}
  ]
};
