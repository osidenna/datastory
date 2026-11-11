/* TD 4 (id td-dash) · Un dashboard, sans code puis en code
   Données : data/restaurants.csv (639 restaurants et cafés de Nouakchott, fiches publiques Google Maps,
   scripts/build-data-restos.py), déjà dans le kit du TD 3. Partie 1 : Looker Studio (navigateur, compte Google).
   Partie 2 : React + D3 dans la page ou dans le kit (VS Code + Live Server), cellules JavaScript avec d3, React,
   ReactDOM et un div `chart`. Corrigé enseignant : td-dash-solutions.js (jamais publié). */
(function () {
  const Q = (c, s) => [...c.querySelectorAll(s)];
  const KIT = 'assets/td-d3/kit/td3-kit.zip';
  const LS = 'https://lookerstudio.google.com/';

  const START_ETAT = `const restos = (await d3.csv("data/restaurants.csv", d3.autoType)).filter(d => d.note != null);
const h = React.createElement;
const {useState} = React;
const TYPES = ["restaurant", "café", "pâtisserie", "jus", "inconnu"];

function Chiffres({lieux}) {
  // 2. À vous : une deuxième tuile, la note moyenne des lieux (d3.mean), arrondie à 2 décimales
  return h("div", {style: {display: "flex", gap: "12px"}},
    h("p", null, h("b", null, lieux.length), " lieux"));
}
function Types({lieux, type, onChoisir}) {
  const x = d3.scaleLinear().domain([0, 400]).range([0, 380]);
  return h("svg", {viewBox: "0 0 560 190", fontSize: 12, fontFamily: "sans-serif"},
    TYPES.map((t, i) => {
      const n = lieux.filter(d => d.type === t).length;
      return h("g", {key: t, transform: "translate(110," + (10 + i * 34) + ")", style: {cursor: "pointer"},
        onClick: () => onChoisir(t === type ? null : t)},
        h("text", {x: -8, y: 16, textAnchor: "end", fontWeight: t === type ? 700 : 400}, t),
        h("rect", {height: 22, width: x(n), fill: !type || t === type ? "#8a4f8c" : "#d9dce2"}),
        h("text", {x: x(n) + 6, y: 16}, n));
    }));
}
function TableauDeBord() {
  const [type, setType] = useState(null);
  const minAvis = 1; // 1. À vous : un état, réglé par un curseur <input type="range"> de 1 à 100
  // LOGIQUE : un seul calcul, lu par toutes les vues
  const lieux = restos.filter(d => d.nb_avis >= minAvis && (!type || d.type === type));
  return h("div", null,
    h("p", null, "Type : " + (type || "tous") + " · au moins " + minAvis + " avis"),
    h(Chiffres, {lieux}),
    h(Types, {lieux: restos.filter(d => d.nb_avis >= minAvis), type, onChoisir: setType}));
}
ReactDOM.createRoot(chart).render(h(TableauDeBord));`;

  const START_LIER = `const restos = (await d3.csv("data/restaurants.csv", d3.autoType)).filter(d => d.note != null && d.nb_avis >= 20);
const h = React.createElement;
const {useState} = React;
const LX = Math.cos(18.08 * Math.PI / 180); // même échelle en x et en y
const x = d3.scaleLinear().domain(d3.extent(restos, d => d.lng * LX)).range([10, 330]);
const y = d3.scaleLinear().domain(d3.extent(restos, d => d.lat)).range([290, 10]);

function Carte({survol, onSurvol}) {
  return h("svg", {viewBox: "0 0 340 300"},
    restos.map(d => h("circle", {key: d.nom + d.lat, cx: x(d.lng * LX), cy: y(d.lat),
      r: d === survol ? 7 : 4, fill: d === survol ? "#1d2433" : "#8a4f8c", fillOpacity: 0.6,
      onPointerEnter: () => onSurvol(d), onPointerLeave: () => onSurvol(null)})));
}
function Classement({survol, onSurvol}) {
  const top = restos.slice().sort((a, b) => b.note - a.note || b.nb_avis - a.nb_avis).slice(0, 8);
  // 2. À vous : surligner la ligne survolée, et appeler onSurvol au survol d'une ligne
  return h("ol", null, top.map(d => h("li", {key: d.nom + d.lat},
    d.nom + " · " + d.note + " · " + d.nb_avis + " avis")));
}
function TableauDeBord() {
  // 1. À vous : le survol doit vivre ICI, partagé par la carte et le classement
  return h("div", {style: {display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"}},
    h(Carte, {survol: null, onSurvol: () => {}}),
    h(Classement, {survol: null, onSurvol: () => {}}));
}
ReactDOM.createRoot(chart).render(h(TableauDeBord));`;

  window.DS_TD = window.DS_TD || {};
  window.DS_TD['td-dash'] = {
    id: 'td-dash',
    title: 'Un dashboard, sans code puis en code',
    lede: 'Un lecteur, trois questions, deux chemins. Construisez le même tableau de bord sur les restaurants de Nouakchott, d’abord dans Looker Studio, puis en React + D3. Comparez ce que chaque outil a décidé pour vous.',
    model: '<span>Lecteur</span><i>→</i><span>Questions</span><i>→</i><span>État</span><i>→</i><span>Logique</span><i>→</i><span>Vues</span>',
    howto: '<div class="d4-route"><p class="d4-tag">Votre parcours</p><ol><li><b>Poser les questions</b><span>Un lecteur, trois questions directrices.</span></li><li><b>Sans code</b><span>Looker Studio : importer, vérifier, publier un lien.</span></li><li><b>En code</b><span>React + D3 : un état, des vues liées. Puis comparer.</span></li></ol></div>' +
      '<div class="mascot-note mascot-note-dog">' + window.Mascots.mascot('dog') + '<div class="mascot-note-text">' +
      '<p><b>Deux outils, un seul fichier.</b> Partie 1 : un navigateur et un compte Google. Partie 2 : le kit du TD 3, dans VS Code avec Live Server ; chaque cellule de cette page s’y colle telle quelle. Vérifiez ici avec <b>Exécuter</b>.</p></div></div>' +
      '<p class="small">Données : fiches publiques Google Maps de 639 restaurants et cafés de Nouakchott (collecte nettoyée du 7 novembre 2026 ; ni téléphone, ni adresse, ni texte d’avis) : <a href="data/restaurants.csv" download>restaurants.csv</a>. Kit : <a href="' + KIT + '" download>td3-kit.zip</a>.</p>' +
      '<p class="small">Usage de l’IA : <span class="ai-badge is-hint">IA : indices seulement</span> <span class="ai-badge is-on">IA autorisée</span></p>',
    exercises: [
      {
        id: 'lecteur', title: 'Un lecteur, trois questions',
        lead: 'Avant tout outil : pour qui est ce tableau de bord, et qu’a-t-il besoin de savoir ?',
        parts: [
          {phase: 'Choisir', ai: 'hint'},
          {steps: [
            'Choisissez un lecteur : une personne qui veut ouvrir un café, un guide pour visiteurs, un service municipal… ou le vôtre.',
            'Écrivez <b>trois questions directrices</b>. Chacune appelle une décision (où, combien, lequel).',
            'Pour chaque question, notez la vue qui y répond : un chiffre clé, des barres, une carte, un classement.'
          ]},
          {html: '<table class="data d4-cmp"><thead><tr><th>Question directrice</th><th>La vue qui y répond</th></tr></thead><tbody><tr><td>Exemple : combien de cafés ont une note ≥ 4,5 avec au moins 20 avis ?</td><td>Un chiffre clé</td></tr><tr><td>…</td><td>…</td></tr><tr><td>…</td><td>…</td></tr></tbody></table>'},
          {note: 'Une question qui commence par « montrer toutes les… » n’est pas une question directrice : c’est un inventaire.', mascot: 'ghost'},
          {tick: ['J’ai un lecteur précis.', 'J’ai trois questions, chacune liée à une vue.']}
        ]
      },
      {
        id: 'import', title: 'Importer le fichier dans Looker Studio',
        lead: 'Looker Studio est gratuit, dans le navigateur, avec un compte Google. Il range chaque colonne en <b>dimension</b> ou <b>métrique</b> : vérifiez ses choix.',
        parts: [
          {phase: 'Importer'},
          {steps: [
            'Téléchargez <a href="data/restaurants.csv" download>restaurants.csv</a>.',
            {t: 'Ouvrez <a href="' + LS + '" target="_blank" rel="noopener">Looker Studio</a>, puis créez un rapport vide.', menu: 'Créer › Rapport'},
            {t: 'Choisissez le connecteur d’import de fichier, déposez le CSV, puis ajoutez-le au rapport.', menu: 'Importation de fichiers', en: 'File Upload'},
            {t: 'Ouvrez la source de données pour voir les champs, leur type et leur agrégation par défaut.', menu: 'Ressource › Gérer les sources de données ajoutées › Modifier', en: 'Resource › Manage added data sources'}
          ]},
          {phase: 'Vérifier'},
          {steps: [
            '<code>note</code> : type Nombre ; changez l’agrégation par défaut de <b>Somme</b> à <b>Moyenne</b>.',
            '<code>nb_avis</code> : type Nombre, agrégation Somme (le total des avis a un sens).',
            '<code>lat</code> et <code>lng</code> : ce ne sont pas des métriques. Ajoutez un champ calculé <code>position</code> = <code>CONCAT(CAST(lat AS TEXT), ",", CAST(lng AS TEXT))</code>, de type <b>Géo › Latitude, longitude</b>.',
            '<code>ville</code> : regardez ses valeurs. Combien d’écritures de Nouakchott ? Ne l’utilisez pas comme filtre.'
          ]},
          {note: 'Les noms des menus changent parfois d’une version à l’autre de Looker Studio : cherchez le mot en anglais indiqué si besoin.', mascot: 'dog'},
          {tick: ['La source est ajoutée au rapport.', '<code>note</code> est en Moyenne.', 'Le champ <code>position</code> est de type géographique.']}
        ]
      },
      {
        id: 'vues', title: 'Trois vues, un filtre, un lien',
        lead: 'Construisez les vues de vos trois questions, et rien d’autre.',
        parts: [
          {phase: 'Construire', ai: 'hint'},
          {steps: [
            {t: 'Une fiche d’évaluation pour votre chiffre clé (par exemple le nombre de lieux).', menu: 'Ajouter un graphique › Fiche d’évaluation', en: 'Scorecard'},
            {t: 'Un graphique à barres : dimension <code>type</code>, métrique <code>note</code> (Moyenne) ; ajoutez <code>Nombre d’enregistrements</code> en info-bulle ou en deuxième métrique.', menu: 'Ajouter un graphique › Barres', en: 'Bar chart'},
            {t: 'Une carte à bulles sur <code>position</code>, taille = <code>nb_avis</code>.', menu: 'Ajouter un graphique › Google Maps › Carte à bulles', en: 'Bubble map'},
            {t: 'Un filtre à l’échelle du rapport : <code>nb_avis</code> ≥ 20. Écrivez ce seuil dans un texte visible sous le titre.', menu: 'Ressource › Gérer les filtres', en: 'Filters'},
            {t: 'Une commande de liste déroulante sur <code>type</code>.', menu: 'Ajouter une commande › Liste déroulante', en: 'Drop-down list'},
            'Un titre qui donne la réponse, pas le sujet : « Sur 9 cafés qui ont au moins 20 avis, 3 seulement sont notés 4,5 ou plus », pas « Tableau de bord des restaurants ».'
          ]},
          {note: 'Disposez en <b>Z</b> : le chiffre clé en haut à gauche (l’œil y commence), la carte et les barres au milieu, le détail en bas.', mascot: 'lion'},
          {phase: 'Partager'},
          {steps: [
            {t: 'Partagez en lecture avec toute personne disposant du lien. Copiez le lien.', menu: 'Partager › Gérer l’accès', en: 'Share › Manage access'},
            'Ouvrez le lien dans une fenêtre privée : le rapport s’affiche-t-il sans votre compte ?'
          ]},
          {ask: 'Changez une fois l’agrégation de <code>note</code> en Somme dans le graphique à barres. Que semble dire le graphique ? Revenez à Moyenne.'},
          {tick: ['Trois vues, une par question.', 'Le seuil de 20 avis est écrit sur le rapport.', 'Le lien s’ouvre en fenêtre privée.']}
        ]
      },
      {
        id: 'etat', title: 'En code : un état, une logique, des vues',
        lead: 'Le même tableau de bord en React + D3. Le type se choisit déjà d’un clic. Ajoutez le seuil d’avis comme un <b>état</b>, et la note moyenne comme un chiffre clé.',
        parts: [
          {p: 'Même kit que le TD 3 : collez la cellule dans <code>main.js</code> sous la ligne <code>const chart = …</code>, enregistrez, regardez le navigateur. Pour vérifier, recollez ici et cliquez sur <b>Exécuter</b>.'},
          {phase: 'Prédire'},
          {ask: 'Le code contient <code>const minAvis = 1</code>. Si vous ajoutez un curseur sans état, la page changera-t-elle quand vous le bougez ?'},
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            'Dans <code>TableauDeBord</code>, remplacez la constante par <code>useState(20)</code>.',
            'Ajoutez un <code>h("input", {type: "range", min: 1, max: 100, value: minAvis, onChange: e => setMinAvis(+e.target.value)})</code>.',
            'Dans <code>Chiffres</code>, ajoutez une tuile « Note moyenne » : <code>d3.mean(lieux, d => d.note)</code>, arrondie avec <code>.toFixed(2)</code>.',
            'Cliquez sur « café », poussez le curseur : les deux vues suivent-elles le même état ?'
          ]},
          {cell: {id: 'd-etat', js: true, wait: 300, code: START_ETAT,
            check: (c, code) => [
              [/\[\s*minAvis\s*,\s*setMinAvis\s*\]\s*=\s*useState\s*\(/.test(code), 'Le seuil d’avis est un état'],
              [Q(c, 'input[type=range]').length >= 1, 'Un curseur'],
              [Q(c, 'svg rect').length >= 5, 'Cinq barres de type'],
              [/d3\.mean\s*\(/.test(code) && Q(c, 'p, div, span, b').some(e => /\b[1-5],\d{2}\b|\b[1-5]\.\d{2}\b/.test(e.textContent)), 'Une note moyenne à deux décimales'],
              [!/d3\.select|\.append\(/.test(code), 'React dessine : ni d3.select, ni .append']
            ]}},
          {details: 'Un indice ?', body: '<p><code>const [minAvis, setMinAvis] = useState(20);</code> remplace la constante. Le curseur va dans le <code>h("div", null, …)</code> de <code>TableauDeBord</code>, avant <code>Chiffres</code>.</p>'}
        ]
      },
      {
        id: 'lier', title: 'Relier la carte et le classement',
        lead: 'Ce que l’outil sans code fait mal : survoler un lieu dans le classement et le voir s’allumer sur la carte. Le survol doit vivre dans le parent.',
        parts: [
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            'Dans <code>TableauDeBord</code> : <code>const [survol, setSurvol] = useState(null)</code>, puis passez <code>survol</code> et <code>setSurvol</code> aux deux vues.',
            'Dans <code>Classement</code> : <code>onPointerEnter</code> et <code>onPointerLeave</code> sur chaque <code>li</code> ; fond jaune (<code>#f6cd4c</code>) pour la ligne survolée.',
            'Survolez une ligne : le point grossit. Survolez un point : la ligne s’allume.'
          ]},
          {cell: {id: 'd-lier', js: true, wait: 300, code: START_LIER,
            check: (c, code) => [
              [/\[\s*survol\s*,\s*setSurvol\s*\]\s*=\s*useState\s*\(/.test(code), 'Le survol est un état du parent'],
              [(code.match(/onSurvol\s*:\s*setSurvol/g) || []).length >= 2, 'Les deux vues reçoivent setSurvol'],
              [Q(c, 'circle').length >= 40, 'Les lieux sur la carte'],
              [Q(c, 'li').length === 8, 'Huit lignes au classement'],
              [/onPointerEnter/.test(code.slice(code.indexOf('function Classement'))), 'Le classement réagit au survol']
            ]}},
          {note: 'C’est le schéma du CM 4 et du CM 5 : les vues ne se parlent jamais ; elles lisent le même état.', mascot: 'lion'}
        ]
      },
      {
        id: 'comparer', title: 'Comparer les deux chemins, rendre',
        lead: 'Même lecteur, mêmes questions : qu’avez-vous gagné et perdu avec chaque outil ?',
        parts: [
          {html: '<table class="data d4-cmp"><thead><tr><th>Critère</th><th>Looker Studio</th><th>React + D3</th></tr></thead><tbody>' +
            ['Temps pour la première vue', 'Ce que l’outil a choisi pour vous (agrégation, couleurs, ordre)', 'Ce qui était impossible', 'Comment un collègue met à jour les données'].map(t => '<tr><td>' + t + '</td><td>…</td><td>…</td></tr>').join('') + '</tbody></table>'},
          {phase: 'Relire'},
          {tick: [
            'Le chiffre clé est en haut à gauche, le plus grand, avec son contexte (« sur 9 cafés », « contre … restaurants »).',
            'Une couleur par type, la même dans toutes les vues ; un seul accent pour la réponse.',
            'Carte à bulles : l’aire suit <code>nb_avis</code> (vérifiez le réglage de taille), avec une légende de taille.',
            'Étiquettes directes, format français (4,16), unités écrites.',
            'Blocs alignés, 5 à 7 vues au plus, de l’air autour du chiffre clé.',
            'Date des données, source et seuil de 20 avis écrits sur la page.'
          ]},
          {phase: 'Rendre'},
          {steps: [
            'Sur Classroom : le <b>lien</b> Looker Studio, et <code>td4-NOM.zip</code> (votre dossier du kit avec <code>main.js</code>).',
            'Dans le message : vos trois questions et le tableau ci-dessus rempli.'
          ]},
          {tick: ['Lien Looker Studio ouvert en fenêtre privée.', 'Zip du kit avec main.js.', 'Le tableau de comparaison rempli.']}
        ]
      },
      {
        id: 'annoter', title: 'Un titre qui répond',
        lead: 'Dans votre version React, le titre doit changer avec l’état et donner la réponse.',
        parts: [
          {phase: 'Faire', ai: 'on'},
          {steps: [
            'Dans <code>TableauDeBord</code>, calculez le nombre de lieux à 4,5 ou plus parmi <code>lieux</code>.',
            'Affichez un titre qui le dit : « Cafés, au moins 20 avis : 3 lieux à 4,5 ou plus ».',
            'Avec une IA : demandez-lui de critiquer votre tableau de bord avec vos trois questions comme seule consigne. Que propose-t-elle de retirer ?'
          ]}
        ]
      }
    ],
    questions: {}
  };
  const td = window.DS_TD['td-dash'];
  const byId = Object.fromEntries(td.exercises.map(ex => [ex.id, ex]));
  byId.lecteur.partHead = {k: 'Avant de commencer', t: 'Le lecteur et ses questions'};
  byId.import.partHead = {k: 'Partie 1', t: 'Sans code : Looker Studio'};
  byId.etat.partHead = {k: 'Partie 2', t: 'En code : React + D3'};
  byId.annoter.partHead = {k: 'Atelier complémentaire', t: 'Pour aller plus loin'};
  byId.annoter.extra = true;
})();
