# Outil Statistique Polytech Lyon

Application web complète pour la gestion et l'analyse statistique des données d'insertion professionnelle, de mobilité internationale et de réussite des étudiants.

## 🚀 Démarrage rapide avec Docker

### Prérequis

- Docker (version 20.10+)
- Docker Compose (version 2.0+)

### Installation et lancement

```bash
# Rendre le script exécutable
chmod +x launch.sh

# Lancer l'application
./launch.sh
```

Le script va :
1. ✅ Arrêter et supprimer les conteneurs existants
2. ✅ Nettoyer les anciennes images
3. ✅ Construire les nouvelles images
4. ✅ Démarrer tous les services
5. ✅ Initialiser la base de données
6. ✅ Afficher les logs

### Accès à l'application

- **Frontend** : http://localhost
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

### Comptes par défaut

- **Admin/Modificateur** : `admin` / `admin123`
- **Consultant** : `consultant` / `consultant123`

⚠️ **IMPORTANT** : Changez ces mots de passe en production !

## 📋 Commandes Docker utiles

```bash
# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v

# Redémarrer un service
docker-compose restart backend

# Voir le statut des services
docker-compose ps

# Accéder au shell du backend
docker exec -it polytech_backend bash

# Accéder à PostgreSQL
docker exec -it polytech_postgres psql -U postgres -d polytech_stats
```

## 🏗️ Architecture

L'application est composée de 3 services Docker :

1. **PostgreSQL** : Base de données
2. **Backend** : API FastAPI (Python)
3. **Frontend** : Application React (Nginx)

## 📁 Structure du projet

```
.
├── docker-compose.yml      # Orchestration Docker
├── launch.sh               # Script de lancement
├── .env.example            # Exemple de configuration
├── src/
│   └── indicateurs/
│       ├── backend/         # API FastAPI
│       └── frontend/        # Application React
└── README.md
```

## 🔧 Configuration

Copiez `.env.example` vers `.env` et modifiez les variables selon vos besoins :

```bash
cp .env.example .env
```

Variables importantes :
- `SECRET_KEY` : Clé secrète pour JWT (changez en production !)
- `DATABASE_URL` : URL de connexion PostgreSQL
- `CORS_ORIGINS` : Origines autorisées pour CORS

## 🛠️ Développement

### Mode développement (sans Docker)

Voir les README dans :
- `src/indicateurs/backend/README.md`
- `src/indicateurs/frontend/frontend/README.md`

### Rebuild après modifications

```bash
# Rebuild et redémarrer
docker-compose up -d --build

# Rebuild sans cache
docker-compose build --no-cache
```

## 📊 Fonctionnalités

- ✅ Authentification avec 2 rôles (consultant/modificateur)
- ✅ Import de fichiers Excel
- ✅ Création et gestion d'indicateurs
- ✅ Calcul automatique avec filtres temporels
- ✅ Visualisation graphique (camemberts, histogrammes)
- ✅ Export Excel avec templates CTI/Lyon1
- ✅ Gestion de formulaires
- ✅ 9 indicateurs CTI pré-définis

## 🐛 Dépannage

### Les services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Vérifier le statut
docker-compose ps
```

### Erreur de connexion à la base de données

Vérifiez que PostgreSQL est bien démarré :
```bash
docker exec polytech_postgres pg_isready -U postgres
```

### Réinitialiser complètement

```bash
# Arrêter et supprimer tout
docker-compose down -v

# Relancer
./launch.sh
```

## 📝 Notes de production

Avant de déployer en production :

1. ✅ Changez `SECRET_KEY` dans `.env`
2. ✅ Changez les mots de passe par défaut
3. ✅ Configurez un reverse proxy (Nginx/Traefik)
4. ✅ Activez HTTPS
5. ✅ Configurez les backups PostgreSQL
6. ✅ Configurez les logs et monitoring

## 📄 Licence

Projet développé pour Polytech Lyon.
