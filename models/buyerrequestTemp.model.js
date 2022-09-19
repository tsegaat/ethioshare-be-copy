const mongoose = require("mongoose")

const Schema = mongoose.Schema

const buyerRequestsTempSchema = Schema({
    companyPremium: {
        type: Number,
        required: true
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Companies',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    sellerId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    entryTime: {
        type: Schema.Types.Date,
        required: true,
    },
})

const model = mongoose.model("BuyerRequestTemp", buyerRequestsTempSchema)
module.exports = model