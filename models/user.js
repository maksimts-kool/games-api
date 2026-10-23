const mongoose = require('mongoose')
const crypto = require('crypto')
const { promisify } = require('util')
const scrypt = promisify(crypto.scrypt)

// Kasutaja skeem: parooli asemel hoitakse ainult soola ja scrypt räsi kujul "sool:räsi"
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'viewer'] }
}, {
    versionKey: false,
    toJSON: {
        transform: (doc, ret) => {
            delete ret._id
            delete ret.passwordHash
            return ret
        }
    }
})

// Teeb paroolist räsi, igal kasutajal on oma juhuslik sool
userSchema.statics.hashPassword = async function (password) {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = await scrypt(password, salt, 64)
    return `${salt}:${hash.toString('hex')}`
}

// Kontrollib, kas parool vastab salvestatud räsile (konstantse ajaga võrdlus)
userSchema.statics.checkPassword = async function (password, passwordHash) {
    const [salt, hash] = passwordHash.split(':')
    const expected = Buffer.from(hash, 'hex')
    const actual = await scrypt(password, salt, expected.length)
    return crypto.timingSafeEqual(actual, expected)
}

module.exports = mongoose.model('User', userSchema)
