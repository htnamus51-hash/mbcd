# MBC Project - Setup & Deployment Guide

## ✅ Complete Environment Reproduction

This guide ensures that when you zip the project and extract it on another device, everything works exactly as on your current device.

---

## 📋 System Requirements

### Python Environment
- **Python Version**: 3.10.10
- **OS**: Windows 10/11 (or any OS with Python 3.10+)

### Node.js Environment
- **Node.js Version**: Latest LTS (v18+)
- **npm Version**: 10+

---

## 🔧 Setup Instructions for New Device

### Step 1: Extract Project
```bash
# Unzip the mbc.zip file to a location like:
C:\Users\YourName\OneDrive\Documents\mbc\
```

### Step 2: Install Python Dependencies

#### Option A: Using requirements.txt (Recommended)
```bash
# Navigate to project directory
cd c:\path\to\mbc

# Create Python virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate

# Install all packages with exact versions
pip install -r requirements.txt
```

#### Option B: Manual Installation
If the above doesn't work, try:
```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### Step 3: Install Node Dependencies
```bash
# Navigate to project directory (if not already there)
cd c:\path\to\mbc

# Install npm dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 4: Configuration Files
Ensure these files exist in the project root:
```
.env              # Backend environment variables
.env.local        # Frontend environment variables (optional)
```

### Step 5: Verify Installation

#### Check Python
```bash
python --version
# Expected: Python 3.10.10

pip list
# Should show all packages from requirements.txt
```

#### Check Node
```bash
node --version
# Expected: v18.x.x or higher

npm --version
# Expected: 9.x.x or higher
```

---

## 🚀 Running the Application

### Terminal 1: Start Backend (Python)
```bash
cd backend
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: Start Frontend (Node)
```bash
npm run dev

# This will start Vite development server on http://localhost:5173 or http://localhost:3000
```

### Terminal 3: Build Frontend (Optional)
```bash
npm run build
# Creates optimized build in ./build/ directory
```

---

## 📦 What's in requirements.txt (PINNED VERSIONS)

All packages are pinned to exact versions for reproducibility:

```
Core Framework:
- fastapi==0.123.9
- uvicorn[standard]==0.38.0
- starlette==0.50.0

Database:
- motor==3.7.1
- pymongo==4.15.5
- dnspython==2.8.0

Authentication & Security:
- passlib[bcrypt]==1.7.4
- bcrypt==5.0.0
- argon2-cffi==25.1.0  # NEW: Added for password hashing
- PyJWT==2.10.1

Data Validation:
- pydantic==2.12.5
- pydantic-core==2.41.5
- email-validator==2.3.0

Real-time Signaling (WebRTC Calls):
- python-socketio==5.15.0
- python-engineio==4.12.3
- websockets==15.0.1

File Uploads:
- python-multipart==0.0.20
- aiofiles==25.1.0

HTTP & Networking:
- httpx==0.28.1
- httpcore==1.0.9
- httptools==0.7.1

All other dependencies...
```

---

## 🔍 Troubleshooting

### Issue: "ModuleNotFoundError" when running backend
**Solution**:
```bash
pip install -r requirements.txt --force-reinstall
```

### Issue: "npm WARN deprecated" messages
**Solution** (Usually safe to ignore, but to clean up):
```bash
npm update
npm audit fix
```

### Issue: Port 8000 already in use
**Solution**:
```bash
# Change the port in main.py or start with different port
uvicorn main:app --port 8001

# Or find and kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Issue: Database connection fails
**Solution**:
```bash
# Check MongoDB is running
# Check connection string in .env file
# Verify MongoDB server is accessible
```

### Issue: Camera/Microphone permissions denied
**Solution**:
- Grant browser permissions when prompted
- Check browser settings: Settings → Privacy → Camera/Microphone
- Restart browser and retry

---

## 📝 Key Files & Directories

