/* TD 2 (id td3) · Partie 1 : raconter avec QGIS (la partie 2, GeoPandas et Bokeh, est dans td3-partie2.js).
   D'après td3-intro.pdf et td3.zip (2025-2026) : on passe des écureuils de New York à une question mauritanienne,
   avec la même chaîne (tampon, compter, visualiser). Le travail se fait dans QGIS ; la page guide et contrôle.
   Toutes les étapes et tous les nombres ont été exécutés dans QGIS 4.2 (captures réelles, interface en français). */
(function () {
  const A = 'assets/td3/';
  const tool = (fr, en) => ({fr, en});
  const box = t => 'Boîte à outils › ' + t;

  window.DS_TD = window.DS_TD || {};
  window.DS_TD.td3 = {
    id: 'td3',
    title: 'Raconter avec une carte : QGIS, GeoPandas, Bokeh',
    lede: 'Une question, des couches, une carte à publier. Et un piège : une carte montre aussi ce que ses données ignorent. D’abord à la souris, puis en code.',
    model: '<span>Question</span><i>→</i><span>Couches</span><i>→</i><span>Analyse</span><i>→</i><span>Mise en page</span>',
    howto: '<div class="mascot-note mascot-note-dog">' + window.Mascots.mascot('dog') + '<div class="mascot-note-text">' +
      '<p><b>La partie 1 se fait dans QGIS</b>, gratuit, à installer avant la séance depuis <a href="https://qgis.org/download/" target="_blank" rel="noopener">qgis.org</a> (version 3.40 ou plus récente). Gardez cette page à côté : elle donne les étapes et <b>contrôle vos résultats</b>. <b>La partie 2 se fait ici, dans la page</b> : Python, sans rien installer.</p></div></div>' +
      '<p><a class="btn btn-primary dl-data" href="' + A + 'donnees-qgis.zip" download>⬇ Télécharger les données (4 Mo)</a></p>' +
      '<p class="small">Décompressez le dossier. Captures faites avec QGIS 4.2 en français : d’une version à l’autre, seuls quelques détails changent. Le nom anglais de chaque outil est indiqué en italique. L’outil se retrouve aussi par son nom dans la <b>Boîte à outils</b> (menu Traitement).</p>' +
      '<p class="small">Usage de l’IA : <span class="ai-badge is-off">Sans IA</span> <span class="ai-badge is-hint">IA : indices seulement</span> <span class="ai-badge is-on">IA autorisée</span></p>',
    exercises: [
      {
        id: 'couches', title: 'Premières couches', minutes: 20,
        partHead: {k: 'Partie 1', t: 'À la souris, dans QGIS'},
        lead: 'Des wilayas, des lieux de santé, un fond de carte. Et une première surprise dans les données.',
        parts: [
          {phase: 'Prédire', ai: 'off'},
          {ask: 'Le fichier compte 530 lieux de santé tirés d’OpenStreetMap, une carte faite par des bénévoles. <b>Quelle part se trouve à Nouakchott, à votre avis ?</b> Notez votre réponse.'},
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            {t: 'Créez un projet et enregistrez-le dans le dossier des données, sous le nom <code>carte-soins.qgz</code>.', menu: 'Projet › Enregistrer sous…', en: 'Project › Save As'},
            {t: 'Ajoutez <code>wilayas.shp</code> et <code>sante_osm.geojson</code>. Vous pouvez aussi les glisser dans la fenêtre.', menu: 'Couche › Ajouter une couche › Ajouter une couche vecteur…', en: 'Add Vector Layer'},
            {t: 'Dans l’Explorateur, ouvrez <b>Tuiles XYZ</b> et double-cliquez sur <b>OpenStreetMap</b>. Si le fond cache tout, glissez-le en bas de la liste des couches.'}
          ]},
          {shot: A + 's01-tour.png', caption: '<b>1</b> Explorateur (vos fichiers) · <b>2</b> Couches : celle du haut se dessine par-dessus · <b>3</b> La carte · <b>4</b> Le SCR du projet (ici EPSG:4326) · <b>5</b> Les menus.'},
          {steps: [
            {t: 'Avec l’outil <b>Identifier les entités</b> (ⓘ bleu), cliquez sur un point : ses attributs s’affichent.', en: 'Identify Features'},
            {t: 'Ouvrez la table de <code>sante_osm</code> : sélectionnez la couche puis appuyez sur F6. Le titre de la fenêtre donne le nombre d’entités.', en: 'Open Attribute Table'}
          ]},
          {shot: A + 's03-table.png', caption: 'La table attributaire : une ligne par point, une colonne par attribut.'},
          {ctrl: {id: 'c-total', label: 'Combien d’entités compte <code>sante_osm</code> ?', ans: 530, ok: 'Oui, 530.', ko: 'Regardez le titre de la table.'}},
          {steps: [
            {t: 'Sélectionnez les hôpitaux : <b>Sélectionner par expression</b> (Ctrl+F3), expression <code>"amenity" = \'hospital\'</code>, puis <b>Sélectionner des entités</b>. La table indique combien sont sélectionnés.', en: 'Select by Expression'}
          ]},
          {shot: A + 's04-expression.png', caption: 'Le champ <code>amenity</code> donne le type : hospital, clinic, doctors, pharmacy, dentist.'},
          {ctrl: {id: 'c-hop', label: 'Combien d’hôpitaux ?', ans: 19, ok: 'Oui, 19. Gardez ce nombre en tête.', ko: 'Vérifiez l’expression : guillemets doubles autour du champ, simples autour de la valeur.'}},
          {phase: 'Regarder', ai: 'off'},
          {ask: 'Zoomez sur le fleuve Sénégal, près de Rosso, avec le fond OpenStreetMap et les wilayas sans remplissage. <b>Qu’est-ce qui ne va pas ?</b>'},
          {shot: A + 's02-senegal.png', caption: 'Zoom sur la vallée du fleuve. Fond : © contributeurs OpenStreetMap.'},
          {details: 'Voir la réponse', body: '<p>Beaucoup de points sont <b>de l’autre côté du fleuve</b>. L’export a été découpé selon un rectangle, pas selon la frontière : il contient des lieux de santé du Sénégal.</p>'},
          {steps: [
            {t: 'Ne gardez que les points du pays : dans <b>Extraire les entités depuis</b>, mettez <code>sante_osm</code>. Cochez <b>sont à l’intérieur</b>, et comparez avec <code>wilayas</code>.', menu: box('Extraire par localisation'), en: 'Extract by Location'},
            'Renommez le résultat <code>sante_pays</code> (clic droit › Renommer). Il est temporaire : clic droit sur la couche › Rendre permanent, ou l’icône à droite de son nom.'
          ]},
          {ctrl: {id: 'c-pays', label: 'Combien de points restent dans le pays ?', ans: 315, ok: 'Oui : 215 points sur 530 étaient hors des limites, presque tous sur la rive sénégalaise.', ko: 'Vérifiez le prédicat « sont à l’intérieur » (are within) et la couche de comparaison.'}},
          {note: 'Première leçon : <b>regardez vos données sur une carte avant de les compter.</b> Sans ce zoom, on aurait annoncé 530 lieux de santé mauritaniens.', mascot: 'ghost'}
        ]
      },
      {
        id: 'bac', title: 'Joindre un tableau : la carte du bac', minutes: 20,
        lead: 'Un tableau n’a pas de géométrie. Une clé commune suffit pour le poser sur la carte.',
        parts: [
          {phase: 'Prédire', ai: 'off'},
          {ask: 'Le fichier du bac a une colonne <code>wilaya</code>, la couche des wilayas une colonne <code>ADM1_EN</code>. <b>Que faut-il pour que la jointure réussisse ?</b>'},
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            {t: 'Ajoutez <code>bac_2025_wilayas.csv</code>. Choisissez <b>Pas de géométrie</b> et laissez cochée la détection des types de champs.', menu: 'Couche › Ajouter une couche › Ajouter une couche de texte délimité…', en: 'Add Delimited Text Layer'},
            {t: 'Double-cliquez sur la couche <code>wilayas</code>, onglet <b>Jointures</b>, puis le bouton <b>+</b>. Couche à joindre : le CSV. Champ de jointure : <code>wilaya</code>. Champ cible : <code>ADM1_EN</code>. Préfixe personnalisé : <code>bac_</code>.', en: 'Layer Properties › Joins'}
          ]},
          {shot: A + 's05-jointure.png', caption: 'La jointure apparaît dans la liste. Elle ne modifie pas le fichier : elle vit dans le projet.'},
          {steps: ['Ouvrez la table de <code>wilayas</code> : trois colonnes <code>bac_…</code> sont apparues à droite. Aucune ne doit être vide (NULL).']},
          {ctrl: {id: 'c-max', label: 'Quel est le taux d’admission le plus élevé (en %) ?', ans: 22.4, tol: .05, ok: 'Oui : 22,4 %, le Hodh Chargui. Pas Nouakchott.', ko: 'Triez la colonne <code>bac_taux</code> en cliquant sur son titre.'}},
          {steps: [
            {t: 'Propriétés de <code>wilayas</code>, onglet <b>Symbologie</b>. En haut, choisissez <b>Gradué</b>. Valeur : <code>bac_taux</code>. Palette de couleurs : une teinte du clair au foncé. Mode : <b>Ruptures naturelles (Jenks)</b>. 5 classes. Cliquez sur <b>Classer</b>.', en: 'Symbology › Graduated › Natural Breaks (Jenks)'}
          ]},
          {shot: A + 's06-symbologie.png', caption: 'Mode, nombre de classes, puis Classer. La colonne Légende se modifie à la main.'},
          {shot: A + 's07-carte-bac.png', caption: 'Le résultat attendu, en Jenks à 5 classes.'},
          {phase: 'Justifier', ai: 'off'},
          {steps: ['Passez le mode à <b>Quantile (effectif égal)</b>, puis à <b>Intervalle égal</b> : la carte change sans qu’aucune donnée ne change.']},
          {ctrl: {id: 'c-q', label: 'En Quantile à 5 classes, combien de wilayas dans la classe la plus foncée ?', ans: 3, ok: 'Oui : 15 wilayas ÷ 5 classes. Une carte peut donc toujours montrer « 3 wilayas en tête », même si elles sont presque à égalité.', ko: 'Comptez dans la colonne Histogramme ou sur la carte : 15 wilayas réparties à parts égales.'}},
          {q: 'bac-nombre'},
          {note: 'Regardez Nouakchott sur votre carte : on la voit à peine. Les 57 % de candidats tiennent dans quelques pixels. Nous y reviendrons à l’exercice 4.', mascot: 'lion'}
        ]
      },
      {
        id: 'soins', title: 'Qui est près d’un lieu de soins ?', minutes: 30,
        lead: 'La chaîne de l’an dernier sur les écureuils de New York, sur une vraie question : tampon, compter, visualiser.',
        parts: [
          {html: '<p class="model qchain"><span>Lieux de soins</span><i>→</i><span>Tampon de 5 km</span><i>→</i><span>Habitants dans la zone</span><i>→</i><span>Part par wilaya</span></p>'},
          {phase: 'Prédire', ai: 'off'},
          {ask: '<b>Quelle part de la population vit à moins de 5 km d’un hôpital, d’une clinique ou d’un cabinet ?</b> Et quelle wilaya sera la moins bien placée ? Notez vos réponses.'},
          {phase: '1. Garder les lieux de soins', ai: 'hint'},
          {steps: [
            {t: 'Sur <code>sante_pays</code>, expression <code>"amenity" IN (\'hospital\', \'clinic\', \'doctors\')</code>. Renommez le résultat <code>soins</code>.', menu: box('Extraire par expression'), en: 'Extract by Expression'}
          ]},
          {ctrl: {id: 'c-soins', label: 'Combien de lieux de soins ?', ans: 54, ok: 'Oui, 54 pour tout le pays.', ko: 'Partez bien de <code>sante_pays</code>, pas de <code>sante_osm</code>.'}},
          {phase: '2. Un tampon de 5 km… vraiment ?', ai: 'off'},
          {steps: [
            {t: 'Sur <code>soins</code>, tapez une distance de <b>5</b>. Lisez bien l’unité à droite, puis lancez quand même.', menu: 'Vecteur › Outils de géotraitement › Tampon…', en: 'Vector › Geoprocessing Tools › Buffer'}
          ]},
          {shot: A + 's08-tampon-degres.png', caption: 'L’unité proposée est le <b>degré</b>, avec un triangle d’avertissement. La couche est en EPSG:4326.'},
          {shot: A + 's10-piege-carte.png', caption: 'Le résultat : votre « zone de 5 » couvre plus de deux fois la superficie du pays.'},
          {q: 'degres'},
          {steps: [
            'Supprimez ce tampon.',
            {t: 'Reprojetez <code>soins</code> en <b>EPSG:32628</b> (WGS 84 / UTM zone 28N), dont l’unité est le mètre. Renommez le résultat <code>soins_utm</code>.', menu: 'Vecteur › Outils de gestion de données › Reprojeter une couche…', en: 'Reproject Layer'},
            {t: 'Refaites le tampon sur <code>soins_utm</code> : distance <b>5000 mètres</b>, et cochez <b>Regrouper le résultat</b> en bas de la fenêtre. Renommez-le <code>zone_5km</code>.', menu: 'Vecteur › Outils de géotraitement › Tampon…', en: 'Dissolve result'}
          ]},
          {shot: A + 's09-tampon-metres.png', caption: 'Cette fois : <code>soins_utm [EPSG:32628]</code>, 5000 mètres. Faites défiler pour trouver « Regrouper le résultat ».'},
          {shot: A + 's11-zone.png', caption: 'Nouakchott : la zone de 5 km autour des lieux de soins. Fond : © contributeurs OpenStreetMap.'},
          {ctrl: {id: 'c-zone', label: 'Combien d’entités dans <code>zone_5km</code> ?', ans: 1, ok: 'Oui : une seule entité, les cercles sont fusionnés. Sans cela, un habitant serait compté plusieurs fois.', ko: 'Il en faut une seule : cochez « Regrouper le résultat » (Dissolve).'}},
          {phase: '3. Compter les habitants', ai: 'hint'},
          {p: 'La population est donnée par petits hexagones. Un hexagone est soit dedans, soit dehors, selon son centre.'},
          {steps: [
            {t: 'Ajoutez <code>population_kontur.gpkg</code>, puis calculez le centre de chaque hexagone. Renommez le résultat <code>pop_points</code>.', menu: 'Vecteur › Outils de géométrie › Centroïdes…', en: 'Centroids'},
            {t: 'Gardez les points dans la zone : extraire depuis <code>pop_points</code>, <b>sont à l’intérieur</b>, comparer avec <code>zone_5km</code>. Renommez le résultat <code>pop_proche</code>.', menu: box('Extraire par localisation'), en: 'Extract by Location'},
            {t: 'Sur <code>pop_proche</code>, lisez la <b>somme</b> du champ <code>population</code>.', menu: 'Vecteur › Outils d’analyse › Statistiques basiques pour les champs…', en: 'Basic Statistics for Fields'}
          ]},
          {ctrl: {id: 'c-pop', label: 'Combien d’habitants dans la zone ?', ans: 1503000, tol: 15000, unit: 'habitants', ok: 'Oui, environ 1,5 million.', ko: 'Il faut environ 1,5 million : vérifiez la distance (5000 m) et « Regrouper le résultat ».'}},
          {phase: '4. Par wilaya', ai: 'hint'},
          {steps: [
            {t: 'Polygones : <code>wilayas</code>. Points : <code>pop_points</code>. Champ de pondération : <code>population</code>. Nom du champ : <code>pop_tot</code>.', menu: 'Vecteur › Outils d’analyse › Compter les points dans les polygones…', en: 'Count Points in Polygon'},
            'Recommencez sur le résultat : Polygones : la couche que vous venez de créer. Points : <code>pop_proche</code>. Pondération : <code>population</code>. Nom du champ : <code>pop_5km</code>.',
            {t: 'Dans la table de ce dernier résultat, ouvrez la <b>calculatrice de champ</b> (Ctrl+I). Nouveau champ <code>part_5km</code>, type nombre décimal, expression <code>100 * "pop_5km" / "pop_tot"</code>.', en: 'Field Calculator'},
            'Représentez <code>part_5km</code> en Gradué, Jenks, 5 classes.'
          ]},
          {shot: A + 's12-compter.png', caption: 'Le champ de pondération additionne les habitants au lieu de compter les points.'},
          {shot: A + 's13-resultat.png', caption: 'Le résultat attendu.'},
          {ctrl: {id: 'c-sud', label: 'Quelle part pour <b>Nouakchott Sud</b> ?', ans: 72.2, tol: 1.5, unit: '%', ok: 'Oui, environ 72 %.', ko: 'Attendu : autour de 72 %. Vérifiez les deux comptages.'}},
          {ctrl: {id: 'c-adrar', label: 'Et pour l’<b>Adrar</b> ?', ans: 38.2, tol: 1.5, unit: '%', ok: 'Oui, environ 38 % : presque tout Atar.', ko: 'Attendu : autour de 38 %.'}},
          {ctrl: {id: 'c-nat', label: 'Pour tout le pays : somme de <code>pop_5km</code> ÷ somme de <code>pop_tot</code> ?', ans: 31.1, tol: 1, unit: '%', ok: 'Oui, environ 31 % : un habitant sur trois. Comparez avec votre prédiction.', ko: 'Attendu : autour de 31 %. Utilisez les Statistiques basiques sur chaque champ.'}},
          {phase: '5. Le croire ?', ai: 'off'},
          {ask: 'Lisez votre carte : <b>Tiris Zemmour, Hodh Chargui, Gorgol, Assaba, Tagant : 0 %.</b> Zéro lieu de soins à Zouérat, à Néma, à Kaédi. Est-ce possible ?'},
          {q: 'zero'},
          {steps: [{t: 'Mesurez le déséquilibre : comptez les points de <code>sante_pays</code> par wilaya, puis additionnez les trois wilayas de Nouakchott.', menu: 'Vecteur › Outils d’analyse › Compter les points dans les polygones…'}]},
          {ctrl: {id: 'c-nkc', label: 'Combien des 315 points sont à Nouakchott ?', ans: 272, tol: 1, ok: 'Oui : 272 sur 315, soit 86 % des points, pour 30 % de la population. Revoyez votre prédiction du début.', ko: 'Additionnez Nouakchott Nord, Ouest et Sud.'}},
          {note: 'OpenStreetMap est riche là où des bénévoles cartographient. <b>Votre carte mesure autant l’effort de cartographie que l’accès aux soins.</b> C’est le biais du survivant du CM 1. Une carte honnête doit le dire.', mascot: 'lion'}
        ]
      },
      {
        id: 'composer', title: 'La carte qu’on publie', minutes: 20,
        lead: 'Une carte d’exploration n’est pas une carte à publier. Passons de l’une à l’autre.',
        parts: [
          {phase: 'Critiquer', ai: 'off'},
          {shot: A + 'a-ne-pas-faire.jpg', caption: 'Une carte faite pour l’exemple, mêmes données. Fond : © contributeurs OpenStreetMap.'},
          {ask: '<b>Relevez au moins cinq défauts.</b> Puis énoncez : quelle est l’histoire de cette carte ?'},
          {phase: 'Construire', ai: 'on'},
          {steps: [
            {t: 'Créez une mise en page, nommée <code>Carte finale</code>.', menu: 'Projet › Nouvelle mise en page…', en: 'New Print Layout'},
            {t: 'Ajoutez la carte, en dessinant un rectangle. Dans la fenêtre principale, gardez seule la couche <code>part_5km</code>.', menu: 'Ajouter un objet › Ajouter une carte', en: 'Add Map'},
            {t: 'Ajoutez un <b>titre qui dit le message</b>, une phrase et pas un thème. Sous-titre : ce qui est mesuré et l’unité.', menu: 'Ajouter un objet › Ajouter une étiquette', en: 'Add Label'},
            {t: 'Ajoutez la légende. Décochez <b>Mise à jour automatique</b> et renommez la couche : personne ne doit lire <code>part_5km</code>.', menu: 'Ajouter un objet › Ajouter une légende', en: 'Add Legend'},
            {t: 'Ajoutez une barre d’échelle, discrète, en kilomètres.', menu: 'Ajouter un objet › Ajouter une barre d’échelle', en: 'Add Scale Bar'},
            {t: '<b>Le carton de Nouakchott.</b> Ajoutez une seconde carte, petite, et zoomez-la sur la capitale : c’est là que se trouve la classe la plus foncée, invisible sur la grande carte.', en: 'Add Map'},
            'Ajoutez une <b>phrase sur les limites des données</b> et une ligne de sources : OpenStreetMap / HOT (ODbL), Kontur Population (CC BY), ANSADE / OCHA.',
            {t: 'Exportez.', menu: 'Mise en page › Exporter au format image…', en: 'Export as Image'}
          ]},
          {shot: A + 's14-mise-en-page.png', caption: 'L’éditeur de mise en page : à droite, la liste des objets et leurs propriétés.'},
          {phase: 'Vérifier', ai: 'off'},
          {p: 'Échangez votre carte avec un voisin. Sans explication, coche-t-il tout ?'},
          {tick: [
            'Le titre dit <b>ce qu’il faut retenir</b>, en une phrase.',
            'Le <b>focus</b> saute aux yeux ; le contexte reste discret.',
            'La légende se lit sans nom de fichier ni champ technique.',
            'Échelle et sources sont présentes, sans attirer l’œil.',
            'Nouakchott se lit, grâce au carton.',
            'Le lecteur sait que <b>0 % ne veut pas dire « aucun soin »</b>.'
          ]}
        ]
      },
      {
        id: 'sensibilite', title: 'Changer la définition', minutes: 15, extra: true,
        lead: '« Un lieu de soins », « 5 km » : deux choix. Que devient votre chiffre si vous en changez ?',
        parts: [
          {phase: 'Prédire', ai: 'off'},
          {ask: 'Qu’est-ce qui changera le plus le chiffre national : ajouter les pharmacies, ou doubler la distance ?'},
          {phase: 'Faire', ai: 'on'},
          {p: 'Refaites les étapes 2 et 3 de l’exercice 3 pour chaque définition, puis divisez la population de la zone par le total, 4 825 614 habitants.'},
          {ctrl: {id: 'c-s1', label: 'Tous les points de <code>sante_pays</code>, pharmacies comprises, à 5 km :', ans: 38.7, tol: 1, unit: '%', ok: 'Oui, environ 39 %.', ko: 'Attendu : autour de 39 %.'}},
          {ctrl: {id: 'c-s2', label: 'Lieux de soins (54) à 10 km :', ans: 35.7, tol: 1, unit: '%', ok: 'Oui, environ 36 %.', ko: 'Attendu : autour de 36 %.'}},
          {ctrl: {id: 'c-s3', label: 'Hôpitaux du pays seulement, à 10 km :', ans: 31.8, tol: 1, unit: '%', ok: 'Oui, environ 32 %. Il n’en reste que 7 dans le pays.', ko: 'Attendu : autour de 32 %. Partez de <code>sante_pays</code>.'}},
          {ask: 'Quel chiffre mettriez-vous en titre ? Lequel un ministre préférerait-il ? Lequel un journaliste critique ? Pourquoi faut-il toujours écrire la définition sur la carte ?'}
        ]
      },
      {
        id: 'relief', title: 'L’œil de l’Afrique', minutes: 15, extra: true,
        lead: 'Un raster, enfin : le relief de l’Adrar et le Guelb er Richat.',
        parts: [
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            {t: 'Ajoutez <code>relief_adrar.tif</code>. Dans Symbologie, choisissez <b>Pseudo-couleur à bande unique</b> et une palette d’altitude.', menu: 'Couche › Ajouter une couche › Ajouter une couche raster…', en: 'Singleband pseudocolor'},
            {t: 'Calculez l’ombrage.', menu: 'Raster › Analyse › Ombrage…', en: 'Hillshade'},
            {t: 'Placez l’ombrage au-dessus du relief, avec le mode de fusion <b>Multiplier</b> dans sa symbologie (rubrique Rendu de la couche).', en: 'Blending mode: Multiply'},
            {t: 'Ajoutez des courbes de niveau tous les 50 m, en gris très fin.', menu: 'Raster › Extraction › Courbes de niveaux…', en: 'Contour'}
          ]},
          {ctrl: {id: 'c-alt', label: 'Altitude maximale du fichier ? (Propriétés › Information)', ans: 788, tol: 10, unit: 'm', ok: 'Oui, autour de 788 m.', ko: 'Attendu : autour de 788 m. Elle peut s’afficher arrondie selon les statistiques calculées.'}},
          {ask: 'Trouvez le Guelb er Richat (21,1° N, 11,4° O). Composez un petit cadrage qui donne envie d’y aller, avec un titre et une échelle.'}
        ]
      },
      {
        id: 'hexagones', title: 'Une grille à la place des wilayas', minutes: 15, extra: true,
        lead: 'Les limites administratives pèsent sur le message. Une grille régulière les efface.',
        parts: [
          {phase: 'Faire', ai: 'hint'},
          {steps: [
            {t: 'Type <b>Hexagone (Polygone)</b>, emprise calculée depuis <code>wilayas</code>, espacement 50 km, SCR <b>EPSG:32628</b>.', menu: 'Vecteur › Outils de recherche › Créer une grille…', en: 'Create Grid'},
            {t: 'Sommez la population par hexagone, pondérée par <code>population</code>, à partir de <code>pop_points</code>.', menu: 'Vecteur › Outils d’analyse › Compter les points dans les polygones…'},
            'Filtrez les hexagones vides (clic droit sur la couche › Filtrer, expression <code>"NUMPOINTS" > 0</code>, selon le nom donné au champ) et représentez-les en Gradué.'
          ]},
          {ask: 'Comparez avec la carte par wilaya. Où est le peuplement ? Qu’est-ce que la grille montre que les wilayas cachaient, et qu’est-ce qu’elle perd ?'}
        ]
      }
    ],
    questions: {
      'bac-nombre': {
        prompt: 'Passez la Valeur à <code>bac_candidats</code>. Pour colorer des surfaces, faut-il un nombre de candidats ou un taux ?',
        options: [
          {t: 'Un taux', ok: true, why: 'Un nombre brut en aplat donne surtout la taille de la population. Pour colorer une surface, on utilise un taux, une densité ou une part. Le nombre brut se montre par la taille d’un symbole.'},
          {t: 'Un nombre', why: 'Regardez : la couleur reproduit surtout le poids de chaque wilaya. Comparer des aplats demande une valeur rapportée à quelque chose.'},
          {t: 'Peu importe', why: 'Les deux cartes disent des choses différentes, et une seule permet de comparer les wilayas entre elles.'}
        ]
      },
      degres: {
        prompt: 'Pourquoi ce tampon est-il gigantesque ?',
        options: [
          {t: 'La couche est en degrés : « 5 », ce sont 5 degrés', ok: true, why: 'Un degré vaut environ 110 km : le rayon dépasse 500 km. Avant toute mesure, reprojetez dans un SCR en mètres, adapté à la région.'},
          {t: 'Il y a trop de points', why: 'Même un seul point donnerait un cercle de plus de 500 km de rayon. Regardez l’unité à droite de la distance.'},
          {t: 'Le fond de carte déforme tout', why: 'Le fond n’y est pour rien : c’est l’unité du SCR de la couche source.'}
        ]
      },
      zero: {
        prompt: 'Que dit vraiment ce 0 % ?',
        options: [
          {t: 'OpenStreetMap n’y connaît aucun lieu de soins', ok: true, why: 'Ces villes ont bien des structures de santé, mais elles ne figurent pas dans le fichier. L’absence dans les données n’est pas une absence dans la réalité.'},
          {t: 'Personne n’y a accès aux soins', why: 'Ce serait une fausse nouvelle. Kaédi, par exemple, a un hôpital bien connu. Il manque simplement dans ce fichier.'},
          {t: 'Une erreur de calcul dans QGIS', why: 'Le calcul est juste : comptez les points de <code>soins</code> dans ces wilayas. C’est le fichier qui est incomplet.'}
        ]
      }
    }
  };
})();
