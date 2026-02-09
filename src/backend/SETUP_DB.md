# Configuration de la base de données PostgreSQL

## Problème d'authentification

Si vous obtenez l'erreur `password authentication failed for user "postgres"`, suivez ces étapes :

## Solution 1 : Utiliser votre nom d'utilisateur macOS

Sur macOS, PostgreSQL utilise souvent votre nom d'utilisateur système. Modifiez le fichier `.env` :

```env
DATABASE_URL=postgresql://jules@localhost:5432/polytech_indicateurs
```

(Remplacez `jules` par votre nom d'utilisateur macOS)

## Solution 2 : Créer un utilisateur PostgreSQL sans mot de passe

1. Trouvez où PostgreSQL est installé et connectez-vous :
```bash
# Si installé via Homebrew
/opt/homebrew/bin/psql postgres

# Ou essayez
psql -U postgres postgres
```

2. Créez un utilisateur sans mot de passe :
```sql
CREATE USER jules WITH CREATEDB;
ALTER USER jules WITH PASSWORD NULL;
\q
```

3. Modifiez `.env` :
```env
DATABASE_URL=postgresql://jules@localhost:5432/polytech_indicateurs
```

## Solution 3 : Définir un mot de passe pour postgres

1. Connectez-vous à PostgreSQL :
```bash
psql postgres
```

2. Définissez un mot de passe :
```sql
ALTER USER postgres WITH PASSWORD 'votre_mot_de_passe';
\q
```

3. Modifiez `.env` :
```env
DATABASE_URL=postgresql://postgres:votre_mot_de_passe@localhost:5432/polytech_indicateurs
```

## Solution 4 : Utiliser la méthode trust (développement uniquement)

1. Trouvez le fichier `pg_hba.conf` :
```bash
# Sur macOS avec Homebrew
/opt/homebrew/var/postgresql@15/pg_hba.conf
# Ou
/usr/local/var/postgres/pg_hba.conf
```

2. Modifiez la ligne pour localhost :
```
# Changez de:
host    all             all             127.0.0.1/32            scram-sha-256
# À:
host    all             all             127.0.0.1/32            trust
```

3. Redémarrez PostgreSQL :
```bash
brew services restart postgresql@15
```

## Créer la base de données

Une fois la connexion configurée, créez la base de données :

```bash
# Connectez-vous
psql postgres

# Créez la base
CREATE DATABASE polytech_indicateurs;
\q
```

## Tester la connexion

Testez avec votre configuration :

```bash
# Avec votre nom d'utilisateur
psql -d polytech_indicateurs

# Ou avec postgres
psql -U postgres -d polytech_indicateurs
```

## Initialiser la base de données

Une fois que la connexion fonctionne :

```bash
cd src/backend
source venv/bin/activate
python init_db.py
```

## Vérifier votre configuration PostgreSQL

Pour trouver votre utilisateur PostgreSQL par défaut :

```bash
# Voir les utilisateurs
psql postgres -c "\du"

# Voir les bases de données
psql postgres -c "\l"
```
