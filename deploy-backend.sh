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
  echo "❌ Error: MONGO_URI not set"
  echo "   Add it to .env.deploy or run: export MONGO_URI='your-connection-string'"
  exit 1
fi

if [ -z "$REDIS_ADDR" ]; then
  echo "❌ Error: REDIS_ADDR not set"
  echo "   Add it to .env.deploy or run: export REDIS_ADDR='your-redis-url'"
  exit 1
fi

echo "🚀 Deploying Pollaris Backend to Cloud Run..."

# Get GCP project ID from gcloud config
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi
echo "   Project: $PROJECT_ID"

# Generate JWT secret if not provided
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32)}"

# Submit Cloud Build with the config file
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_MONGO_URI="$MONGO_URI",_REDIS_ADDR="$REDIS_ADDR",_JWT_SECRET="$JWT_SECRET" .

echo "✅ Backend deployed!"
echo "🔗 URL will be shown above — save it for frontend config"
