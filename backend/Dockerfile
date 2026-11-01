FROM golang:1.23-alpine AS build

WORKDIR /src

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api ./cmd/api

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata su-exec \
	&& adduser -D -H -u 10001 appuser

WORKDIR /app
COPY --from=build /out/api /app/api
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
