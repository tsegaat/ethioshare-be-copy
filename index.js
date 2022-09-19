const express = require("express")
const cors = require("cors")
const mongoose = require('mongoose')
const authCheck = require("./middleware/authentication")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 8000

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const resetPassRouter = require("./routes/resetpass")
app.use("/resetpass", resetPassRouter)

// Development in production there will only one origin
const whitelist = ['http://localhost:3000', 'https://ethioshare.vercel.app']
app.use(cors({
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus: 200
}))

// app.use(cors())
const uri = process.env.ATLAS_URI
async function connectToDB() {
    try {
        mongoose.connect(uri)
        console.log("Connected to MongoDB")
    } catch (err) {
        console.log(err)
    }
}

connectToDB()

const connection = mongoose.connection
connection.once('open', () => {
    console.log("MangoDB database connection established")
})

const usersRouter = require("./routes/users")
app.use("/users", usersRouter)

const twoFaRouter = require("./routes/2fa")
app.use("/2fa", twoFaRouter)

const companiesRouter = require("./routes/companies")
app.use("/companies", companiesRouter)

const buyerRequestsRouter = require("./routes/buyer_requests")
app.use("/buyerRequests", buyerRequestsRouter)

app.use(authCheck)
const graphqlRouter = require("./routes/graphql")
const { urlencoded } = require("express")
app.use("/graphql", graphqlRouter)

app.use("/", (req, res) => {
    res.send("This is the body")
})
app.listen(PORT, () => {
    console.log(`The server is running on port ${PORT}`)
})