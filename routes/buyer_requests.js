const router = require('express').Router()
require("dotenv").config()
const BuyerRequests = require('../models/buyer_requests.model')
const BuyerRequestsTemp = require('../models/buyerrequestTemp.model')
const Companies = require('../models/companies.model')
const authCheck = require("../middleware/authentication")
const Users = require('../models/users.model')
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

router.route('/add').post([authCheck], (req, res) => {
    const { companyPremium, userId, companyId } = req.body

    const buyerRequestsData = { companyPremium, company: companyId, user: userId }

    const buyerRequest = new BuyerRequests(buyerRequestsData)
    buyerRequest.save()
        .then(() => {
            res.json({
                buyerRequestCreated: true
            })
        })
        .catch(() => {
            res.json({
                buyerRequestCreated: false
            })
        })
})

router.route("/transferToTemp").post([authCheck], async (req, res) => {
    const { offerId, sellerId } = req.body
    const buyerReq = await BuyerRequests.findOne({ _id: offerId }, { companyPremium: 1, company: 1, user: 1 })
    if (buyerReq === !null && buyerReq === !undefined) {
        const buyerReqTemp = new BuyerRequestsTemp({ ...buyerReq["_doc"], entryTime: Date(), sellerId })
        buyerReqTemp.save().then(() => {
            BuyerRequests.findOneAndRemove({ _id: offerId }).then(() => res.json({ transferred: true }))
        }).catch((e) => {
            console.log(e)
            res.json({ transferred: false })
        })
    }
})

router.route("/getBuyerRequest").post([authCheck], async (req, res) => {
    const { companyName } = req.body
    const companyIds = await Companies.aggregate([{
        '$search': {
            'index': 'searchCompany',
            'text': {
                'query': companyName,
                'path': 'companyName'
            }
        }
    }, {
        "$project": {
            "_id": 1
        }
    }])
    const _ids = companyIds.map((id) => {
        return id._id.toString()
    })
    if (_ids.length != 0) {
        BuyerRequests.find({ company: _ids }, "", {
            sort: {
                "companyPremium": -1
            },
            limit: 5
        }).populate(path = "company", select = "_id companyName companyEmail companyLogo companyPrice companyExchangeScore companySector")
            .populate(path = "user", select = "-_id username")
            .exec((err, buyerRequestRes) => {
                res.json(buyerRequestRes)
            })
    } else {
        res.json({ status: "Not Found" })
    }
})


router.route("/getAllBuyerRequests").get([authCheck], (req, res) => {
    const page = req.query.page
    BuyerRequests.find({}, "", {
        sort: {
            "companyPremium": -1
        },
        skip: 0 + (page * 6),
        limit: 6
    }).populate(path = "company", select = "_id companyName companyEmail companyLogo companyPrice companyExchangeScore companySector")
        .populate(path = "user", select = "-_id username")
        .exec((err, buyerRequestRes) => {
            res.json(buyerRequestRes)
        })
})

const sendEmail = (email, content) => {
    return sgMail.send({
        from: "ethioshare <ethioshare1@gmail.com",
        to: email,
        subject: "Conformation Email",
        html: `
            <h1> ${content} </h1>
        `
    })
}

router.route("/sendConformations").post(async (req, res) => {
    const { offerId, sellerId } = req.body
    let buyerUserEmail = await BuyerRequests.findOne({ _id: offerId }, { _id: 0, user: 1 }).populate(path = "user", select = "-_id email")
    let sellerUserEmail = await Users.findOne({ _id: sellerId }, { _id: 0, email: 1 })

    buyerUserEmail = buyerUserEmail.user.email
    sellerUserEmail = sellerUserEmail.email
    if ((buyerUserEmail === null || undefined) || (sellerUserEmail === null || undefined)) {
        res.json({
            sent: false,
            reason: "Failed"
        })
        return
    }
    if (buyerUserEmail === sellerUserEmail) {
        res.json({
            sent: false,
            reason: "Same Email"
        })
        return
    }

    sendEmail(buyerUserEmail, "This email is for the buyer on how to proceed with the transaction.").then(() => {
        res.json({ sent: true })
    }).catch((err) => {
        console.log(err)
        res.json({ sent: false, reason: "Failed" })
    })
    sendEmail(sellerUserEmail, "This email is for the seller on how to proceed with the transaction.").then(() => {
        res.json({ sent: true })
    }).catch((err) => {
        console.log(err)
        res.json({ sent: false, reason: "Failed" })
    })

})


module.exports = router