FROM golang:1.25-alpine

LABEL name="piggy-bank" \
      description="An personal finance management tool" \
      maintainers="Favor Charles"\
      project="Personal project for Q1"\
      language="Golang"

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o piggy-bank ./cmd/server/main.go

EXPOSE 8080
ENTRYPOINT ["./piggy-bank"]