#!/bin/bash
# Deploy Pollaris backend to Google Cloud Run
# Usage: source .env.deploy && ./deploy-backend.sh
# Or set env vars directly in your terminal before running

set -e

if [ -z "$MONGO_URI" ]; then
  echo "❌ Error: MONGO_URI not set"
  echo "   Run: export MONGO_URI='your-mongodb-connection-string'"
  exit 1
fi

if [ -z "$REDIS_ADDR" ]; then
  echo "❌ Error: REDIS_ADDR not set"
  echo "   Run: export REDIS_ADDR='your-redis-url'"
  exit 1
fi

echo "🚀 Deploying Pollaris Backend to Cloud Run..."

# Build and push Docker image
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/pollaris-backend ./backend

# Generate JWT secret if not provided
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32)}"

# Deploy to Cloud Run
gcloud run deploy pollaris-backend \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/pollaris-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "MONGO_URI=$MONGO_URI,REDIS_ADDR=$REDIS_ADDR,JWT_SECRET=$JWT_SECRET,PORT=8080"

echo "✅ Backend deployed!"
echo "🔗 URL will be shown above — save it for frontend config"
