require('dotenv').config({ quiet: true })
const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const swaggerUi = require('swagger-ui-express')
const yamljs = require('yamljs')
const swaggerDocument = yamljs.load('./docs/swagger.yaml')

app.use(express.json())

const widgets = [
    { id: 1, name: "Cizzbor", price: 29.99 },
    { id: 2, name: "Woowo", price: 26.99 },
    { id: 3, name: "Crazlinger", price: 59.99 },
    { id: 4, name: "Fozzockle", price: 39.99 },
    { id: 5, name: "Blurpton", price: 0 }
]

app.get('/widgets', (req, res) => {
    res.send(widgets.map(widget => widget.name))
})

app.get('/widgets/:id', (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).send({ error: "Widget id must be a positive integer" })
    }
    const widget = widgets.find(widget => widget.id === id)
    if (!widget) {
        return res.status(404).send({ error: "Widget not found" })
    }
    res.send(widget)
})

app.post('/widgets', (req, res) => {
    const { name, price } = req.body || {}
    if (typeof name !== 'string' || name.trim() === '' || price === undefined || price === '') {
        return res.status(400).send({ error: 'One or all params are missing' })
    }
    const priceNumber = Number(price)
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        return res.status(400).send({ error: 'Price must be a number that is 0 or greater' })
    }
    const widget = {
        id: Math.max(0, ...widgets.map(widget => widget.id)) + 1,
        name: name.trim(),
        price: priceNumber
    }

    widgets.push(widget)

    res.status(201)
        .location(`${getBaseUrl(req)}/widgets/${widget.id}`)
        .send(widget)
})

app.delete('/widgets/:id', (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).send({ error: "Widget id must be a positive integer" })
    }
    const index = widgets.findIndex(widget => widget.id === id)
    if (index === -1) {
        return res.status(404).send({ error: "Widget not found" })
    }

    widgets.splice(index, 1)

    res.status(204).send()
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`)
})

function getBaseUrl(req) {
    return `${req.protocol}://${req.get('host')}`
}
