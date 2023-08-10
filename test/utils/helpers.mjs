import { MongoClient } from "mongodb"
import axios from 'axios'
import Ajv from 'ajv'
import { responses } from "./schemas.mjs"
import { faker } from '@faker-js/faker'
import dotenv from "dotenv"

dotenv.config()

axios.defaults.validateStatus = (status) => {
    return status >= 200 && status < 500
}

export async function sendRequest(reqParams) {
    try {
        const start = new Date()    // <-- 
        const response = await axios({
            baseURL: process.env.BASE_URL,  // This straightforward method of measuring
            ...reqParams                    // response time is nonetheless accurate.
        })
        const end = new Date()    // <-- 
        return {
            time: end - start,
            ...response
        }
    } catch (error) {
        console.error(error)
    }
}

// Iterates through all existing pages with provided query parameters.

export async function* nextPage(query) {
    let page = 1
    while (true) {
        const request = {
            url: "/api",
            method: "GET",
            params: {
                page,
                ...query
            }
        }
        const response = await sendRequest(request)
        yield {
            request,
            response
        }
        page++
        if (!response.data.next) {
            return
        }
    }
}

// Generates valid and somewhat realistic request bodies.

export class Body {
    name = faker.lorem.word({ length: { min: 3, max: 10 } })
    type = pickOne(Body.types)
    invented = int(2023).toString()
    origin = faker.location.country()
    static arrayProps = {
        musicians: faker.person.fullName,
        songs: faker.music.songName,
        brands: faker.company.name,
        tags: faker.word.adjective
    }
    static types = [
        "Bowed string",
        "Plucked string",
        "Woodwind",
        "Brass",
        "Percussion",
        "Keyboard",
        "Other"
    ]
    constructor() {
        for (const prop in Body.arrayProps) {
            this[prop] = uniqueArray(
                Body.arrayProps[prop],
                int({ min: 1, max: 5 })
            )
        }
    }
}

const ajv = new Ajv({ allErrors: true, schemas: [responses] })

// Validates responses. Returns either true or validation errors.

export function validate(object, schema) {
    const valid = ajv.getSchema(`responses#/$defs/${schema}`)
    return valid(object) || valid.errors
}

const client = new MongoClient(process.env.MONGO_URI)
const db = client.db().collection("instruments")

// Returns a random sample document.

export async function getSample() {
    try {
        await client.connect()
        const [sample] = await db.aggregate([
            {
                $sample: {
                    size: 1
                }
            }
        ]).toArray()
        await client.close()
        return sample
    } catch (error) {
        console.error(error)
    }
}

// Returns the number of found documents.

export async function getCount(search) {
    try {
        await client.connect()
        const count = await db.countDocuments(
            search ? {
                $text: {
                    $search: `"${search}"`
                }
            } : {}
        )
        await client.close()
        return count
    } catch (error) {
        console.error(error)
    }
}

// Returns the number of skipped documents that precede the document passed as the first argument.

export async function getSkip(
    { _id },
    { search, sort_by = "_id", sort_direction = "asc" }
) {
    try {
        await client.connect()
        const allResults = await db
            .find(
                search ? {
                    $text: {
                        $search: `"${search}"`
                    }
                } : {}
            )
            .collation({
                locale: "en",
                strength: 1
            })
            .sort({
                [sort_by]: sort_direction === "asc" ? 1 : -1
            })
            .toArray()
        const index = allResults.findIndex(item => item._id === _id)
        const skipped = allResults.slice(0, index).length
        await client.close()
        return skipped
    } catch (error) {
        console.error(error)
    }
}

// Sorts an array of search results in a particular order.

export function sortResults(
    [...results],
    { sort_by = "_id", sort_direction = "asc" }
) {
    const options = {
        _id: {
            asc(a, b) {
                return a._id - b._id
            },
            desc(a, b) {
                return b._id - a._id
            }
        },
        name: {
            asc(a, b) {
                return a.name.localeCompare(b.name)
            },
            desc(a, b) {
                return b.name.localeCompare(a.name)
            }
        }
    }
    return results.sort(options[sort_by][sort_direction])
}

// Checks that all objects of the search results array contain a string that matches the search string.

export function checkResults(results, search) {
    const escSpecial = search.replace(/\W/g, "\\$&")
    const regex = new RegExp(`${escSpecial}`, "i")
    return results.every(item =>
        Object.values(item)
            .flat()
            .some(string => regex.test(string))
    )
}

// Returns a random string from a random document to be used as a search string.

export async function searchString() {
    const randomInst = await getSample()
    delete randomInst._id
    const strings = Object.values(randomInst).flat()
    return pickOne(strings)
}

// Scans the database for strings that contain diacritics and returns a random string.

export async function diacriticString() {
    try {
        await client.connect()
        const all = await db.find().toArray()
        let diacritics = []
        all.forEach((item) => {
            const strings = Object.values(item).flat()
            strings.forEach((string) => {
                if (/[^\x00-\x7F]/.test(string)) {
                    diacritics.push(string)
                }
            })
        })
        await client.close()
        return pickOne(diacritics)
    } catch (error) {
        console.error(error)
    }
}

// Samples of different data types (supported in JSON).

export const samples = {
    string() {
        return words()
    },
    number() {
        return int(999)
    },
    boolean() {
        return pickOne([true, false])
    },
    object() {
        let obj = {}
        const entries = int({ min: 1, max: 5 })
        for (let i = 0; i < entries; i++) {
            obj[words(1)] = words()
        }
        return obj
    },
    array() {
        return uniqueArray(
            words,
            int({ min: 1, max: 5 })
        )
    },
    null() {
        return null
    }
}

// Samples of valid query and path parameters values.

export const validInput = {
    search() {
        return words()
    },
    page_size() {
        return pickOne([5, 10, 25])
    },
    page() {
        return int({ min: 1, max: 999 }).toString()
    },
    sort_by() {
        return pickOne(["asc", "desc"])
    },
    sort_direction() {
        return pickOne(["_id", "name"])
    },
    path() {
        return int({ min: 1, max: 999999 }).toString()
    }
}

// Returns a random object key, except the key provided as the first argument.

export function anythingBut(except, obj) {
    const keys = Object.keys(obj).filter(key => key !== except)
    return pickOne(keys)
}

// Returns a string that is equal or longer than the specified length.

export function longString(minLength) {
    let string = words()
    while (string.length < minLength) {
        string = string + " " + words()
    }
    return string
}

// Returns a random special character that matches the provided pattern.

export function symbol(exclPattern) {
    let symbol = faker.string.symbol()
    if (exclPattern) {
        while (!exclPattern.test(symbol)) {
            symbol = faker.string.symbol()
        }
    }
    return symbol
}

// Inserts a character into a string at random index.

export function insertChar(string, character) {
    const insertAt = int(string.length - 1)
    const newString = string.slice(0, insertAt) + character
        + string.slice(insertAt + 1)
    return newString
}

// Used inside the onFailure() hook. Executes whenever a test fails.

export function reportAndBail(request, response) {
    console.dir(
        {
            request,
            response: {
                status: response.status,
                headers: response.headers,
                body: response.data
            }
        },
        {
            depth: null
        }
    )
    process.exit(1)
}

const {
    helpers: {
        arrayElement: pickOne,
        uniqueArray
    },
    word: {
        words
    },
    number: {
        int
    }
} = faker