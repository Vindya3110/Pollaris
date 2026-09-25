#!/bin/bash
# Deploy Pollaris frontend to Google Cloud Run
# Usage: ./deploy-frontend.sh <BACKEND_URL>
# Example: ./deploy-frontend.sh https://pollaris-backend-xxxxx-uc.a.run.app

set -e

# Load .env.deploy if present (for consistency)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
  set -a
  source "$SCRIPT_DIR/.env.deploy"
  set +a
fi

# Ensure gcloud is in PATH
export PATH="/Users/work/Downloads/google-cloud-sdk/bin:$PATH"

if [ -z "$1" ]; then
  echo "Usage: ./deploy-frontend.sh <BACKEND_URL>"
  echo "Example: ./deploy-frontend.sh https://pollaris-backend-xxxxx-uc.a.run.app"
  exit 1
fi

BACKEND_URL="$1"
# Strip trailing slash and /api if present
BACKEND_URL="${BACKEND_URL%/}"
BACKEND_URL="${BACKEND_URL%/api}"

echo "🚀 Deploying Pollaris Frontend to Cloud Run..."
echo "   API URL: $BACKEND_URL"

# Get GCP project ID from gcloud config
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

# Build and push Docker image
gcloud builds submit --tag gcr.io/$PROJECT_ID/pollaris-frontend ./frontend

# Deploy to Cloud Run
gcloud run deploy pollaris-frontend \
  --image gcr.io/$PROJECT_ID/pollaris-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80 \
  --memory 256Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 20 \
  --set-env-vars "VITE_API_URL=$BACKEND_URL"

echo "✅ Frontend deployed!"
echo "🔗 URL will be shown above — this is your live app"
