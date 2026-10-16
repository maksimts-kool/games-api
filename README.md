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
| `ADMIN_USERNAME` | | Admin username for `PUT` and `DELETE` |
| `ADMIN_PASSWORD` | | Admin password for `PUT` and `DELETE` |

## Running

```bash
npm start      # node .
npm run dev    # nodemon ., restarts on file changes
```

The API runs at `http://localhost:8080`, and the Swagger documentation is at `http://localhost:8080/docs`.

## Endpoints

| Method | Path | Success | Errors |
|---|---|---|---|
| `GET` | `/games` | `200`, array of full game objects | |
| `GET` | `/games/:id` | `200`, full game object | `400` invalid id, `404` not found |
| `POST` | `/games` | `201`, created game plus `Location` header | `400` missing or invalid params, `409` name already exists |
| `PUT` | `/games/:id` | `200`, updated game | `401` not admin, `400` invalid id or params, `404` not found, `409` name already exists |
| `DELETE` | `/games/:id` | `204` no content | `401` not admin, `400` invalid id, `404` not found |

Errors are returned as `{ "error": "..." }`.

Game names are unique. `POST` and `PUT` return `409` if another game already has the same name (compared case-insensitively, ignoring surrounding spaces). A `PUT` that keeps the game's own name is allowed.

`PUT` and `DELETE` are admin only. They need HTTP Basic auth with `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`. If either is not set, these requests always return `401`.

## Testing with xh

```bash
xh -v localhost:8080/games
xh -v localhost:8080/games/1
xh -v localhost:8080/games name=Tetris price:=0.99
xh -v -a admin:change-me PUT localhost:8080/games/1 name="Cizzbor Deluxe" price:=34.99
xh -v -a admin:change-me DELETE localhost:8080/games/2
```

## Links

- GitHub: <https://github.com/maksimts-kool/games-api>
- LiteTracker stories: <https://eu.litetracker.com/story/show/88852>, [#88853](https://eu.litetracker.com/story/show/88853), [#88854](https://eu.litetracker.com/story/show/88854), [#88855](https://eu.litetracker.com/story/show/88855), [#88856](https://eu.litetracker.com/story/show/88856)
