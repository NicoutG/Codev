# Backend - Polytech Stats API

## Installation

### 1. Installer PostgreSQL

Assurez-vous que PostgreSQL est installé et en cours d'exécution.

### 2. Créer la base de données

```sql
CREATE DATABASE polytech_stats;
```

### 3. Installer les dépendances Python

```bash
cd src/indicateurs/backend
python3 -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configurer la connexion à la base de données

Modifiez `config.py` ou définissez la variable d'environnement :

```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/polytech_stats"
```

### 5. Initialiser la base de données

```bash
python init_db.py
```

Cela créera :
- Les tables nécessaires
- Un utilisateur admin (username: `admin`, password: `admin123`)
- Un utilisateur consultant (username: `consultant`, password: `consultant123`)
- Les 9 indicateurs CTI pré-définis

⚠️ **Important** : Changez les mots de passe par défaut en production !

### 6. Lancer le serveur

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Le serveur sera accessible sur `http://localhost:8000`

La documentation API interactive est disponible sur `http://localhost:8000/docs`

## Structure

- `main.py` : Point d'entrée FastAPI avec toutes les routes
- `models.py` : Modèles SQLAlchemy
- `database.py` : Configuration de la base de données
- `auth.py` : Authentification JWT
- `services/` : Services métier
- `dao/` : Data Access Objects
- `data/predefined_indicators.py` : 9 indicateurs CTI pré-définis

## Endpoints principaux

- `/api/auth/login` : Connexion
- `/api/auth/me` : Utilisateur courant
- `/api/indicators` : CRUD indicateurs
- `/api/import/excel` : Import fichiers Excel
- `/api/export/excel` : Export Excel
- `/api/formulaires` : CRUD formulaires
- `/api/metadata/tables` : Métadonnées tables

## Variables d'environnement

- `DATABASE_URL` : URL de connexion PostgreSQL
- `SECRET_KEY` : Clé secrète pour JWT (changez en production !)
