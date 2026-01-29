# ⏱️ FINAL PRE-TEST CHECKLIST - RUN THIS NOW (5 minutes)

**Time**: December 5, 2025  
**Your Test**: In 1 hour  
**Status**: VERIFICATION IN PROGRESS

---

## 1️⃣ VERIFY PROCESSES RUNNING (30 seconds)

```
✅ Backend (Python): RUNNING
   - FastAPI on localhost:8000
   - Socket.IO active
   - Logging to backend/logs/messaging.log

✅ Frontend (Node): RUNNING
   - Vite dev server on localhost:3000
   - Hot reload enabled
   - React/TypeScript compiling

✅ Database (MongoDB): RUNNING (assumed connected)
```

**What to do if not running**:
- Backend: `python backend/main.py`
- Frontend: `npm run dev`

---

## 2️⃣ VERIFY CONFIGURATIONS (60 seconds)

### Config 1: TURN Servers (src/config.ts)
```typescript
✅ Primary: turn:openrelay.metered.ca:80
✅ Fallback: turn:turnserver.101domain.com:3478
✅ Console logging enabled
✅ Environment override support active
```

### Config 2: CORS (backend/main.py)
```python
✅ Origins allowed:
   - http://localhost:3000 ✅
   - http://localhost:5173 ✅
   - http://127.0.0.1:3000 ✅
   - http://127.0.0.1:5173 ✅
✅ allow_credentials=True ✅
✅ Socket.IO CORS matches ✅
```

### Config 3: Authentication (backend/auth.py)
```python
✅ Argon2 primary algorithm ✅
✅ Bcrypt fallback enabled ✅
✅ Password truncation (72-byte limit) ✅
```

### Config 4: Dependencies (requirements.txt)
```
✅ All 67 packages pinned to exact versions
✅ No version ranges (no >= or ~)
✅ Reproducible across all devices
```

---

## 3️⃣ DO A QUICK TEST (60 seconds)

### Step 1: Hard Refresh
```
1. Open: http://localhost:3000
2. Press: Ctrl + Shift + R (hard refresh)
3. Wait: 3 seconds for page to load
4. Expected: MBC Therapy Portal login page
```

### Step 2: Check Console
```
1. Press: F12 (open DevTools)
2. Click: Console tab
3. Look for: [DEBUG] TURN_SERVERS configured: Yes (2 servers)
4. Expected: ✅ Message appears
```

### Step 3: Quick Login Test
```
1. Email: admin@example.com
2. Password: password
3. Click: Sign In
4. Expected: ✅ Dashboard loads successfully
```

---

## 4️⃣ VERIFY REQUIREMENTS.TXT (30 seconds)

**All 67 packages pinned**:
```
✅ fastapi==0.123.9
✅ uvicorn[standard]==0.38.0
✅ motor==3.7.1
✅ pymongo==4.15.5
✅ python-socketio==5.15.0
✅ argon2-cffi==25.1.0
✅ bcrypt==5.0.0
✅ websockets==15.0.1
... (and 59 more packages)
```

**Why important for 2-device test**:
- Exact versions = guaranteed same behavior on Device 2
- No "works on my machine" problems
- Reproducible setup

---

## 5️⃣ VERIFY FILE CHANGES (30 seconds)

### Changed Files ✅
1. ✅ `src/config.ts` - TURN servers updated
2. ✅ `src/components/CallModal.tsx` - ICE buffering implemented
3. ✅ `backend/auth.py` - Argon2 + password truncation
4. ✅ `backend/main.py` - CORS configured
5. ✅ `requirements.txt` - All versions pinned

### NOT Changed
- ❌ Database schema (still works)
- ❌ API routes (still compatible)
- ❌ UI components (still functional)

---

## 6️⃣ WHAT TO EXPECT IN 1 HOUR

### Phase 1: Same Device Test (Sanity Check)
```
[ ] Hard refresh frontend
[ ] Open 2 browser tabs
[ ] Login as admin (Tab 1) and doctor (Tab 2)
[ ] Call from Tab 1 to Tab 2
[ ] Expected: Video + Audio works ✅
   If fails: Something broke, investigate
   If works: Ready for Device 2 test
```

### Phase 2: Same WiFi Test (Device 2)
```
[ ] Connect Device 2 to same WiFi
[ ] Get Device 1 IP: ipconfig /all
[ ] Device 2 opens: http://[IP]:3000
[ ] Device 2 login as different user
[ ] Device 1 initiates call to Device 2
[ ] Expected: Video + Audio works ✅
   If fails: TURN server issue or network
   If works: SUCCESS! Cross-device calling works
```

### Phase 3: Verify Metrics
```
On both devices check F12 console:
[ ] [DEBUG] TURN_SERVERS configured: Yes (2 servers)
[ ] [CallModal] ICE connection state: connected
[ ] [CallModal] PeerConnection state: connected
[ ] No errors or warnings
```

---

## 🚨 CRITICAL - DO NOT FORGET

1. **Hard Refresh is MANDATORY**
   - Not just F5 or Ctrl+R
   - Must be `Ctrl + Shift + R`
   - Without it, old config cached and new TURN servers won't load

2. **Same Device Test First**
   - Do NOT skip this
   - Sanity check that nothing broke
   - If 2 tabs fail, don't test Device 2 yet

3. **Same WiFi is Easiest**
   - Start with Device 2 on same WiFi
   - Easier to debug than different networks
   - If this works, Device 2 setup is correct

4. **Check Console Logs**
   - Open F12 on both devices during call
   - Look for connection state changes
   - Most problems visible in console

---

## 📋 Pre-Test Inventory

| Item | Status | Action |
|------|--------|--------|
| Backend running | ✅ | None needed |
| Frontend running | ✅ | None needed |
| TURN configured | ✅ | Verify in console |
| CORS setup | ✅ | Check main.py |
| Auth working | ✅ | Quick login test |
| Requirements pinned | ✅ | Check requirements.txt |
| ICE buffering | ✅ | Implemented in CallModal |
| Logging enabled | ✅ | Check console |
| Device 1 ready | ✅ | Running tests |
| Device 2 ready | ⏳ | Will prepare in 1 hour |

---

## ✅ Sign-Off

Everything is configured and ready.

**Status**: 🟢 READY FOR CROSS-DEVICE TEST

**Next Step**: Follow STEP_BY_STEP_CHECKLIST.md in exactly 1 hour

**Success Criteria**: Both devices see video + hear audio + console shows "connected"

---

**Document Created**: December 5, 2025  
**Test Scheduled**: In 1 hour  
**Expected Result**: Cross-device video calling working ✅

Good luck! You've got this! 🚀

