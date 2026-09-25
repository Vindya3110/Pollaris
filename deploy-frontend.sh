#!/bin/bash
# Deploy Pollaris frontend to Google Cloud Run
# Usage: ./deploy-frontend.sh <BACKEND_URL>

set -e

if [ -z "$1" ]; then
  echo "Usage: ./deploy-frontend.sh <BACKEND_URL>"
  echo "Example: ./deploy-frontend.sh https://pollaris-backend-xxxxx-uc.a.run.app"
  exit 1
fi

BACKEND_URL="$1"
# Strip trailing slash and /api
BACKEND_URL="${BACKEND_URL%/}"
BACKEND_URL="${BACKEND_URL%/api}"

# Ensure gcloud is in PATH
export PATH="/Users/work/Downloads/google-cloud-sdk/bin:$PATH"

# Get GCP project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  echo "Error: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Project: $PROJECT_ID"
echo "API URL: $BACKEND_URL"

# Build and deploy frontend
echo ""
echo "Building and deploying frontend..."
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_VITE_API_URL="$BACKEND_URL" \
  . 2>&1 | tail -20