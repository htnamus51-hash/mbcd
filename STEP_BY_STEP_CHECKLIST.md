# ✅ STEP-BY-STEP CHECKLIST FOR CROSS-DEVICE TESTING

## 🎯 DO THIS RIGHT NOW (5 minutes)

### ✓ Step 1: Hard Refresh Frontend
```
[ ] Open browser with frontend (http://localhost:3000)
[ ] Press Ctrl + Shift + R (hard refresh, clears cache)
[ ] Wait 2-3 seconds for page to load
[ ] Open DevTools: Press F12
[ ] Click Console tab
[ ] Look for these messages:
    [ ] [DEBUG] API_URL: http://localhost:8000
    [ ] [DEBUG] TURN_SERVERS configured: Yes (2 servers)
    [ ] [DEBUG] TURN servers: [Array(2)]
[ ] If you see all 3 ✅ = Configuration loaded successfully
[ ] If not, try Ctrl+F5 and try again
```

### ✓ Step 2: Test Same Device (2 Browser Tabs)
```
[ ] Open Browser Tab 1: http://localhost:3000
[ ] Login as: admin@example.com / password
[ ] Open Browser Tab 2: http://localhost:3000
[ ] Login as: doctor@example.com / password
[ ] Tab 1: Search for "doctor" in messaging
[ ] Tab 1: Click VIDEO CALL button
[ ] Tab 2: Should see incoming call notification
[ ] Tab 2: Click ACCEPT CALL button
[ ] Check both tabs have:
    [ ] Own video visible (top left)
    [ ] Remote video visible (bottom right)
    [ ] Can hear audio from other tab
[ ] Tab 1: Press F12, check Console has:
    [ ] [CallModal] ICE connection state: connected
    [ ] [CallModal] PeerConnection state: connected
[ ] If all above ✅ = Same-device calling still works
[ ] If any ❌ = Something broke, hard refresh again
```

---

## 📱 THEN DO THIS (10 minutes)

### ✓ Step 3: Get Device 2 Ready
```
[ ] Have second device ready (phone, tablet, or laptop)
[ ] Make sure Device 2 has:
    [ ] Web browser installed
    [ ] Connected to SAME WiFi as Device 1
    [ ] Microphone enabled
    [ ] Camera enabled
```

### ✓ Step 4: Find Device 1's IP Address
```
On Device 1 (where backend is running):
[ ] Open PowerShell or Command Prompt
[ ] Run: ipconfig /all
[ ] Look for "IPv4 Address:" 
[ ] Should look like: 192.168.1.100 or 10.0.0.50
[ ] Write it down: ___________________
[ ] This is your [DEVICE1_IP]
```

### ✓ Step 5: Test Device 2 Network Access
```
On Device 2:
[ ] Open browser
[ ] Go to: http://[DEVICE1_IP]:8000/docs
    (Replace [DEVICE1_IP] with your IP from Step 4)
[ ] Should see API documentation page
[ ] If page appears ✅ = Network connectivity OK
[ ] If page doesn't appear ❌ = Network problem, debug connection
```

### ✓ Step 6: Open Frontend on Device 2
```
On Device 2:
[ ] Open browser
[ ] Go to: http://[DEVICE1_IP]:3000
    (Example: http://192.168.1.100:3000)
[ ] Should see MBC Therapy Portal login page
[ ] If page appears ✅ = Frontend accessible
[ ] If page doesn't appear ❌ = Network/config issue
```

### ✓ Step 7: Login on Device 2
```
On Device 2:
[ ] Email: doctor@example.com (or any user different from Device 1)
[ ] Password: password
[ ] Click "Sign In as Doctor"
[ ] Should see dashboard
[ ] If dashboard appears ✅ = Authentication works
```

---

## 🎥 NOW TEST VIDEO CALLING (5 minutes)

### ✓ Step 8: Device 1 Initiates Call
```
On Device 1 (already logged in as admin):
[ ] Go to Messaging or search for doctor user
[ ] Find the user you logged in as on Device 2
[ ] Click VIDEO CALL button (not audio-only)
[ ] Wait for connection
```

### ✓ Step 9: Device 2 Receives Call
```
On Device 2:
[ ] Should see "Incoming Call" notification
[ ] Should see caller name
[ ] Click ACCEPT CALL button
[ ] Wait for connection (5-10 seconds)
```

### ✓ Step 10: Check Video
```
On Device 1:
[ ] Should see your own video (top left)
[ ] Should see remote video (bottom right)
[ ] Remote video should show Device 2 user
[ ] Video should be clear and smooth

On Device 2:
[ ] Should see your own video
[ ] Should see remote video (from Device 1)
[ ] Remote video should show Device 1 user
```

### ✓ Step 11: Check Audio
```
On Both Devices:
[ ] Listen for audio from remote device
[ ] Should hear voice/sound clearly
[ ] Try speaking - other side should hear you
[ ] No echo or distortion

Device 1 F12 Console:
[ ] Should show: [CallModal] ICE connection state: connected
[ ] Should show: [CallModal] PeerConnection state: connected
```

