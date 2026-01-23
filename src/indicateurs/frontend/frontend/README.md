# Frontend - Polytech Stats

## Installation

```bash
cd src/indicateurs/frontend/frontend
npm install
```

## Lancer en développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Build pour production

```bash
npm run build
```

Les fichiers seront générés dans le dossier `dist/`

## Structure

- `src/api/` : APIs pour communiquer avec le backend
- `src/auth/` : Authentification (Login, AuthContext)
- `src/pages/` : Pages principales
- `src/components/` : Composants réutilisables

## Pages

- `/login` : Connexion
- `/dashboard` : Tableau de bord
- `/indicators` : Liste des indicateurs
- `/indicators/new` : Créer un indicateur
- `/indicators/:id/edit` : Éditer un indicateur
- `/indicators/:id/results` : Résultats avec graphiques
- `/import` : Importer des données Excel (modificateur uniquement)
- `/formulaires` : Liste des formulaires
- `/formulaires/new` : Créer un formulaire

## Comptes par défaut

- **Admin/Modificateur** : `admin` / `admin123`
- **Consultant** : `consultant` / `consultant123`
