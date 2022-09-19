const router = require("express").Router()
let Users = require("../models/users.model")
let Token = require("../models/token.model")
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
require("dotenv").config()
var multer = require('multer')
var upload = multer({ dest: 'uploads/' })
const cloudinary = require('cloudinary').v2
const authCheck = require("../middleware/authentication")
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_SERVER_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

router.route('/login').post((req, res) => {
    const email = req.body.email
    const password = req.body.password
    // TODO: Do more authentication
    Users.findOne({ email: email }, { password: 1 }, function (err, user) {
        if (user === null) {
            res.json({
                userExist: false
            })
        } else {
            bcrypt.compare(password, user.password, (err, bol) => {
                if (bol) {
                    const userId = user._id.toString()
                    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN, {
                        expiresIn: "5m"
                    })
                    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN, {
                        expiresIn: "1d"
                    })
                    res.json({
                        userExist: true,
                        correct: true,
                        userId,
                        accessToken,
                        refreshToken
                    })
                } else {
                    res.json({
                        userExist: true,
                        correct: false
                    })
                }
            })
        }
    });
})

router.route('/create').post((req, res) => {
    const { firstName, lastName, email, username, password } = req.body
    const language = "English"
    const profilePicture = "https://res.cloudinary.com/ethioshare/image/upload/v1645550971/users/placeholder_users.png"
    const birthday = "YYYY-MM-DD"
    const twoFa = false
    // TODO: Do more authentication
    // TODO: handle all errors so the server never crashes
    bcrypt.hash(password, 5, function (err, encryptedPassword) {
        const user = {
            firstName, lastName, email, username, password: encryptedPassword, language,
            profilePicture, birthday, twoFa
        }
        const newUser = new Users(user)
        newUser.save()
            .then((user) => {
                const token = jwt.sign(user._id.toString(), process.env.ACCESS_TOKEN)
                const refreshToken = jwt.sign(user._id.toString(), process.env.REFRESH_TOKEN)
                res.json({
                    userCreated: true,
                    userId: user._id.toString(),
                    token,
                    refreshToken
                })
            })
            .catch(err => {
                console.log(err)
                const error = err.keyPattern
                const errorCause = Object.keys(error)[0]
                res.json({ userCreated: false, errorCause: errorCause })
            })
    });

})

router.post("/getUser", [authCheck], (req, res) => {
    const { userId } = req.body
    Users.findOne({ _id: userId }, {
        firstName: 1, lastName: 1, email: 1, username: 1, profilePicture: 1,
        language: 1, birthday: 1, twoFa: 1
    }).then((user) => {
        res.json(user)
    }).catch(() => res.sendStatus(404))
})

router.route('/changePassword').post([authCheck], async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body

    Users.findOne({ _id: userId }, { password: 1, _id: 0 }, function (err, user) {
        const { password } = user
        bcrypt.compare(oldPassword, password).then((val) => {
            if (val) {
                bcrypt.hash(newPassword, 5, (err, encNewPass) => {
                    Users.findOneAndUpdate({ _id: userId }, { password: encNewPass }).then(() => {
                        res.json({ success: true })
                    })
                })
            } else res.json({ success: val })
        })
    })
})

router.post('/changeProfilePicture', [authCheck, upload.single('profilePic')], (req, res) => {
    const { profilePic, userId } = req.body

    cloudinary.uploader.upload(profilePic, { public_id: `users/${userId}`, use_filename: true }).then(result => {
        Users.findOneAndUpdate({ _id: userId }, { profilePicture: result.secure_url }, (err, user) => {
            if (err) res.json({ status: false })
            res.json({ status: true })
        })

    })

})

router.post("/forget-password", async (req, res) => {
    const { email } = req.body
    const user = await Users.findOne({ email: email }, { _id: 1, password: 1 })
    if (!user) return res.json({ userExist: false })

    let token = await Token.findOne({ userId: user.userId }, { _id: 0, token: 1 })
    if (!token) {
        token = await new Token({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, process.env.RESET_PASSWORD, { expiresIn: "5m" })
        }).save()
    }

    const url = `https://ethioshare-be.herokuapp.com/resetpass/${user._id}/${token.token}`
    const msg = {
        to: email,
        from: 'ethioshare <ethioshare1@gmail.com',
        subject: 'Ethioshare Reset Link',
        html: `
            <h1> Here is your password reset link </h1>
            <br/>
            <h3>${url}</h3>
        `,
    }
    sgMail
        .send(msg)
        .then(() => {
            res.json({ userExist: true, sent: true })
        }).catch((err) => {
            console.log(err)
            res.json({ userExist: true, sent: false })
        })
})

router.post("/reset-password", (req, res) => {
    const { userId, password } = req.body
    return bcrypt.hash(password, 5, async function (err, encryptedPassword) {
        if (err) return res.json({ updated: false })
        try {
            const user = await Users.findByIdAndUpdate(userId, { password: encryptedPassword })
            return res.json({ updated: true })
        } catch {
            return res.json({ updated: false })
        }
    })
})

module.exports = router