### ✓ Step 12: Verify Success Criteria
```
✅ SUCCESS if ALL of these are true:
  [ ] Can see own video
  [ ] Can see remote video
  [ ] Can hear remote audio
  [ ] Remote person can hear you
  [ ] No significant lag
  [ ] No console errors (F12)
  [ ] Console shows "connected" state

❌ INCOMPLETE if ANY of these are missing:
  [ ] Can see video but no audio
  [ ] Can hear audio but no video
  [ ] Video/audio but very laggy
  [ ] Connection keeps dropping
  [ ] Console shows errors
```

---

## 🆘 TROUBLESHOOTING

### Problem: Hard refresh doesn't show TURN servers
```
❌ Issue: TURN configuration not loading
✓ Fix:
  [ ] Make sure you're pressing Ctrl + Shift + R (not Ctrl + R)
  [ ] Wait 5 seconds after hard refresh
  [ ] Try opening in Incognito/Private mode
  [ ] Check that src/config.ts was actually updated
  [ ] Restart npm dev server: npm run dev
  [ ] Hard refresh again
```

### Problem: Same device (2 tabs) doesn't work anymore
```
❌ Issue: Configuration change broke something
✓ Fix:
  [ ] This shouldn't happen - config only adds TURN servers
  [ ] Check browser console for errors (F12)
  [ ] Try closing both tabs and opening fresh
  [ ] Try Incognito/Private mode
  [ ] Restart backend: Ctrl+C then python main.py
  [ ] Restart frontend: Ctrl+C then npm run dev
  [ ] Hard refresh browser
```

### Problem: Device 2 can't reach Device 1
```
❌ Issue: Network connectivity problem
✓ Fix:
  [ ] Verify both on SAME WiFi network
  [ ] Check Device 1 IP is correct: ipconfig /all
  [ ] Try pinging Device 1: ping [IP_ADDRESS]
  [ ] Try accessing http://[IP]:8000/docs
  [ ] Check firewall not blocking port 8000
  [ ] Try restarting router
  [ ] Try with ethernet cable if possible
```

### Problem: Video connection fails/drops
```
❌ Issue: WebRTC connection not established
✓ Fix:
  [ ] Check console for errors (F12)
  [ ] Check ICE connection state (should say "connected")
  [ ] Make sure both cameras working (test in video app first)
  [ ] Try same WiFi first (easier to debug)
  [ ] Check if TURN servers configured
  [ ] Try different WiFi network
  [ ] Restart browser and try again
```

### Problem: Can see video but no audio
```
❌ Issue: Microphone issue or audio track not added
✓ Fix:
  [ ] Check microphone enabled in browser settings
  [ ] Go to: Settings → Privacy → Microphone
  [ ] Grant microphone permission to browser
  [ ] Check system microphone is working (test in Skype/Teams)
  [ ] Restart browser
  [ ] Try different browser (Chrome, Firefox, Edge)
  [ ] Check mute button in call UI (unmute if needed)
```

### Problem: Works on same WiFi but want different networks
```
❌ Issue: Need ngrok for testing different networks
✓ Fix - Use ngrok (5 minutes):
  [ ] Download ngrok: https://ngrok.com/download
  [ ] Create free account: https://ngrok.com/signup
  [ ] Run: ngrok http 8000
  [ ] Get URL: https://abc123.ngrok.io
  [ ] Update src/config.ts: const API_URL = 'https://abc123.ngrok.io'
  [ ] Hard refresh frontend
  [ ] Device 2 access via: https://abc123.ngrok.io
  [ ] Try calling from different WiFi
```

---

## 📋 Summary Table

| Stage | What | Where | Expected |
|-------|------|-------|----------|
| 1 | Hard refresh | Browser | See TURN logs |
| 2 | Same device test | 2 browser tabs | Video + audio works |
| 3 | Get Device 2 | Physical device | Ready |
| 4 | Find IP | Device 1 terminal | Get 192.168.x.x |
| 5 | Test network | Device 2 browser | Can reach API |
| 6 | Open frontend | Device 2 browser | See login page |
| 7 | Login | Device 2 | Logged in as doctor |
| 8 | Initiate call | Device 1 | Click call button |
| 9 | Accept call | Device 2 | Click accept button |
| 10 | Check video | Both | See remote video |
| 11 | Check audio | Both | Hear remote audio |
| 12 | Verify success | Both | All criteria met ✅ |

---

## ✨ Final Checklist

Before starting, make sure:
- [ ] Backend running: `python backend/main.py`
- [ ] Frontend running: `npm run dev`
- [ ] TURN servers configured in src/config.ts
- [ ] Hard refresh done in browser
- [ ] Same-device test works (2 browser tabs)
- [ ] Device 2 is ready and on same WiFi
- [ ] Both devices have camera/microphone enabled
- [ ] Browser console visible for debugging (F12)

If all above checked ✅ → You're ready to test! 🚀

---

## 🎯 Success Timeline

```
Minute 1-2:   Hard refresh, check console
Minute 2-4:   Test same device (2 tabs)
Minute 4-9:   Setup Device 2, connect to WiFi
Minute 9-14:  Test Device 2 connectivity
Minute 14-19: Login on Device 2
Minute 19-24: Initiate and accept call
Minute 24+:   Verify video and audio working

Total time: ~25 minutes for first successful call ✅
```

---

Good luck! 🍀 You've got everything configured. Now just test it!

Remember: **Same WiFi is easiest to test first.** Get that working, then try different networks. 📱
