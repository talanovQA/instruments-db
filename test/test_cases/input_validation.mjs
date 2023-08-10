import { faker } from "@faker-js/faker"
import {
    samples,
    validInput,
    longString,
    insertChar,
    symbol,
    anythingBut
} from "../utils/helpers.mjs"

export const bodyTest = new Map()
    .set("Additional property", (body) => {
        return {
            body: {
                [words(1)]: words(),
                ...body
            },
            message: "should not have additional properties"
        }
    })
    .set("Missing property", ({ ...body }) => {
        const key = objectKey(body)
        delete body[key]
        return {
            body,
            message: "should have all of the required properties"
        }
    })
    .set("Wrong type of data", ({ ...body }) => {
        const key = anythingBut("type", body)
        let message
        if (typeof body[key] === "string") {
            const dataType = anythingBut("string", samples)
            body[key] = samples[dataType]()
            message = "should be string"
        } else {
            const doOneOf = new Map()
                .set(1, () => {
                    const dataType = anythingBut("array", samples)
                    body[key] = samples[dataType]()
                    message = "should be array"
                })
                .set(2, () => {
                    const index = int(body[key].length - 1)
                    const dataType = anythingBut("string", samples)
                    body[key].splice(index, 1, samples[dataType]())
                    message = "should be string"
                })
            doOneOf.get(pickOne([1, 2]))()
        }
        return {
            body,
            message
        }
    })
    .set("Exceeded limit", ({ ...body }) => {
        const key = anythingBut("type", body)
        let message
        if (typeof body[key] === "string") {
            body[key] = longString(101)
            message = "should not have more than 100 characters"
        } else {
            const doOneOf = new Map()
                .set(1, () => {
                    const inserAt = int(body[key].length - 1)
                    body[key].splice(inserAt, 1, longString(101))
                    message = "should not have more than 100 characters"
                })
                .set(2, () => {
                    while (body[key].length <= 5) {
                        body[key].push(words())
                    }
                    message = "should not have more than 5 items"
                })
                .set(3, () => {
                    body[key] = []
                    message = "should not have fewer than 1 item"
                })
            doOneOf.get(pickOne([1, 2, 3]))()
        }
        return {
            body,
            message
        }
    })
    .set("Forbidden character", ({ ...body }) => {
        const key = anythingBut("type", body)
        const char = symbol(/[^()/!?.,'&-]/)
        if (typeof body[key] === "string") {
            body[key] = insertChar(body[key], char)
        } else {
            const index = int(body[key].length - 1)
            const string = body[key][index]
            body[key].splice(index, 1, insertChar(string, char))
        }
        return {
            body,
            message: "should have only alphanumeric characters, spaces, and the symbols: ()/!?.,'&-"
        }
    })
    .set("Duplicate items", ({ ...body }) => {
        const key = pickOne(["musicians", "songs", "brands", "tags"])
        const index = int(body[key].length - 1)
        if (body[key].length === 5) {
            body[key].pop()
        }
        body[key].splice(index, 0, pickOne(body[key]))
        return {
            body,
            message: "should not have duplicate items"
        }
    })
    .set("Not allowed value", ({ ...body }) => {
        body.type = samples[objectKey(samples)]()
        return {
            body,
            message: "should be equal to one of the allowed values"
        }
    })

const allParams = [
    "search",
    "page_size",
    "page",
    "sort_by",
    "sort_direction"
]

export const queryTest = new Map()
    .set([faker.word.words(1)], function additionalParameter(param) {
        return {
            descr: "Additional parameter",
            params: {
                [param]: faker.word.words()
            },
            message: "should not have additional parameters"
        }
    })
    .set(allParams, function multipleValues(param) {
        const numOfvalues = int({ min: 2, max: 5 })
        let values = []
        for (let i = 0; i < numOfvalues; i++) {
            values.push(validInput[param]())
        }
        return {
            descr: `Multiple parameter values (${param})`,
            params: {
                [param]: values
            },
            message: param === "search" || param === "page"
                ? "should be string"
                : "should be equal to one of the allowed values"
        }
    }
    )
    .set(["search", "page"], function forbiddenCharacter(param) {
        const string = validInput[param]()
        let char = param === "search"
            ? symbol(/[^()/!?.,'&-]/)
            : pickOne(
                [
                    faker.string.alpha(),
                    symbol()
                ]
            )
        return {
            descr: `Forbidden character (${param})`,
            params: {
                [param]: insertChar(string, char)
            },
            message: param === "search"
                ? "should have only alphanumeric characters, spaces, and the symbols: ()/!?.,'&-"
                : "should be a number 1-999"
        }
    })
    .set(["search", "page"], function exceededLimit(param) {
        return {
            descr: `Exceeded limit (${param})`,
            params: {
                [param]: param === "search"
                    ? longString(101)
                    : pickOne(
                        [
                            0,
                            int({ min: -999, max: -1 }),
                            int({ min: 1000, max: 999999 })
                        ]
                    )
            },
            message: param === "search"
                ? "should not have more than 100 characters"
                : "should be a number 1-999"
        }
    })
    .set(["page_size", "sort_by", "sort_direction"], function notAllowedValue(param) {
        return {
            descr: `Not allowed value (${param})`,
            params: {
                [param]: int({ min: 1, max: 2 }) === 1
                    ? faker.word.words()
                    : int(999999)
            },
            message: "should be equal to one of the allowed values"
        }
    })

export const pathTest = new Map()
    .set("Forbidden character", () => {
        const string = validInput.path()
        const char = pickOne(
            [
                faker.string.alpha(),
                symbol(/[^#/\\?%]/)
            ]
        )
        return {
            url: "/api/" + insertChar(string, char),
            message: "should be a number 1-9999"
        }
    })
    .set("Exceeded limit", () => {
        return {
            url: "/api/" + pickOne(
                [
                    0,
                    int({ min: -999, max: -1 }),
                    int({ min: 10000, max: 999999 })
                ]
            ),
            message: "should be a number 1-9999"
        }
    })

const {
    word: {
        words
    },
    number: {
        int
    },
    helpers: {
        arrayElement: pickOne,
        objectKey
    }
} = faker