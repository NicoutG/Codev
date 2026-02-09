# Backend - API FastAPI

## Installation

```bash
cd src/backend
python -m venv venv
source venv/bin/activate  # Sur Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Configuration

1. Créez un fichier `.env` à partir de `.env.example` :
```bash
cp .env.example .env
```

2. Modifiez les variables d'environnement selon votre configuration PostgreSQL.

## Initialisation de la base de données

1. Assurez-vous que PostgreSQL est installé et en cours d'exécution.

2. Créez la base de données :
```sql
CREATE DATABASE polytech_indicateurs;
```

3. Initialisez la base de données et créez les comptes de test :
```bash
cd src/backend
source venv/bin/activate
python init_db.py
```

Cela créera :
- **consultant** / consultant123 (Consultant)
- **editeur** / editeur123 (Éditeur)
- **admin** / admin123 (Administrateur)

## Lancer le serveur

```bash
cd src/backend
source venv/bin/activate  # Sur Windows: .\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Le serveur sera accessible sur `http://localhost:8000`

## API Documentation

Une fois le serveur lancé, accédez à :
- Documentation Swagger : `http://localhost:8000/docs`
- Documentation ReDoc : `http://localhost:8000/redoc`

## Endpoints

### Authentification
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/change-password` - Changer le mot de passe
- `GET /api/v1/auth/me` - Informations utilisateur actuel

### Utilisateurs (Admin uniquement)
- `GET /api/v1/users/` - Liste des utilisateurs
- `POST /api/v1/users/` - Créer un utilisateur
- `GET /api/v1/users/{id}` - Détails d'un utilisateur
- `PUT /api/v1/users/{id}` - Modifier un utilisateur
- `PUT /api/v1/users/{id}/role` - Modifier le rôle
- `DELETE /api/v1/users/{id}` - Supprimer un utilisateur

### Métadonnées
- `GET /api/v1/metadata/tables` - Liste des tables
- `GET /api/v1/metadata/tables/{table}/columns` - Colonnes d'une table
- `POST /api/v1/metadata/columns` - Colonnes communes

## Structure

```
src/backend/
├── app/
│   ├── main.py              # Point d'entrée FastAPI
│   ├── api/
│   │   ├── deps.py          # Dépendances (auth, DB)
│   │   └── v1/
│   │       ├── auth.py      # Endpoints authentification
│   │       ├── users.py     # Endpoints utilisateurs
│   │       └── metadata.py  # Endpoints métadonnées
│   ├── core/
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Connexion DB
│   │   └── security.py      # JWT, hashage
│   ├── models/
│   │   └── user.py          # Modèle User
│   ├── schemas/
│   │   ├── auth.py         # Schémas authentification
│   │   └── user.py         # Schémas utilisateur
│   ├── services/
│   │   └── user_service.py  # Logique métier utilisateurs
│   ├── dao/
│   │   └── user_dao.py     # Accès DB utilisateurs
│   └── ...
├── uploads/                 # Fichiers uploadés
├── requirements.txt
└── init_db.py              # Script d'initialisation
```
