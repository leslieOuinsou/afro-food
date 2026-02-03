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

---

## Déploiement sur Vercel (frontend + backend)

Tu peux déployer **le frontend et le backend** sur Vercel en créant **deux projets** (même dépôt Git, racines différentes).

### 1. Projet Vercel « Frontend »

1. Va sur [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Importe le dépôt **afro-food** (ou ton fork).
3. **Root Directory** : clique sur **Edit** et choisis **`frontend`**.
4. **Variables d’environnement** : ajoute  
   - **Nom** : `NEXT_PUBLIC_API_URL`  
   - **Valeur** : l’URL de ton **backend** (voir étape 2). Ex. `https://afro-food-api-xxx.vercel.app`
5. **Deploy**. Tu obtiendras une URL du type `https://afro-food-xxx.vercel.app`.

### 2. Projet Vercel « Backend » (API)

1. **Add New** → **Project** et importe **le même dépôt** afro-food.
2. **Root Directory** : choisis **`backend`** (et non `frontend`).
3. **Variables d’environnement** (obligatoires pour l’API) :
   - **Nom** : `MONGODB_URI`  
     **Valeur** : ton URI MongoDB Atlas (ex. `mongodb+srv://user:pass@cluster.mongodb.net/afro-food`)
   - **Nom** : `JWT_SECRET`  
     **Valeur** : une chaîne secrète longue et aléatoire
   - **Nom** : `FRONTEND_URL` (optionnel)  
     **Valeur** : l’URL de ton frontend Vercel (ex. `https://afro-food-xxx.vercel.app`) pour CORS
4. **Deploy**. Tu obtiendras une URL du type `https://afro-food-api-xxx.vercel.app`.
5. L’API est exposée sur **`/api`** :  
   - Ex. `https://afro-food-api-xxx.vercel.app/api/plats`  
   - Ex. `https://afro-food-api-xxx.vercel.app/api/contact`  
   - Ex. `https://afro-food-api-xxx.vercel.app/health`

### 3. Relier frontend et backend

1. Dans le **projet Vercel Frontend**, va dans **Settings** → **Environment Variables**.
2. Mets à jour **`NEXT_PUBLIC_API_URL`** avec l’URL exacte du projet Backend (ex. `https://afro-food-api-xxx.vercel.app`).
3. Redéploie le frontend (ou attends le prochain push) pour que le changement soit pris en compte.

### Résumé

| Projet   | Root Directory | Rôle                          |
|----------|----------------|-------------------------------|
| Frontend | `frontend`     | Site Next.js (pages, panier)  |
| Backend  | `backend`      | API Express (plats, commandes, contact, etc.) |

Les deux projets se mettent à jour à chaque push sur la branche connectée (ex. `main` ou `backend`).
