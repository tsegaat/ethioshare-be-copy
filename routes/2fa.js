const speakeasy = require("speakeasy")
const router = require("express").Router()
const QRcode = require("qrcode")
const authCheck = require("../middleware/authentication")
let Users = require("../models/users.model")

const secret = speakeasy.generateSecret({
    name: "Ethioshare"
})

router.post("/", [authCheck], async (req, res) => {
    const { userId } = req.body
    const user = await Users.findOne({ _id: userId }, { _id: 0, twoFa: 1 })
    if (!user.twoFa) {
        QRcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.send("There was an error please try again.")
            Users.findOneAndUpdate({ _id: userId }, { twoFa: true }).then(() => {
                res.send(`
                <h1> Scan this qr code using your authenticator app to add ethioshare to your app. </h1>
                <img src=${data_url}/>
                <h3> The qr code is not working enter this code manually: ${secret.base32} </h3>
                <h4> After adding the QRcode or code go back to the previous page and enter the code on your authenticator app <h4/>
                `)
            }).catch(() => res.send("There was an error please try again."))
        })
    }
})

router.post("/verify", [authCheck], (req, res) => {
    const { token } = req.body
    const verified = speakeasy.totp.verify({ secret: secret.base32, encoding: "base32", token })
    if (verified) {
        res.json({ verified: true })
    } else {
        res.json({ verified: false })
    }
})

router.post("/remove", [authCheck], async (req, res) => {
    const { userId } = req.body
    Users.findOneAndUpdate({ _id: userId }, { twoFa: false }).then(() => {
        res.json({ removed: true })
    }).catch(() => res.json({ removed: false }))
})

module.exports = router