# Backend - API FastAPI

## Installation

```bash
cd src/backend
python -m venv venv
source venv/bin/activate  # Sur Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Lancer le serveur

```bash
cd src/backend
source venv/bin/activate  # Sur Windows: .\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Le serveur sera accessible sur `http://localhost:8000`

## Structure

```
src/backend/
├── app/
│   ├── main.py              # Point d'entrée FastAPI
│   ├── api/
│   │   └── v1/
│   │       └── metadata.py  # Endpoints métadonnées
│   ├── services/            # Logique métier
│   ├── dao/                 # Accès base de données
│   ├── utils/               # Utilitaires (SQL translator)
│   └── ...
├── uploads/                 # Fichiers uploadés
└── requirements.txt
```

## API Documentation

Une fois le serveur lancé, accédez à :
- Documentation Swagger : `http://localhost:8000/docs`
- Documentation ReDoc : `http://localhost:8000/redoc`
