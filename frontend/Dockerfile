# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# VITE_API_URL is read from .env file by Vite at build time.
# Cloud Build passes it via --build-arg → written into .env.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
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
