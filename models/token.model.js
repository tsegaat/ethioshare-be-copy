const mongoose = require("mongoose")

const Schema = mongoose.Schema

const tokenSchema = Schema({
    userId: {
        type: String,
    },

    token: {
        type: String
    }
})

const model = mongoose.model("Token", tokenSchema)
module.exports = model