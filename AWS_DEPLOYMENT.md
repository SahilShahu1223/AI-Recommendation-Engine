# AWS Deployment Guide (EC2 + RDS PostgreSQL)

> **Recommended deployment:** Vercel + Neon PostgreSQL (see README.md).
> This guide covers a self-hosted EC2 + RDS PostgreSQL deployment for those who prefer AWS.

## Architecture

```
Internet → AWS ALB (HTTPS :443)
             ↓
         EC2 instance
           ├── Nginx (reverse proxy + serves built frontend)
           └── Node.js backend (Express, port 5000)
                     ↓
               AWS RDS (PostgreSQL, port 5432, security-group restricted)
```

## Setup

### 1. Create the PostgreSQL database on RDS

1. Open the RDS console.
2. Engine: **PostgreSQL 14+**.
3. Create a database named `smart_recommend_ai`.
4. Create a user (e.g. `app_user`) with a strong password.
5. Note the endpoint.
6. Edit the RDS security group to allow PostgreSQL (5432) only from your EC2 instance.

### 2. Set up the EC2 instance

```bash
sudo apt-get update
sudo apt-get install -y nodejs npm postgresql-client nginx git

git clone https://github.com/your-org/AI-Recommendation-Engine.git
cd AI-Recommendation-Engine

npm run install:all
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
nano backend/.env
# Set DATABASE_URL=postgresql://app_user:password@<RDS_ENDPOINT>:5432/smart_recommend_ai
# Set JWT secrets, CORS_ORIGIN, FRONTEND_URL, Stripe keys
```

### 4. Apply the schema and seed data

```bash
DATABASE_URL="postgresql://app_user:password@<RDS_ENDPOINT>:5432/smart_recommend_ai" \
  node database/migrate.js --seed
```

### 5. Build the frontend

```bash
npm run build
```

### 6. Configure Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/AI-Recommendation-Engine/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 7. Start the backend

```bash
npm run start --prefix backend
# Or with PM2:
npm install -g pm2
pm2 start backend/src/server.js --name smart-recommend-api
pm2 save
pm2 startup
```

## Troubleshooting

**Connection refused to RDS**
Check the RDS security group allows inbound TCP 5432 from the EC2 security group.

**`role "app_user" does not exist`**
Connect to RDS as the master user and create the role:
```sql
CREATE USER app_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE smart_recommend_ai TO app_user;
```

**Frontend 404 on page refresh**
Make sure the Nginx config has `try_files $uri $uri/ /index.html;` for the SPA fallback.
