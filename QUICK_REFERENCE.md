# 🚀 QUICK REFERENCE - Project Setup & Deployment

## 🎯 TL;DR - One Page Summary

### For Current Device (You)
Everything is already working! Just remember to **update requirements.txt** when you add new packages:

```bash
# After installing any new package
pip freeze > requirements.txt
```

### For Another Device (or Backup)

```bash
# 1. Extract ZIP
unzip mbc-backup.zip && cd mbc

# 2. Install everything (EXACT versions)
pip install -r requirements.txt
npm ci  # Use npm ci, not npm install

# 3. Configure
# Create .env file with:
# MONGODB_URI=mongodb://localhost:27017/mbc
# JWT_SECRET=your-secret-key

# 4. Run
python backend/main.py    # Terminal 1
npm run dev               # Terminal 2
```

---

## 📦 What Changed?

### Python (requirements.txt - UPDATED)
- ✅ Added: `argon2-cffi==25.1.0` (password hashing)
- ✅ Upgraded: All packages to latest compatible versions
- ✅ Pinned: All versions to specific numbers (not ranges)

### Code Changes
1. **backend/auth.py** - Added argon2 password support
2. **backend/main.py** - Fixed CORS configuration
3. **src/components/CallModal.tsx** - Fixed WebRTC cross-device calling
4. **src/config.ts** - Added TURN server support

### Node (package.json)
- ✅ No changes needed
- ✅ All versions locked in package-lock.json

---

## 📋 Files to Include When Zipping

✅ **DO Include**:
```
requirements.txt          ← MOST IMPORTANT
package.json             ← MOST IMPORTANT
package-lock.json        ← MOST IMPORTANT
backend/                 ← Source code
src/                     ← Source code
public/                  ← Assets
tests/                   ← Tests
docs/                    ← Documentation
*.md files               ← Important guides
```

❌ **DON'T Include**:
```
node_modules/            ← Recreate with npm ci
.venv/ or venv/         ← Recreate with pip install
build/                  ← Recreate with npm run build
__pycache__/            ← Recreate on run
.env                    ← Create manually (secrets)
.git/                   ← Use GitHub to clone
```

---

## 🔍 Key Files This Time

### requirements.txt
**Before**:
```
fastapi>=0.104.0        # Range (could break)
uvicorn>=0.24.0         # Range (could break)
```

**After** (FIXED):
```
fastapi==0.123.9        # Exact version ✅
uvicorn[standard]==0.38.0  # Exact version ✅
```

**Why**: Exact versions guarantee same behavior everywhere

---

## ✨ Recent Fixes

### Issue 1: Cross-Device Video Calls Not Working
**Root Cause**: ICE candidates were dropped before connection established
**Fix**: Added candidate buffering in CallModal.tsx
**Status**: ✅ FIXED

### Issue 2: Password Hashing Failed
**Root Cause**: Bcrypt has 72-byte limit, no fallback hash
**Fix**: Added argon2-cffi support in auth.py
**Status**: ✅ FIXED

### Issue 3: CORS Errors on Login
**Root Cause**: Misconfigured CORS middleware
**Fix**: Updated main.py with proper origins
**Status**: ✅ FIXED

---

## 📞 What To Do Before Zipping

1. **Update requirements.txt**
   ```bash
   pip freeze > requirements.txt  # Gets all installed packages
   # OR just ensure new additions are there
   ```

2. **Test on current device**
   ```bash
   python backend/main.py
   npm run dev
   # Try login, calling, messaging
   ```

3. **Clean up (optional)**
   ```bash
   rm -rf node_modules/ build/ __pycache__/
   find . -name "*.pyc" -delete
   ```

4. **Create ZIP**
   ```bash
   Compress-Archive -Path mbc -DestinationPath mbc-backup.zip
   ```

5. **Test extract on another location**
   ```bash
   # Unzip to test folder and verify
   # Run pip install and npm ci to ensure it works
   ```

---

## 🎯 Testing After Extract on New Device

```bash
# Verify packages
pip list | grep argon2        # Should show argon2-cffi
pip list | grep socketio      # Should show python-socketio

# Verify Node
npm list react                # Should work without errors

# Start backend
cd backend && python main.py  # Should start without errors

# Start frontend (new terminal)
npm run dev                   # Should start without errors

# Open browser
http://localhost:3000        # Should load without errors

# Test login
email: admin@example.com
password: password           # Should work

# Test calling
Open two browser tabs → Login as admin & doctor → Test call
# Should see video/audio from both (if on same WiFi)
```

---

## ⚠️ Common Issues on New Device

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| `npm ERR!` | Run `npm ci` instead of `npm install` |
| Port 8000 in use | Kill process: `netstat -ano \| find ":8000"` then `taskkill /PID <PID>` |
| MongoDB connection fails | Check `.env` has correct `MONGODB_URI` |
| Camera permission denied | Grant in browser settings |
| Video call no audio | Check microphone is enabled |

---

## 📚 Documentation Files

After extracting ZIP, read in this order:

1. **README.md** - Project overview
2. **SETUP_AND_DEPLOYMENT.md** - Detailed setup (15 pages)
3. **CHANGES_SUMMARY.md** - What changed and why
4. **WEBRTC_SETUP_GUIDE.md** - Video calling setup (if cross-network needed)
5. **ZIP_DEPLOYMENT_CHECKLIST.md** - Complete ZIP guide

---

## 🔐 Security Reminder

### .env file (CREATE MANUALLY, don't include in ZIP)
```
MONGODB_URI=mongodb://username:password@host:27017/dbname
JWT_SECRET=your-super-secret-key-here
```

### Never commit to Git:
- `.env`
- `node_modules/`
- `venv/` or `.venv/`
- `__pycache__/`

---

## ✅ Deployment Readiness Checklist

Before zipping:
- [ ] All code changes committed
- [ ] requirements.txt has exact versions
- [ ] package.json and package-lock.json present
- [ ] No node_modules or venv in ZIP
- [ ] Tested on current device (login, calling, messaging)
- [ ] Documentation files included
- [ ] ZIP extracts correctly in test location
- [ ] pip install -r requirements.txt works after extract
- [ ] npm ci works after extract

---

## 🎉 Success Criteria

After setup on new device, these should work:

✅ Backend starts on http://localhost:8000
✅ Frontend starts on http://localhost:3000
✅ Can log in without errors
✅ Can access messaging
✅ Can initiate video calls (same device)
✅ Can accept video calls (same device)
✅ Browser console has no critical errors
✅ Backend terminal has no critical errors

**If all above work → Ready for deployment!** 🚀

---

## 📞 Emergency Commands

If something breaks:

```bash
# Nuclear option: reinstall everything fresh
rm -rf node_modules venv build __pycache__
pip install -r requirements.txt
npm ci
npm run build

# Check what's installed
pip list
npm list

# Clear cache and try again
pip cache purge
npm cache clean --force
npm ci

# Start fresh backends
python backend/main.py
npm run dev
```

---

## 🎯 Remember

**Key to reproducibility**: 
- ✅ Exact package versions in requirements.txt
- ✅ Package-lock.json for npm
- ✅ .env file configured separately
- ✅ Source code files included
- ✅ Build artifacts NOT included

**Result**: Same project, same device, different location = Works perfectly!**

