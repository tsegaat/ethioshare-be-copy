const mongoose = require("mongoose")
const validator = require("validator")

const Schema = mongoose.Schema

const companySchema = new Schema({
    companyName: {
        type: String
    },
    companyEmail: {
        type: String,
        unique: true,
        validate: [validator.isEmail, 'Please fill a valid email address']
    },
    companyLogo: {
        type: String
    },
    companySector: {
        type: String
    },
    companyDescription: {
        type: String
    },
    companyPrice: {
        type: Number
    },
    companyExchangeScore: {
        type: Number
    },
    trending: {
        type: Boolean
    }
}, { timestamps: true })

const Company = mongoose.model("Companies", companySchema)

module.exports = Company