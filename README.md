# games-api

REST API for **games**, built with Node.js and Express. Course: Hajusrakenduste alused (Backend).

Data is kept in an in-memory array, so it resets when the server restarts.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- Optional: [xh](https://github.com/ducaale/xh) for testing requests from the terminal

## Setup

```bash
git clone <repo-url>
cd games-api
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
| `GET` | `/games` | `200`, array of game names | |
| `GET` | `/games/:id` | `200`, full game object | `400` invalid id, `404` not found |
| `POST` | `/games` | `201`, created game plus `Location` header | `400` missing or invalid params |
| `DELETE` | `/games/:id` | `204` no content | `400` invalid id, `404` not found |

Errors are returned as `{ "error": "..." }`.

## Testing with xh

```bash
xh -v localhost:8080/games
xh -v localhost:8080/games/1
xh -v localhost:8080/games name=Tetris price:=0.99
xh -v DELETE localhost:8080/games/2
```

## Links

- GitHub: <https://github.com/maksimts-kool/games-api>
- LiteTracker stories: <https://eu.litetracker.com/story/show/88852>, [#88853](https://eu.litetracker.com/story/show/88853), [#88854](https://eu.litetracker.com/story/show/88854), [#88855](https://eu.litetracker.com/story/show/88855), [#88856](https://eu.litetracker.com/story/show/88856)
