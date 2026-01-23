# 📊 Guide : Comprendre les Indicateurs

## Qu'est-ce qu'un indicateur ?

Un **indicateur** est une requête SQL qui calcule des statistiques à partir de vos données importées. Il permet de répondre à des questions comme :
- "Combien d'étudiants sont employés par genre ?"
- "Quel est le pourcentage de diplômés en CDI ?"
- "Combien d'étudiants par formation et par année ?"

## Structure d'un indicateur

Un indicateur se compose de **deux parties principales** :

### 1. 📋 Le Sujet (Tables et filtres)

Le sujet définit :
- **Quelles tables** utiliser (ex: `insertion_diplomes`, `mobilite_etudiants`)
- **Quelles conditions** appliquer (filtres, ex: année = 2022, genre = 'F')

**Exemple :**
```json
{
  "tables": ["insertion_diplomes"],
  "conditions": [
    { "=": [{ "col": "promotion" }, 2022] }
  ]
}
```

### 2. 📈 Les Colonnes (Calculs et regroupements)

Les colonnes définissent ce qu'on calcule et comment on groupe les résultats. Il y a **3 types de colonnes** :

#### a) Regroupement par colonne (`group_by`)
Groupe les résultats par une colonne existante.

**Exemple :** Grouper par genre
```json
{
  "type": "group_by",
  "titre": "Genre",
  "expr": { "col": "genre" }
}
```
**Résultat :** Une ligne par genre (M, F, etc.)

#### b) Regroupement par cas (`case`)
Crée des catégories personnalisées basées sur des conditions.

**Exemple :** Tranches d'âge
```json
{
  "type": "case",
  "titre": "Tranche d'âge",
  "cases": [
    { "label": "<18", "when": { "<": [{ "col": "age" }, 18] } },
    { "label": "18-25", "when": { "and": [
      { ">=": [{ "col": "age" }, 18] },
      { "<=": [{ "col": "age" }, 25] }
    ]} },
    { "label": ">25", "when": { ">": [{ "col": "age" }, 25] } }
  ]
}
```
**Résultat :** Une ligne par tranche d'âge

#### c) Valeur (`aggregation`)
Calcule une valeur (COUNT, SUM, pourcentage, etc.)

**Exemple 1 :** Compter le nombre total
```json
{
  "type": "aggregation",
  "titre": "Nombre total",
  "expr": { "agg": "count" }
}
```

**Exemple 2 :** Pourcentage avec condition
```json
{
  "type": "aggregation",
  "titre": "Pourcentage en CDI",
  "expr": {
    "op": "*",
    "args": [
      100,
      {
        "op": "/",
        "args": [
          { "agg": "count", "condition": { "=": [{ "col": "statut" }, "CDI"] } },
          { "agg": "count" }
        ]
      }
    ]
  }
}
```

## 📝 Exemple complet

**Question :** "Combien d'étudiants employés par genre en 2022 ?"

**Indicateur :**
```json
{
  "sujet": {
    "tables": ["insertion_diplomes"],
    "conditions": [
      { "=": [{ "col": "promotion" }, 2022] },
      { "=": [{ "col": "quelle_est_votre_situation_au_1er_mars_2023___" }, "En activité professionnelle"] }
    ]
  },
  "colonnes": [
    {
      "type": "group_by",
      "titre": "Genre",
      "expr": { "col": "genre" }
    },
    {
      "type": "aggregation",
      "titre": "Nombre employés",
      "expr": { "agg": "count" }
    }
  ]
}
```

**Résultat attendu :**
| Genre | Nombre employés |
|-------|----------------|
| M     | 97             |
| F     | 44             |

## 🎯 Comment créer un indicateur

1. **Allez sur la page "Indicateurs"** → Cliquez sur "Nouvel indicateur"
2. **Remplissez les métadonnées** :
   - Titre (obligatoire)
   - Description (optionnelle)
3. **Définissez le Sujet** :
   - Sélectionnez les tables à utiliser
   - Ajoutez des conditions si nécessaire
4. **Ajoutez des Colonnes** :
   - Cliquez sur "Ajouter une colonne"
   - Choisissez le type (regroupement, cas, ou valeur)
   - Configurez la colonne
5. **Sauvegardez** : Cliquez sur "Créer l'indicateur"

## 💡 Astuces

- **Utilisez les exemples** : Vous pouvez importer un fichier JSON d'exemple pour voir la structure
- **Testez régulièrement** : Utilisez le bouton "Calculer" pour voir les résultats avant de finaliser
- **Exportez vos indicateurs** : Sauvegardez-les en JSON pour les réutiliser plus tard
- **Commencez simple** : Créez d'abord un indicateur simple (une table, une colonne COUNT) puis complexifiez

## 🔍 Opérateurs disponibles

### Conditions (dans le Sujet)
- `=` : Égal à
- `!=` ou `<>` : Différent de
- `>` : Supérieur à
- `>=` : Supérieur ou égal à
- `<` : Inférieur à
- `<=` : Inférieur ou égal à
- `and` : ET logique
- `or` : OU logique

### Agrégations (dans les Colonnes)
- `count` : Compter le nombre de lignes
- `sum` : Somme
- `avg` : Moyenne
- `min` : Minimum
- `max` : Maximum

### Opérations mathématiques
- `+` : Addition
- `-` : Soustraction
- `*` : Multiplication
- `/` : Division

## 📚 Exemples de fichiers JSON

Vous trouverez des exemples dans le dossier `src/indicateurs/data/` :
- `exemple.json` : Exemple basique
- `exemple2.json` : Exemple avec cas
- `exemple3.json` : Exemple avec calculs complexes
