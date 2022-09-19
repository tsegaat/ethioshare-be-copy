const router = require("express").Router()
let Companies = require("../models/companies.model")
const authCheck = require("../middleware/authentication")

// TODO: Don't let just anyone come to the backend and request info just let the frontend request!
router.route('/wd').get((req, res) => {
    Companies.find({ trending: true }, {
        _id: 1, companyName: 1, companyEmail: 1, companyLogo: 1,
        companyPrice: 1, companyExchangeScore: 1, companySector: 1
    }, function (err, companies) {
        res.json(companies)
    });
})

router.route('/getCompanyByName').post((req, res) => {
    const { companyName } = req.body
    if (req.body == {}) return res.json({ found: false })
    Companies.find({ companyName }, {
        _id: 0, companyName: 1, companyEmail: 1, companyLogo: 1, companyPrice: 1,
        companyExchangeScore: 1, companySector: 1
    }, function (err, company) {
        if (company.length === 0) {
            res.json({ found: false })
        } else {
            res.json({ company, found: true })
        }

    })
})

router.route('/d').get([authCheck], (req, res) => {
    Companies.find({}, {
        companyName: 1, companyEmail: 1, companyLogo: 1,
        companyPrice: 1, companyExchangeScore: 1, companySector: 1,
        companyDescription: 1
    }, function (err, companies) {
        res.json(companies)
    });
})

router.route('/getCompany').post([authCheck], (req, res) => {
    const { id } = req.body
    if (req.body == {}) return res.json({ found: false })
    Companies.findOne({ _id: id }, {
        _id: 0, companyName: 1, companyLogo: 1, companyPrice: 1,
        companyExchangeScore: 1, companyDescription: 1
    }, function (err, company) {
        if (company === undefined || company === null) {
            res.json({ found: false })
        } else {
            res.json(company)
        }

    })
})

module.exports = router