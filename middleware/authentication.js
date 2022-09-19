require("dotenv").config()
const jwt = require("jsonwebtoken")

module.exports = function authCheck(req, res, next) {
    // FIXME Logs an error saying "Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client"
    if (req.headers["x-access-token"] !== undefined) {
        const ACCESS_TOKEN = req.headers["x-access-token"]
        try {
            jwt.verify(ACCESS_TOKEN, process.env.ACCESS_TOKEN)
            return next()
        } catch {
            return res.sendStatus(403).send("Permission Denied")
        }
    } else {
        return res.sendStatus(403).send("Permission Denied")
    }
}