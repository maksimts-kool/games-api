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

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`)
})
