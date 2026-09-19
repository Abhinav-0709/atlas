# Atlas AWS Deployment & Infrastructure Guide

A step-by-step guide to deploying **Atlas** on Amazon Web Services (AWS), following the cloud-native architecture featured in the Atlas architecture design.

```mermaid
graph TD
    Client["Client Browser"] --> Vercel["Vercel Global Edge Network\n(Next.js App Router Frontend)"]
    Client --> ALB["Application Load Balancer (ALB)\n(AWS)"]
    ALB --> API["API Server\n(FastAPI / EC2)"]
    API --> DB[("DynamoDB / RDS\nExecution State")]
    API --> S3[("Amazon S3\nArtifacts & Logs")]
    API --> Scheduler["Atlas Scheduler\n(EC2 / ECS)"]
    Scheduler --> SQS["Amazon SQS\n(Task Queue)"]
    SQS --> DLQ["SQS DLQ\n(Dead Letter Queue)"]
    SQS --> Workers["Atlas Worker Fleet\n(EC2 / ECS Auto Scaling)"]
    Workers --> DB
    Workers --> S3
    Workers --> CW["Amazon CloudWatch\n(Logs & Metrics)"]
```

---

## Architecture Overview

Atlas adopts the modern, battle-tested hybrid cloud pattern: **Vercel for the Next.js Frontend** + **AWS for the Distributed Backend & Worker Fleet**.

| Component | Platform / Service | Purpose in Atlas |
| :--- | :--- | :--- |
| **Frontend** | **Vercel (Global Edge)** | Hosting Next.js 14 App Router, static assets (`blocks.png`, `golf.png`), edge caching, and preview branches |
| **Networking** | **Amazon VPC** | Isolated private network, public/private subnets, Security Groups |
| **Security** | **AWS IAM** | Granular execution roles with least-privilege policies |
| **API Server** | **Amazon EC2 (or ECS Fargate)** | High-throughput FastAPI REST backend |
| **Scheduler** | **Amazon EC2 / ECS** | Evaluates DAG dependencies and dispatches ready tasks |
| **Message Queue**| **Amazon SQS** | Distributed FIFO/standard queue for tasks ready to be claimed |
| **State Storage**| **Amazon DynamoDB / RDS** | Fast execution states, worker heartbeats, and leases |
| **Artifacts** | **Amazon S3** | Workflow definitions, execution outputs, and log bundles |
| **Monitoring** | **Amazon CloudWatch** | Structured log aggregation, alarms, and engine metrics |

---

## Step 1: Network & Security Setup (VPC & IAM)

### 1.1 Create VPC & Subnets
1. Open the **AWS Management Console** → **VPC** → **Create VPC**.
2. Select **VPC and more**:
   - **Name tag**: `atlas-vpc`
   - **IPv4 CIDR block**: `10.0.0.0/16`
   - **Number of Availability Zones (AZs)**: `2`
   - **Public subnets**: `2` (e.g. `10.0.1.0/24`, `10.0.2.0/24`)
   - **Private subnets**: `2` (e.g. `10.0.10.0/24`, `10.0.20.0/24`)
   - **NAT Gateways**: `1 per AZ` (or `1` for development to save cost)
3. Click **Create VPC**.

### 1.2 Security Groups
Create two Security Groups under **VPC → Security groups**:

1. **`atlas-alb-sg`** (Load Balancer):
   - Inbound: HTTP (Port `80`) and HTTPS (Port `443`) from `0.0.0.0/0`.
   - Outbound: All traffic.

2. **`atlas-backend-sg`** (EC2 Instances / Workers):
   - Inbound: Port `8000` (FastAPI) from `atlas-alb-sg`.
   - Inbound: SSH (Port `22`) from your trusted IP only.
   - Outbound: All traffic (to access AWS services and internet via NAT Gateway).

### 1.3 IAM Role for EC2 Instances
1. Open **IAM** → **Roles** → **Create role**.
2. Select **AWS service** → **EC2**.
3. Attach an inline policy named `AtlasServicePolicy`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": "arn:aws:sqs:*:*:atlas-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::atlas-artifacts-*",
        "arn:aws:s3:::atlas-artifacts-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/atlas-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```
4. Name the role: **`AtlasEC2InstanceRole`**.

---

## Step 2: Storage & State (S3 & DynamoDB)

