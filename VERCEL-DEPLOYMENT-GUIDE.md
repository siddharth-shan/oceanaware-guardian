# Vercel Deployment Guide for OceanAware Guardian

**Platform:** Vercel (vercel.com)
**Framework:** React + Vite
**Build Time:** ~2-3 minutes
**Deployment Type:** Static Frontend (No Database Required)

---

## ✅ What Works Without a Database

Your OceanAware Guardian app is **perfectly suited for Vercel** because all core features work client-side:

### Fully Functional Features:
- ✅ **AI Ocean Guardian** - All training, testing, certificates (uses browser state)
- ✅ **Captain Marina's Story** - Interactive storybook with quizzes
- ✅ **Interactive Coastal Story** - Scroll-based time travel narrative
- ✅ **Data Art Triptych** - Ocean data visualizations
- ✅ **Ocean Sounds** - Data sonification
- ✅ **Art Generator** - Custom ocean art creation
- ✅ **Conservation Games** - All 3 games (Tsunami Escape, Rebuild Coast, etc.)
- ✅ **Ocean Curriculum** - All lesson plans, experiments, worksheets
- ✅ **Dashboard** - Ocean health metrics and navigation
- ✅ **Policy Engine** - Action recommendations and progress tracking

### Storage Method:
- **LocalStorage** - User progress, preferences, quiz answers
- **LocalForage** - Offline caching, data persistence
- **Browser State** - Real-time interactions, game states

### What You DON'T Need:
- ❌ Backend server
- ❌ Database (PostgreSQL, MongoDB, etc.)
- ❌ User authentication backend (uses Firebase client SDK if needed)
- ❌ Server-side API routes (all data is static or from external APIs)

---

## 🚀 Deployment Methods

Choose **ONE** of these methods:

---

## Method 1: Deploy via Vercel CLI (Recommended - Fastest)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate. Use your:
- GitHub account (recommended)
- GitLab account
- Bitbucket account
- Email

### Step 3: Deploy from Project Root

```bash
# Navigate to project directory
cd /home/user/oceanaware-guardian

# Deploy to production
vercel --prod
```

**The CLI will ask:**

1. **"Set up and deploy?"** → Press `Y`
2. **"Which scope?"** → Select your account
3. **"Link to existing project?"** → Press `N` (first time)
4. **"What's your project's name?"** → Press Enter (uses `oceanaware-guardian`)
5. **"In which directory is your code located?"** → Press Enter (uses `./`)
6. **"Want to override settings?"** → Press `N`

**Deployment will:**
- Build your app (`npm run build`)
- Upload `dist/` folder
- Provide you with live URLs:
  - Production: `https://oceanaware-guardian.vercel.app`
  - Deployment URL: `https://oceanaware-guardian-[hash].vercel.app`

### Step 4: Done! 🎉

Visit your URL: `https://oceanaware-guardian.vercel.app`

**Future Deployments:**
```bash
# From project root
vercel --prod
```

---

## Method 2: Deploy via Vercel Website (Good for GitHub Integration)

### Step 1: Push Code to GitHub

```bash
# If not already pushed
git push origin claude/review-ocean-contest-018iprzBm2nWyGnt6rHkwpdS
```

### Step 2: Import Project on Vercel

1. Go to **https://vercel.com**
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your **GitHub account**
5. Find **`oceanaware-guardian`** repository
6. Click **"Import"**

### Step 3: Configure Build Settings

Vercel will auto-detect Vite. Verify these settings:

**Framework Preset:** Vite
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`
**Node Version:** 18.x or higher

### Step 4: Deploy

Click **"Deploy"**

Vercel will:
- Install dependencies (~2 min)
- Build your app (`vite build`) (~1 min)
- Deploy to global CDN (~30 sec)

### Step 5: Get Your URLs

After deployment completes:
- **Production URL:** `https://oceanaware-guardian.vercel.app`
- **Preview URL:** `https://oceanaware-guardian-git-[branch]-[username].vercel.app`

### Step 6: Enable Auto-Deployments

**Automatic deployments are enabled by default:**
- **Push to main branch** → Production deployment
- **Push to any branch** → Preview deployment
- **Pull requests** → Automatic preview URLs

---

## Method 3: Deploy via Vercel GitHub Integration (Easiest for Teams)

### Step 1: Connect GitHub Repository

1. Visit **https://vercel.com/new**
2. Authorize Vercel to access your GitHub
3. Select **`oceanaware-guardian`** repository
4. Click **"Import"**

### Step 2: Configure Project

- **Project Name:** `oceanaware-guardian`
- **Framework:** Vite (auto-detected)
- **Root Directory:** `./` (leave default)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Step 3: Add Environment Variables (Optional)

