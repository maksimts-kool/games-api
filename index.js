require('dotenv').config({ quiet: true })
const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const swaggerUi = require('swagger-ui-express')
const yamljs = require('yamljs')
const swaggerDocument = yamljs.load('./docs/swagger.yaml')

app.use(express.json())

const games = [
    { id: 1, name: "Cizzbor", price: 29.99 },
    { id: 2, name: "Woowo", price: 26.99 },
    { id: 3, name: "Crazlinger", price: 59.99 },
    { id: 4, name: "Fozzockle", price: 39.99 },
    { id: 5, name: "Blurpton", price: 0 }
]

app.get('/games', (req, res) => {
    res.send(games.map(game => game.name))
})

app.get('/games/:id', (req, res) => {
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

app.post('/games', (req, res) => {
    const { name, price } = req.body || {}
    if (typeof name !== 'string' || name.trim() === '' || price === undefined || price === '') {
        return res.status(400).send({ error: 'One or all params are missing' })
    }
    const priceNumber = Number(price)
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        return res.status(400).send({ error: 'Price must be a number that is 0 or greater' })
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

app.delete('/games/:id', (req, res) => {
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
})

function getBaseUrl(req) {
    return `${req.protocol}://${req.get('host')}`
}
