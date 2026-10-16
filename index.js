require('dotenv').config({ quiet: true })
const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const swaggerUi = require('swagger-ui-express')
const yamljs = require('yamljs')
const swaggerDocument = yamljs.load('./docs/swagger.yaml')
const crypto = require('crypto')

app.use(express.json())

const users = [
    { role: 'admin', username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD },
    { role: 'viewer', username: process.env.VIEWER_USERNAME, password: process.env.VIEWER_PASSWORD }
]

const games = [
    { id: 1, name: "Cizzbor", price: 29.99 },
    { id: 2, name: "Woowo", price: 26.99 },
    { id: 3, name: "Crazlinger", price: 59.99 },
    { id: 4, name: "Fozzockle", price: 39.99 },
    { id: 5, name: "Blurpton", price: 0 }
]

app.get('/games', requireRole('admin', 'viewer'), (req, res) => {
    res.send(games)
})

app.get('/games/:id', requireRole('admin', 'viewer'), (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).send({ error: "Game id must be a positive integer" })
    }
    const game = games.find(game => game.id === id)
    if (!game) {
        return res.status(404).send({ error: "Game not found" })
    }
    res.send(game)
})

app.post('/games', requireRole('admin'), (req, res) => {
    const { name, price } = req.body || {}
    if (typeof name !== 'string' || name.trim() === '' || price === undefined || price === '') {
        return res.status(400).send({ error: 'One or all params are missing' })
    }
    const priceNumber = Number(price)
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        return res.status(400).send({ error: 'Price must be a number that is 0 or greater' })
    }
    if (nameTaken(name)) {
        return res.status(409).send({ error: 'A game with this name already exists' })
    }
    const game = {
        id: Math.max(0, ...games.map(game => game.id)) + 1,
        name: name.trim(),
        price: priceNumber
    }

    games.push(game)

    res.status(201)
        .location(`${getBaseUrl(req)}/games/${game.id}`)
        .send(game)
})

app.put('/games/:id', requireRole('admin'), (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).send({ error: "Game id must be a positive integer" })
    }
    const game = games.find(game => game.id === id)
    if (!game) {
        return res.status(404).send({ error: "Game not found" })
    }
    const { name, price } = req.body || {}
    if (typeof name !== 'string' || name.trim() === '' || price === undefined || price === '') {
        return res.status(400).send({ error: 'One or all params are missing' })
    }
    const priceNumber = Number(price)
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        return res.status(400).send({ error: 'Price must be a number that is 0 or greater' })
    }
    if (nameTaken(name, game.id)) {
        return res.status(409).send({ error: 'A game with this name already exists' })
    }

    game.name = name.trim()
    game.price = priceNumber

    res.send(game)
})

app.delete('/games/:id', requireRole('admin'), (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).send({ error: "Game id must be a positive integer" })
    }
    const index = games.findIndex(game => game.id === id)
    if (index === -1) {
        return res.status(404).send({ error: "Game not found" })
    }

    games.splice(index, 1)

    res.status(204).send()
})

app.get('/', (req, res) => {
    res.redirect('/docs')
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`)
    for (const user of users) {
        if (!user.username || !user.password) {
            console.warn(`${user.role.toUpperCase()}_USERNAME or ${user.role.toUpperCase()}_PASSWORD is not set, the ${user.role} user can not log in`)
        }
    }
})

function getBaseUrl(req) {
    return `${req.protocol}://${req.get('host')}`
}

function nameTaken(name, exceptId) {
    const normalized = name.trim().toLowerCase()
    return games.some(game => game.id !== exceptId && game.name.toLowerCase() === normalized)
}

function authenticate(req) {
    const [scheme, encoded] = (req.get('authorization') || '').split(' ')
    if (scheme !== 'Basic' || !encoded) {
        return null
    }
    const decoded = Buffer.from(encoded, 'base64').toString()
    const separator = decoded.indexOf(':')
    if (separator === -1) {
        return null
    }
    const username = decoded.slice(0, separator)
    const password = decoded.slice(separator + 1)
    return users.find(user => user.username && user.password &&
        safeEqual(username, user.username) && safeEqual(password, user.password)) || null
}

function requireRole(...roles) {
    return (req, res, next) => {
        const user = authenticate(req)
        if (!user) {
            return res.status(401).send({ error: 'Valid credentials are required' })
        }
        if (!roles.includes(user.role)) {
            return res.status(403).send({ error: 'Admin rights are required' })
        }
        req.user = user
        next()
    }
}

function safeEqual(a, b) {
    const hashA = crypto.createHash('sha256').update(a).digest()
    const hashB = crypto.createHash('sha256').update(b).digest()
    return crypto.timingSafeEqual(hashA, hashB)
}
