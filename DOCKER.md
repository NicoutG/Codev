# Guide Docker - Polytech Lyon Suivi Statistique

## Prérequis

- Docker installé ([Docker Desktop](https://www.docker.com/products/docker-desktop) pour macOS/Windows)
- Docker Compose (inclus avec Docker Desktop)

## Démarrage rapide

### 1. Lancer tous les services

```bash
docker-compose up -d
```

Cette commande va :
- Créer et démarrer PostgreSQL
- Construire et lancer le backend FastAPI
- Construire et lancer le frontend React
- Initialiser automatiquement la base de données avec les 3 comptes de test

### 2. Accéder à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs
- **PostgreSQL** : localhost:5433 (port externe, 5432 dans le conteneur)

### 3. Comptes de test

- **Consultant** : `consultant` / `consultant123`
- **Éditeur** : `editeur` / `editeur123`
- **Admin** : `admin` / `admin123`

## Commandes utiles

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Arrêter les services

```bash
docker-compose stop
```

### Arrêter et supprimer les conteneurs

```bash
docker-compose down
```

### Arrêter et supprimer tout (y compris les volumes)

```bash
docker-compose down -v
```

### Reconstruire les images

```bash
# Reconstruire toutes les images
docker-compose build

# Reconstruire un service spécifique
docker-compose build backend
docker-compose build frontend

# Reconstruire sans cache
docker-compose build --no-cache
```

### Redémarrer un service

```bash
docker-compose restart backend
docker-compose restart frontend
```

### Accéder au shell d'un conteneur

```bash
# Backend
docker-compose exec backend bash

# Frontend
docker-compose exec frontend sh

# PostgreSQL (port externe 5433)
docker-compose exec postgres psql -U postgres -d polytech_indicateurs

# Ou depuis votre machine (si vous avez psql installé)
psql -h localhost -p 5433 -U postgres -d polytech_indicateurs
```

### Réinitialiser la base de données

```bash
# Supprimer le volume PostgreSQL
docker-compose down -v

# Relancer (la base sera réinitialisée automatiquement)
docker-compose up -d
```

## Structure Docker

```
Codev/
├── docker-compose.yml          # Orchestration des services
├── src/
│   ├── backend/
│   │   ├── Dockerfile          # Image backend
│   │   └── .dockerignore
│   └── frontend/
│       ├── Dockerfile          # Image frontend
│       └── .dockerignore
└── DOCKER.md                   # Ce fichier
```

## Services

### PostgreSQL
- **Image** : postgres:15-alpine
- **Port externe** : 5433 (pour éviter les conflits avec PostgreSQL local)
- **Port interne** : 5432
- **Volume** : `postgres_data` (persistance des données)
- **Utilisateur** : postgres
- **Mot de passe** : postgres
- **Base de données** : polytech_indicateurs

### Backend (FastAPI)
- **Port** : 8000
- **Hot reload** : activé (--reload)
- **Volume** : `./src/backend/uploads` (fichiers uploadés)
- **Initialisation** : exécute automatiquement `init_db.py` au démarrage

### Frontend (React + Vite)
- **Port** : 5173
- **Hot reload** : activé
- **Volume** : code source monté pour le développement

## Variables d'environnement

Les variables d'environnement sont définies dans `docker-compose.yml`. Pour les modifier :

1. Éditez `docker-compose.yml`
2. Ou créez un fichier `.env` à la racine du projet

## Développement

### Mode développement

Les volumes sont montés pour permettre le hot reload :
- Le code backend est monté dans le conteneur
- Le code frontend est monté dans le conteneur
- Les modifications sont prises en compte automatiquement

### Production

Pour la production, modifiez les Dockerfiles pour :
- Utiliser des images de build séparées
- Optimiser les builds
- Utiliser des serveurs de production (Nginx pour le frontend, Gunicorn pour le backend)

## Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier que PostgreSQL est prêt
docker-compose exec postgres pg_isready -U postgres
```

### Le frontend ne se connecte pas au backend

Vérifiez que `VITE_API_URL` dans `docker-compose.yml` pointe vers le bon endpoint.

### Erreur de connexion à la base de données

Attendez que PostgreSQL soit complètement démarré (healthcheck). Le backend attend automatiquement.

### Réinitialiser complètement

```bash
# Arrêter et supprimer tout
docker-compose down -v

# Nettoyer les images
docker system prune -a

# Relancer
docker-compose up -d --build
```

## Performance

Pour améliorer les performances en développement :
- Utilisez Docker Desktop avec suffisamment de ressources allouées
- Surveillez l'utilisation des ressources : `docker stats`
