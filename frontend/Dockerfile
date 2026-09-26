# Build stage — built on your local machine
FROM node:20-alpine AS builder

WORKDIR /app

# Cache bust — timestamp ensures fresh build
ARG BUILD_TIME=20260926-v2
RUN echo "Build: $BUILD_TIME"

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Final stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
