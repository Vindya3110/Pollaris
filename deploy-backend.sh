#!/bin/bash
# Deploy Pollaris backend to Google Cloud Run
# Automatically loads secrets from .env.deploy if present

set -e

# Ensure gcloud is in PATH
export PATH="/Users/work/Downloads/google-cloud-sdk/bin:$PATH"

# Load secrets from .env.deploy if it exists
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
  set -a
  source "$SCRIPT_DIR/.env.deploy"
  set +a
fi

if [ -z "$MONGO_URI" ]; then
  echo "Error: MONGO_URI not set. Add it to .env.deploy or export it."
  exit 1
fi

if [ -z "$REDIS_ADDR" ]; then
  echo "Error: REDIS_ADDR not set. Add it to .env.deploy or export it."
  exit 1
fi

# Get GCP project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  echo "Error: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi
echo "Project: $PROJECT_ID"

# Generate JWT secret if not provided
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32)}"

# Deploy to Cloud Run (image already exists, just update deploy config)
echo ""
echo "Deploying to Cloud Run..."

gcloud run deploy pollaris-backend \
  --image gcr.io/$PROJECT_ID/pollaris-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "MONGO_URI=$MONGO_URI,REDIS_ADDR=$REDIS_ADDR,JWT_SECRET=$JWT_SECRET"

echo ""
echo "Backend deployed!"
