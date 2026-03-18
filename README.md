# Chandrakanth Portfolio — Deployment Guide

## Files
- `index.html` — Portfolio website
- `server.js`  — Node.js backend (Groq AI proxy)
- `package.json` — Node config

---

## Option 1: Railway.app (FREE — Recommended ✅)

1. Go to https://github.com and create a new repository named `chandrakanth-portfolio`
2. Upload all 3 files (index.html, server.js, package.json)
3. Go to https://railway.app → Login with GitHub
4. Click **New Project** → **Deploy from GitHub repo**
5. Select your `chandrakanth-portfolio` repo
6. Railway auto-detects Node.js and runs `npm start`
7. Click **Generate Domain** → Get your public URL!

Your URL: https://chandrakanth-portfolio-xxxx.railway.app

---

## Option 2: Render.com (FREE ✅)

1. Push files to GitHub (same as above)
2. Go to https://render.com → New → Web Service
3. Connect GitHub repo
4. Set:  Build Command: (leave empty)  Start Command: node server.js
5. Click Deploy → Get your public URL

---

## Option 3: Run Locally

Requires Node.js (https://nodejs.org)

```
node server.js
```

Open http://localhost:3333
