# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept VITE_API_URL as build-arg (Cloud Build passes it via substitution)
ARG VITE_API_URL
# Write to .env so Vite picks it up at build time
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN rm -rf dist && npm run build

# Final stage — serve static files via nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
