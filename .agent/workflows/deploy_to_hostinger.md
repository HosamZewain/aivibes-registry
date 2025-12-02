---
description: How to deploy the Hackathon Registration App to Hostinger VPS
---

# Deploy to Hostinger VPS

This guide assumes you have a Hostinger VPS running Ubuntu 20.04 or later.

## 1. Prepare the VPS

SSH into your VPS:
```bash
ssh root@your_vps_ip
```

Update system and install dependencies:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx
```

Install Node.js (LTS):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Install PM2 (Process Manager):
```bash
sudo npm install -g pm2
```

## 2. Clone and Setup Project

Clone your repository (replace with your actual repo URL):
```bash
cd /var/www
git clone <YOUR_REPO_URL> hackathon-app
cd hackathon-app
```

### Setup Backend
```bash
cd server
npm install
cp .env.example .env # Configure your .env variables (DATABASE_URL, SMTP, etc.)
npx prisma generate
npx prisma migrate deploy
```

Start Backend with PM2:
```bash
pm2 start index.js --name "hackathon-api"
pm2 save
pm2 startup
```

### Setup Frontend
```bash
cd ../client
npm install
npm run build
```

## 3. Configure Nginx

Create a new Nginx config:
```bash
sudo nano /etc/nginx/sites-available/hackathon-app
```

Paste the following configuration (replace `your_domain.com`):

```nginx
server {
    listen 80;
    server_name your_domain.com;

    root /var/www/hackathon-app/client/dist;
    index index.html;

    # Serve Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js Server
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/hackathon-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 4. Setup SSL (HTTPS)

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain SSL Certificate:
```bash
sudo certbot --nginx -d your_domain.com
```

## 5. Verification

- Visit `https://your_domain.com` to see the app.
- Test the API endpoints.
