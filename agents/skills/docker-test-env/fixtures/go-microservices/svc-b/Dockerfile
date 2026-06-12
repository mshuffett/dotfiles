FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod .
RUN go mod download
COPY . .
RUN go build -o svc-b .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/svc-b .
EXPOSE 8081
CMD ["./svc-b"]
