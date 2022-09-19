const { graphqlHTTP } = require("express-graphql")
const { buildSchema } = require("graphql")
let Companies = require("../models/companies.model")
const Users = require("../models/users.model")

const graphqlHandler = graphqlHTTP({
    // The type company type is what is supposed to be returned after the search
    // The RootQuery is the search function that searches the Database and returns the type company
    schema: buildSchema(`
        type Company {
            _id: ID!
            companyName: String!
            companySector: String!
            companyPrice: Float!
            companyEmail: String!
            companyLogo: String!
            companyExchangeScore: Int!
        }

        input CompanyInput {
            companyName: String
            companySector: String
            companyPrice: Float
            companyDescription: String
        }
        
        type User {
            firstName: String!
            lastName: String!
            email: String!
            username: String!
            profilePicture: String!
        }

        type Response {
            status: Boolean!
            reason: String
        }

        input UserInput {
            _id: ID!
            firstName: String
            lastName: String
            email: String
            username: String
            profilePicture: String
            language: String
            birthday: String
        }

        type RootQuery {
            company(companyInput: CompanyInput): [Company]!
            changeUserSettings(userInput: UserInput): Response!
        }

        schema {
            query: RootQuery
        }
    `),
    rootValue: {
        company: (args) => {

            const companyName = args.companyInput.companyName
            let companyPrice = args.companyInput.companyPrice
            const companySector = args.companyInput.companySector

            if (companyName === "" && companySector === "" && companyPrice === 0) {
                return Companies.find({ trending: true }, {
                    companyName: 1, companyEmail: 1, companyLogo: 1,
                    companyPrice: 1, companyExchangeScore: 1, companySector: 1
                }).then(company => {
                    return company
                }).catch(err => console.log(err))
            }

            if (companyName === "" && companySector === "") {
                return Companies.find({ companyPrice: { $lt: companyPrice } }, {
                    companyName: 1, companyEmail: 1, companyLogo: 1,
                    companyPrice: 1, companyExchangeScore: 1, companySector: 1
                }).then(company => {
                    return company
                }).catch(err => console.log(err))
            }

            return Companies.aggregate([
                {
                    '$search': {
                        'index': 'searchCompany',
                        'text': {
                            'query': [companyName, companySector],
                            'path': ["companyName", "companySector"]
                        }
                    }
                }, {
                    '$match': {
                        "companyPrice": { $lt: companyPrice }
                    }
                }
            ])


        },
        changeUserSettings: (args) => {
            const { _id, firstName, lastName, email, username, profilePicture, language, birthday } = args.userInput
            const userInput = { firstName, lastName, email, username, profilePicture, language, birthday }
            const filteredUserInput = {}
            for (const [key, value] of Object.entries(userInput)) {
                if (value !== undefined) {
                    filteredUserInput[key] = value
                }
            }

            return Users.findOneAndUpdate({ _id }, filteredUserInput).then(() => {
                return { status: true }
            }).catch((error) => {
                if (error.codeName === "DuplicateKey") {
                    return { status: false, reason: error.codeName }
                }
                return false
            })
        }

    }
})

module.exports = graphqlHandler