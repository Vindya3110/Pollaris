#!/bin/bash
# Deploy Pollaris backend to Google Cloud Run
# Usage: ./deploy-backend.sh

set -e

echo "🚀 Deploying Pollaris Backend to Cloud Run..."

# Build and push Docker image
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/pollaris-backend ./backend

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
  --set-env-vars "MONGO_URI=mongodb+srv://pollaris:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pollaris,REDIS_ADDR=rediss://default:YOUR_PASSWORD@xxxxx.upstash.io:6379,JWT_SECRET=$(openssl rand -base64 32),PORT=8080"

echo "✅ Backend deployed!"
echo "🔗 URL will be shown above — save it for frontend config"
