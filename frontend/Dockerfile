# Build stage — built on your local machine
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
# Clear any local .env that would override the build-arg VITE_API_URL
RUN rm -f .env && rm -rf dist && \
    VITE_API_URL=${VITE_API_URL} npm run build

# Final stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
