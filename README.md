# Polytech Lyon - Suivi Statistique

Outil ergonomique pour le traitement et l'analyse des données d'insertion professionnelle des diplômés Polytech Lyon.

## Technologies

- **Backend** : FastAPI (Python)
- **Frontend** : React + TypeScript + Vite
- **Base de données** : PostgreSQL
- **Authentification** : JWT

## Démarrage rapide avec Docker

### Prérequis

- Docker et Docker Compose installés

### Lancer l'application

```bash
# Lancer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

### Comptes de test

- **Consultant** : `consultant` / `consultant123`
- **Éditeur** : `editeur` / `editeur123`
- **Admin** : `admin` / `admin123`

Pour plus de détails, consultez [DOCKER.md](./DOCKER.md)

## Développement local (sans Docker)

### Backend

```bash
cd src/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurer .env avec vos paramètres PostgreSQL
cp .env.example .env

# Initialiser la base de données
python init_db.py

# Lancer le serveur
uvicorn app.main:app --reload
```

### Frontend

```bash
cd src/frontend
npm install
npm run dev
```

## Documentation

- [Architecture du projet](./ARCHITECTURE.md)
- [Guide Docker](./DOCKER.md)
- [Migration](./MIGRATION.md)

## Structure du projet

```
Codev/
├── docker-compose.yml          # Configuration Docker
├── src/
│   ├── backend/                # API FastAPI
│   └── frontend/               # Application React
├── examples/                   # Fichiers exemples
└── docs/                       # Documentation
```

## Fonctionnalités

- Authentification et gestion des utilisateurs (3 rôles : consultant, éditeur, admin)
- Import de données (XLSX, CSV)
- Création et gestion d'indicateurs
- Génération de rapports et visualisations
