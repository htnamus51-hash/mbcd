# MBC Deployment Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `mbc` (or your preferred name)
3. **Do NOT initialize with README** (we already have one)
4. Click "Create repository"

## Step 2: Link Local Repository to GitHub

After creating the repo, GitHub will show you commands. Run these in your terminal:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/mbc.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally (one-time)
npm install -g vercel

# Deploy from project root
cd c:\Users\suman\Downloads\MBC
vercel
```

Follow the prompts:
- Link to existing project or create new
- Select `./` as root directory
- Build command: `npm run build`
- Output directory: `dist`

### Option B: Connect via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import GitHub repository
4. Select your `mbc` repository
5. Vercel will auto-detect settings
6. Click "Deploy"

## Step 4: Configure Environment Variables (if needed)

In Vercel Dashboard:
1. Go to project settings
2. Click "Environment Variables"
3. Add backend API URL if using external API:
   - `VITE_API_URL`: Your backend URL
   - `VITE_BACKEND_URL`: Backend API endpoint

## Frontend Build

The frontend is built with Vite and automatically builds when you push to GitHub.

Build command: `npm run build`
Output: `dist/`

## Backend Deployment (Optional)

For the Python backend, you have options:
- **Railway.app** - Simple Python deployment
- **Render.com** - Free tier available
- **PythonAnywhere** - Python-specific hosting
- **Heroku** (paid)

## Future Updates

After this initial setup, any changes you push to GitHub will automatically deploy to Vercel:

```bash
# Make changes locally
# Edit files as needed

# Commit changes
git add .
git commit -m "feat: description of changes"

# Push to GitHub (and Vercel auto-deploys)
git push
```

## Quick Command Reference

```bash
# Check git status
git status

# Stage all changes
git add .

# Commit with message
git commit -m "feat: your message"

# Push to GitHub
git push

# View commit history
git log --oneline
```

---

**Your Live URL**: Will be provided after Vercel deployment
**GitHub URL**: https://github.com/YOUR_USERNAME/mbc
