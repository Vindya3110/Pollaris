FROM golang:1.23-alpine AS builder

WORKDIR /app
RUN apk add --no-cache git

# Copy go.mod first (go.sum is optional, will be regenerated if missing)
COPY go.mod ./
COPY go.sum* ./

# Download deps and allow go to generate missing go.sum entries
RUN go mod download || true
RUN go mod tidy

# Copy source
COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server/

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/server .

EXPOSE 8080
CMD ["./server"]
