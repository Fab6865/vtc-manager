# Déploiement VTC Manager sur Render (Gratuit)

## Étapes de déploiement

### 1. Créer un compte GitHub (si pas déjà fait)
- Va sur https://github.com
- Crée un compte gratuit

### 2. Pousser le projet sur GitHub
```bash
cd "c:\Users\legam\Desktop\Vtc Ets2\vtc-manager"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/vtc-manager.git
git push -u origin main
```

### 3. Créer un compte Render
- Va sur https://render.com
- Connecte-toi avec GitHub

### 4. Déployer sur Render
1. Clique sur **"New +"** → **"Web Service"**
2. Connecte ton repo GitHub `vtc-manager`
3. Configure :
   - **Name**: `vtc-manager`
   - **Environment**: `Node`
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `npm run server`
4. Ajoute les variables d'environnement :
   - `NODE_ENV` = `production`
5. Clique sur **"Create Web Service"**

### 5. Attendre le déploiement
- Render va builder et déployer ton app
- Tu recevras une URL comme `https://vtc-manager.onrender.com`

## Garder le serveur éveillé (important!)

Le plan gratuit de Render met le serveur en veille après 15 min d'inactivité.

### Option 1 : UptimeRobot (recommandé)
1. Va sur https://uptimerobot.com
2. Crée un compte gratuit
3. Ajoute un nouveau monitor :
   - **Type**: HTTP(s)
   - **URL**: `https://vtc-manager.onrender.com`
   - **Interval**: 5 minutes
4. Ça va ping ton serveur toutes les 5 min pour le garder éveillé

### Option 2 : Cron-job.org
1. Va sur https://cron-job.org
2. Crée un job qui ping ton URL toutes les 10 min

## Notes
- La base de données est stockée en mémoire (sql.js)
- Les données seront perdues si le serveur redémarre
- Pour une persistance permanente, il faudrait ajouter une vraie base de données (PostgreSQL sur Render)
