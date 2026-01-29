#!/bin/bash
set -e

# Configuration
APP_DIR="/home/ubuntu/app"
BACKEND_DIR="$APP_DIR/backend"
# Vite config output is 'build', not 'dist'
FRONTEND_BUILD_DIR="$APP_DIR/build"

echo "Step 1: System Update & Dependencies"
sudo apt-get update
# Suppress prompts during install
# Removing 'npm' from install list as it is included in nodejs (NodeSource) and causes conflicts
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3-pip python3-venv nginx nodejs acl

echo "Step 2: Backend Setup"
cd $BACKEND_DIR
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r ../requirements.txt

# Setup Systemd Service
echo "Configuring Backend Service..."
sudo bash -c "cat > /etc/systemd/system/mbc-backend.service <<EOF
[Unit]
Description=MBC Backend
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=$BACKEND_DIR
Environment=\"PATH=$BACKEND_DIR/venv/bin\"
ExecStart=$BACKEND_DIR/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable mbc-backend
sudo systemctl restart mbc-backend

echo "Step 3: Frontend Setup"
cd $APP_DIR
# Ensure dependencies are installed
npm install
# Build the project (Outputs to $APP_DIR/build)
npm run build

echo "Step 4: Nginx Deployment"
# Verify build directory exists
if [ ! -d "$FRONTEND_BUILD_DIR" ]; then
    echo "Error: Build directory $FRONTEND_BUILD_DIR not found!"
    exit 1
fi

# Clear old files and copy new build
sudo rm -rf /var/www/html/*
sudo cp -r $FRONTEND_BUILD_DIR/* /var/www/html/

# Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/mbc > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable configuration if not already enabled
sudo ln -sf /etc/nginx/sites-available/mbc /etc/nginx/sites-enabled/
# Remove default config if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Verify and Restart Nginx
sudo nginx -t
sudo systemctl restart nginx

echo "Deployment Complete! Backend running on port 8000, Frontend on port 80."
