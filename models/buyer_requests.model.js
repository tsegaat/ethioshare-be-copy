const mongoose = require('mongoose')

const Schema = mongoose.Schema

const buyerRequestsSchema = Schema({
    companyPremium: {
        type: Number
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Companies'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },

})

const model = mongoose.model("BuyerRequests", buyerRequestsSchema)
module.exports = model