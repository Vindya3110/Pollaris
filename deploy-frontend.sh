#!/bin/bash
# Deploy Pollaris frontend to Google Cloud Run
# Usage: ./deploy-frontend.sh <BACKEND_URL>
# Example: ./deploy-frontend.sh https://pollaris-backend-xxxxx-uc.a.run.app

set -e

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

# Build and push Docker image
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/pollaris-frontend ./frontend

# Deploy to Cloud Run
gcloud run deploy pollaris-frontend \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/pollaris-frontend \
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
