# Quick Railway Deployment

## 🚂 Deploy Backend to Railway (10 minutes)

### 1. Sign Up
- Go to [railway.app](https://railway.app)
- Login with GitHub
- Get $5 free credit/month

### 2. Create Project
- **"New Project"** → **"Deploy from GitHub repo"**
- Select: `imregular/url_shortner`

### 3. Configure Service
**Settings**:
- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

### 4. Add Database
- **"+ New"** → **"Database"** → **"PostgreSQL"**
- Auto-configured!

### 5. Add Redis (Optional)
- **"+ New"** → **"Database"** → **"Redis"**
- Auto-configured!

### 6. Environment Variables
Go to **"Variables"** tab:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://your-app.vercel.app
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
REDIS_CACHE_TTL=3600
```

### 7. Generate Domain
- **"Settings"** → **"Networking"** → **"Generate Domain"**
- Copy URL: `https://your-backend.up.railway.app`

### 8. Test
Visit: `https://your-backend.up.railway.app/health`

✅ Should see: `{"status": "OK", "message": "Server is running"}`

---

## 🎨 Deploy Frontend to Vercel (5 minutes)

### 1. Update .env.production
```env
VITE_API_URL=https://your-backend.up.railway.app
```

### 2. Commit & Push
```bash
git add .
git commit -m "Update Railway backend URL"
git push origin main
```

### 3. Deploy to Vercel
- Go to [vercel.com](https://vercel.com)
- **"Import"** → `imregular/url_shortner`
- Root Directory: `frontend/my-frontend`
- Framework: Vite
- Add env var: `VITE_API_URL=https://your-backend.up.railway.app`
- **"Deploy"**

### 4. Update Backend CORS
In Railway, update `FRONTEND_URL` to your Vercel URL

---

## 🎉 Done!

Your app is live:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.up.railway.app`
- **Database**: Railway PostgreSQL
- **Cache**: Railway Redis

**Cost**: FREE ($5 credit covers everything!)

For detailed guide, see `railway_deployment.md`
