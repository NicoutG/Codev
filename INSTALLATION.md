# Guide d'Installation - Outil Statistique Polytech Lyon

## Prérequis

- Python 3.9+
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

## Installation complète

### 1. Base de données PostgreSQL

```bash
# Créer la base de données
createdb polytech_stats

# Ou via psql
psql -U postgres
CREATE DATABASE polytech_stats;
\q
```

### 2. Backend

```bash
cd src/indicateurs/backend

# Créer environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer dépendances
pip install -r requirements.txt

# Configurer DATABASE_URL (optionnel, par défaut: postgresql://postgres:postgres@localhost:5432/polytech_stats)
export DATABASE_URL="postgresql://votre_user:votre_password@localhost:5432/polytech_stats"

# Initialiser la base de données
python init_db.py

# Lancer le serveur
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
cd src/indicateurs/frontend/frontend

# Installer dépendances
npm install

# Lancer en développement
npm run dev
```

## Accès

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

## Comptes par défaut

Après l'initialisation de la base de données :

- **Admin/Modificateur** :
  - Username: `admin`
  - Password: `admin123`
  - Permissions: Lecture, Export, Import, Création/Modification

- **Consultant** :
  - Username: `consultant`
  - Password: `consultant123`
  - Permissions: Lecture, Export uniquement

⚠️ **IMPORTANT** : Changez ces mots de passe en production !

## Utilisation

1. **Connexion** : Allez sur http://localhost:5173 et connectez-vous
2. **Import de données** : (Modificateur uniquement) Importez des fichiers Excel via `/import`
3. **Création d'indicateurs** : Créez des indicateurs personnalisés ou utilisez les 9 pré-définis
4. **Calcul** : Calculez les indicateurs avec filtres temporels (6 mois, 18 mois)
5. **Visualisation** : Consultez les résultats avec graphiques (camemberts, histogrammes)
6. **Export** : Exportez en Excel avec templates CTI ou Lyon 1
7. **Formulaires** : Créez des formulaires regroupant plusieurs indicateurs

## Dépannage

### Erreur de connexion PostgreSQL

Vérifiez que PostgreSQL est en cours d'exécution et que les identifiants dans `config.py` sont corrects.

### Erreur d'import Excel

Assurez-vous que les fichiers Excel sont au format `.xlsx` ou `.xls` et que les colonnes sont correctement formatées.

### Erreur CORS

Vérifiez que `CORS_ORIGINS` dans `config.py` inclut l'URL du frontend.

## Support

Pour toute question, consultez la documentation dans les dossiers `backend/README.md` et `frontend/frontend/README.md`.
