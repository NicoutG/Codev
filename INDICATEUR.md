# Documentation : Création d'indicateurs

Cette documentation explique comment créer et configurer un indicateur dans l'application CTI pour suivre les données d'insertion professionnelle.

---

## 1. Accéder à la section Indicateurs

1. Connectez-vous à l'application avec votre compte administrateur ou éditeur.
2. Dans le menu principal, cliquez sur **Indicateurs**.
3. Vous verrez la liste des indicateurs existants.

---

## 2. Créer un nouvel indicateur

1. Cliquez sur **Créer un indicateur**.
2. Remplissez les informations générales :
   - **Titre** : nom de l'indicateur qui sera affiché.
   - **Description** : courte description expliquant le contenu de l’indicateur.

---

## 3. Définir les données à analyser

1. **Choisir la source de données** :
   - Sélectionnez la ou les tables contenant les informations à analyser (ex. `Insertion`, `Mobilité`, `Etudiant`).
   - Les tables `Mobilité` et `Etudiant` peuvent être sélectionnées en même temps. La jointure est automatiquement faite sur `id_polytech`.
2. **Filtrer les données** :
   - Vous pouvez ajouter des conditions sur les tables pour ne prendre en compte qu'une partie des données.

---

## 4. Configurer les colonnes de l’indicateur

Chaque indicateur peut contenir une ou plusieurs colonnes :

1. **Colonnes de type "Nombre" ou agrégation** :
   - Permettent de compter, additionner ou calculer une moyenne.
   - Exemple : nombre de diplômés employés.

2. **Colonnes de regroupement (Catégorie / Groupe)** :
   - Permettent de regrouper les données selon un critère.
   - Exemple : regrouper par genre (`Homme` / `Femme`) ou par type de contrat (`CDI` / `CDD`).

3. **Colonnes conditionnelles (Case / Catégorie personnalisée)** :
   - Permettent de créer des groupes en fonction de critères spécifiques.
   - Exemple : durée de recherche d'emploi moins de 2 mois, 2 à 4 mois, plus de 4 mois.

---

## 5. Importer et exporter les données à analyser

1. **Importer** :
   - Si vous possedez un indicateur sous forme de json, vous pouvez l'importer directement en cliquant sur **Importer un JSON**.

2. **Exporter** :
   - Une fois l'indicateur définit, vous pouvez l'exporter sous format json en cliquant sur **Exporter le JSON**.

---

## 6. Sauvegarder et visualiser l’indicateur

1. Après avoir défini l'indicateur, cliquez sur **Tester l'indicateur** pour voir le résultat de l'indicateur.
2. Après avoir configuré le titre, la description et l'indicateur, cliquez sur **Créer un indicateur**.
3. L’indicateur apparaîtra dans la liste des indicateurs.
4. Vous pouvez immédiatement l’utiliser dans des rapports ou des graphiques prédéfinis.

---

## 7. Conseils pratiques

- Donnez un titre clair et explicite à chaque indicateur.
- Ajoutez une description pour que tous les utilisateurs comprennent ce que représente l’indicateur.
- Vérifiez que vos filtres sont cohérents avec le type de données analysées.
- Utilisez les colonnes de regroupement pour comparer facilement différentes catégories.
- Les indicateurs peuvent être réutilisés dans plusieurs rapports.