### 2.1 S3 Bucket for Artifacts & Logs
Run via AWS CLI:
```bash
aws s3api create-bucket \
  --bucket atlas-artifacts-prod \
  --region us-east-1
```
*Ensure Block Public Access is **ON** (all access through IAM).*

### 2.2 DynamoDB Tables
Create the primary state table for task runs and heartbeats:
```bash
aws dynamodb create-table \
  --table-name atlas-task-runs \
  --attribute-definitions \
      AttributeName=id,AttributeType=S \
      AttributeName=workflow_run_id,AttributeType=S \
  --key-schema \
      AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
      "[{\"IndexName\": \"WorkflowRunIndex\",\"KeySchema\":[{\"AttributeName\":\"workflow_run_id\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## Step 3: Message Queue Setup (Amazon SQS)

Atlas uses SQS to decouple the Scheduler from the Worker Fleet.

### 3.1 Create Dead Letter Queue (DLQ)
```bash
aws sqs create-queue \
  --queue-name atlas-task-dlq \
  --region us-east-1
```

### 3.2 Create Main Task Queue with DLQ Redrive
Create `sqs-attributes.json`:
```json
{
  "RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:YOUR_ACCOUNT_ID:atlas-task-dlq\",\"maxReceiveCount\":\"3\"}",
  "VisibilityTimeout": "60"
}
```
Create queue:
```bash
aws sqs create-queue \
  --queue-name atlas-task-queue \
  --attributes file://sqs-attributes.json \
  --region us-east-1
```

---

## Step 4: Compute Deployment (Amazon EC2)

### 4.1 Launch EC2 Instance
1. Go to **EC2 → Launch Instance**.
2. **Name**: `atlas-core-node`
3. **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type.
4. **Instance type**: `t3.medium` (2 vCPU, 4 GiB RAM) for dev/test, or `c6i.large` for high-throughput production.
5. **Key pair**: Select or create an SSH key pair.
6. **Network settings**:
   - VPC: `atlas-vpc`
   - Subnet: A public subnet (or private subnet behind NAT + ALB)
   - Security Group: `atlas-backend-sg`
7. **Advanced details**:
   - IAM instance profile: `AtlasEC2InstanceRole`
8. Click **Launch instance**.

### 4.2 Provision the Server
SSH into your instance:
```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Install Docker & Git:
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git python3-pip
sudo usermod -aG docker ubuntu
newgrp docker
```

Clone the repository and set up environment:
```bash
git clone https://github.com/Abhinav-0709/atlas.git
cd atlas/backend
```

Create `/etc/atlas.env`:
```ini
APP_NAME=Atlas
APP_ENV=production
DEBUG=False
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql+asyncpg://atlas:YOUR_STRONG_PASSWORD@atlas-postgres.cxxxxxx.us-east-1.rds.amazonaws.com:5432/atlas_db

# Redis & Queues
REDIS_URL=redis://atlas-redis.xxxxxx.0001.use1.cache.amazonaws.com:6379/0
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT_ID/atlas-task-queue

# AWS Config
AWS_REGION=us-east-1
S3_BUCKET=atlas-artifacts-prod
```

### 4.3 Configure Systemd Services

#### Service 1: Atlas API Server (`/etc/systemd/system/atlas-api.service`)
```ini
[Unit]
Description=Atlas FastAPI Server
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/atlas/backend
EnvironmentFile=/etc/atlas.env
ExecStart=/home/ubuntu/.local/bin/uv run uvicorn atlas.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

#### Service 2: Atlas Worker Daemon (`/etc/systemd/system/atlas-worker.service`)
```ini
[Unit]
Description=Atlas Distributed Worker Fleet
After=network.target atlas-api.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/atlas/backend
EnvironmentFile=/etc/atlas.env
ExecStart=/home/ubuntu/.local/bin/uv run python -m atlas.worker.main
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now atlas-api atlas-worker
sudo systemctl status atlas-api atlas-worker
```

---

## Step 5: Frontend Deployment (Vercel & Next.js)

### Option A: Deploy on Vercel (Strongly Recommended)
Vercel is built by the creators of Next.js and provides zero-config support for Next.js 14 App Router, dynamic server rendering, image optimization (`next/image`), and edge CDN caching.

