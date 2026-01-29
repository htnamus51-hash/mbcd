# MBC Project - ZIP Deployment Checklist

## 📦 What to Include When Zipping

When you zip the project to send to another device, include these files:

### ✅ MUST INCLUDE (Required for functionality)

```
mbc/
├── requirements.txt          ✅ Python dependencies (PINNED VERSIONS)
├── package.json              ✅ Node.js dependencies
├── package-lock.json         ✅ Locked npm versions
├── tsconfig.json            ✅ TypeScript config
├── tsconfig.node.json       ✅ TypeScript Node config
├── vite.config.ts           ✅ Vite build config
├── playwright.config.ts     ✅ Test config
│
├── backend/
│   ├── main.py              ✅ Main backend (FIXED)
│   ├── auth.py              ✅ Auth module (UPDATED with argon2)
│   ├── database.py          ✅ Database connection
│   ├── data_api.py          ✅ Data API module
│   ├── jwt_utils.py         ✅ JWT utilities
│   ├── schemas.py           ✅ Pydantic schemas
│   ├── pydantic_fix.py      ✅ Pydantic compatibility
│   ├── __init__.py
│   ├── messaging/
│   │   ├── __init__.py
│   │   ├── handlers.py      ✅ WebSocket handlers
│   │   ├── service.py       ✅ Messaging service
│   │   └── ...
│   └── ...
│
├── src/
│   ├── main.tsx             ✅ React entry point
│   ├── App.tsx              ✅ Main app component
│   ├── config.ts            ✅ App config (UPDATED)
│   ├── index.css            ✅ Styles
│   ├── main.tsx             ✅ Entry point
│   ├── components/
│   │   ├── CallModal.tsx    ✅ VIDEO CALLING (FIXED)
│   │   ├── LoginPage.tsx    ✅ Login component
│   │   ├── MessagingPage.tsx ✅ Messaging component
│   │   └── ... (all components)
│   ├── hooks/
│   │   ├── useSocket.ts     ✅ WebSocket hook
│   │   └── useMessages.ts   ✅ Messages hook
│   ├── services/
│   │   └── messagingApi.ts  ✅ API service
│   ├── types/
│   │   └── messaging.ts     ✅ Type definitions
│   ├── utils/
│   │   ├── emoji.ts         ✅ Emoji utils
│   │   └── notifications.ts ✅ Notification utils
│   └── styles/
│       └── globals.css      ✅ Global styles
│
├── public/
│   └── service-worker.js    ✅ Service worker
│
├── tests/
│   └── e2e/
│       └── group.spec.ts    ✅ Tests
│
├── tools/
│   ├── inspect_user.py      ✅ Utilities
│   ├── reset_admin_password.py
│   ├── reset_user_password.py
│   └── ...
│
├── docs/
│   └── NOTIFICATIONS_AND_TESTS.md
│
└── Documentation/
    ├── README.md                        ✅ Project README
    ├── SETUP_AND_DEPLOYMENT.md          ✅ Setup guide (NEW)
    ├── CHANGES_SUMMARY.md               ✅ Changes list (NEW)
    ├── WEBRTC_CALLING_ANALYSIS.md       ✅ Calling analysis (NEW)
    ├── WEBRTC_FIX_SUMMARY.md            ✅ Fix summary (NEW)
    ├── WEBRTC_SETUP_GUIDE.md            ✅ TURN setup (NEW)
    ├── DEPLOYMENT_GUIDE.md              ✅ Deployment guide
    └── MESSAGING_FEATURE_GUIDE.md       ✅ Messaging guide
```

---

## ❌ DO NOT INCLUDE (Large or unnecessary)

```
.git/                    ❌ Git history (not needed, can clone from GitHub)
node_modules/           ❌ Node packages (recreate with `npm install`)
.venv/ or venv/        ❌ Python virtualenv (recreate with `pip install`)
build/                 ❌ Build artifacts (recreate with `npm run build`)
__pycache__/           ❌ Python cache (recreate on run)
*.log                  ❌ Log files (generate on run)
.DS_Store              ❌ macOS files
Thumbs.db              ❌ Windows thumbnails
.env                   ❌ Secrets/API keys (configure separately)
```

---

## 📝 Files to Create on New Device

Create these files on the new device (not in zip):

### `.env` (Backend environment)
```bash
MONGODB_URI=mongodb://localhost:27017/mbc
JWT_SECRET=your-secret-key
DEBUG=True
```

