# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# VITE_API_URL is read from .env file by Vite. Set it to your backend URL at build time.
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
