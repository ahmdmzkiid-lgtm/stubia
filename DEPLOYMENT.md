# Panduan Deployment Eduzet

## 📦 Backend - Render.com

### Persiapan di Render
1. Buat akun di [render.com](https://render.com)
2. Connect GitHub repository Anda
3. Buat **Web Service** baru

### Konfigurasi di Render

**Basic Settings:**
- **Name:** `eduzet-backend` (atau nama yang Anda inginkan)
- **Region:** Singapore (atau pilih region terdekat)
- **Runtime:** Node

**Build & Deploy:**
- **Build Command:** `npm ci`
- **Start Command:** `npm start`
- **Root Directory:** `server` (karena backend di folder server)

**Environment Variables:**
Tambahkan di Environment section:
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/eduzet_db
JWT_SECRET=your_production_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
ALLOWED_DOMAINS=eduzet.my.id,www.eduzet.my.id
CORS_ORIGIN=https://eduzet.vercel.app
```

**Database (PostgreSQL):**
- Render menyediakan PostgreSQL, atau gunakan external database
- Jika menggunakan Render PostgreSQL, update `DATABASE_URL` dengan connection string

### Deploy Backend
```bash
# Render akan auto-deploy saat ada push ke branch main
# Atau klik "Deploy" button di Render dashboard
```

**Backend URL:** `https://eduzet-backend.onrender.com`

---

## 🚀 Frontend - Vercel

### Persiapan di Vercel
1. Buat akun di [vercel.com](https://vercel.com)
2. Connect GitHub repository Anda
3. Import project

### Konfigurasi di Vercel

**Project Settings:**
- **Framework Preset:** Vite
- **Root Directory:** `client`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`

**Environment Variables:**
Tambahkan di Environment Variables:
```
VITE_API_BASE_URL=https://eduzet-backend.onrender.com/api
```

### Deploy Frontend
```bash
# Vercel akan auto-deploy saat ada push ke branch main
# Atau klik "Deploy" button di Vercel dashboard
```

**Frontend URL:** `https://eduzet.vercel.app` (atau custom domain)

---

## 🔄 Workflow Deployment

### Deploy Backend
```bash
# 1. Push ke main branch
git add .
git commit -m "Update backend"
git push origin main

# 2. Render akan auto-detect dan deploy
# Monitor di https://dashboard.render.com
```

### Deploy Frontend
```bash
# 1. Push ke main branch
git add .
git commit -m "Update frontend"
git push origin main

# 2. Vercel akan auto-detect dan deploy
# Monitor di https://vercel.com/dashboard
```

---

## 📋 Checklist Sebelum Deploy

### Backend (Render)
- [ ] `.env` file NOT committed (gunakan `.env.example`)
- [ ] Database URL sudah di-set di Render
- [ ] JWT_SECRET sudah di-generate (strong & random)
- [ ] SMTP credentials sudah valid
- [ ] API endpoints sudah tested locally
- [ ] CORS_ORIGIN sudah set ke Vercel frontend URL

### Frontend (Vercel)
- [ ] `VITE_API_BASE_URL` sudah di-set ke Render backend
- [ ] Build command tested locally (`npm run build`)
- [ ] Environment variables sudah di-add ke Vercel
- [ ] API calls menggunakan `VITE_API_BASE_URL`

---

## 🆘 Troubleshooting

### Backend tidak connect ke Database
- Verifikasi `DATABASE_URL` di Render environment
- Pastikan database server online dan accessible
- Check Render logs untuk error messages

### Frontend API call failed (CORS)
- Pastikan backend `CORS_ORIGIN` include frontend URL
- Check browser console untuk CORS error details
- Verify `VITE_API_BASE_URL` di frontend

### Build fails di Render
- Check build logs di Render dashboard
- Pastikan `server/package.json` sudah include semua dependencies
- Verify `node_modules` tidak di-commit

### Build fails di Vercel
- Check build logs di Vercel dashboard
- Pastikan `client/package.json` sudah include semua dependencies
- Verify build command benar: `npm run build`

---

## 📝 Custom Domain Setup

### Backend di Render
1. Buka Render dashboard → Web Service Anda
2. Settings → Custom Domain
3. Add domain Anda (contoh: `api.eduzet.my.id`)
4. Update DNS records sesuai instruksi Render

### Frontend di Vercel
1. Buka Vercel dashboard → Project Anda
2. Settings → Domains
3. Add custom domain (contoh: `eduzet.my.id`)
4. Update DNS records sesuai instruksi Vercel

---

## 🔒 Security Best Practices

✅ **Lakukan:**
- Store semua secrets di environment variables
- Use strong JWT_SECRET (min 32 characters, random)
- Enable HTTPS (auto di Render & Vercel)
- Validate & sanitize semua user input
- Use CORS whitelist untuk domain yang authorized

❌ **Jangan:**
- Commit `.env` file ke git
- Use weak/default passwords untuk database
- Expose API keys di frontend code
- Allow wildcard CORS (`*`)
- Debug mode di production

---

## 📞 Support

**Render Support:** https://render.com/docs  
**Vercel Support:** https://vercel.com/docs  
**Project:** Eduzet - Platform Try Out & Latihan Soal
