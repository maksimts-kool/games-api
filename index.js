// Laeme .env failist keskkonnamuutujad (PORT, kasutajanimed, paroolid)
require('dotenv').config({ quiet: true })
const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const swaggerUi = require('swagger-ui-express')
const yamljs = require('yamljs')
// API dokumentatsioon, mida näidatakse aadressil /docs
const swaggerDocument = yamljs.load('./docs/swagger.yaml')
const crypto = require('crypto')
const fs = require('fs')

// Võimaldab lugeda JSON-kujul päringu keha (req.body)
app.use(express.json())

// Kasutajad: admin tohib kõike, viewer ainult lugeda (GET)
const users = [
    { role: 'admin', username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD },
    { role: 'viewer', username: process.env.VIEWER_USERNAME, password: process.env.VIEWER_PASSWORD }
]

// Mängude andmed hoitakse mälus, serveri taaskäivitusel lähevad muudatused kaotsi
const games = [
    { id: 1, name: "Cizzbor", price: 29.99 },
    { id: 2, name: "Woowo", price: 26.99 },
    { id: 3, name: "Crazlinger", price: 59.99 },
    { id: 4, name: "Fozzockle", price: 39.99 },
    { id: 5, name: "Blurpton", price: 0 }
]

// Tagastab kõik mängud
app.get('/games', requireRole('admin', 'viewer'), (req, res) => {
    res.send(games)
})

// Tagastab ühe mängu id järgi
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

// Lisab uue mängu (ainult admin)
app.post('/games', requireRole('admin'), (req, res) => {
    const { name, price } = req.body || {}
    // Nimi ja hind on kohustuslikud
    if (typeof name !== 'string' || name.trim() === '' || price === undefined || price === '') {
        return res.status(400).send({ error: 'One or all params are missing' })
    }
    // Hind peab olema arv, mis on 0 või suurem
    const priceNumber = Number(price)
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        return res.status(400).send({ error: 'Price must be a number that is 0 or greater' })
    }
    // Sama nimega mängu ei tohi olla kaks korda
    if (nameTaken(name)) {
        return res.status(409).send({ error: 'A game with this name already exists' })
    }
    // Uus id on seni suurimast id-st ühe võrra suurem
    const game = {
        id: Math.max(0, ...games.map(game => game.id)) + 1,
        name: name.trim(),
        price: priceNumber
    }

    games.push(game)

    // Location päis näitab, kust uue mängu leiab
    res.status(201)
        .location(`${getBaseUrl(req)}/games/${game.id}`)
        .send(game)
})

// Muudab olemasoleva mängu nime ja hinda (ainult admin)
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
    // Muudetav mäng ise ei lähe nime kontrollis arvesse
    if (nameTaken(name, game.id)) {
        return res.status(409).send({ error: 'A game with this name already exists' })
    }

    game.name = name.trim()
    game.price = priceNumber

    res.send(game)
})

// Kustutab mängu id järgi (ainult admin)
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

// Juuraadress suunab dokumentatsiooni lehele
app.get('/', (req, res) => {
    res.redirect('/docs')
})

// HTTP meetodid, mida iga roll tohib teha, dokumentatsioonis näidatakse ainult neid.
// Sisse logimata kasutaja (guest) ei näe ühtegi päringut
const allowedMethods = {
    admin: ['get', 'post', 'put', 'delete'],
    viewer: ['get'],
    guest: []
}
const httpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']

// Tagastab dokumentatsiooni, kus on ainult antud rolli lubatud päringud
function docsFor(role) {
    const paths = {}
    for (const [path, pathItem] of Object.entries(swaggerDocument.paths)) {
        const filtered = Object.fromEntries(Object.entries(pathItem).filter(([key]) =>
            !httpMethods.includes(key) || allowedMethods[role].includes(key)))
        // Aadress jääb välja, kui sellel pole ühtegi lubatud päringut
        if (Object.keys(filtered).some(key => httpMethods.includes(key))) {
            paths[path] = filtered
        }
    }
    return { ...swaggerDocument, paths }
}

// Dokumentatsioon sisse logitud kasutaja rolli järgi: viewer ei näe POST, PUT ja DELETE
// päringuid, sisse logimata kasutaja ei näe ühtegi päringut
app.get('/docs/swagger.json', (req, res) => {
    const user = authenticate(req)
    res.send(docsFor(user ? user.role : 'guest'))
})

// Swagger UI dokumentatsioon, swagger-auth.js laeb selle sisse- ja väljalogimisel uuesti
app.use('/docs', swaggerUi.serve, swaggerUi.setup(docsFor('guest'), {
    customJsStr: fs.readFileSync('./docs/swagger-auth.js', 'utf8')
}))

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`)
    // Hoiatame, kui mõne kasutaja nimi või parool on .env failis puudu
    for (const user of users) {
        if (!user.username || !user.password) {
            console.warn(`${user.role.toUpperCase()}_USERNAME or ${user.role.toUpperCase()}_PASSWORD is not set, the ${user.role} user can not log in`)
        }
    }
})

// Tagastab serveri aadressi, nt http://localhost:8080
function getBaseUrl(req) {
    return `${req.protocol}://${req.get('host')}`
}

// Kontrollib, kas sama nimega mäng on juba olemas (suur- ja väiketähti ei eristata)
function nameTaken(name, exceptId) {
    const normalized = name.trim().toLowerCase()
    return games.some(game => game.id !== exceptId && game.name.toLowerCase() === normalized)
}

// Loeb Authorization päisest Basic auth kasutajanime ja parooli
// ning tagastab sobiva kasutaja või null
function authenticate(req) {
    const [scheme, encoded] = (req.get('authorization') || '').split(' ')
    if (scheme !== 'Basic' || !encoded) {
        return null
    }
    // Päises on "kasutajanimi:parool" base64 kujul
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

// Vahevara, mis lubab edasi ainult antud rollidega kasutajad
// 401 - sisselogimine puudub või vale, 403 - pole piisavalt õigusi
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

// Võrdleb stringe konstantse ajaga, et ajastusrünnakuga ei saaks parooli ära arvata
function safeEqual(a, b) {
    const hashA = crypto.createHash('sha256').update(a).digest()
    const hashB = crypto.createHash('sha256').update(b).digest()
    return crypto.timingSafeEqual(hashA, hashB)
}
