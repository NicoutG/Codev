# Frontend - React + Vite

## Installation

```bash
cd src/frontend
npm install
```

## Lancer le serveur de développement

```bash
cd src/frontend
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Structure

```
src/frontend/
├── src/
│   ├── main.jsx             # Point d'entrée React
│   ├── App.jsx              # Composant racine
│   ├── api/                 # Clients API
│   ├── components/          # Composants React
│   ├── pages/               # Pages de l'application
│   ├── contexts/            # Contextes React
│   └── ...
├── public/                  # Fichiers statiques
├── package.json
└── vite.config.ts
```

## Build pour production

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`
