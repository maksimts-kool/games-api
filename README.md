# widgets-api

REST API for **widgets**, built with Node.js and Express. Course: Hajusrakenduste alused (Backend).

Data is kept in an in-memory array, so it resets when the server restarts.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- Optional: [xh](https://github.com/ducaale/xh) for testing requests from the terminal

## Setup

```bash
git clone <repo-url>
cd widgets-api
npm install
cp .env.example .env
```

`.env` settings:

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | Port the API listens on |

## Running

```bash
npm start      # node .
npm run dev    # nodemon ., restarts on file changes
```

The API runs at `http://localhost:8080`, and the Swagger documentation is at `http://localhost:8080/docs`.

## Endpoints

| Method | Path | Success | Errors |
|---|---|---|---|
| `GET` | `/widgets` | `200`, array of widget names | |
| `GET` | `/widgets/:id` | `200`, full widget object | `400` invalid id, `404` not found |
| `POST` | `/widgets` | `201`, created widget plus `Location` header | `400` missing or invalid params |
| `DELETE` | `/widgets/:id` | `204` no content | `400` invalid id, `404` not found |

Errors are returned as `{ "error": "..." }`.

## Testing with xh

```bash
xh -v localhost:8080/widgets
xh -v localhost:8080/widgets/1
xh -v localhost:8080/widgets name=Tetris price:=0.99
xh -v DELETE localhost:8080/widgets/2
```
