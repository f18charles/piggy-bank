# syntax=docker/dockerfile:1

# Stage 1: Build binary
FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server ./cmd/server

# Stage 2: Minimal runtime image
FROM alpine:3.19 AS runtime

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/server /app/server
COPY --from=builder /app/internal/database/migrations /app/migrations

ENV PORT=8080 \
    APP_ENV=production

EXPOSE 8080

USER nobody:nobody

ENTRYPOINT ["/app/server"]