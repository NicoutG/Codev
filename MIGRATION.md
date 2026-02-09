# Migration de la Structure du Projet

## Nouvelle Structure

Le projet a été réorganisé selon l'architecture définie dans `ARCHITECTURE.md`.

### Avant
```
src/indicateurs/
├── backend/
│   ├── main.py
│   ├── services/
│   ├── dao/
│   └── ...
└── frontend/
    └── frontend/
        └── src/
```

### Après
```
src/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/v1/
│   │   ├── services/
│   │   ├── dao/
│   │   ├── utils/
│   │   └── ...
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── ...
│   └── package.json
└── data/
```

## Changements Principaux

### Backend

1. **Structure modulaire** : Code organisé dans `app/` avec séparation claire des responsabilités
2. **API versionnée** : Endpoints sous `/api/v1/`
3. **Imports** : Tous les imports utilisent maintenant `app.` comme préfixe
4. **Fichiers déplacés** :
   - `main.py` → `app/main.py`
   - `services/` → `app/services/`
   - `dao/` → `app/dao/`
   - `JsonToSqlTranslator.py` → `app/utils/sql_translator.py`

### Frontend

1. **Structure simplifiée** : Plus de double dossier `frontend/frontend/`
2. **Organisation** : Dossiers créés pour futures fonctionnalités (auth, users, data, reports)
3. **Contexts** : Déplacés dans `contexts/` au lieu de `components/context/`
4. **Styles** : `index.css` → `styles/globals.css`
5. **API** : Chemins mis à jour pour `/api/v1/metadata`

## Commandes de Lancement

### Backend
```bash
cd src/backend
source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

### Frontend
```bash
cd src/frontend
npm install  # Si première fois
npm run dev
```

## Fichiers Conservés

Tous les fichiers développés ont été conservés et adaptés :
- ✅ Tous les composants React
- ✅ Tous les services backend
- ✅ Le traducteur SQL (JsonToSqlTranslator)
- ✅ Les fichiers de données dans `src/data/`

## Ancienne Structure

L'ancienne structure dans `src/indicateurs/` est toujours présente. Vous pouvez la supprimer une fois que vous avez vérifié que tout fonctionne correctement avec la nouvelle structure.

## Prochaines Étapes

1. Tester que le backend démarre correctement
2. Tester que le frontend se connecte au backend
3. Vérifier que les endpoints API fonctionnent
4. Supprimer l'ancienne structure `src/indicateurs/` si tout fonctionne
