# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept VITE_API_URL as build-arg (Cloud Run won't pass it, so it's empty — nginx handles it)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN rm -rf dist && npm run build

# Final stage — serve via nginx which proxies API/WebSocket to backend
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
