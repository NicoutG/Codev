# Architecture du Projet - Système de Suivi Statistique Polytech Lyon

## 1. Présentation du Projet

### 1.1 Contexte
Dans un but d'amélioration continue et de pertinence avec les besoins liés à l'insertion des diplômés Polytech Lyon, l'école établit un suivi statistique de ceux-ci. Pour ce faire, l'école utilise des données sur les populations étudiantes et diplômées (obtenues via de nombreux systèmes d'informations) et croise ces informations afin de pouvoir en tirer des analyses de performances de son activité d'enseignement et dégager les forces et pistes d'amélioration de l'offre de formation.

### 1.2 Objectif
Réaliser un outil ergonomique, facilitant le traitement de ces volumes importants, afin de permettre l'accès à des formulaires de résultats simplifiés, utilisables par plusieurs services afin de dégager des plans d'amélioration et des outils de prise de décision pertinents.

## 2. Cahier des Charges

### 2.1 Gestion des Utilisateurs

#### 2.1.1 Types d'utilisateurs
- **Consultant** : Peut lire les données et les indicateurs
- **Éditeur** : Consultant + créer, éditer, supprimer les indicateurs et importer des données
- **Admin** : Éditeur + créer, éditer, supprimer des utilisateurs

#### 2.1.2 Fonctionnalités utilisateur
- **Portail de connexion** :
  - Connexion (Login)
  - Changement de mot de passe
- **Ajout d'utilisateur** (Admin uniquement) :
  - Créer un utilisateur et un mot de passe
- **Liste des utilisateurs** (Admin uniquement) :
  - Visualiser
  - Modifier des rôles
  - Supprimer

### 2.2 Récupération des Données

#### 2.2.1 Format des données
- **Types de fichiers acceptés** : XLSX, CSV
- **Contenu** : Données liées à l'insertion professionnelle des élèves
- **Nomenclature** : Suivre le fichier nomenclature fourni en garantissant des noms de colonnes similaires pour garantir l'importation des données
- **Clé unique** : La colonne "code" sera une clé unique
- **Comportement d'import** :
  - Si le code existe déjà → mise à jour de la ligne
  - Si le code n'existe pas → création de la ligne

#### 2.2.2 Stockage BDD
- Base de données PostgreSQL
- Structure de tables dynamique basée sur les fichiers importés
- Gestion des métadonnées (noms de tables, colonnes, types)

#### 2.2.3 Fonctionnalités
- **Import de données** :
  - Importer les fichiers Excel/CSV
- **Liste des données** :
  - Visualiser
  - Supprimer

### 2.3 Traitement des Données

#### 2.3.1 Principe
Recréer des requêtes SQL à partir d'un langage simplifié.

#### 2.3.2 Sélection du sujet
- Choix des tables que l'on étudie
- Join automatique sur les colonnes de même nom si on sélectionne plusieurs tables dans le sujet

#### 2.3.3 Définition des colonnes
- **Regroupement par colonne** : Regroupement des lignes qui ont des noms similaires sur une colonne
- **Regroupement par cas** : Regroupement des lignes qui respectent les mêmes conditions
- **Agrégation** : Calcul à appliquer sur tous les regroupements

#### 2.3.4 Fonctionnalités
- **Ajout et édition d'indicateurs** (Éditeur/Admin) :
  - Création d'indicateur
  - Édition d'indicateur
- **Liste des indicateurs** :
  - Visualiser
  - Supprimer (Éditeur/Admin)

### 2.4 Affichage des Données

#### 2.4.1 Filtrage
- **Sélection de période** : Sélectionner une période pour les résultats
- **Sélection d'indicateurs** : Sélectionner des indicateurs à inclure
- **Sélection de types de graphiques** : Sélectionner le type de représentation graphique

#### 2.4.2 Création du résultat
- **Affichage du rapport** : Afficher le rapport généré
- **Export du rapport** : Exporter le rapport (formats à définir : PDF, Excel, CSV)

## 3. Architecture Technique

### 3.1 Stack Technique

#### 3.1.1 Backend
- **Framework** : FastAPI (Python)
- **Base de données** : PostgreSQL
- **ORM** : SQLAlchemy (recommandé) ou psycopg2 pour requêtes directes
- **Authentification** : JWT (JSON Web Tokens)
- **Validation** : Pydantic
- **Import de fichiers** : pandas, openpyxl (pour XLSX), csv (standard)

#### 3.1.2 Frontend
- **Framework** : React (TypeScript)
- **Build tool** : Vite
- **Routing** : React Router DOM
- **HTTP Client** : Axios ou Fetch API
- **Graphiques** : Chart.js, Recharts, ou D3.js
- **UI Components** : Material-UI, Ant Design, ou Tailwind CSS (à choisir)

#### 3.1.3 Base de données
- **SGBD** : PostgreSQL
- **Migrations** : Alembic (recommandé avec SQLAlchemy)

### 3.2 Structure des Répertoires

```
Codev/
├── src/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py                 # Point d'entrée FastAPI
│   │   │   ├── config.py               # Configuration (DB, JWT, etc.)
│   │   │   ├── dependencies.py         # Dépendances FastAPI (auth, etc.)
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── deps.py              # Dépendances communes (auth, DB)
│   │   │   │   │
│   │   │   │   ├── v1/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── auth.py          # Authentification (login, change password)
│   │   │   │   │   ├── users.py         # Gestion utilisateurs (CRUD)
│   │   │   │   │   ├── data.py          # Import/export données
│   │   │   │   │   ├── indicators.py    # CRUD indicateurs
│   │   │   │   │   ├── metadata.py      # Métadonnées (tables, colonnes)
│   │   │   │   │   ├── queries.py       # Exécution requêtes SQL
│   │   │   │   │   └── reports.py       # Génération rapports
│   │   │   │   │
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── security.py          # JWT, hash passwords
│   │   │   │   ├── config.py            # Settings (env vars)
│   │   │   │   └── database.py          # Connexion DB
│   │   │   │
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user.py              # Modèle User (SQLAlchemy)
│   │   │   │   ├── indicator.py         # Modèle Indicator
│   │   │   │   ├── data_import.py       # Modèle DataImport (historique)
│   │   │   │   └── base.py              # Base model
│   │   │   │
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user.py              # Pydantic schemas User
│   │   │   │   ├── indicator.py         # Pydantic schemas Indicator
│   │   │   │   ├── data.py              # Pydantic schemas Data
│   │   │   │   └── query.py             # Pydantic schemas Query
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth_service.py      # Logique authentification
│   │   │   │   ├── user_service.py      # Logique utilisateurs
│   │   │   │   ├── data_service.py      # Import/export données
│   │   │   │   ├── indicator_service.py # Logique indicateurs
│   │   │   │   ├── metadata_service.py # Métadonnées DB
│   │   │   │   ├── query_service.py     # Exécution requêtes
│   │   │   │   ├── report_service.py    # Génération rapports
│   │   │   │   └── sql_translator.py    # JSON vers SQL
│   │   │   │
│   │   │   ├── dao/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user_dao.py          # Accès DB utilisateurs
│   │   │   │   ├── indicator_dao.py     # Accès DB indicateurs
│   │   │   │   ├── metadata_dao.py      # Accès DB métadonnées
│   │   │   │   └── data_dao.py          # Accès DB données importées
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── __init__.py
│   │   │       ├── file_parser.py       # Parser XLSX/CSV
│   │   │       ├── validators.py       # Validateurs métier
│   │   │       └── exporters.py         # Export PDF/Excel
│   │   │
│   │   ├── alembic/                     # Migrations DB
│   │   │   ├── versions/
│   │   │   └── env.py
│   │   │
│   │   ├── uploads/                     # Fichiers uploadés temporaires
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   └── README.md
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── main.tsx                 # Point d'entrée React
│   │   │   ├── App.tsx                  # Composant racine
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── client.ts            # Client HTTP (Axios)
│   │   │   │   ├── auth.ts              # API authentification
│   │   │   │   ├── users.ts             # API utilisateurs
│   │   │   │   ├── data.ts              # API données
│   │   │   │   ├── indicators.ts        # API indicateurs
│   │   │   │   ├── metadata.ts          # API métadonnées
│   │   │   │   ├── queries.ts           # API requêtes
│   │   │   │   └── reports.ts           # API rapports
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── common/
│   │   │   │   │   ├── Layout.tsx       # Layout principal
│   │   │   │   │   ├── Navbar.tsx       # Barre de navigation
│   │   │   │   │   ├── Sidebar.tsx      # Menu latéral
│   │   │   │   │   ├── ProtectedRoute.tsx # Route protégée
│   │   │   │   │   └── Loading.tsx      # Indicateur de chargement
│   │   │   │   │
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx    # Formulaire connexion
│   │   │   │   │   └── ChangePasswordForm.tsx
│   │   │   │   │
│   │   │   │   ├── users/
│   │   │   │   │   ├── UserList.tsx     # Liste utilisateurs
│   │   │   │   │   ├── UserForm.tsx     # Formulaire utilisateur
│   │   │   │   │   └── UserRoleEditor.tsx
│   │   │   │   │
│   │   │   │   ├── data/
│   │   │   │   │   ├── DataImportForm.tsx # Import données
│   │   │   │   │   ├── DataList.tsx     # Liste données
│   │   │   │   │   └── DataViewer.tsx   # Visualiseur données
│   │   │   │   │
│   │   │   │   ├── indicators/
│   │   │   │   │   ├── IndicatorList.tsx # Liste indicateurs
│   │   │   │   │   ├── IndicatorForm.tsx # Formulaire indicateur
│   │   │   │   │   ├── IndicatorEditor.tsx # Éditeur complet
│   │   │   │   │   │
│   │   │   │   │   ├── editors/
│   │   │   │   │   │   ├── SubjectEditor.tsx      # Sélection tables
│   │   │   │   │   │   ├── ColumnEditor.tsx       # Édition colonnes
│   │   │   │   │   │   ├── GroupByEditor.tsx      # Regroupement
│   │   │   │   │   │   ├── CaseEditor.tsx         # Regroupement par cas
│   │   │   │   │   │   ├── AggregationEditor.tsx  # Agrégations
│   │   │   │   │   │   ├── ConditionEditor.tsx    # Conditions
│   │   │   │   │   │   └── ExpressionEditor.tsx   # Expressions
│   │   │   │   │   │
│   │   │   │   ├── reports/
│   │   │   │   │   ├── ReportBuilder.tsx # Constructeur rapport
│   │   │   │   │   ├── ReportViewer.tsx  # Visualiseur rapport
│   │   │   │   │   ├── FilterPanel.tsx   # Panneau filtres
│   │   │   │   │   ├── ChartSelector.tsx # Sélecteur graphiques
│   │   │   │   │   └── ChartRenderer.tsx # Rendu graphiques
│   │   │   │   │
│   │   │   │   └── shared/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       ├── Select.tsx
│   │   │   │       ├── Table.tsx
│   │   │   │       └── Modal.tsx
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── UsersPage.tsx
│   │   │   │   ├── DataPage.tsx
│   │   │   │   ├── IndicatorsPage.tsx
│   │   │   │   └── ReportsPage.tsx
│   │   │   │
│   │   │   ├── contexts/
│   │   │   │   ├── AuthContext.tsx      # Contexte authentification
│   │   │   │   └── AppContext.tsx       # Contexte global
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts           # Hook authentification
│   │   │   │   ├── useApi.ts            # Hook API
│   │   │   │   └── usePermissions.ts    # Hook permissions
│   │   │   │
│   │   │   ├── types/
│   │   │   │   ├── user.ts
│   │   │   │   ├── indicator.ts
│   │   │   │   ├── data.ts
│   │   │   │   └── query.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── constants.ts
│   │   │   │   ├── formatters.ts
│   │   │   │   └── validators.ts
│   │   │   │
│   │   │   ├── styles/
│   │   │   │   ├── globals.css
│   │   │   │   └── theme.css
│   │   │   │
│   │   │   └── assets/
│   │   │
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── README.md
│   │
│   └── shared/                          # Code partagé (types, constants)
│       └── types/
│
├── examples/                            # Fichiers exemples
│   ├── Base_insertion_promos_2020_a_2022.xlsx
│   ├── NOMENCLATURE_base_insertion_promos_2020_a_2022.xlsx
│   └── ...
│
├── docs/                                # Documentation
│   ├── ARCHITECTURE.md                  # Ce fichier
│   ├── API.md                           # Documentation API
│   └── DEPLOYMENT.md                    # Guide déploiement
│
├── tests/
│   ├── backend/
│   │   ├── unit/
│   │   └── integration/
│   └── frontend/
│       ├── unit/
│       └── e2e/
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
├── .gitignore
├── README.md
└── LICENSE
```

## 4. Modèle de Données

### 4.1 Tables Système

#### 4.1.1 users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('consultant', 'editeur', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.1.2 indicators
```sql
CREATE TABLE indicators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    specification JSONB NOT NULL,  -- Structure JSON du langage simplifié
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.1.3 data_imports
```sql
CREATE TABLE data_imports (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    imported_by INTEGER REFERENCES users(id),
    row_count INTEGER,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Tables Dynamiques

Les tables de données sont créées dynamiquement lors de l'import :
- Nom de table basé sur le fichier source ou configuré
- Colonnes basées sur les colonnes du fichier
- Colonne "code" obligatoire (clé unique)
- Types de colonnes détectés automatiquement

## 5. API Endpoints

### 5.1 Authentification (`/api/v1/auth`)
- `POST /login` - Connexion
- `POST /change-password` - Changement de mot de passe
- `POST /refresh` - Rafraîchir token

### 5.2 Utilisateurs (`/api/v1/users`) - Admin uniquement
- `GET /` - Liste utilisateurs
- `POST /` - Créer utilisateur
- `GET /{id}` - Détails utilisateur
- `PUT /{id}` - Modifier utilisateur
- `DELETE /{id}` - Supprimer utilisateur
- `PUT /{id}/role` - Modifier rôle

### 5.3 Données (`/api/v1/data`)
- `POST /import` - Importer fichier (Éditeur/Admin)
- `GET /` - Liste des imports (Éditeur/Admin)
- `GET /tables` - Liste des tables disponibles
- `GET /tables/{table_name}` - Données d'une table (paginées)
- `DELETE /tables/{table_name}` - Supprimer table (Éditeur/Admin)

### 5.4 Métadonnées (`/api/v1/metadata`)
- `GET /tables` - Liste des tables
- `GET /tables/{table}/columns` - Colonnes d'une table
- `POST /columns` - Colonnes communes de plusieurs tables

### 5.5 Indicateurs (`/api/v1/indicators`)
- `GET /` - Liste indicateurs
- `POST /` - Créer indicateur (Éditeur/Admin)
- `GET /{id}` - Détails indicateur
- `PUT /{id}` - Modifier indicateur (Éditeur/Admin)
- `DELETE /{id}` - Supprimer indicateur (Éditeur/Admin)
- `POST /{id}/execute` - Exécuter indicateur (génère SQL et retourne résultats)

### 5.6 Rapports (`/api/v1/reports`)
- `POST /generate` - Générer rapport
- `GET /{id}` - Récupérer rapport
- `POST /{id}/export` - Exporter rapport (PDF/Excel)

## 6. Flux de Données

### 6.1 Import de Données
1. Utilisateur (Éditeur/Admin) upload un fichier XLSX/CSV
2. Backend parse le fichier (pandas)
3. Validation selon nomenclature
4. Vérification colonne "code"
5. Création/mise à jour table PostgreSQL
6. Insertion données (UPSERT sur code)
7. Enregistrement métadonnées import

### 6.2 Création d'Indicateur
1. Utilisateur (Éditeur/Admin) sélectionne tables
2. Backend retourne colonnes disponibles
3. Utilisateur définit colonnes (group_by, case, aggregation)
4. Backend traduit JSON → SQL (JsonToSqlTranslator)
5. Sauvegarde indicateur en BDD
6. Optionnel : prévisualisation résultats

### 6.3 Génération de Rapport
1. Utilisateur sélectionne indicateurs
2. Utilisateur sélectionne période (filtres)
3. Utilisateur sélectionne type graphique
4. Backend exécute requêtes SQL
5. Backend génère graphiques (si nécessaire)
6. Frontend affiche résultats
7. Optionnel : export PDF/Excel

## 7. Sécurité

### 7.1 Authentification
- JWT (JSON Web Tokens)
- Tokens avec expiration
- Refresh tokens
- Hashage mots de passe (bcrypt)

### 7.2 Autorisation
- Middleware FastAPI pour vérifier rôles
- Permissions par endpoint
- Vérification propriétaire (pour modification/suppression)

### 7.3 Validation
- Validation côté client (React)
- Validation côté serveur (Pydantic)
- Validation SQL (prévention injection)

## 8. Méthodologie de Développement

### 8.1 Phase 1 : Infrastructure de Base
**Durée estimée : 2-3 semaines**

#### Backend
- Configuration FastAPI
- Configuration PostgreSQL
- Modèles SQLAlchemy (users, indicators, data_imports)
- Authentification JWT
- CRUD utilisateurs (Admin)
- Migrations Alembic

#### Frontend
- Configuration React + TypeScript + Vite
- Routing
- Authentification (login, change password)
- Layout de base
- Gestion utilisateurs (Admin)

**Stack** : FastAPI, PostgreSQL, React, TypeScript, JWT

**Répartition** :
- Développeur 1 : Backend (auth, users)
- Développeur 2 : Frontend (auth, users UI)

### 8.2 Phase 2 : Import et Gestion des Données
**Durée estimée : 2-3 semaines**

#### Backend
- Parser XLSX/CSV
- Validation nomenclature
- Création tables dynamiques
- UPSERT données (code unique)
- API métadonnées
- API données

#### Frontend
- Interface import fichiers
- Liste des données importées
- Visualiseur données
- Gestion tables

**Répartition** :
- Développeur 1 : Backend (import, parsing)
- Développeur 2 : Frontend (import UI, visualisation)

### 8.3 Phase 3 : Création d'Indicateurs
**Durée estimée : 3-4 semaines**

#### Backend
- Amélioration JsonToSqlTranslator
- Gestion joins automatiques
- API indicateurs (CRUD)
- Exécution requêtes SQL
- Validation requêtes

#### Frontend
- Éditeur indicateurs complet
- Sélection tables
- Édition colonnes (group_by, case, aggregation)
- Éditeur conditions
- Prévisualisation SQL

**Répartition** :
- Développeur 1 : Backend (SQL translator, API)
- Développeur 2 : Frontend (éditeur indicateurs)

### 8.4 Phase 4 : Rapports et Visualisation
**Durée estimée : 2-3 semaines**

#### Backend
- API génération rapports
- Filtres (période, indicateurs)
- Export PDF/Excel

#### Frontend
- Constructeur rapports
- Sélecteur graphiques
- Rendu graphiques (Chart.js/Recharts)
- Export rapports

**Répartition** :
- Développeur 1 : Backend (rapports, export)
- Développeur 2 : Frontend (visualisation, graphiques)

### 8.5 Phase 5 : Tests et Optimisation
**Durée estimée : 1-2 semaines**

- Tests unitaires
- Tests d'intégration
- Tests E2E
- Optimisation requêtes SQL
- Optimisation performances frontend
- Documentation

**Répartition** :
- Développeur 1 : Tests backend, optimisation
- Développeur 2 : Tests frontend, optimisation

## 9. Planning Gantt (Estimation)

```
Semaine 1-3  : Phase 1 - Infrastructure
Semaine 4-6  : Phase 2 - Import données
Semaine 7-10 : Phase 3 - Indicateurs
Semaine 11-13: Phase 4 - Rapports
Semaine 14-15: Phase 5 - Tests et finition
```

**Total estimé : 15 semaines (environ 4 mois)**

## 10. Technologies et Dépendances

### 10.1 Backend (requirements.txt)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pandas==2.1.3
openpyxl==3.1.2
python-dotenv==1.0.0
```

### 10.2 Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "recharts": "^2.10.3",
    "@mui/material": "^5.14.20",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

## 11. Points d'Attention

### 11.1 Performance
- Pagination pour grandes tables
- Index sur colonne "code"
- Cache métadonnées
- Optimisation requêtes SQL complexes

### 11.2 Sécurité
- Validation stricte fichiers uploadés
- Sanitization noms de tables/colonnes
- Prévention injection SQL
- Rate limiting sur endpoints sensibles

### 11.3 Gestion d'Erreurs
- Messages d'erreur clairs
- Logging approprié
- Gestion fichiers corrompus
- Rollback en cas d'échec import

### 11.4 UX
- Feedback utilisateur (loading, erreurs)
- Validation en temps réel
- Prévisualisation avant sauvegarde
- Interface intuitive

## 12. Évolutions Futures Possibles

- Export données en différents formats
- Historique des modifications
- Partage de rapports
- Notifications
- API publique pour intégrations
- Multi-tenant (si besoin)
- Dashboard personnalisable
