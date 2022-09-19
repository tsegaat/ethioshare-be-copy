const mongoose = require("mongoose")
const validator = require("validator")

const Schema = mongoose.Schema

const usersSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    profilePicture: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate: [validator.isEmail, 'Please fill a valid email address'],
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: 5
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    language: {
        type: String,
        required: true
    },
    birthday: {
        type: String,
        required: true
    },
    twoFa: {
        type: Boolean,
        required: true
    }
}, {
    timestamps: true,
})

const Users = mongoose.model("Users", usersSchema)

module.exports = Users