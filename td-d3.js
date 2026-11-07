/* TD 3 (id td-d3) · Un récit en D3.js
   Données : prêts de la bibliothèque Iqraa Ma3i, Nouakchott (Kaggle, CC BY 4.0), agrégats dans data/*.csv
   (scripts/build-data-cm4.py). Les cellules sont du JavaScript exécuté dans la page, avec d3 et un div `chart`.
   Partie 2 : les skills de Yan Holtz (github.com/holtzy/dataviz-skills, MIT), utilisés avec un assistant IA.
   Exercice 1 : préparer VS Code + Live Server ; le kit (assets/td-d3/kit/td3-kit.zip) exécute chaque cellule telle quelle.
   Partie 3 : pictogramme et React (React 18 chargé dans la page, JSX écrit avec React.createElement).
   Partie 4 : sur l'ordinateur des étudiants (VS Code + serveur local), restaurants de Nouakchott (Google Maps,
   scripts/build-data-restos.py → data/restaurants.csv), premier jet IA puis skills inspiration → d3 → roast. */
(function () {
  const A = 'assets/td-d3/';
  const Q = (c, s) => [...c.querySelectorAll(s)];
  const num = (e, a) => parseFloat(e.getAttribute(a) || '0');
  const MAUVE = e => /8a4f8c/i.test(e.getAttribute('fill') || e.style.fill || '') || /rgb\(138, 79, 140\)/.test(e.style.fill || '');
  const SK = 'https://github.com/holtzy/dataviz-skills/blob/main/';
  const PROMPT = 'Voici un graphique (capture jointe) et le code D3 qui le produit. Applique le skill roast-my-chart : décris d’abord le graphique, vérifie toutes les fiches de caveats.md, puis classe les problèmes du plus grave au moins grave. Réponds en français. Ne réécris pas mon code : je corrige moi-même.';

  const K = A + 'kit/td3-kit.zip';
  const P_AVANT = "À partir de data/restaurants.csv, écris avant.js pour un top 10 par note, sans autre critère. D3 v7 est déjà chargé. Sélectionne #chart avec document.querySelector et garde le module compatible avec await.";
  const P_INSPI = "Mon lecteur veut une sélection de restaurants expliquée. Trouve 3 à 5 exemples publiés qui comparent une note et son nombre d’avis ou montrent qui sort d’un filtre. Donne les liens et une idée à reprendre pour chaque exemple.";
  const P_D3 = "Écris apres.js à partir de data/restaurants.csv pour la règle que je viens de définir. D3 v7 est déjà chargé ; utilise #chart. Montre les exclusions, le nombre d’avis et le classement. Ajoute un survol et une transition quand la règle change. N’invente ni avis individuels ni intervalle de confiance.";

  window.DS_TD = window.DS_TD || {};
  window.DS_TD['td-d3'] = {
    id: 'td-d3',
    title: 'Un récit en D3.js',
    lede: 'Survolez et comparez des graphiques sur les prêts d’une bibliothèque, puis construisez une sélection de restaurants que votre lecteur peut vérifier. Les exemples fonctionnent dans la page ; vos cellules se modifient dans VS Code.',
    model: '<span>Données</span><i>→</i><span>Échelles</span><i>→</i><span>Formes</span><i>→</i><span>Axes</span><i>→</i><span>Message</span><i>→</i><span>Relecture</span>',
    howto: '<div class="d4-route"><p class="d4-tag">Votre parcours</p><ol><li><b>Préparer</b><span>VS Code, Live Server, le kit : le navigateur suit votre code.</span></li><li><b>Construire</b><span>Rectangles → échelles → message.</span></li><li><b>Relire</b><span>Corriger deux défauts et justifier.</span></li><li><b>Relier</b><span>Une année, un total et des barres.</span></li><li><b>Restaurants</b><span>Un classement, ses preuves, puis votre règle de sélection.</span></li></ol><p class="small">Objectif : pouvoir expliquer votre code et votre choix visuel. La ligne, le pictogramme et les autres défis sont des ateliers complémentaires.</p></div>' +
      '<div class="mascot-note mascot-note-dog">' + window.Mascots.mascot('dog') + '<div class="mascot-note-text">' +
      '<p><b>Vous écrivez dans VS Code ; cette page donne les consignes et vérifie.</b> Chaque cellule est du JavaScript, avec quatre noms prêts, ici comme dans le kit : <code>d3</code> (D3 v7), <code>chart</code> (le cadre où dessiner), <code>React</code> et <code>ReactDOM</code>. Dans la page, <b>Exécuter</b> affiche le graphique, les <code>console.log</code> et les coches vertes.</p></div></div>' +
      '<p class="small">Données : bibliothèque associative <a href="https://iqraama3i.org/" target="_blank" rel="noopener">Iqraa Ma3i</a>, Nouakchott, janvier 2024 – 17 octobre 2026, anonymisées (<a href="https://www.kaggle.com/datasets/iqramaee/iqra-maee-library-mauritania-20242026" target="_blank" rel="noopener">Kaggle</a>, CC BY 4.0). Fichiers agrégés du TD : ' +
      ['categories.csv', 'prets-mois.csv', 'prets-jour.csv', 'durees.csv'].map(f => '<a href="data/' + f + '" download>' + f + '</a>').join(' · ') + '.</p>' +
      '<p class="small">Restaurants : fiches publiques Google Maps de 639 restaurants et cafés de Nouakchott (fusion de deux collectes, la plus récente le 7 novembre 2026 ; ni téléphone, ni adresse, ni texte d’avis) : <a href="data/restaurants.csv" download>restaurants.csv</a>.</p>' +
      '<p class="small">Usage de l’IA : <span class="ai-badge is-hint">IA : indices seulement</span> <span class="ai-badge is-on">IA autorisée</span></p>',
    exercises: [
      {
        id: 'poste', title: 'Préparer votre poste : VS Code et le navigateur',
        lead: 'Tout le TD s’écrit dans <b>VS Code</b>, le <b>navigateur</b> ouvert à côté : vous enregistrez, la page se recharge, vous voyez le graphique et la console.',
        parts: [
          {phase: 'Installer'},
          {html: '<table class="data d4-install"><thead><tr><th>À installer</th><th>Pour quoi faire</th><th></th></tr></thead><tbody>' +
            '<tr><td><a href="https://code.visualstudio.com/" target="_blank" rel="noopener"><b>VS Code</b></a></td><td>L’éditeur de code.</td><td><span class="d4-req">obligatoire</span></td></tr>' +
            '<tr><td><b>Chrome</b>, <b>Edge</b> ou <b>Firefox</b></td><td>Voir le graphique ; la console (F12) montre vos <code>console.log</code> et les erreurs.</td><td><span class="d4-req">obligatoire</span></td></tr>' +
            '<tr><td>Extension <b>Live Server</b> (Ritwick Dey)</td><td>Ouvre la page sur <code>http://127.0.0.1:5500</code> et la <b>recharge à chaque enregistrement</b>.</td><td><span class="d4-req">obligatoire</span></td></tr>' +
            '<tr><td>Extension <b>Error Lens</b> (Alexander)</td><td>Affiche les erreurs en rouge, sur la ligne même.</td><td><span class="d4-opt">conseillé</span></td></tr>' +
            '<tr><td>Extension <b>Prettier</b> (Prettier)</td><td>Remet le code en forme : clic droit › <i>Mettre en forme le document</i>.</td><td><span class="d4-opt">conseillé</span></td></tr>' +
            '<tr><td>Extension <b>French Language Pack</b> (Microsoft)</td><td>VS Code en français.</td><td><span class="d4-opt">facultatif</span></td></tr>' +
            '<tr><td><a href="https://nodejs.org/" target="_blank" rel="noopener"><b>Node.js</b></a> (version LTS)</td><td>Seulement pour installer les skills avec <code>npx</code> (partie 4, voie B).</td><td><span class="d4-opt">facultatif</span></td></tr>' +
            '</tbody></table>'},
          {p: 'Une extension s’installe dans VS Code : icône <b>Extensions</b> dans la barre de gauche (<b>Ctrl + Maj + X</b>, Mac : <b>Cmd + Maj + X</b>), cherchez son nom, vérifiez l’auteur, <b>Installer</b>. Rien d’autre : D3 et React sont dans le kit, le TD marche sans internet.'},
          {phase: 'Préparer'},
          {html: '<div class="d4-files"><p class="d4-tag">Le kit, une fois dézippé</p><pre class="d4-code">td3-kit/\n├── index.html     <span class="d4-c">la page : charge les bibliothèques, puis votre code</span>\n├── main.js        <span class="d4-c">votre code : le fichier que vous modifiez</span>\n├── style.css\n├── LISEZMOI.txt\n├── lib/           <span class="d4-c">D3 v7.9.0, React 18.3.1</span>\n└── data/          <span class="d4-c">les fichiers du TD, mêmes chemins que dans cette page</span>\n    ├── categories.csv · prets-mois.csv · prets-jour.csv · durees.csv\n    └── restaurants.csv</pre><p><a class="btn" href="' + K + '" download>⬇ Télécharger td3-kit.zip</a></p></div>'},
          {steps: [
            'Téléchargez le kit et <b>dézippez-le</b> (Windows : clic droit › <i>Extraire tout</i>). Ne travaillez pas à l’intérieur du zip.',
            'VS Code › <b>Fichier › Ouvrir le dossier…</b> › <code>td3-kit</code> (le dossier, pas un fichier). Si VS Code demande s’il doit faire confiance aux auteurs, répondez <b>Oui</b>.',
            'Ouvrez <code>main.js</code>, puis cliquez sur <b>Go Live</b>, en bas à droite de VS Code (ou clic droit sur <code>index.html</code> › <i>Open with Live Server</i>). Le navigateur s’ouvre sur <code>http://127.0.0.1:5500</code>.',
            'Placez VS Code à gauche et le navigateur à droite (Windows : <b>touche Windows + ←</b>, puis <b>→</b> ; Mac : survolez le bouton vert de la fenêtre). Dans le navigateur, ouvrez la console : <b>F12</b> (Mac : <b>Cmd + Option + I</b>) › onglet <i>Console</i>.',
            'Vous devez voir « Le kit fonctionne : 639 restaurants » dans la page et <b>« 639 restaurants chargés »</b> dans la console.',
            'Test : dans <code>main.js</code>, changez la phrase, enregistrez (<b>Ctrl + S</b>, Mac : <b>Cmd + S</b>). Sans toucher au navigateur, il se recharge et la phrase change.'
          ]},
          {note: 'Double-cliquer sur <code>index.html</code> ouvre une adresse <code>file:///…</code> : le navigateur bloque alors <code>d3.csv</code> (« CORS » ou « Failed to fetch » dans la console). Passez toujours par <b>Go Live</b>.', mascot: 'ghost'},
          {phase: 'Exécuter le code du TD'},
          {p: 'Chaque cellule de cette page marche aussi dans le kit, <b>telle quelle</b> : <code>d3</code>, <code>chart</code>, <code>React</code> et les fichiers <code>data/…</code> y portent les mêmes noms.'},
          {steps: [
            'Dans la cellule de l’exercice, sélectionnez tout le code (<b>Ctrl + A</b>, Mac : <b>Cmd + A</b>) et copiez-le.',
            'Dans <code>main.js</code>, gardez la ligne <code>const chart = …</code> et collez le code dessous, à la place de la démo. Enregistrez.',
            'Regardez le navigateur : le graphique ; et la console : vos <code>console.log</code> et les erreurs, en rouge, avec le numéro de ligne.',
            'Complétez l’exercice dans VS Code. Pour le faire vérifier, recollez votre code dans la cellule de la page et cliquez sur <b>Exécuter</b> : les coches vertes s’affichent.'
          ]},
          {tick: [
            'VS Code, Live Server et un navigateur sont installés.',
            'Le <b>dossier</b> <code>td3-kit</code> est ouvert dans VS Code.',
            'L’adresse du navigateur commence par <code>http://127.0.0.1</code> ou <code>http://localhost</code>, et la console affiche « 639 restaurants chargés ».',
            'J’enregistre <code>main.js</code> : le navigateur se recharge tout seul.'
          ]},
          {details: 'Ça ne marche pas ?', body: '<table class="data"><tbody>' +
            '<tr><td>Pas de bouton <b>Go Live</b></td><td>Live Server n’est pas installé, ou VS Code doit être relancé : <b>Ctrl + Maj + P</b> › <i>Reload Window</i>.</td></tr>' +
            '<tr><td>Le port 5500 est occupé</td><td>Live Server en prend un autre : lisez l’adresse dans la barre d’état de VS Code.</td></tr>' +
            '<tr><td>Page blanche</td><td>Console (F12) : la ligne rouge donne le fichier et le numéro de ligne de l’erreur.</td></tr>' +
            '<tr><td>Rien ne change</td><td>Fichier enregistré ? (un point blanc sur l’onglet = non enregistré). Rechargement forcé : <b>Ctrl + Maj + R</b>.</td></tr>' +
            '<tr><td><code>d3 is not defined</code></td><td>Dans <code>index.html</code>, les scripts de <code>lib/</code> doivent rester <b>avant</b> <code>main.js</code>.</td></tr>' +
            '<tr><td><code>await is only valid…</code></td><td>Dans <code>index.html</code>, gardez <code>type="module"</code> sur la ligne de <code>main.js</code>.</td></tr>' +
            '<tr><td><code>chart has already been declared</code></td><td>La ligne <code>const chart</code> est en double : gardez-en une.</td></tr>' +
            '<tr><td>Live Server impossible</td><td>Terminal de VS Code (<b>Ctrl + `</b>) : <code>python3 -m http.server 8000</code> (Windows : <code>py -m http.server 8000</code>), puis <code>http://localhost:8000</code> ; rechargez à la main.</td></tr>' +
            '</tbody></table>'}
        ]
      },
      {
        id: 'premier', title: 'Trois rectangles',
        partHead: {k: 'Partie 1', t: 'À la main : votre premier graphique D3'},
        lead: 'Une donnée, un rectangle. Et un piège : en SVG, y descend.',
        parts: [
          {phase: 'Prédire'},
          {ask: 'La barre de 2024 doit mesurer 1 173 ÷ 6 ≈ 196 pixels et reposer sur le bas (y = 200). <b>Que vaut son attribut <code>y</code> ?</b> Répondez avant de lancer.'},
          {phase: 'Faire'},
          {cell: {id: 'd-premier', js: true, code: `// Prêts par année (2026 s'arrête le 17 octobre)
const prets = [1173, 912, 874];

const svg = d3.select(chart).append("svg")
  .attr("width", 400).attr("height", 220);

svg.selectAll("rect")
  .data([])                        // 1. Remplacez [] par le tableau des prêts
  .join("rect")
  .attr("x", (d, i) => 40 + i * 120)
  .attr("width", 80)
  .attr("height", d => d / 6)
  .attr("y", d => 0)               // 2. Corrigez : la barre doit reposer sur y = 200
  .attr("fill", "#a3a8b3");        // 3. 2026 (index 2) en mauve #8a4f8c, les autres en gris`,
            check: c => {
              const r = Q(c, 'rect');
              return [
                [r.length === 3, 'Trois rectangles : un par année'],
                [r.length === 3 && Math.abs(num(r[0], 'height') - 1173 / 6) < 1, 'Hauteurs proportionnelles aux prêts'],
                [r.length === 3 && r.every(e => Math.abs(num(e, 'y') + num(e, 'height') - 200) < 1), 'Les barres reposent sur le bas (y + hauteur = 200)'],
                [r.length === 3 && MAUVE(r[2]) && !MAUVE(r[0]) && !MAUVE(r[1]), '2026 seule en mauve']
              ];
            }}},
          {note: 'Le mauve sur 2026 attire l’œil… sur une année incomplète. Une couleur dit « regardez ici » : réservez-la au message. Ici, il faudrait d’abord comparer les mêmes mois : de janvier à septembre, 2026 fait +23 % sur 2025.', mascot: 'ghost'}
        ]
      },
      {
        id: 'echelles', title: 'Échelles et axes',
        lead: 'Lire un fichier, laisser les échelles calculer les pixels, poser les axes.',
        parts: [
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            '<code>d3.csv(fichier, d3.autoType)</code> lit le fichier et convertit les nombres. Le fichier est déjà trié du plus prêté au moins prêté.',
            'Complétez <code>x</code> : <code>.domain([0, d3.max(top, d => d.prets)])</code> et <code>.range([0, largeur])</code>.',
            'Complétez <code>y</code> : <code>.domain(top.map(d => d.categorie))</code>, <code>.range([0, hauteur])</code>, <code>.padding(0.2)</code>.',
            'Dessinez les barres : <code>y</code>, <code>height</code> (<code>y.bandwidth()</code>), <code>width</code>.',
            'Ajoutez les axes : <code>zone.append("g").call(d3.axisLeft(y))</code>, et l’axe du bas, déplacé de <code>hauteur</code>.'
          ]},
          {cell: {id: 'd-echelles', js: true, code: `const cats = await d3.csv("data/categories.csv", d3.autoType);
console.log(cats.length, "catégories, colonnes :", cats.columns.join(", "));
const top = cats.slice(0, 10);

const MARGE = {haut: 20, droite: 30, bas: 30, gauche: 190};
const L = 680, H = 360;
const largeur = L - MARGE.gauche - MARGE.droite;
const hauteur = H - MARGE.haut - MARGE.bas;

const zone = d3.select(chart).append("svg").attr("viewBox", \`0 0 \${L} \${H}\`)
  .append("g").attr("transform", \`translate(\${MARGE.gauche},\${MARGE.haut})\`);

// 1. Échelle des longueurs
const x = d3.scaleLinear();

// 2. Échelle des bandes
const y = d3.scaleBand();

// 3. Les barres
zone.selectAll("rect").data(top).join("rect")
  .attr("fill", "#a3a8b3");

// 4. Les axes
`,
            check: c => {
              const r = Q(c, 'rect'), w = r.map(e => num(e, 'width'));
              return [
                [r.length === 10, '10 barres'],
                [r.length === 10 && Math.abs(Math.max(...w) - 460) < 2, 'La plus longue barre remplit la largeur (460 px)'],
                [r.length === 10 && new Set(r.map(e => Math.round(num(e, 'height')))).size === 1 && num(r[0], 'height') > 10, 'Toutes les barres ont la même épaisseur'],
                [r.length === 10 && r.every(e => num(e, 'x') === 0), 'Toutes partent de x = 0'],
                [Q(c, '.tick').length >= 14, 'Deux axes, avec leurs graduations']
              ];
            }}},
          {details: 'Un indice si vous bloquez', body: '<p>L’axe du bas : <code>zone.append("g").attr("transform", `translate(0,${hauteur})`).call(d3.axisBottom(x));</code></p>'}
        ]
      },
      {
        id: 'message', title: 'Un titre qui dit quelque chose',
        lead: 'Les romans dominent en volume. Est-ce encore vrai si chaque catégorie est rapportée à son stock ?',
        parts: [
          {demo: {id: 'library-rank', build: window.DS_TD_DEMOS.library}},
          {phase: 'Prédire'},
          {ask: '<b>Par livre en rayon</b> (prêts ÷ livres), quelle catégorie arrive en tête ? Notez votre réponse.'},
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            'Survolez une barre, puis changez de mesure dans l’exemple. Suivez les mêmes catégories pendant le reclassement.',
            'Dans la cellule, calculez <code>parLivre = prets / livres</code>. Les 12 catégories les plus prêtées parmi celles d’au moins 30 livres restent les mêmes.',
            'Ouvrez sur <code>parLivre</code>. Donnez un titre qui change avec la mesure et colorez les deux premières catégories.',
            'Repérez la clé <code>d.categorie</code> dans <code>.data()</code> et la <code>.transition()</code>. La clé permet de suivre la même barre ; le mouvement montre son nouveau rang.'
          ]},
          {cell: {id: 'd-message', js: true, wait: 700, code: `const cats = await d3.csv("data/categories.csv", d3.autoType);
const data = cats.filter(d => d.livres >= 30).sort((a, b) => b.prets - a.prets).slice(0, 12)
  .map(d => ({...d, parLivre: 0 // À vous : calculez prêts ÷ livres
  }));
let metrique = "prets"; // À vous : ouvrez sur « parLivre » après le calcul
const couleur = (d, i) => "#d9dce2"; // À vous : colorez les deux premières
const titre = () => "Prêts par catégorie"; // À vous : un titre-phrase pour chaque mesure

const L = 680, H = 430, M = {haut: 60, droite: 50, bas: 35, gauche: 190};
const largeur = L - M.gauche - M.droite, hauteur = H - M.haut - M.bas;
const duree = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600;
const commandes = d3.select(chart).append("div");
const boutons = commandes.selectAll("button").data(["prets", "parLivre"]).join("button")
  .attr("type", "button").text(d => d === "prets" ? "Nombre de prêts" : "Prêts par livre en rayon");
const svg = d3.select(chart).append("svg").attr("viewBox", "0 0 " + L + " " + H);
const zone = svg.append("g").attr("transform", "translate(" + M.gauche + "," + M.haut + ")");
const lignes = zone.append("g"), axe = zone.append("g").attr("transform", "translate(0," + hauteur + ")");
const entete = svg.append("text").attr("x", 4).attr("y", 24).attr("font-size", 16).attr("font-weight", 700);
svg.append("text").attr("x", 4).attr("y", 44).attr("font-size", 11)
  .text("Même périmètre : 12 catégories, au moins 30 livres ; philosophie et psychologie : 67 livres.");
const detail = d3.select(chart).append("p").attr("class", "story-live-detail")
  .text("Survolez une barre pour lire ce que la longueur résume.");

function dessiner(premier = false) {
  const ordre = data.slice().sort((a, b) => d3.descending(a[metrique], b[metrique]));
  const x = d3.scaleLinear().domain([0, d3.max(ordre, d => d[metrique]) || 1]).range([0, largeur]);
  const y = d3.scaleBand().domain(ordre.map(d => d.categorie)).range([0, hauteur]).padding(0.2);
  const groupes = lignes.selectAll("g.categorie").data(ordre, d => d.categorie).join(entree => {
    const g = entree.append("g").attr("class", "categorie").attr("transform", d => "translate(0," + y(d.categorie) + ")");
    g.append("rect").attr("width", 0);
    g.append("text").attr("class", "nom").attr("x", -8).attr("text-anchor", "end").attr("font-size", 12);
    g.append("text").attr("class", "val").attr("font-size", 12);
    return g;
  });
  groupes.on("pointerenter", (e, d) => {
    groupes.style("opacity", r => r.categorie === d.categorie ? 1 : 0.3);
    detail.text(d.categorie + " : " + d.prets + " prêts / " + d.livres + " livres = " +
      d.parLivre.toLocaleString("fr-FR", {maximumFractionDigits: 2}) + " prêt(s) par livre.");
  }).on("pointerleave", () => {
    groupes.style("opacity", 1); detail.text("Survolez une barre pour lire ce que la longueur résume.");
  });
  groupes.select("rect").attr("height", y.bandwidth()).attr("fill", couleur);
  groupes.select(".nom").attr("y", y.bandwidth() / 2 + 4).text(d => d.categorie);
  groupes.select(".val").attr("y", y.bandwidth() / 2 + 4)
    .text(d => d[metrique].toLocaleString("fr-FR", {maximumFractionDigits: 2}));
  // La clé conserve chaque catégorie ; la transition montre son nouveau rang et sa longueur.
  const ms = premier ? 0 : duree;
  groupes.interrupt().transition().duration(ms).attr("transform", d => "translate(0," + y(d.categorie) + ")");
  groupes.select("rect").interrupt().transition().duration(ms).attr("width", d => x(d[metrique]));
  groupes.select(".val").interrupt().transition().duration(ms).attr("x", d => x(d[metrique]) + 5);
  axe.interrupt().transition().duration(ms).call(d3.axisBottom(x).ticks(5));
  entete.text(titre());
  boutons.attr("aria-pressed", d => String(d === metrique));
}
boutons.on("click", (e, valeur) => { metrique = valeur; dessiner(); });
dessiner(true);`,
            check: c => {
              const r = Q(c, 'rect'), ys = r.map(e => num(e, 'y')), w = r.map(e => num(e, 'width'));
              const top = r[ys.indexOf(Math.min(...ys))], t = Q(c, 'text').map(e => e.textContent);
              return [
                [r.length === 12, '12 barres'],
                [r.length > 0 && num(top, 'width') === Math.max(...w), 'Triées : la plus longue en haut'],
                [r.filter(MAUVE).length === 2, 'Deux barres en mauve, les autres non'],
                [t.some(s => /philosophie/i.test(s)), 'Philosophie et psychologie apparaît'],
                [t.some(s => s.length >= 30), 'Un titre-phrase (au moins 30 caractères)'],
                [Q(c, '.val').some(e => /^1[,.]46$/.test(e.textContent.trim())), 'Le rapport de philosophie et psychologie atteint 1,46 prêt par livre']
              ];
            }}},
          {note: 'Un ratio change le récit : en nombre, les romans écrasent tout ; par livre en rayon, la philosophie et la psychologie passent devant. Mais 67 livres seulement : écrivez-le en sous-titre.', mascot: 'lion'}
        ]
      },
      {
        id: 'temps', title: 'Une ligne et une annotation',
        lead: 'Les prêts par mois, avec une échelle de temps. Puis une annotation pour le record.',
        parts: [
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            'Le fichier donne des mois comme <code>"2024-01"</code> : <code>d3.autoType</code> les convertit déjà en dates (vérifiez avec <code>console.log</code>).',
            '<code>x</code> : <code>d3.scaleTime()</code> sur <code>d3.extent(mois, d => d.date)</code>. <code>y</code> : linéaire, de 0 au maximum.',
            'La ligne : <code>d3.line().x(d => x(d.date)).y(d => y(d.prets))</code>, dans un <code>path</code> sans remplissage.',
            'Trouvez le record avec <code>d3.greatest(mois, d => d.prets)</code> : un cercle et un texte qui donne le mois et le nombre.',
            'Le dernier mois s’arrête le 17 octobre : dites-le (pointillés, ou une note).'
          ]},
          {cell: {id: 'd-temps', js: true, code: `// d3.autoType convertit déjà "2024-01" en date (sans lui : d3.timeParse("%Y-%m"))
const mois = (await d3.csv("data/prets-mois.csv", d3.autoType))
  .map(d => ({date: d.mois, prets: d.prets}));
console.log(mois.length, "mois, de", mois[0].date.toLocaleDateString("fr-FR"), "à", mois.at(-1).date.toLocaleDateString("fr-FR"));

const MARGE = {haut: 40, droite: 20, bas: 30, gauche: 40};
const L = 680, H = 320;
const largeur = L - MARGE.gauche - MARGE.droite, hauteur = H - MARGE.haut - MARGE.bas;
const zone = d3.select(chart).append("svg").attr("viewBox", \`0 0 \${L} \${H}\`)
  .append("g").attr("transform", \`translate(\${MARGE.gauche},\${MARGE.haut})\`);

// Échelles, axes, ligne, annotation du record
`,
            check: c => {
              const paths = Q(c, 'path').map(p => p.getAttribute('d') || '');
              const t = Q(c, 'text').map(e => e.textContent).join(' ');
              return [
                [paths.some(d => !/NaN/.test(d) && (d.match(/[LC]/g) || []).length >= 30), 'Une ligne de plus de 30 points (sans NaN)'],
                [Q(c, '.tick').length >= 6, 'Des axes'],
                [Q(c, 'circle').length >= 1, 'Un cercle sur le record'],
                [/174/.test(t), 'Le texte de l’annotation donne le record (174 prêts)']
              ];
            }}},
          {details: 'Pour aller plus loin', body: '<p>Ajoutez un survol : un rectangle transparent sur la zone, <code>.on("pointermove", ...)</code>, puis <code>d3.pointer(event)</code>, <code>x.invert()</code> et <code>d3.bisector(d => d.date).center</code> pour trouver le mois le plus proche.</p>'}
        ]
      },
      {
        id: 'roast', title: 'Faites rôtir votre graphique',
        partHead: {k: 'Partie 2', t: 'Avec l’IA : les skills de Yan Holtz'},
        lead: 'Un skill est un fichier d’instructions qu’un assistant IA lit avant de travailler. <b>roast-my-chart</b> relit un graphique avec 61 fiches d’erreurs courantes.',
        parts: [
          {note: 'Relisez votre graphique de l’exercice « Un titre qui dit quelque chose », corrigez deux problèmes et justifiez-les. Si votre assistant IA est prêt, utilisez-le ; sinon, vérifiez vous-même le message, les proportions, les étiquettes et les limites des données. La préparation du skill peut se faire avant la séance.', mascot: 'dog'},
          {phase: 'Préparer', ai: 'on'},
          {p: 'Le pas à pas, en quatre captures. Le dépôt de Yan Holtz contient cinq skills ; celui du jour est <b>roast-my-chart</b> (1).'},
          {shot: A + 'skills/s1-depot.jpg', alt: 'La page GitHub holtzy/dataviz-skills et la liste de ses cinq skills', caption: '<b>1</b> <a href="https://github.com/holtzy/dataviz-skills" target="_blank" rel="noopener">github.com/holtzy/dataviz-skills</a> : roast-my-chart relit un graphique fini avec les 61 fiches de Data to Viz.'},
          {shot: A + 'skills/s4-mode-emploi.jpg', alt: 'La section How to use du dépôt', caption: 'Le mode d’emploi du dépôt. <b>A</b> ChatGPT, Gemini, Mistral, Claude (site web) : on colle le contenu de SKILL.md. <b>B</b> Un agent de code (Claude Code, Codex, Cursor…) l’installe en une commande. Aujourd’hui : la voie <b>A</b>, elle marche partout.'},
          {shot: A + 'skills/s2-skill-raw.jpg', alt: 'Le fichier SKILL.md de roast-my-chart et ses boutons Raw, copier, télécharger', caption: '<b>2</b> Ouvrez <a href="' + SK + 'roast-my-chart/SKILL.md" target="_blank" rel="noopener">roast-my-chart/SKILL.md</a>, cliquez sur l’icône « Copy raw file » : tout le fichier est copié. Collez-le en premier message d’une nouvelle conversation (ou dans les instructions d’un projet ChatGPT, d’un Gem, d’un projet Claude).'},
          {shot: A + 'skills/s3-caveats-download.jpg', alt: 'Le fichier caveats.md et son bouton de téléchargement', caption: '<b>3</b> Ouvrez <a href="' + SK + 'roast-my-chart/references/caveats.md" target="_blank" rel="noopener">references/caveats.md</a>, cliquez sur « Download raw file » et joignez le fichier à la même conversation : ce sont les 61 fiches que le skill vérifie.'},
          {note: 'Le README parle aussi d’un fichier zip à installer dans les réglages de Claude.ai, mais le dépôt n’en publie pas encore (novembre 2026). Le copier-coller suffit.', mascot: 'cat'},
          {p: 'Faites une capture de votre graphique « Un titre qui dit quelque chose » (ou de l’atelier « Une ligne et une annotation »). Pas de graphique ? Exécutez la cellule ci-dessous : le premier jet d’une IA, à rôtir.'},
          {cell: {id: 'd-camembert', js: true, code: `// Le premier jet d'une IA, à qui l'on a demandé : « un graphique D3 des prêts par catégorie »
const cats = await d3.csv("data/categories.csv", d3.autoType);
const svg = d3.select(chart).append("svg").attr("viewBox", "0 0 680 340");
svg.append("text").attr("x", 340).attr("y", 22).attr("text-anchor", "middle")
  .attr("font-weight", 700).text("Répartition des prêts par catégorie");
const pie = d3.pie().value(d => d.prets).sort(null);
const arc = d3.arc().innerRadius(0).outerRadius(130);
const couleur = d3.scaleOrdinal(d3.schemeTableau10);
svg.append("g").attr("transform", "translate(170,185)")
  .selectAll("path").data(pie(cats)).join("path")
  .attr("d", arc).attr("fill", d => couleur(d.data.categorie));
const leg = svg.append("g").attr("transform", "translate(330,45)")
  .selectAll("g").data(cats).join("g")
  .attr("transform", (d, i) => \`translate(\${Math.floor(i / 14) * 170},\${(i % 14) * 20})\`);
leg.append("rect").attr("width", 10).attr("height", 10).attr("fill", d => couleur(d.categorie));
leg.append("text").attr("x", 14).attr("y", 9).attr("font-size", 11).text(d => d.categorie);`}},
          {phase: 'Rôtir', ai: 'on'},
          {p: 'Envoyez la capture et votre code, avec cette consigne :'},
          {html: '<p class="td-prompt">' + PROMPT + '</p>'},
          {phase: 'Juger'},
          {p: 'L’IA peut se tromper. Pour chaque remarque, regardez votre graphique : est-ce vrai ici ?'},
          {tick: [
            'Chaque remarque cite un élément <b>précis</b> de mon graphique (une barre, un axe, une couleur).',
            'J’ai vérifié chaque remarque sur le graphique lui-même.',
            'J’ai corrigé les <b>deux</b> problèmes les plus graves, dans ma cellule, et relancé.',
            'J’ai noté une remarque que je refuse, et pourquoi.'
          ]},
          {note: 'Une IA qui relit avec une liste explicite (61 fiches) est bien plus utile qu’une IA à qui l’on demande « c’est bien ? ». Le skill ne rend pas l’IA plus intelligente : il la rend méthodique.', mascot: 'lion'}
        ]
      },
      {
        id: 'skill-d3', title: 'D3 calcule, vous dessinez',
        lead: 'Le skill <b>d3</b> de Yan Holtz impose une règle aux applications React : D3 fait les maths, le rendu se fait à part. Appliquons-la sans React.',
        parts: [
          {p: 'La règle, en résumé (lire le <a href="' + SK + 'd3/SKILL.md" target="_blank" rel="noopener">SKILL.md</a>) : échelles, formes et calculs viennent de D3 ; aucun <code>d3.select</code>, <code>.append</code>, <code>.attr</code>. Les éléments s’écrivent directement, un par donnée, comme React les écrit en JSX. Les marges vivent dans un objet, et une seule translation décale la zone.'},
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            'Exécutez : 10 barres, sans un seul <code>.attr</code>. Le SVG est une chaîne de texte construite avec <code>map</code>.',
            'Ajoutez les noms des catégories : un <code>&lt;text&gt;</code> par donnée, à <code>x="-8"</code>, aligné à droite (<code>text-anchor="end"</code>).',
            'Remplacez <code>d3.axisBottom</code> : <code>x.ticks(5).map(t => ...)</code> donne les graduations, écrivez-les en <code>&lt;text&gt;</code> sous la zone.',
            'Gardez la règle : aucun <code>d3.select</code>, <code>.append(</code> ni <code>.attr(</code> dans la cellule.'
          ]},
          {cell: {id: 'd-skill', js: true, code: `const cats = (await d3.csv("data/categories.csv", d3.autoType)).slice(0, 10);

const MARGE = {haut: 20, droite: 30, bas: 40, gauche: 190};
const L = 680, H = 360;
const largeur = L - MARGE.gauche - MARGE.droite, hauteur = H - MARGE.haut - MARGE.bas;

// D3 pour les maths seulement
const x = d3.scaleLinear().domain([0, d3.max(cats, d => d.prets)]).range([0, largeur]);
const y = d3.scaleBand().domain(cats.map(d => d.categorie)).range([0, hauteur]).padding(0.2);

// Le rendu : du texte SVG, une forme par donnée
const barres = cats.map(d =>
  \`<rect x="0" y="\${y(d.categorie)}" width="\${x(d.prets)}" height="\${y.bandwidth()}" fill="#d9dce2" />\`
).join("");
const etiquettes = "";   // à vous
const graduations = "";  // à vous

chart.innerHTML = \`<svg viewBox="0 0 \${L} \${H}" font-family="sans-serif" font-size="12">
  <g transform="translate(\${MARGE.gauche},\${MARGE.haut})">\${barres}\${etiquettes}\${graduations}</g>
</svg>\`;`,
            check: (c, code) => {
              const t = Q(c, 'text');
              return [
                [!/d3\.select|\.append\(|\.attr\(/.test(code), 'Aucun d3.select, .append ou .attr : D3 ne touche pas à la page'],
                [Q(c, 'rect').length === 10, '10 barres'],
                [t.filter(e => /Romans|Poésie|Histoire/.test(e.textContent)).length >= 3, 'Les noms des catégories'],
                [t.filter(e => /^\s*[\d\s  ]+\s*$/.test(e.textContent)).length >= 4, 'Des graduations écrites à la main (x.ticks)']
              ];
            }}},
          {ask: 'Comparez avec l’exercice « Échelles et axes » : qu’est-ce qui est plus clair ici ? Qu’est-ce qui manque (les transitions, par exemple) ? Pourquoi une application React préfère-t-elle cette façon de faire ?'},
          {details: 'Avec un agent de code (Claude Code, Cursor, Codex…), chez vous', body: '<p>Installez les skills : <code>npx skills add holtzy/dataviz-skills</code>. Demandez ensuite : « Crée une application React avec un graphique D3 des prêts par catégorie à partir de categories.csv ». Le skill d3 impose les marges, un graphique qui s’adapte à la taille de l’écran, et des animations seulement quand les données changent.</p>'}
        ]
      },
      {
        id: 'picto', title: 'Cent prêts, cent livres',
        partHead: {k: 'Partie 3', t: 'Graphiques spéciaux et React'},
        lead: 'Un pictogramme : une icône = un prêt sur 100. Combien de romans ?',
        parts: [
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            'Exécutez : la cellule calcule <code>k</code>, le nombre de romans sur 100 prêts.',
            'Dessinez 100 icônes en grille 10 × 10 : une donnée par icône (<code>d3.range(100)</code>), <code>col = i % 10</code>, <code>lig = Math.floor(i / 10)</code>. Un livre peut être un simple rectangle arrondi (<code>rx</code>).',
            'Les <code>k</code> premières en <code>#8a4f8c</code>, les autres en <code>#d9dce2</code>.',
            'Un titre qui donne le chiffre : « 50 prêts sur 100 sont des romans ».',
            'Pour aller plus loin : définissez l’icône une fois dans un <code>&lt;symbol&gt;</code>, réutilisez-la avec <code>&lt;use href="#livre"&gt;</code> (comme le pictogramme du CM 4).'
          ]},
          {cell: {id: 'd-picto', js: true, code: `const cats = await d3.csv("data/categories.csv", d3.autoType);
const total = d3.sum(cats, d => d.prets);
const romans = cats.find(d => d.categorie === "Romans").prets;
const k = Math.round(100 * romans / total);   // romans sur 100 prêts
console.log(k, "romans sur 100 prêts");

const grille = d3.range(100).map(i => ({i, col: i % 10, lig: Math.floor(i / 10)}));
const svg = d3.select(chart).append("svg").attr("viewBox", "0 0 680 460");
// à vous : une icône par élément de la grille, puis le titre
`,
            check: c => {
              const shapes = Q(c, 'svg rect, svg circle, svg use, svg path').filter(e => !e.closest('symbol, defs'));
              const t = Q(c, 'text').map(e => e.textContent).join(' ');
              return [[shapes.length >= 100, '100 icônes'], [shapes.filter(MAUVE).length === 50, '50 icônes violettes (#8a4f8c) : les romans'], [/\b50\b/.test(t), 'Le chiffre dans le titre']];
            }}},
          {ask: 'Ajoutez une deuxième grille pour la poésie (72 prêts sur 2 796). Quand un pictogramme est-il meilleur qu’une barre ? Quand est-il pire ?'}
        ]
      },
      {
        id: 'react', title: 'Un état, deux vues en React',
        lead: 'D3 calcule, React dessine, et un <b>état</b> relie les vues. Trois boutons d’année, un graphique qui suit.',
        parts: [
          {p: '<code>React</code> et <code>ReactDOM</code> sont chargés dans la page. Sans compilateur, on écrit le JSX avec <code>h = React.createElement</code> : <code>h("rect", {x: 0, width: 10})</code> équivaut à <code>&lt;rect x={0} width={10} /&gt;</code>.'},
          {phase: 'Prédire'},
          {ask: 'Avant d’exécuter : le code contient <code>const annee = 2024</code>. Un clic sur 2026 suffit-il à changer cette valeur ? Repérez les trois lignes à compléter.'},
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            'Exécutez et survolez une barre : son détail est déjà fourni. Le survol vit dans <code>Barres</code> ; l’année doit vivre dans le parent <code>Tableau</code>.',
            'Dans <code>Tableau</code>, remplacez la constante par un état avec <code>useState(2024)</code>. Reliez chaque bouton à son setter.',
            'Dans <code>Total</code>, calculez les prêts des <b>8 catégories affichées</b> pour l’année reçue en prop. Ce total ne représente pas toute la bibliothèque.',
            'Prédisez le résultat pour 2025, puis cliquez : titre et total suivent ; les largeurs s’animent sur la même échelle. Pourquoi une échelle fixe aide-t-elle à comparer ? 2026 s’arrête le 17 octobre.'
          ]},
          {cell: {id: 'd-react', js: true, wait: 400, code: `const cats = (await d3.csv("data/categories.csv", d3.autoType)).slice(0, 8);
const h = React.createElement;
const {useState} = React;
const ANNEES = [2024, 2025, 2026];
const maximum = d3.max(cats, d => d3.max(ANNEES, a => d["prets_" + a]));
const mouvement = matchMedia("(prefers-reduced-motion: reduce)").matches ? "none" : "width 600ms ease";

function Barres({annee}) {
  // Le survol est local à cette vue ; l’année commune reste dans Tableau.
  const [survol, setSurvol] = useState(null);
  const cle = "prets_" + annee;
  const x = d3.scaleLinear().domain([0, maximum]).range([0, 400]);
  const y = d3.scaleBand().domain(cats.map(d => d.categorie)).range([0, 260]).padding(0.2);
  const choisie = cats.find(d => d.categorie === survol);
  return h("div", null,
    h("svg", {viewBox: "0 0 680 300", fontSize: 12, fontFamily: "sans-serif"},
      h("g", {transform: "translate(200,20)"},
        cats.map(d => h("g", {key: d.categorie,
          onPointerEnter: () => setSurvol(d.categorie), onPointerLeave: () => setSurvol(null),
          style: {opacity: survol && survol !== d.categorie ? 0.3 : 1, transition: "opacity 150ms"}},
          h("rect", {className: "story-react-bar", y: y(d.categorie), height: y.bandwidth(), width: x(d[cle]),
            style: {width: x(d[cle]) + "px", transition: mouvement}, fill: d.categorie === "Romans" ? "#8a4f8c" : "#d9dce2"}),
          h("text", {x: -8, y: y(d.categorie) + 14, textAnchor: "end"}, d.categorie),
          h("text", {x: x(d[cle]) + 6, y: y(d.categorie) + 14}, d[cle]))))),
    h("p", {className: "story-live-detail", "aria-live": "polite"}, choisie
      ? choisie.categorie + " : " + choisie[cle] + " prêts en " + annee + ", pour " + choisie.livres + " livres au catalogue."
      : "Survolez une barre ; changez d’année pour suivre les longueurs."));
}
function Total({annee}) {
  const total = 0; // 1. À vous : somme des prêts de l’année
  return h("p", null, total + " prêts dans ces 8 catégories");
}
function Tableau() {
  const annee = 2024; // 2. À vous : un état partagé
  return h("div", null,
    ANNEES.map(a => h("button", {key: a, "aria-pressed": a === annee, onClick: () => {} /* 3. À vous : appeler le setter */}, a)),
    h("p", null, "Prêts par catégorie en " + annee + (annee === 2026 ? " (jusqu’au 17 octobre)" : "")),
    h(Total, {annee}), h(Barres, {annee}));
}
ReactDOM.createRoot(chart).render(h(Tableau));`,
            check: (c, code) => [
              [/\b(?:const|let)\s*\[\s*annee\s*,\s*setAnnee\s*\]\s*=\s*useState\s*\(/.test(code), 'L’année est un état dans le composant parent'],
              [!/d3\.select|\.append\(|\.attr\(/.test(code), 'React dessine : aucun d3.select, .append, .attr'],
              [Q(c, 'button').length >= 3, 'Trois boutons d’année'],
              [Q(c, 'svg rect').length >= 8, '8 barres'],
              [Q(c, 'svg text').some(e => /Romans/.test(e.textContent)), 'Les noms des catégories'],
              [Q(c, 'p').some(e => /963\s+prêts/.test(e.textContent) && /8 catégories/.test(e.textContent)), 'Le total des 8 catégories en 2024 : 963 prêts']
            ]}},
          {details: 'Un indice si vous bloquez', body: '<p>Le parent garde <code>const [annee, setAnnee] = useState(2024)</code>. Un bouton appelle <code>setAnnee(a)</code>. La colonne à additionner : <code>"prets_" + annee</code>.</p>'},
          {tick: ['En cliquant 2025, le total passe de 963 à 732 prêts ; les barres et le titre suivent.', 'En cliquant 2026, le total vaut 721 pour les 8 catégories ; le titre dit « jusqu’au 17 octobre ».', 'Je peux expliquer le trajet : clic → setter → état du parent → props → deux vues.']},
          {ask: 'Où vit l’état <code>annee</code> ? Que se passerait-il si chaque vue avait son propre <code>useState</code> ?'},
          {details: 'Le même tableau de bord sur votre ordinateur', body: '<p><code>npm create vite@latest mon-tableau -- --template react</code>, puis <code>npm install d3</code>. Écrivez le même code en JSX dans <code>src/App.jsx</code> : <code>&lt;rect y={y(d.categorie)} … /&gt;</code> au lieu de <code>h("rect", …)</code>. Le skill <b>d3</b> de Yan Holtz (<code>npx skills add holtzy/dataviz-skills</code>) guide un agent de code exactement ainsi.</p>'}
        ]
      },
      {
        id: 'calendrier', title: 'Un calendrier de prêts', extra: true,
        lead: 'Un carré par jour, plus foncé quand on prête plus (un « calendrier thermique »), à vous de l’écrire. Une IA peut vous aider : relisez chaque ligne qu’elle propose.',
        parts: [
          {phase: 'Faire', ai: 'on'},
          {steps: [
            'Lisez <code>prets-jour.csv</code> (colonnes <code>date</code>, <code>prets</code>) ; <code>d3.autoType</code> convertit déjà les dates.',
            'Pour un jour <code>d</code> : colonne = <code>d3.timeMonday.count(d3.timeYear(d), d)</code>, ligne = <code>(d.getDay() + 6) % 7</code> (lundi en haut).',
            'Couleur : <code>d3.scaleSequential(d3.interpolatePurples).domain([0, 14])</code>.',
            'Une rangée par année, un <code>&lt;title&gt;</code> dans chaque carré pour l’infobulle.'
          ]},
          {cell: {id: 'd-calendrier', js: true, code: `const jours = await d3.csv("data/prets-jour.csv", d3.autoType);
console.log(jours.length, "jours avec au moins un prêt");
`,
            check: c => [[Q(c, 'rect').length >= 797, 'Au moins un carré par jour de prêt (797)'], [Q(c, 'title').length >= 797, 'Une infobulle par jour']]}}
        ]
      },
      {
        id: 'retours', title: 'La règle des 21 jours', extra: true,
        lead: 'Un livre doit revenir en 21 jours. Un histogramme, une ligne, un pourcentage.',
        parts: [
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            '<code>durees.csv</code> donne, pour chaque durée de 0 à 91 jours, le nombre de prêts rendus (91 = 91 jours et plus).',
            'Affichez les durées de 0 à 55 jours (axe jusqu’à 56), une barre par durée. Une ligne verticale à 21 jours.',
            'Calculez la part des prêts rendus après 21 jours et écrivez-la sur le graphique.',
            'Ajoutez un menu (<code>&lt;select&gt;</code> dans <code>chart</code>) pour regrouper par 1, 3 ou 7 jours : que deviennent les pics ?'
          ]},
          {cell: {id: 'd-retours', js: true, code: `const durees = await d3.csv("data/durees.csv", d3.autoType);
console.log("Prêts rendus :", d3.sum(durees, d => d.prets));
`,
            check: c => {
              const t = Q(c, 'text').map(e => e.textContent).join(' ');
              return [[Q(c, 'rect').length >= 8, 'Un histogramme'], [Q(c, 'line').length >= 1, 'Une ligne à 21 jours'], [/3[23]\s?%|32[,.]8/.test(t), 'La part en retard (environ 33 %) écrite sur le graphique'], [Q(c, 'select').some(s => ['1', '3', '7'].every(v => [...s.options].some(o => o.value === v))), 'Un menu de classes de 1, 3 ou 7 jours']];
            }}}
        ]
      },
      {
        id: 'inspiration', title: 'Chercher l’inspiration d’abord', extra: true,
        lead: 'Le skill <b>inspiration</b> demande à l’IA de trouver 3 à 5 graphiques publiés avant d’écrire une ligne de code.',
        parts: [
          {phase: 'Chercher', ai: 'on'},
          {steps: [
            'Lisez le <a href="' + SK + 'inspiration/SKILL.md" target="_blank" rel="noopener">SKILL.md</a> : quelles « familles » de graphiques distingue-t-il ?',
            'Sans agent de code, faites sa recherche à la main sur <a href="https://www.dataviz-inspiration.com/" target="_blank" rel="noopener">dataviz-inspiration.com</a> : la famille qui correspond à votre message (évolution, classement, distribution…).',
            'Notez 3 graphiques, avec leur lien : pour chacun, <b>une idée</b> à emprunter (forme, annotation, palette, mise en page).',
            'Appliquez l’une de ces idées à l’un de vos graphiques du TD.'
          ]},
          {tick: ['J’ai trois références, avec leurs liens.', 'Pour chacune, une idée précise, pas « c’est joli ».', 'J’ai appliqué une idée, et je cite la source sous mon graphique.']}
        ]
      },
      {
        id: 'avant', title: 'Le piège des cinq étoiles',
        lead: 'Vous préparez un guide de Nouakchott. Une adresse a 5,0 : que devez-vous savoir avant de la mettre en tête ?',
        parts: [
          {demo: {id: 'restaurant-story', build: window.DS_TD_DEMOS.restaurants}},
          {ask: 'Dans « La promesse », choisissez une adresse. Ouvrez « Les preuves », puis « Votre règle ». La gardez-vous ? Donnez le chiffre et le critère qui ont changé votre choix.'},
          {phase: 'Faire le premier jet', ai: 'on'},
          {p: 'Demandez à une IA, sans skill, un top 10 par note à partir de <code>data/restaurants.csv</code>. Gardez le premier jet comme point de comparaison.'},
          {html: '<p class="td-prompt">' + P_AVANT + '</p>'},
          {steps: [
            'Enregistrez le premier jet dans <code>avant.js</code>. Dans <code>index.html</code>, chargez ce fichier à la place de <code>main.js</code>, en gardant <code>type="module"</code>.',
            'Exécutez la cellule ci-dessous si vous n’utilisez pas d’IA. Ajoutez une étiquette <code>d.nb_avis</code> au bout de chaque barre pour vérifier la comparaison.',
            'Gardez une capture <code>avant.png</code> et notez un choix que ce classement ne permet pas de défendre.'
          ]},
          {cell: {id: 'd-avant', js: true, code: `// Le premier jet typique : trier par note, garder les 10 premiers
const restos = await d3.csv("data/restaurants.csv", d3.autoType);
const top = restos.filter(d => d.note).sort((a, b) => b.note - a.note).slice(0, 10);

const L = 680, H = 360, M = {haut: 40, droite: 30, bas: 20, gauche: 250};
const x = d3.scaleLinear().domain([0, 5]).range([M.gauche, L - M.droite]);
const y = d3.scaleBand().domain(top.map(d => d.nom)).range([M.haut, H - M.bas]).padding(0.2);

const svg = d3.select(chart).append("svg").attr("viewBox", \`0 0 \${L} \${H}\`);
svg.append("text").attr("x", 0).attr("y", 22).attr("font-weight", 700)
  .text("Les 10 meilleurs restaurants de Nouakchott");
svg.append("g").selectAll("rect").data(top).join("rect")
  .attr("x", M.gauche).attr("y", d => y(d.nom))
  .attr("width", d => x(d.note) - M.gauche).attr("height", y.bandwidth())
  .attr("fill", (d, i) => d3.schemeTableau10[i]);
svg.append("g").attr("transform", \`translate(\${M.gauche},0)\`).call(d3.axisLeft(y));
// À vous : ajoutez le nombre d'avis au bout de chaque barre (d.nb_avis)`,
            check: c => [
              [Q(c, 'rect').length === 10, '10 barres'],
              [Q(c, 'text').filter(e => /^\D{0,3}\d+\D{0,6}$/.test(e.textContent.trim())).length >= 10, 'Le nombre d’avis écrit au bout de chaque barre']
            ]}},
          {details: 'Le constat à vérifier', body: '<p>57 lieux sont à 5,0. Parmi les dix affichés, six n’ont qu’un avis et neuf en ont moins de dix. Le tri par note ne départage pas les ex aequo : le fichier fournit l’ordre.</p>'}
        ]
      },
      {
        id: 'apres', title: 'Construire une sélection que l’on peut défendre',
        lead: 'Le lecteur veut comparer des restaurants identifiés. Dites quelles fiches vous retenez, et où passent les autres.',
        parts: [
          {phase: 'Définir une règle'},
          {ask: 'Que reste-t-il si vous gardez les restaurants identifiés, écartez les fiches signalées fermées et exigez au moins 50 avis ? Prédisez avant d’exécuter.'},
          {phase: 'Transformer les données', ai: 'hint'},
          {steps: [
            'Complétez <code>perimetre</code> : gardez <code>type === "restaurant"</code>. Un type inconnu reste inconnu.',
            'Complétez <code>exploitables</code> : retirez les fiches signalées fermées, puis celles sans note ou sans avis. Gardez les deux nombres séparés.',
            'Complétez <code>retenus</code> avec <code>nb_avis &gt;= minimum</code>. Vérifiez : périmètre = fermées + sans note + sous le seuil + retenues.',
            'Triez d’abord par note décroissante, puis par nombre d’avis décroissant en cas d’égalité. Affichez huit adresses, mais gardez le décompte de toutes les fiches retenues.'
          ]},
          {cell: {id: 'd-guide', js: true, code: `const lieux = await d3.csv("data/restaurants.csv", d3.autoType);
const minimum = 50;   // Un choix éditorial à justifier, pas un niveau de confiance.
const perimetre = lieux; // 1. Gardez uniquement le type restaurant
const exploitables = perimetre; // 2. Retirez les fiches signalées fermées et celles sans note ou avis
const retenus = exploitables; // 3. Appliquez le seuil d’avis
const classement = retenus.slice(0, 8); // 4. Triez avant de limiter la liste

const fermees = perimetre.filter(d => d.ferme).length;
const sansNote = perimetre.filter(d => !d.ferme && (d.note == null || d.nb_avis <= 0)).length;
const sousSeuil = exploitables.filter(d => d.nb_avis < minimum).length;
chart.classList.add("td-story");
d3.select(chart).append("h3").text("Prototype : complétez la règle avant de publier");
const bilan = d3.select(chart).append("div").attr("class", "story-ledger");
[
  ["Dans le périmètre", perimetre.length], ["Signalées fermées", fermees],
  ["Sans note", sansNote], ["Sous le seuil", sousSeuil], ["Retenues", retenus.length]
].forEach(([libelle, n]) => {
  const caseBilan = bilan.append("div").attr("data-count", libelle);
  caseBilan.append("b").text(n); caseBilan.append("span").text(libelle);
});
const tableau = d3.select(chart).append("table").style("width", "100%");
tableau.append("thead").append("tr").selectAll("th")
  .data(["Les huit premières adresses", "Note / 5", "Avis"]).join("th").text(d => d);
const lignes = tableau.append("tbody").selectAll("tr").data(classement, d => [d.nom, d.lat, d.lng].join("|")).join("tr");
lignes.append("td").text(d => d.nom);
lignes.append("td").text(d => d.note == null ? "sans note" : d.note.toLocaleString("fr-FR", {minimumFractionDigits: 1}));
lignes.append("td").text(d => d.nb_avis);
d3.select(chart).append("p").attr("class", "story-source")
  .text("Source : Google Maps, fusion du 7 novembre 2026. Tri : note, puis nombre d’avis. Périmètre : type restaurant, hors fiches signalées fermées. Ce filtre ne prouve pas la qualité du repas.");
console.log("Contrôle :", fermees + sansNote + sousSeuil + retenus.length, "=", perimetre.length);`,
            check: c => {
              const n = key => Number(Q(c, '[data-count]').find(e => e.getAttribute('data-count') === key)?.querySelector('b')?.textContent);
              return [
                [n('Dans le périmètre') === 447, '447 fiches de type restaurant'],
                [n('Signalées fermées') === 8 && n('Sans note') === 48, '8 fiches signalées fermées et 48 sans note comptées à part'],
                [n('Sous le seuil') === 357 && n('Retenues') === 34, 'Le seuil de 50 avis laisse 34 fiches et en écarte 357'],
                [n('Signalées fermées') + n('Sans note') + n('Sous le seuil') + n('Retenues') === n('Dans le périmètre'), 'Le décompte explique chaque exclusion'],
                [Q(c, 'tbody tr').length === 8 && Q(c, 'tbody tr:first-child td:first-child')[0]?.textContent === 'The India Gate', 'Huit adresses ; la règle place The India Gate en tête']
              ];
            }}},
          {phase: 'Relire le récit', ai: 'on'},
          {details: 'Utiliser les trois skills sur votre sélection', body: '<ol><li><b>Inspiration.</b> Cherchez une référence qui montre ce qu’un filtre exclut : <a href="' + SK + 'inspiration/SKILL.md" target="_blank" rel="noopener">inspiration</a>.<p class="td-prompt">' + P_INSPI + '</p></li><li><b>Construire.</b> Donnez votre règle et vos chiffres à <a href="' + SK + 'd3/SKILL.md" target="_blank" rel="noopener">d3</a>.<p class="td-prompt">' + P_D3 + '</p></li><li><b>Relire.</b> Avec <a href="' + SK + 'roast-my-chart/SKILL.md" target="_blank" rel="noopener">roast-my-chart</a>, vérifiez le titre, les exclusions, les unités et la source. Corrigez vous-même deux défauts.</li></ol>'},
          {note: 'Le seuil de 50 avis est un choix de rédaction. On peut compter les avis et comparer les moyennes ; le fichier ne donne pas leur dispersion ni la qualité réelle d’un repas.', mascot: 'lion'}
        ]
      },
      {
        id: 'interagir', title: 'Montrer ce que votre règle écarte',
        lead: 'Le filtre devient une expérience : les points gris gardent le contexte, les points mauves suivent votre règle.',
        parts: [
          {phase: 'Manipuler'},
          {steps: [
            'Exécutez. Survolez un point pour lire le nom, la note et le nombre d’avis. Changez le seuil : les points changent de taille et de couleur sans perdre leur position.',
            'Cliquez un point pour garder une adresse, puis passez de 10 à 50 et à 100 avis. Notez le nombre retenu et ce qui arrive à l’adresse choisie.',
            'Dans <code>liste.selectAll("button")</code>, remplacez <code>data([], cle)</code> par les huit premières fiches de <code>retenus</code>. Cliquez une adresse : la fiche et le point doivent suivre la même sélection.',
            'Ajoutez un titre qui dit ce que votre lecteur apprend. Indiquez le périmètre, le seuil et la source sous le graphique.'
          ]},
          {cell: {id: 'd-entonnoir', js: true, wait: 700, code: `const lieux = await d3.csv("data/restaurants.csv", d3.autoType);
const points = lieux.filter(d => d.note != null && d.nb_avis > 0);
const cle = d => [d.nom, d.lat, d.lng].join("|");
const duree = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 550;
let selection = null;
chart.classList.add("td-story");
const titre = d3.select(chart).append("h3");
const controles = d3.select(chart).append("div").attr("class", "story-policy");
const choixType = controles.append("label").text("Périmètre ").append("select").attr("aria-label", "Type de lieu");
choixType.selectAll("option").data([["restaurant", "Restaurants identifiés"], ["café", "Cafés identifiés"], ["tous", "Tous les lieux"]])
  .join("option").attr("value", d => d[0]).text(d => d[1]);
const etiquette = controles.append("label").text("Au moins ");
const valeur = etiquette.append("output").text(50);
etiquette.append("span").text(" avis ");
const seuil = etiquette.append("input").attr("type", "range").attr("aria-label", "Nombre minimum d’avis")
  .attr("min", 1).attr("max", 100).attr("value", 50);
const L = 680, H = 340, M = {haut: 20, droite: 20, bas: 38, gauche: 42};
const x = d3.scaleLog().domain([1, 500]).range([M.gauche, L - M.droite]);
const y = d3.scaleLinear().domain([1, 5]).range([H - M.bas, M.haut]);
const svg = d3.select(chart).append("svg").attr("viewBox", "0 0 " + L + " " + H);
svg.append("g").attr("transform", "translate(0," + (H - M.bas) + ")").call(d3.axisBottom(x).ticks(5, "~s"));
svg.append("g").attr("transform", "translate(" + M.gauche + ",0)").call(d3.axisLeft(y).ticks(4));
svg.append("text").attr("x", L - M.droite).attr("y", H - 5).attr("text-anchor", "end").attr("font-size", 11).text("Nombre d’avis · échelle logarithmique");
const nuage = svg.append("g");
const bilan = d3.select(chart).append("p").attr("class", "story-reading").attr("aria-live", "polite");
d3.select(chart).append("p").attr("class", "story-source").text("Gris : les autres lieux notés restent visibles. Mauve : les lieux retenus par votre règle. Les fiches signalées fermées sont écartées.");
const liste = d3.select(chart).append("div").attr("class", "story-controls story-shortlist");
const fiche = d3.select(chart).append("p").attr("class", "story-selection").attr("aria-live", "polite");
const bulle = d3.select(chart).append("div").attr("class", "d4-tip").attr("role", "tooltip").style("opacity", 0);

function dessiner(premier = false) {
  const type = choixType.property("value"), minimum = +seuil.property("value");
  const perimetre = lieux.filter(d => type === "tous" || d.type === type);
  const eligible = perimetre.filter(d => !d.ferme && d.note != null && d.nb_avis > 0);
  const retenus = eligible.filter(d => d.nb_avis >= minimum).sort((a, b) =>
    d3.descending(a.note, b.note) || d3.descending(a.nb_avis, b.nb_avis));
  const ids = new Set(retenus.map(cle));
  valeur.text(minimum); bulle.style("opacity", 0);
  titre.text(retenus.length + " adresses retenues avec au moins " + minimum + " avis");
  bilan.text(perimetre.length + " fiches dans le périmètre ; " + perimetre.filter(d => d.ferme).length +
    " signalées fermées ; " + perimetre.filter(d => !d.ferme && (d.note == null || d.nb_avis <= 0)).length +
    " sans note ; " + eligible.filter(d => d.nb_avis < minimum).length + " sous le seuil.");
  const cercles = nuage.selectAll("circle").data(points, cle).join("circle")
    .attr("cx", d => x(d.nb_avis)).attr("cy", d => y(d.note))
    .attr("aria-label", d => d.nom + ", " + d.note + " sur 5, " + d.nb_avis + " avis. Sélectionner.")
    .on("pointerenter", (e, d) => {
      bulle.selectAll("*").remove(); bulle.append("b").text(d.nom);
      bulle.append("div").text(d.note + " / 5 · " + d.nb_avis + " avis");
      bulle.append("div").text(ids.has(cle(d)) ? "Retenu par votre règle" : "Hors de votre sélection : type, fermeture ou seuil");
      bulle.style("opacity", 1);
    }).on("pointermove", e => {
      const [px, py] = d3.pointer(e, chart);
      bulle.style("left", Math.max(4, Math.min(px + 12, chart.clientWidth - bulle.node().offsetWidth - 4)) + "px")
        .style("top", Math.max(4, py - 10) + "px");
    }).on("pointerleave", () => bulle.style("opacity", 0))
    .on("click", (e, d) => choisir(d));
  cercles.interrupt().transition().duration(premier ? 0 : duree)
    .attr("r", d => cle(d) === selection ? 7 : ids.has(cle(d)) ? 4.5 : 2.5)
    .attr("fill", d => ids.has(cle(d)) ? "#8a4f8c" : "#a3a8b3")
    .attr("opacity", d => ids.has(cle(d)) || cle(d) === selection ? .9 : .18)
    .attr("stroke", d => cle(d) === selection ? "#1d2433" : "none");
  // Deuxième vue : elle reçoit exactement les mêmes données filtrées que le nuage.
  liste.selectAll("button").data([], cle) // À vous : les huit premières fiches retenues
    .join("button")
    .attr("type", "button").attr("class", "chip story-pick").attr("aria-pressed", d => String(cle(d) === selection))
    .text(d => d.nom + " · " + d.note + " / 5 · " + d.nb_avis + " avis").on("click", (e, d) => choisir(d));
  const choisie = points.find(d => cle(d) === selection);
  fiche.text(choisie ? choisie.nom + " — " + choisie.note + " / 5 sur " + choisie.nb_avis +
    " avis. " + (ids.has(selection) ? "Retenue par cette règle." : "Cette règle l’écarte : vérifiez le type, la fermeture ou le seuil.") :
    "Cliquez un point ou une adresse. Gardez ce choix en passant de 10 à 50 puis 100 avis : que lui arrive-t-il ?");
}
function choisir(d) { selection = cle(d); dessiner(); }
seuil.on("input", () => dessiner()); choixType.on("change", () => dessiner());
dessiner(true);`,
            check: c => [
              [Q(c, 'svg circle').length === 551, '551 lieux notés restent visibles pour le contexte'],
              [Q(c, 'input[type=range]').length === 1 && Q(c, 'select').length === 1, 'Un seuil et un périmètre manipulables'],
              [Q(c, '[role="tooltip"]').length === 1, 'Une infobulle pour les détails'],
              [Q(c, '.story-shortlist button').length === 8, 'Huit adresses dans la vue liée']
            ]}},
          {phase: 'Rendre'},
          {tick: [
            '<code>avant.js</code> et <code>avant.png</code> montrent le premier classement. <code>apres.js</code> et <code>apres.png</code> montrent ma règle et ses effets.',
            'Dans <code>notes.md</code> : mon lecteur, ma règle, les nombres à 10 / 50 / 100 avis, et une adresse dont le sort change.',
            'Je peux expliquer pourquoi une adresse est retenue ou écartée ; je ne présente pas le seuil comme une preuve de qualité.',
            'Je zippe le dossier (<code>td3-NOM.zip</code>) et je le dépose sur Classroom.'
          ]}
        ]
      },
      {
        id: 'villes', title: 'Une ville, vingt façons de l’écrire', extra: true,
        lead: 'La colonne <code>ville</code> vient telle que les gens l’ont saisie. Avant tout graphique « par ville », regardez-la.',
        parts: [
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            'Exécutez : <code>d3.rollups</code> compte les restaurants par valeur de <code>ville</code>. Combien de façons d’écrire Nouakchott ?',
            'Certaines valeurs sont des quartiers (Tvz pour Tevragh Zeina, Ksar, Jreida…) : la colonne mélange deux niveaux. Peut-on la nettoyer à la main ? Avec quelle règle ?',
            'Autre voie : oubliez <code>ville</code>, dessinez les points avec <code>lng</code> en x et <code>lat</code> en y (deux <code>scaleLinear</code>, même échelle pour les deux). Tous les lieux sont-ils à Nouakchott ?'
          ]},
          {cell: {id: 'd-villes', js: true, code: `const restos = await d3.csv("data/restaurants.csv", d3.autoType);
const villes = d3.rollups(restos, v => v.length, d => d.ville).sort((a, b) => b[1] - a[1]);
console.log(villes.length, "valeurs différentes");
console.log(villes);
// À vous : un nuage lng / lat, un point par restaurant
`,
            check: c => [[Q(c, 'circle').length >= 600, 'Un point par lieu (lng, lat)']]}},
          {note: 'Les coordonnées sont plus fiables que le texte : elles viennent de la carte, pas du clavier. Le texte reste utile pour l’étiquette, après nettoyage.', mascot: 'dog'}
        ]
      }
    ],
    questions: {}
  };
  // Le parcours principal ; les autres activités deviennent des ateliers complémentaires.
  const td = window.DS_TD['td-d3'];
  const byId = Object.fromEntries(td.exercises.map(ex => [ex.id, ex]));
  const core = ['poste', 'premier', 'echelles', 'message', 'roast', 'react', 'avant', 'apres', 'interagir'];
  td.exercises.forEach(ex => { delete ex.partHead; ex.extra = !core.includes(ex.id); });
  byId.poste.partHead = {k: 'Avant de commencer', t: 'Votre poste de travail'};
  byId.premier.partHead = {k: 'Partie 1', t: 'Construire et défendre le message'};
  byId.roast.partHead = {k: 'Partie 2', t: 'Relire et corriger'};
  byId.react.partHead = {k: 'Partie 3', t: 'Relier deux vues'};
  byId.temps.partHead = {k: 'Ateliers complémentaires', t: 'Choisissez un défi après le parcours'};
  byId.avant.partHead = {k: 'Partie 4', t: 'Restaurants de Nouakchott : défendre une sélection'};
  td.exercises = core.concat(['temps', 'skill-d3', 'picto', 'calendrier', 'retours', 'inspiration', 'villes']).map(id => byId[id]);
})();
