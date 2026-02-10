# Deploying n8n with Claira Node on Google Cloud Run

## Prerequisites

- GCP project with billing enabled
- `gcloud` CLI installed and authenticated
- Docker installed locally

```bash
# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
export PROJECT_ID=$(gcloud config get-value project)

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  vpcaccess.googleapis.com \
  servicenetworking.googleapis.com

# Create Artifact Registry repository (one-time)
gcloud artifacts repositories create n8n \
  --repository-format=docker \
  --location=us-central1

# Configure Docker to use Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## 1. Set up VPC Network

Create a VPC with private service access for Cloud SQL:

```bash
# Create VPC network
gcloud compute networks create n8n-vpc --subnet-mode=auto

# Allocate IP range for private services
gcloud compute addresses create google-managed-services-n8n-vpc \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network=n8n-vpc

# Create private connection to Google services
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-n8n-vpc \
  --network=n8n-vpc

# Create VPC connector for Cloud Run
gcloud compute networks vpc-access connectors create n8n-connector \
  --region=us-central1 \
  --network=n8n-vpc \
  --range=10.8.0.0/28 \
  --min-instances=2 \
  --max-instances=3
```

## 2. Set up Cloud SQL with Private IP

```bash
# Create PostgreSQL instance with private IP only
gcloud sql instances create n8n-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=us-central1 \
  --network=n8n-vpc \
  --no-assign-ip

# Get the private IP
export DB_PRIVATE_IP=$(gcloud sql instances describe n8n-db --format='value(ipAddresses[0].ipAddress)')
echo "Database Private IP: $DB_PRIVATE_IP"

# Create database
gcloud sql databases create n8n --instance=n8n-db

# Create user (save this password!)
gcloud sql users create n8n \
  --instance=n8n-db \
  --password=YOUR_SECURE_PASSWORD
```

## 3. Build and Push Image

```bash
# Build the image (--platform required for Apple Silicon Macs)
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/$PROJECT_ID/n8n/n8n-claira:latest .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/$PROJECT_ID/n8n/n8n-claira:latest
```

## 4. Deploy to Cloud Run

```bash
# Get database private IP
export DB_PRIVATE_IP=$(gcloud sql instances describe n8n-db --format='value(ipAddresses[0].ipAddress)')

# Generate encryption key (save this securely!)
export N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "Save this key: $N8N_ENCRYPTION_KEY"

# Set database password (must match what you used in Cloud SQL setup)
export N8N_DB_PASSWORD=YOUR_SECURE_PASSWORD

# Deploy with VPC connector and no CPU throttling
gcloud run deploy n8n-claira \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/n8n/n8n-claira:latest \
  --region us-central1 \
  --port 5678 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --no-cpu-throttling \
  --cpu-boost \
  --min-instances 1 \
  --max-instances 3 \
  --vpc-connector n8n-connector \
  --vpc-egress all-traffic \
  --set-env-vars "DB_TYPE=postgresdb" \
  --set-env-vars "DB_POSTGRESDB_HOST=$DB_PRIVATE_IP" \
  --set-env-vars "DB_POSTGRESDB_PORT=5432" \
  --set-env-vars "DB_POSTGRESDB_DATABASE=n8n" \
  --set-env-vars "DB_POSTGRESDB_USER=n8n" \
  --set-env-vars "DB_POSTGRESDB_PASSWORD=$N8N_DB_PASSWORD" \
  --set-env-vars "N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY" \
  --set-env-vars "EXECUTIONS_MODE=regular" \
  --set-env-vars "N8N_DIAGNOSTICS_ENABLED=false"
```

### Update existing service

```bash
gcloud run services update n8n-claira \
  --region us-central1 \
  --no-cpu-throttling \
  --cpu-boost \
  --vpc-connector n8n-connector \
  --vpc-egress all-traffic \
  --update-env-vars "DB_POSTGRESDB_HOST=$DB_PRIVATE_IP" \
  --update-env-vars "DB_TYPE=postgresdb" \
  --update-env-vars "DB_POSTGRESDB_HOST=$DB_PRIVATE_IP" \
  --update-env-vars "DB_POSTGRESDB_PORT=5432" \
  --update-env-vars "DB_POSTGRESDB_DATABASE=n8n" \
  --update-env-vars "DB_POSTGRESDB_USER=n8n" \
  --update-env-vars "DB_POSTGRESDB_PASSWORD=$N8N_DB_PASSWORD" \
  --update-env-vars "N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY" \
  --update-env-vars "EXECUTIONS_MODE=regular" \
  --update-env-vars "N8N_DIAGNOSTICS_ENABLED=false" \
  --min-instances=1
