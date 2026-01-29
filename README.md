# Afro-Food

Application de commande de plats africains (Afro-Eats).

## Structure du projet

```
afro-food/
├── frontend/     # Application Next.js (interface utilisateur)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/      # API Express + MongoDB
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── ...
└── README.md
```

## Démarrage

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

### Backend (API Express)

```bash
cd backend
npm install
npm run dev
```

L’API tourne sur [http://localhost:5000](http://localhost:5000).

### Variables d’environnement

- **frontend** : créer `frontend/.env.local` avec `NEXT_PUBLIC_API_URL=http://localhost:5000`
- **backend** : créer `backend/.env` avec `MONGODB_URI`, `PORT`, etc.

## Scripts utiles (depuis la racine)

- `cd frontend && npm run dev` — lancer le frontend
- `cd backend && npm run dev` — lancer le backend