```
mbc/
├── backend/                  # Python FastAPI backend
│   ├── main.py             # Main application entry
│   ├── auth.py             # Authentication (fixed with argon2)
│   ├── database.py         # MongoDB connection
│   ├── messaging/          # WebSocket handlers
│   ├── requirements.txt    # Python dependencies (UPDATED)
│   └── ...
├── src/                    # Frontend TypeScript/React
│   ├── App.tsx
│   ├── components/         # React components
│   │   ├── CallModal.tsx   # Video/Audio calling (FIXED)
│   │   └── ...
│   ├── hooks/
│   │   ├── useSocket.ts    # WebSocket connection
│   │   └── ...
│   ├── config.ts           # App configuration (UPDATED)
│   └── ...
├── package.json            # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── .env                   # Environment variables (not in git)
└── README.md
```

---

## 🆕 New Additions to requirements.txt

These packages were added/upgraded for specific features:

### 1. **argon2-cffi==25.1.0**
- **Purpose**: Enhanced password hashing algorithm
- **Why**: Better security than bcrypt alone
- **Used in**: `backend/auth.py` for password management
- **Install**: `pip install argon2-cffi`

### 2. **upgraded packages**
These were upgraded to fix cross-device calling:
- `python-socketio==5.15.0` (from >=5.8.0)
- `python-engineio==4.12.3` (from >=4.3.0)
- `fastapi==0.123.9` (from >=0.104.0)
- And many others for stability

---

## ✨ Recent Code Changes

### 1. **src/components/CallModal.tsx**
- Added ICE candidate buffering for cross-device calls
- Enhanced connection state logging
- Fixed WebRTC connection issues

### 2. **src/config.ts**
- Added TURN server configuration support
- Environment variable override for custom servers

### 3. **backend/auth.py**
- Added password truncation for bcrypt compatibility
- Integrated argon2 for better hashing

### 4. **backend/main.py**
- Fixed CORS configuration
- Updated Socket.IO setup with proper CORS origins

---

## 📊 Deployment Checklist

Before deploying to production or another device:

- [ ] All dependencies in `requirements.txt` pinned to specific versions
- [ ] `package.json` properly configured with all npm packages
- [ ] `.env` file configured with correct MongoDB URI
- [ ] Backend can connect to MongoDB
- [ ] Frontend builds without errors (`npm run build`)
- [ ] Backend starts without errors (`python main.py`)
- [ ] Frontend connects to backend at correct API URL
- [ ] Video/audio calls work on same device
- [ ] Video/audio calls work on different devices (same network)
- [ ] Environment variables documented and set correctly

---

## 🔒 Important Environment Variables

Create a `.env` file in the project root:

```bash
# Backend
MONGODB_URI=mongodb://localhost:27017/mbc
JWT_SECRET=your-secret-key-here
FLASK_ENV=development

# Frontend (in .env.local if using Vite)
VITE_API_URL=http://localhost:8000
VITE_TURN_SERVERS='[{"urls":"turn:your-server.com:3478","username":"user","credential":"pass"}]'
```

---

## 🎯 Quick Start (After Setup)

```bash
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: Frontend
npm run dev

# Terminal 3: Build (optional)
npm run build

# Open http://localhost:3000 in browser
```

---

## 📞 Support

If you encounter issues:

1. **Check console logs** - Browser console (F12) and terminal logs
2. **Verify requirements.txt** - All packages installed with `pip list`
3. **Test connectivity** - Backend at http://localhost:8000/docs
4. **Check environment variables** - Ensure `.env` file is configured
5. **Review documentation** - See WEBRTC_*.md files for calling-specific issues

---

## ✅ Reproduction Guarantee

With this setup:
- ✅ Same Python packages (exact versions)
- ✅ Same Node.js packages (from package-lock.json)
- ✅ Same code changes (CallModal, auth, config, main.py)
- ✅ Same database schema (if you backup MongoDB)
- ✅ Same configuration (if you include .env)

**Result**: The project will work identically on another device!

