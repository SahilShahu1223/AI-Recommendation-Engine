# AWS Deployment Guide

This guide covers deploying Smart Recommend AI to AWS. Two paths are documented:

- **Path A — EC2 + RDS (recommended, simplest)**: one small EC2 instance runs the backend (via PM2)
  and serves the built frontend through Nginx; MySQL runs on a managed RDS instance.
- **Path B — Docker on EC2**: uses the `Dockerfile`s and `docker-compose.yml` included in this repo,
  useful if you already run other services in containers or plan to move to ECS/Fargate later.

Either path works well for a small-to-medium deployment. Start with Path A if you're not already
using Docker elsewhere.

---

## Architecture overview

```
                     ┌────────────────────┐
   Users ──HTTPS──▶  │  EC2 instance       │
                     │  ├─ Nginx (:80/443) │──▶ serves frontend build (static files)
                     │  │    └─ proxies /api ──▶ Node backend (PM2, :5000)
                     └──────────┬──────────┘
                                │  MySQL protocol (:3306), security-group restricted
                                ▼
                     ┌────────────────────┐
                     │  Amazon RDS (MySQL) │
                     └────────────────────┘
```

## Prerequisites

- An AWS account with billing enabled
- The AWS CLI installed and configured (`aws configure`) — optional but convenient
- A domain name if you want HTTPS with a real certificate (not required to get started)
- This repository, either pushed to a Git provider (recommended) or ready to `scp` to the server

---

## Path A — EC2 + RDS

### 1. Create the MySQL database on RDS

1. Open **RDS → Create database**.
2. Engine: **MySQL 8.0**.
3. Templates: **Free tier** (for testing) or **Production** (for real traffic).
4. Set a master username/password — you'll use these to create the app's dedicated DB user.
5. Under **Connectivity**, choose the same VPC you'll launch your EC2 instance in, and note the
   security group RDS creates.
6. Under **Additional configuration**, set **Initial database name** to `smart_recommend_ai`.
7. Create the database, then note its **endpoint** (looks like
   `smart-recommend-ai.xxxxxxxxxx.<region>.rds.amazonaws.com`) once it's available.
8. Edit the RDS security group's inbound rules to allow **MySQL/Aurora (3306)** only from your EC2
   instance's security group (not from `0.0.0.0/0`).

### 2. Launch the EC2 instance

1. Open **EC2 → Launch instance**.
2. AMI: **Ubuntu Server 22.04 LTS**.
3. Instance type: `t3.small` is a reasonable starting point (`t3.micro` works for light testing).
4. Configure a security group allowing:
   - **SSH (22)** from your IP only
   - **HTTP (80)** and **HTTPS (443)** from anywhere
5. Launch with a key pair you can SSH in with.

### 3. Install dependencies on the instance

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MySQL client (to run schema/sample_data against RDS), Nginx, git
sudo apt-get update
sudo apt-get install -y mysql-client nginx git

# PM2 — keeps the backend running and restarts it on crash/reboot
sudo npm install -g pm2
```

### 4. Get the code onto the instance

```bash
git clone <your-repo-url> AI-Recommendation-Engine
cd AI-Recommendation-Engine
```

(Or `scp -i your-key.pem -r ./AI-Recommendation-Engine ubuntu@<EC2_PUBLIC_IP>:~` from your machine
if you're not using Git.)

### 5. Set up the database schema on RDS

From the EC2 instance (or any machine that can reach the RDS endpoint):

```bash
mysql -h <RDS_ENDPOINT> -u <master_user> -p --default-character-set=utf8mb4 < database/schema.sql
mysql -h <RDS_ENDPOINT> -u <master_user> -p --default-character-set=utf8mb4 smart_recommend_ai < database/sample_data.sql
```

Then create a dedicated application user (don't run the app as the RDS master user):

```sql
CREATE USER 'app_user'@'%' IDENTIFIED BY 'a-strong-password-here';
GRANT ALL PRIVILEGES ON smart_recommend_ai.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
```

### 6. Configure and start the backend

```bash
cd ~/AI-Recommendation-Engine/backend
cp .env.example .env
nano .env
```

Set at minimum:

```
PORT=5000
NODE_ENV=production
DB_HOST=<RDS_ENDPOINT>
DB_PORT=3306
DB_USER=app_user
DB_PASSWORD=a-strong-password-here
DB_NAME=smart_recommend_ai
JWT_ACCESS_SECRET=<generate a long random string>
JWT_REFRESH_SECRET=<generate a different long random string>
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

Generate strong secrets with `openssl rand -base64 48`.

```bash
npm install
npm run seed
pm2 start src/server.js --name smart-recommend-backend
pm2 save
pm2 startup     # follow the printed command to enable PM2 on boot
```