If you have any API keys (NOAA, weather APIs, etc.):

Click **"Environment Variables"** and add:
```
VITE_NOAA_API_KEY=your_key_here
VITE_FIREBASE_API_KEY=your_key_here
```

**Note:** Vite requires `VITE_` prefix for env variables to be exposed to the client.

### Step 4: Deploy

Click **"Deploy"**

### Step 5: Automatic Future Deployments

Every `git push` will automatically:
- Trigger new deployment
- Run build process
- Update live site
- Generate preview URLs for PRs

---

## 📝 Pre-Deployment Checklist

Before deploying, ensure:

### 1. Dependencies are Clean

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 2. Build Works Locally

```bash
# Test production build
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:4173` to test the production build locally.

### 3. No Build Errors

Check for:
- ✅ No TypeScript errors
- ✅ No ESLint warnings (if strict)
- ✅ All imports resolve correctly
- ✅ No missing dependencies

### 4. Environment Variables (if needed)

Create `.env.production` if you have production-specific variables:

```bash
# .env.production
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.noaa.gov
```

**Important:** Never commit `.env` files with secrets!

### 5. Verify vercel.json Exists

```bash
ls -la vercel.json
```

Should show the configuration file we created.

---

## 🔧 Build Configuration Details

### Current Setup (vite.config.js):

```javascript
{
  buildCommand: "vite build",
  outDir: "dist",
  chunkSplitting: {
    vendor: ['react', 'react-dom'],
    maps: ['react-leaflet', 'leaflet'],
    ui: ['lucide-react', 'framer-motion']
  }
}
```

### What Vercel Does:

1. **Installs dependencies** - Runs `npm install`
2. **Builds app** - Runs `npm run build` (which runs `vite build`)
3. **Outputs to `dist/`** - Static files ready for CDN
4. **Deploys globally** - Files served from edge network
5. **Configures routing** - SPA routing handled via rewrites

---

## 🌍 Post-Deployment Configuration

### Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `oceanaware.org`
4. Follow DNS configuration instructions
5. Vercel provides SSL certificate automatically

### Environment Variables

Add in **Project Settings** → **Environment Variables**:

```
VITE_NOAA_API_KEY=abc123
VITE_FIREBASE_API_KEY=xyz789
```

**After adding:** Trigger redeploy for changes to take effect.

### Performance Optimizations

Vercel automatically provides:
- ✅ **Global CDN** - Files served from nearest edge location
- ✅ **Compression** - Gzip/Brotli compression
- ✅ **Caching** - Smart cache headers
- ✅ **Image Optimization** - Automatic image optimization (if using Vercel Image)
- ✅ **SSL/HTTPS** - Free SSL certificates
- ✅ **HTTP/2** - Enabled by default

---

## 🧪 Testing Your Deployment

### 1. Smoke Test All Features

After deployment, test:

- [ ] **Dashboard loads** - Visit homepage
- [ ] **AI Ocean Guardian** - Complete training flow
- [ ] **Captain Marina Story** - Read chapters, take quizzes
- [ ] **Interactive Story** - Scroll through time periods
- [ ] **Data Art** - View and generate visualizations
- [ ] **Ocean Sounds** - Play sonification
- [ ] **Games** - Play all 3 games
- [ ] **Curriculum** - Download worksheets
- [ ] **Mobile responsive** - Test on phone/tablet

### 2. Check Performance

Use **Vercel Analytics** (free tier):
- Real user monitoring
- Core Web Vitals
- Performance insights

Or use external tools:
- **Lighthouse** - Chrome DevTools
- **WebPageTest** - webpagetest.org
- **GTmetrix** - gtmetrix.com

**Target Scores:**
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90

### 3. Check Console for Errors

Open browser DevTools → Console:
- ❌ Should see NO errors
- ⚠️ Warnings are usually okay
- ℹ️ Info logs are fine

### 4. Test Offline Functionality

Your app uses LocalForage, so test:
1. Load app while online
2. Open DevTools → Network → Check "Offline"
3. Navigate between pages
4. Core features should still work

---

## 🐛 Troubleshooting Common Issues

### Issue 1: Build Fails - "Cannot find module"

**Problem:** Missing dependency

**Solution:**
```bash
# Check package.json has all dependencies
npm install
npm run build
```

### Issue 2: Blank Page After Deployment

**Problem:** Routing issue or build error

**Solution:**
```bash
# Check browser console for errors
# Verify vercel.json has correct rewrites
# Ensure index.html is in dist/
```

**Check `vercel.json` has:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Issue 3: API Calls Failing (404/CORS)

**Problem:** External API configuration

**Solution:**
- External APIs (NOAA, USGS) should work fine (CORS-enabled)
- If using your own backend, you'd need Vercel serverless functions
- For this app, all features are client-side, so this shouldn't be an issue

