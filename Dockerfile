# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build Go backend
FROM golang:1.23-alpine AS backend-builder
WORKDIR /app
COPY backend/go.mod backend/go.sum* ./
RUN go mod download || true
RUN go mod tidy
COPY backend/ .
COPY --from=frontend-builder /app/frontend/dist ./dist
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server/

# Stage 3: Final image
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=backend-builder /app/server .
COPY --from=backend-builder /app/dist ./dist
EXPOSE 8080
CMD ["./server"]