### `.env.local` (Frontend environment - optional)
```bash
VITE_API_URL=http://localhost:8000
VITE_TURN_SERVERS='[{"urls":"turn:your-server.com:3478","username":"user","credential":"pass"}]'
```

---

## 🗜️ Steps to Create ZIP

### Using Windows:
```bash
# Navigate to parent directory of mbc
cd "C:\Users\YourName\OneDrive\Documents"

# Right-click mbc folder → Send to → Compressed (zipped) folder
# Or use PowerShell:
Compress-Archive -Path mbc -DestinationPath mbc-backup.zip
```

### Using Command Line:
```bash
cd "C:\Users\YourName\OneDrive\Documents"
tar -czf mbc-backup.tar.gz mbc/
```

---

## 📦 Recommended ZIP Structure

```
mbc-backup.zip
└── mbc/
    ├── backend/
    ├── src/
    ├── public/
    ├── tests/
    ├── tools/
    ├── docs/
    ├── requirements.txt              ← KEY FILE
    ├── package.json                  ← KEY FILE
    ├── package-lock.json             ← KEY FILE
    ├── vite.config.ts
    ├── tsconfig.json
    ├── SETUP_AND_DEPLOYMENT.md       ← READ THIS FIRST
    ├── CHANGES_SUMMARY.md
    ├── README.md
    └── ... (other config files)
```

---

## 🚀 Setup on New Device (from ZIP)

```bash
# Step 1: Extract ZIP
unzip mbc-backup.zip

# Step 2: Navigate to project
cd mbc

# Step 3: Install Python (exact versions from requirements.txt)
pip install -r requirements.txt

# Step 4: Install Node (exact versions from package-lock.json)
npm ci

# Step 5: Create .env file
# Edit .env with your MongoDB URI

# Step 6: Run application
# Terminal 1: python backend/main.py
# Terminal 2: npm run dev
```

---

## ✅ Verification After Extract

```bash
# Check Python packages
pip list | grep -E "fastapi|uvicorn|argon2|python-socketio"

# Check Node packages
npm list --depth=0 | head -20

# Verify key files
ls -la requirements.txt package.json SETUP_AND_DEPLOYMENT.md
```

---

## 🎯 File Sizes Reference

For your reference when checking ZIP:

```
Uncompressed:
  node_modules/          ~500 MB  (DO NOT INCLUDE)
  backend/              ~5 MB
  src/                  ~3 MB
  docs/                 ~1 MB
  requirements.txt      ~2 KB
  package.json          ~5 KB
  ---
  TOTAL (without node_modules):  ~10 MB ✅
  TOTAL (with node_modules):     ~510 MB ❌ TOO LARGE!

Compressed ZIP (without node_modules):  ~2-3 MB ✅
```

---

## 📋 Pre-ZIP Cleanup (Optional)

Before creating ZIP, optionally clean these:

```bash
# Remove __pycache__ folders
find . -type d -name __pycache__ -exec rm -rf {} +

# Remove .pyc files
find . -type f -name "*.pyc" -delete

# Remove build folder
rm -rf build/

# Remove any .log files
rm -f *.log
```

---

## ✨ Final Checklist Before Zipping

- [ ] `requirements.txt` exists with all pinned versions
- [ ] `package.json` and `package-lock.json` exist
- [ ] `node_modules/` folder NOT included in ZIP
- [ ] `.venv/` or `venv/` folder NOT included in ZIP
- [ ] All source code files included (backend/, src/, etc.)
- [ ] Documentation files included (*.md)
- [ ] ZIP file size reasonable (~2-5 MB)
- [ ] Test extract ZIP in test folder to verify contents

---

## 📞 If Setup Fails on New Device

1. **Check file was extracted correctly**
   ```bash
   ls -la  # Should see backend/, src/, requirements.txt, etc.
   ```

2. **Re-run pip install**
   ```bash
   pip install -r requirements.txt --force-reinstall
   ```

3. **Re-run npm install**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check Python/Node versions**
   ```bash
   python --version    # Should be 3.10+
   node --version      # Should be 18+
   ```

5. **Check for .env file**
   ```bash
   ls -la .env         # Should exist with MongoDB URI
   ```

---

## 🎉 Success Indicators

After setup on new device, you'll see:

✅ Backend starts: `INFO: Application startup complete`
✅ Frontend starts: `Local: http://localhost:5173`
✅ No Python errors in console
✅ No npm build errors
✅ Browser opens app without errors
✅ Can log in successfully
✅ Calling works (same device, then different devices)

**All systems go!** 🚀