### Issue 4: Large Bundle Size Warning

**Problem:** Bundle too large

**Solution:**
```bash
# Already configured in vite.config.js
# Code splitting for vendor, maps, ui chunks
# Should be under 1MB total
```

### Issue 5: Environment Variables Not Working

**Problem:** Missing `VITE_` prefix

**Solution:**
```bash
# ❌ Wrong
API_KEY=abc123

# ✅ Correct
VITE_API_KEY=abc123
```

**Access in code:**
```javascript
const apiKey = import.meta.env.VITE_API_KEY;
```

---

## 📊 Deployment Stats

**Expected Performance:**

| Metric | Value |
|--------|-------|
| Build Time | 2-3 minutes |
| Deploy Time | 30 seconds |
| Bundle Size | ~800KB (gzipped) |
| Load Time | <2 seconds (global) |
| Lighthouse Score | 90+ |
| Edge Locations | 70+ worldwide |

---

## 💰 Vercel Pricing (as of 2024)

### Hobby Plan (FREE)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Custom domains
- ✅ Global CDN
- **Perfect for OceanAware Guardian!**

### Pro Plan ($20/month) - Only if you need:
- Team collaboration
- Advanced analytics
- Password protection
- Increased bandwidth (1TB)

**Recommendation:** Start with Hobby (free). Your contest app will work perfectly on free tier.

---

## 🔐 Security Best Practices

### 1. Environment Variables

**Never commit:**
- `.env`
- `.env.local`
- `.env.production`

**Already in `.gitignore`:**
```
.env
.env.local
.env.production
```

### 2. API Keys

For external APIs:
- Store in Vercel environment variables
- Use `VITE_` prefix for client-side variables
- Rotate keys regularly

### 3. Content Security Policy

Already configured in `vercel.json`:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

---

## 📈 Monitoring & Analytics

### Built-in Vercel Analytics (Free)

Enable in **Project Settings** → **Analytics**:
- Real user monitoring
- Core Web Vitals (LCP, FID, CLS)
- Page load times
- Geographic distribution

### External Analytics (Optional)

Add to your app:
- **Google Analytics 4** - User behavior
- **Plausible** - Privacy-friendly analytics
- **Umami** - Open-source, self-hosted

---

## 🚦 Deployment Workflow

### Development → Staging → Production

**1. Local Development:**
```bash
npm run dev
# Test at http://localhost:5173
```

**2. Preview Deployment (Auto on PR):**
```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
# Create PR → Vercel auto-deploys preview
```

**3. Production Deployment:**
```bash
git checkout main
git merge feature/new-feature
git push origin main
# Vercel auto-deploys to production
```

---

## 📞 Support & Resources

### Vercel Documentation
- Deploying Vite: https://vercel.com/guides/deploying-vite
- Environment Variables: https://vercel.com/docs/environment-variables
- Custom Domains: https://vercel.com/docs/custom-domains

### Troubleshooting
- Vercel Status: https://vercel-status.com
- Community Forum: https://github.com/vercel/vercel/discussions
- Discord: https://vercel.com/discord

---

## ✅ Final Deployment Checklist

Before going live with your Bow Seat submission:

- [ ] Build passes locally (`npm run build`)
- [ ] All features tested in preview
- [ ] No console errors
- [ ] Mobile responsive verified
- [ ] Performance score >90
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled
- [ ] SSL certificate active (automatic)
- [ ] Social media meta tags added
- [ ] Favicon included
- [ ] README updated with live URL

---

## 🎉 Quick Start Commands

**Deploy in 60 seconds:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd /home/user/oceanaware-guardian
vercel --prod

# Done! Visit your URL
```

**That's it!** Your OceanAware Guardian app will be live at:
- `https://oceanaware-guardian.vercel.app`

---

## 🌊 Share Your Deployment

After deployment, share your live URL:

**For Bow Seat Contest:**
- Add to submission form
- Include in artist statement
- Share in video walkthrough

**For Social Media:**
```
🌊 OceanAware Guardian is LIVE!

Train AI to protect our oceans 🤖
Play conservation games 🎮
Learn marine science 🐠
Access free curriculum 📚

Try it now: https://oceanaware-guardian.vercel.app

#BowSeat2026 #OceanConservation #AIforGood
```

**For Teachers/Educators:**
```
Free ocean conservation education platform now live!

✅ NGSS-aligned lessons
✅ AI/ML training for students
✅ Interactive games & experiments
✅ Downloadable worksheets

Explore: https://oceanaware-guardian.vercel.app
```

---

**Your app is production-ready. Go deploy and inspire 10,000 ocean guardians!** 🌊🚀

*Last Updated: November 2025*
