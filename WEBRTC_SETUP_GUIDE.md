# Cross-Device WebRTC Calling - Setup & Deployment Guide

## Issue Summary
Video/audio calling works on the same device/browser tabs but fails between different devices because:
- **ICE candidates were being dropped** before remote description was set
- **Missing TURN server** for NAT traversal on different networks

## What Was Fixed

### 1. ✅ ICE Candidate Buffering
- **Problem**: ICE candidates arriving before `remoteDescription` was set were discarded
- **Solution**: Implemented candidate queue in `CallModal.tsx`
- **Result**: Candidates are now buffered and flushed once remote description is set

### 2. ✅ Enhanced Logging
- Added detailed connection state tracking
- Status updates show: "ICE: connected", "Connection: connected", etc.
- Better error messages for debugging

### 3. ⚠️ TURN Server Configuration (Needs Setup)
- Added placeholder TURN server config in `src/config.ts`
- For production, you need to configure a real TURN server

---

## How to Enable Cross-Device Calling

### Option 1: Use Google's STUN Server (Limited)
This is already configured but may not work for all network configurations.
```typescript
// In CallModal.tsx
const defaultStun: RTCIceServer = { urls: 'stun:stun.l.google.com:19302' };
```

### Option 2: Self-Host TURN Server (Recommended for Production)

#### Install coturn
```bash
# Ubuntu/Debian
sudo apt-get install coturn

# macOS
brew install coturn

# Windows - download from https://github.com/coturn/coturn/wiki/Downloads
```

#### Configure coturn (`/etc/coturn/turnserver.conf`)
```conf
# Basic TURN server config
listening-port=3478
listening-ip=0.0.0.0
relay-ip=<YOUR_PUBLIC_IP>
external-ip=<YOUR_PUBLIC_IP>

# User credentials
user=admin:password123

# Realm
realm=example.com

# Enable STUN
stun-only

# Logging
log-file=/var/log/coturn.log
```

#### Start TURN server
```bash
sudo systemctl start coturn
sudo systemctl enable coturn
```

#### Update `.env` file
```bash
VITE_TURN_SERVERS='[{"urls":"turn:your-server.com:3478","username":"admin","credential":"password123"}]'
```

#### Update `src/config.ts` to use environment variable
```typescript
const TURN_SERVERS: RTCIceServer[] = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_TURN_SERVERS)
  ? JSON.parse((import.meta as any).env.VITE_TURN_SERVERS)
  : [];
```

### Option 3: Use Free Public TURN Servers (For Testing)

Replace the placeholder in `src/config.ts`:
```typescript
TURN_SERVERS = [
  {
    urls: 'turn:turnserver.example.com:3478',
    username: 'public',
    credential: 'public'
  }
];
```

---

## Testing Cross-Device Calling

### Prerequisites
- Two devices on different networks (or same WiFi to test locally)
- Both devices accessing the app at the same backend URL
- Microphone/camera permissions granted on both devices

### Test Steps
1. **Device 1**: Log in as `admin@example.com` (or any admin user)
2. **Device 2**: Log in as `doctor@example.com` (or any doctor user)
3. **Device 1**: Search for "doctor" in the messaging interface
4. **Device 1**: Click the video/audio call button
5. **Device 2**: Should receive call notification
6. **Device 2**: Click "Answer" to accept
7. Both devices should see video and hear audio

### Troubleshooting

#### ❌ "No video/audio from other device"
- **Check**: Are both devices showing their own video? If not, camera/microphone permissions issue
- **Check**: Does the console show "ICE: connected"? If not, network connectivity issue
- **Fix**: Ensure TURN server is configured (see Option 2 above)

#### ❌ "Can see video but no audio"
- **Check**: Are microphones enabled on both devices?
- **Check**: Is audio track being added to peer connection?
- **Fix**: Check console logs for track addition errors

#### ❌ "Connection fails with 'InvalidStateError'"
- **Check**: This means ICE candidates arrived before remote description
- **Fix**: Already fixed in this update - should not occur anymore
- **Verify**: Check console for "Flushing X queued ICE candidates"

---

## Architecture Changes

### CallModal.tsx
- Added `iceCandidateQueueRef` to buffer candidates
- Added `remoteDescriptionSetRef` to track remote description status
- Added `flushIceCandidateQueue()` helper function
- Updated `handleIncomingCandidate()` to queue instead of drop
- Updated `handleIncomingAnswer()` and `handleIncomingOfferNew()` to flush queue after setting remote description

### src/config.ts
- Enhanced TURN server configuration
- Better logging
- Support for environment variable override

---

## Architecture Diagram: ICE Candidate Flow (After Fix)

```
Device A                              Backend                         Device B
  |                                      |                               |
  |------ call.ice (candidate 1) ------>  |                              |
  |                                      |                              |
  | [Waiting for answer]                 |------ call.ice (1) --------> |
  |                                      |  [Remote desc not set yet]   |
  |                                      |  → QUEUE candidate 1         |
  |<------ call.answer (SDP) ----------- | <------ call.answer -------- |
  | [Set remote description]             |                              |
  | → FLUSH queue: [candidate 1]         |                              |
  | → Add candidate 1 to PC              |                              |
  |                                      |                              |
  |------ call.ice (candidate 2) ------>  |                              |
  |                                      |------ call.ice (2) --------> |
  | [Candidates now added immediately]   |  [Remote desc already set]  |
  |                                      |  → Add immediately           |
  |                                      |                              |
  |===== WebRTC Connection Established ====================================>|
  |                              Media Stream (Video/Audio)                |
```

---

## Network Configuration for Production

For best cross-device performance:

1. **STUN Server** (Essential)
   - Detects public IP address
   - Used by default with Google's STUN server

2. **TURN Server** (For Restricted Networks)
   - Required for symmetric NAT, firewalls, corporate networks
   - Relays media through your server
   - Self-host with coturn or use commercial service

3. **ICE Credentials** (Security)
   - Use strong credentials for TURN server
   - Change default passwords

4. **TLS/HTTPS** (Security)
   - Use TURNS (TLS-encrypted) in production
   - Update ports to 5349 (TURNS) instead of 3478

---

## Monitoring & Debugging

### Browser Console Logs
```
[CallModal] ICE candidate sent to device2@example.com
[CallModal] ICE candidate arrived before remote description set - QUEUEING for later
[CallModal] Queued candidates: 5
[CallModal] Flushing 5 queued ICE candidates
[CallModal] Queued ICE candidate added successfully
[CallModal] PeerConnection state: connected
```

### Backend Logs
```
[Call] offer from device1@example.com -> device2@example.com
[Call] target sids for device2@example.com: {sid123}
[Call] offer forwarded from device1@example.com to device2@example.com
```

---

## Next Steps

1. **Test locally** with STUN server only (should work for same network)
2. **Test cross-network** with STUN + dummy TURN (if available)
3. **Deploy TURN server** for production (using coturn or commercial service)
4. **Monitor logs** to verify ICE candidate flow
5. **Load test** with multiple concurrent calls
