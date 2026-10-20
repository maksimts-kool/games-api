const mongoose = require('mongoose')

// Mängu skeem: id on meie enda järjekorranumber (1, 2, 3...), MongoDB _id jääb vastusest välja
const gameSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }
}, {
    versionKey: false,
    toJSON: {
        transform: (doc, ret) => {
            delete ret._id
            return ret
        }
    }
})

// Sama nimega mängu ei tohi olla kaks korda (strength 2 = suur- ja väiketähti ei eristata)
gameSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })

module.exports = mongoose.model('Game', gameSchema)
