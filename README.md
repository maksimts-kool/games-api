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
