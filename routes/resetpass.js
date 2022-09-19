const jwt = require("jsonwebtoken")
const router = require("express").Router()
let Users = require("../models/users.model")
let Token = require("../models/token.model")
require("dotenv").config()


router.get("/:id/:token", async (req, res) => {
    const user = await Users.findOne({ _id: req.params.id }, { _id: 0 })
    const token = await Token.findOne({
        userId: req.params.id,
        token: req.params.token
    })
    try {
        jwt.verify(token.token, process.env.RESET_PASSWORD)
    } catch {
        return res.send("The Link has expired or is invalid")
    }

    if (!user || !token) return res.send("Invalid Link")
    // Redirect user to a frontend where they can put there new password
    const url = req.params.id + "|||" + req.params.token
    return res.redirect(`https://ethioshare.vercel.app/resetpass/${url}`)
})

module.exports = router