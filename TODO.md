## Indicateurs
- pas de colonne de 6 mois ou à 18 mois dans insertion
- il faudrait une colonne "annee" pour toutes les tables -> et lorsqu'on appelle la fonction pour executer un indicateur on passera un nouveau parametre optionnel année qui concretement rajoutera simplement une clause WHERE pour filtrer sur l'anne de chaque table. Ensuite dans les rapport on aura un select pour choisir l'année parmis toutes les années disponibles.
- utiliser id_polytech comme clé primaire pour les tables mobilités et étudiants ne fonctionnera pas car on remet les infos  chaque année (il faudrait prendre l'id et l'année comme clé primaire)
- le système de join actuel est peut être trop simpliste pour certains indicateurs

## Autres
- améliorer les interfaces (parfois de longues liste de données sont affichées alors que pas forcement necessaire, la premiere chose qu'on voit quand on clique sur un indicateur est le json, peut etre que ce n est pas le plus pertinent, etc)
- creer le nouveau grade qui ne peux que visionner les rapports
- permettre d'exporter les rapports en pdf (avec les charts, ou a defaut de telecharger les charts)
- Ajouter des colonnes data_text_1, data_text_2, ... jusqu'à 5 pour des données additionnelles de type text, et pareil pour les nombre : data_number_1 data_number_2, ... jusqu'à 5. le but etant d'avoir de la flexibilité pour que l'utilisateur puisse ajouter des colonnes additionnelles.