#### 1. Import Repository into Vercel
1. Log in to [Vercel](https://vercel.com) with your GitHub account.
2. Click **Add New...** → **Project**.
3. Locate and select your `atlas` repository (`Abhinav-0709/atlas`).

#### 2. Configure Project Settings
- **Framework Preset**: `Next.js` (automatically detected).
- **Root Directory**: Click **Edit** and choose `frontend`.
- **Build Command**: `npm run build` (default).
- **Output Directory**: `.next` (default).
- **Install Command**: `npm install` (default).

#### 3. Set Environment Variables
In the **Environment Variables** section, add:
| Key | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://<YOUR_AWS_EC2_PUBLIC_IP_OR_ALB>:8000` | Points UI queries to your FastAPI backend on AWS |

#### 4. Deploy
1. Click **Deploy**.
2. Within 60 seconds, Vercel will build and assign you a production URL (e.g., `https://atlas-engine.vercel.app`).
3. Every subsequent `git push` to `main` will automatically trigger a new deployment, while pull requests generate isolated preview URLs!

---

### Option B: Deploy on AWS Amplify
If your organization requires keeping 100% of resources within AWS:
1. Open **AWS Amplify Console** → **Create new app** → select **GitHub**.
2. Select repository and set App root to `frontend`.
3. In **Environment variables**, set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`.
4. Click **Save and Deploy**.

---

### Option C: Self-Host on EC2 via PM2
If hosting frontend directly alongside the backend on your EC2 instance:
```bash
cd /home/ubuntu/atlas/frontend
npm install
npm run build
sudo npm install -g pm2
pm2 start npm --name "atlas-frontend" -- start -- -p 3000
pm2 save
pm2 startup
```

---

### Cross-Origin Setup (Connecting Vercel to AWS Backend)

To allow the frontend on Vercel to query your FastAPI server on AWS without browser CORS errors:

1. **Verify Backend CORS** (Already implemented in `backend/atlas/main.py`):
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # Or set to ["https://your-atlas.vercel.app"]
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```
2. **AWS Security Group**:
   Ensure the EC2 Security Group (`atlas-backend-sg`) allows inbound TCP traffic on port `8000` (or `443` if behind ALB) from `0.0.0.0/0`.

---

## Step 6: Observability (CloudWatch & Prometheus)

### 6.1 CloudWatch Unified Agent
Install the CloudWatch agent on your EC2 instance to push logs:
```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```
Configure `/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json`:
```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/home/ubuntu/atlas/backend/logs/*.log",
            "log_group_name": "/atlas/production/backend",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
```
Start the agent:
```bash
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
```

### 6.2 Prometheus Metrics
Atlas exposes Prometheus metrics on:
```
http://<EC2_IP>:8000/metrics
```
You can point your existing Prometheus server (configured in `infra/prometheus/prometheus.yml`) directly to this endpoint.

---

## Step 7: Verification & Smoke Test

### 1. Check API Health
```bash
curl -i http://localhost:8000/health
```
Expected output:
```json
{"status":"healthy","database":"connected","redis":"connected"}
```

### 2. Verify Metrics
```bash
curl -s http://localhost:8000/metrics | grep atlas_
```

### 3. Check Worker Heartbeat in DB
```bash
curl -s http://localhost:8000/workers
```
Should list active workers with their heartbeat timestamp and hostname.

### 4. Trigger a Test DAG
```bash
curl -X POST http://localhost:8000/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "aws-smoke-test",
    "definition": {
      "name": "smoke-test",
      "tasks": [
        {"key": "download_data", "name": "Download Data", "type": "HTTP"},
        {"key": "process_data", "name": "Process Data", "type": "PYTHON_FUNCTION", "dependencies": ["download_data"]}
      ]
    }
  }'
```

---

## Production Checklist & Cost Optimization

- [ ] **VPC NAT Gateway**: Use 1 NAT Gateway for dev/staging environments to minimize hourly charges.
- [ ] **DynamoDB Capacity**: Keep Billing Mode set to **On-Demand** (`PAY_PER_REQUEST`) unless traffic is steady and predictable.
- [ ] **Auto Scaling**: Set up EC2 Auto Scaling Groups (ASG) or ECS Fargate driven by the SQS metric `ApproximateNumberOfMessagesVisible`.
- [ ] **Secrets Manager**: Store database credentials and Redis tokens in **AWS Secrets Manager** or **AWS Systems Manager Parameter Store** instead of plain text `.env`.
- [ ] **HTTPS / TLS**: Terminate TLS at the AWS ALB using free certificates from **AWS Certificate Manager (ACM)**.