```

## 5. Set Webhook URL

After deployment, get your Cloud Run URL and update:

```bash
export SERVICE_URL=$(gcloud run services describe n8n-claira --region us-central1 --format='value(status.url)')

gcloud run services update n8n-claira \
  --region us-central1 \
  --update-env-vars "WEBHOOK_URL=$SERVICE_URL/"
```

## Updating the Deployment

```bash
# Rebuild and push
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/$PROJECT_ID/n8n/n8n-claira:latest .
docker push us-central1-docker.pkg.dev/$PROJECT_ID/n8n/n8n-claira:latest

# Deploy new image (preserves existing config)
gcloud run deploy n8n-claira \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/n8n/n8n-claira:latest \
  --region us-central1
```

## Continuous Deployment (Auto-deploy on Push)

**Via Console (recommended):**

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on your `n8n-claira` service
3. Click **Set up continuous deployment**
4. Authenticate with GitHub and select the repo
5. Choose branch (e.g., `master` or `main`)
6. Select "Cloud Build configuration" and set path to `cloudbuild.yaml`
7. Save

Now every push to the selected branch triggers a new deployment.

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `DB_TYPE` | Set to `postgresdb` |
| `DB_POSTGRESDB_HOST` | Private IP of Cloud SQL instance |
| `DB_POSTGRESDB_PORT` | `5432` |
| `DB_POSTGRESDB_DATABASE` | Database name |
| `DB_POSTGRESDB_USER` | Database user |
| `DB_POSTGRESDB_PASSWORD` | Database password |
| `N8N_ENCRYPTION_KEY` | Encryption key for credentials (keep secret!) |
| `WEBHOOK_URL` | Your Cloud Run service URL |

## Cloud Run Settings Explained

| Setting | Value | Purpose |
|---------|-------|---------|
| `--no-cpu-throttling` | - | CPU always allocated, not just during requests. Prevents workflow timeouts. |
| `--cpu-boost` | - | Temporarily boosts CPU during startup for faster cold starts |
| `--min-instances 1` | 1 | Keeps one instance warm to avoid cold starts |
| `--vpc-connector` | n8n-connector | Routes traffic through VPC to reach Cloud SQL private IP |
| `--vpc-egress all-traffic` | - | All outbound traffic goes through VPC |

## Security Recommendations

1. **Authentication** - n8n 1.0+ uses built-in user management. Create an owner account on first launch
2. **Use Secret Manager** for sensitive values instead of plain env vars:
   ```bash
   # Create secrets
   echo -n $N8N_DB_PASSWORD | gcloud secrets create n8n-db-password --data-file=-
   echo -n $N8N_ENCRYPTION_KEY | gcloud secrets create n8n-encryption-key --data-file=-
   
   # Grant access to Cloud Run service account
   gcloud secrets add-iam-policy-binding n8n-db-password \
     --member="serviceAccount:$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   gcloud secrets add-iam-policy-binding n8n-encryption-key \
     --member="serviceAccount:$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"

   # Update service to use secrets
   gcloud run services update n8n-claira \
     --region us-central1 \
     --set-secrets="DB_POSTGRESDB_PASSWORD=n8n-db-password:latest,N8N_ENCRYPTION_KEY=n8n-encryption-key:latest"
   ```
3. **Set min-instances to 1** to avoid cold starts affecting webhooks

## Migrating from Cloud SQL Proxy to VPC

If you have an existing setup using Cloud SQL proxy (`/cloudsql/...`):

```bash
# Get private IP of existing instance (must have private IP enabled)
export DB_PRIVATE_IP=$(gcloud sql instances describe n8n-db --format='value(ipAddresses[0].ipAddress)')

# Update service to use private IP instead of socket
gcloud run services update n8n-claira \
  --region us-central1 \
  --vpc-connector n8n-connector \
  --vpc-egress all-traffic \
  --no-cpu-throttling \
  --cpu-boost \
  --remove-cloudsql-instances \
  --update-env-vars "DB_POSTGRESDB_HOST=$DB_PRIVATE_IP,DB_POSTGRESDB_PORT=5432"
```

If your existing Cloud SQL instance doesn't have a private IP, you need to add one:

```bash
# Enable private IP on existing instance
gcloud sql instances patch n8n-db \
  --network=n8n-vpc \
  --no-assign-ip
```