### 7. Build and deploy the frontend

```bash
cd ~/AI-Recommendation-Engine/frontend
cp .env.example .env
```

Set `VITE_API_URL` in `.env` to your public API path, e.g. `https://yourdomain.com/api`.

```bash
npm install
npm run build      # outputs static files to frontend/dist
```

### 8. Configure Nginx

Create `/etc/nginx/sites-available/smart-recommend`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /home/ubuntu/AI-Recommendation-Engine/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/smart-recommend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Add HTTPS (recommended)

Point your domain's DNS `A` record at the EC2 instance's public IP, then:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot edits the Nginx config to serve HTTPS and sets up auto-renewal.

### 10. Verify

```bash
curl https://yourdomain.com/api/payments/status
```

Then open `https://yourdomain.com` in a browser and log in with the demo account or register a new
one.

### Updating a live deployment

```bash
cd ~/AI-Recommendation-Engine
git pull
cd backend && npm install && pm2 restart smart-recommend-backend
cd ../frontend && npm install && npm run build
```

---

## Path B — Docker on EC2

This repo includes `backend/Dockerfile`, `frontend/Dockerfile`, and a root `docker-compose.yml` that
runs MySQL, the backend, and the frontend (via Nginx) as three containers.

### 1. Launch an EC2 instance and install Docker

Follow steps 1–2 from Path A to launch the instance, then:

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Get the code and configure environment variables

```bash
git clone <your-repo-url> AI-Recommendation-Engine
cd AI-Recommendation-Engine
cp .env.example .env
nano .env
```

`docker-compose.yml` reads its variables from this root `.env` file. At minimum set:

```
DB_USER=app_user
DB_PASSWORD=a-strong-password-here
MYSQL_ROOT_PASSWORD=a-different-strong-password
JWT_ACCESS_SECRET=<generate with: openssl rand -base64 48>
JWT_REFRESH_SECRET=<generate a different one>
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
```

### 3. Build and start everything

```bash
docker compose up -d --build
```

This starts three containers: `smart-recommend-mysql` (with `schema.sql` and `sample_data.sql` loaded
automatically on first boot via the MySQL image's init-script mechanism), `smart-recommend-backend`,
and `smart-recommend-frontend`.

```bash
docker compose logs -f backend    # watch the backend start up and connect to MySQL
docker compose exec backend npm run seed    # set the demo account's password hash
```

### 4. Put Nginx or an Application Load Balancer in front (for HTTPS)

The `frontend` container listens on port `5173` on the host and already proxies nothing itself for
`/api` — routing between the frontend and backend containers in this compose file is handled by the
browser calling `VITE_API_URL` directly, so both ports (`5173` and `5000`) need to be reachable, or
better, put an Nginx reverse proxy or an AWS Application Load Balancer in front of both so only 80/443
are exposed publicly, similarly to the Nginx config shown in Path A but pointing at
`localhost:5173` and `localhost:5000` instead of local files.

Then run Certbot against that Nginx instance the same way as step 9 in Path A.

### Updating a live Docker deployment

```bash
cd ~/AI-Recommendation-Engine
git pull
docker compose up -d --build
```

---

## Notes on scaling beyond a single instance

- Move MySQL to RDS (Path B still benefits from this — point `DB_HOST` in `.env` at the RDS endpoint
  and drop the `mysql` service from `docker-compose.yml`).
- Push container images to **Amazon ECR** and run them on **ECS Fargate** instead of a single EC2
  Docker host, for zero-downtime deploys and auto-scaling.
- Serve the frontend's static build from **S3 + CloudFront** instead of Nginx/EC2, and keep only the
  backend on EC2/ECS behind an Application Load Balancer.
- Store secrets (`JWT_*_SECRET`, `DB_PASSWORD`, `STRIPE_SECRET_KEY`) in **AWS Secrets Manager** or
  **SSM Parameter Store** rather than a plain `.env` file once you're past the prototype stage.

## Troubleshooting

**Backend can't connect to RDS**
Check the RDS security group allows inbound 3306 from the EC2 instance's security group, and that
both are in the same VPC (or peered/routable VPCs).

**`ERROR 1406: Data too long for column 'emoji'` when loading `sample_data.sql` against RDS**
Add `--default-character-set=utf8mb4` to the `mysql` command, as noted in step 5 above.

**502 Bad Gateway from Nginx**
The backend process isn't running or isn't listening on the port Nginx is proxying to. Check
`pm2 status` (Path A) or `docker compose ps` / `docker compose logs backend` (Path B).

**Frontend loads but API calls fail with a CORS error**
`CORS_ORIGIN` in the backend's environment must exactly match the frontend's public URL, including
the scheme (`https://`) and no trailing slash.
