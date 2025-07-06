# Vercel Deployment Guide - Diff Pod MVP

## Quick Setup (5 minutes)

### Step 1: Run the Setup Script
```bash
cd /Users/meddya/Downloads/diff-pod
chmod +x setup-deployment.sh
./setup-deployment.sh
```

### Step 2: Create GitHub Repository
1. Go to [GitHub New Repository](https://github.com/new)
2. Repository name: `diff-pod-mvp`
3. Description: `Diff Pod MVP - Conference podcast management platform`
4. **Don't** initialize with README (you already have one)
5. Click "Create repository"

### Step 3: Push to GitHub
Replace `YOUR_USERNAME` with your actual GitHub username:
```bash
git remote add origin https://github.com/YOUR_USERNAME/diff-pod-mvp.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login (use GitHub account)
3. Click "New Project"
4. Import your `diff-pod-mvp` repository
5. Vercel will auto-detect it's a Vite project
6. Click "Deploy"

## What Vercel Will Do Automatically

✅ **Install dependencies** (`npm install`)
✅ **Build the project** (`npm run build`)
✅ **Deploy to CDN** (global edge network)
✅ **Generate live URL** (e.g., `https://diff-pod-mvp.vercel.app`)
✅ **Set up automatic deployments** (future pushes auto-deploy)

## Your MVP Features Ready to Demo

- **Dashboard**: Media groups with analytics
- **Portfolios**: Conference management
- **Events**: Session upload workflow
- **Analytics**: Charts and metrics
- **Public Recaps**: Shareable content
- **Settings**: User preferences

## Demo Data Included

✅ Rich mock data for all features
✅ Professional UI/UX
✅ Mobile responsive design
✅ Supabase integration ready
✅ Full functionality working

## After Deployment

1. **Test all features** with demo data
2. **Share the live URL** for feedback
3. **Customize branding** as needed
4. **Add real data** when ready

Your MVP will be live and ready to demo! 🚀 