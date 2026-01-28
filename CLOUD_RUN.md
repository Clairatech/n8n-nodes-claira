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
gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com

# Create Artifact Registry repository (one-time)
gcloud artifacts repositories create n8n \
  --repository-format=docker \
  --location=us-central1

# Configure Docker to use Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## 1. Set up Cloud SQL

n8n requires a database for persistence (Cloud Run is stateless).

```bash
# Create PostgreSQL instance (db-g1-small minimum recommended for stable connections)
gcloud sql instances create n8n-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=us-central1

# Create database
gcloud sql databases create n8n --instance=n8n-db

# Create user (save this password!)
gcloud sql users create n8n \
  --instance=n8n-db \
  --password=YOUR_SECURE_PASSWORD
```

## 2. Build and Push Image

```bash
# Build the image (--platform required for Apple Silicon Macs)
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/$PROJECT_ID/n8n/n8n-claira:latest .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/$PROJECT_ID/n8n/n8n-claira:latest
```

## 3. Deploy to Cloud Run

```bash
# Get Cloud SQL connection name
export DB_CONNECTION=$(gcloud sql instances describe n8n-db --format='value(connectionName)')

# Generate encryption key (save this securely!)
export N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "Save this key: $N8N_ENCRYPTION_KEY"

# Set database password (must match what you used in Cloud SQL setup)
export N8N_DB_PASSWORD=YOUR_SECURE_PASSWORD

# Deploy
gcloud run deploy n8n-claira \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/n8n/n8n-claira:latest \
  --region us-central1 \
  --port 5678 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 3 \
  --add-cloudsql-instances $DB_CONNECTION \
  --set-env-vars "DB_TYPE=postgresdb" \
  --set-env-vars "DB_POSTGRESDB_HOST=/cloudsql/$DB_CONNECTION" \
  --set-env-vars "DB_POSTGRESDB_DATABASE=n8n" \
  --set-env-vars "DB_POSTGRESDB_USER=n8n" \
  --set-env-vars "DB_POSTGRESDB_PASSWORD=$N8N_DB_PASSWORD" \
  --set-env-vars "N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY" \
  --set-env-vars "EXECUTIONS_MODE=regular" \
  --set-env-vars "N8N_DIAGNOSTICS_ENABLED=false"
```

gcloud run services update n8n-claira \
  --region us-central1 \
  --update-env-vars "DB_TYPE=postgresdb" \
  --update-env-vars "DB_POSTGRESDB_HOST=/cloudsql/$DB_CONNECTION" \
  --update-env-vars "DB_POSTGRESDB_DATABASE=n8n" \
  --update-env-vars "DB_POSTGRESDB_USER=n8n" \
  --update-env-vars "DB_POSTGRESDB_PASSWORD=$N8N_DB_PASSWORD" \
  --update-env-vars "N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY" \
  --update-env-vars "EXECUTIONS_MODE=regular" \
  --update-env-vars "N8N_DIAGNOSTICS_ENABLED=false"

## 4. Set Webhook URL

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

# Deploy new image
gcloud run deploy n8n-claira \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/n8n/n8n-claira:latest \
  --vpc-connector n8n-connector \
  --vpc-egress all-traffic \
  --region us-central1
```

## Continuous Deployment (Auto-deploy on Push)

**Via Console (recommended):**

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on your `n8n-claira` service
3. Click **Set up continuous deployment**
4. Authenticate with GitHub and select the repo
5. Choose branch (e.g., `master` or `main`)
6. Select "Dockerfile" as the build type
7. Save

Now every push to the selected branch triggers a new deployment.

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `DB_TYPE` | Set to `postgresdb` |
| `DB_POSTGRESDB_HOST` | Cloud SQL socket path |
| `DB_POSTGRESDB_DATABASE` | Database name |
| `DB_POSTGRESDB_USER` | Database user |
| `DB_POSTGRESDB_PASSWORD` | Database password |
| `N8N_ENCRYPTION_KEY` | Encryption key for credentials (keep secret!) |
| `WEBHOOK_URL` | Your Cloud Run service URL |

## Security Recommendations

1. **Authentication** - n8n 1.0+ uses built-in user management. Create an owner account on first launch
2. **Use Secret Manager** for sensitive values instead of plain env vars:
   ```bash
   # Create secret
   echo -n "YOUR_PASSWORD" | gcloud secrets create n8n-db-password --data-file=-
   
   # Grant access to Cloud Run service account
   gcloud secrets add-iam-policy-binding n8n-db-password \
     --member="serviceAccount:$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   
   # Update service to use secret
   gcloud run services update n8n-claira \
     --region us-central1 \
     --set-secrets="DB_POSTGRESDB_PASSWORD=n8n-db-password:latest"
   ```
3. **Set min-instances to 1** to avoid cold starts affecting webhooks
