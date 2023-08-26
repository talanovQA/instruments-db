import test from "tape"
import { faker } from "@faker-js/faker"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import {
    sendRequest,
    validate,
    getSample,
    getCount,
    Body,
    reportAndBail
} from "./utils/helpers.mjs"

dotenv.config()

async function errorHandling() {

    const client = new MongoClient(process.env.MONGO_URI)
    const db = client.db().collection("instruments")

    let request, response

    const { _id } = await getSample()

    test("Adding an instrument that already exists", async (t) => {
        const body = new Body()
        body.name = (await getSample()).name
        request = {
            url: "/api",
            method: "POST",
            headers: {
                "API-Key": process.env.API_KEY
            },
            data: body
        }
        const {
            time,
            status,
            headers,
            data
        } = response = await sendRequest(request)
        t.comment(
            `Response time: ${time} ms`
        )
        t.is(
            status,
            409,
            "Status: 409 Conflict"
        )
        t.is(
            validate(headers, "headers"),
            true,
            "Expected headers"
        )
        t.is(
            validate(data, "conflict"),
            true,
            "Valid against the JSON schema"
        )
        t.is(
            data.error,
            "An instrument with the specified name already exists",
            "Relevant error message"
        )
    })

    test("Changing an instrument's name to an existing one", async (t) => {
        let sample = await getSample()
        while (sample._id === _id) {
            sample = await getSample()
        }
        const body = new Body()
        body.name = sample.name
        request = {
            url: "/api/" + _id,
            headers: {
                "API-Key": process.env.API_KEY
            },
            method: "PUT",
            data: body
        }
        const {
            time,
            status,
            headers,
            data
        } = response = await sendRequest(request)
        t.comment(
            `Response time: ${time} ms`
        )
        t.is(
            status,
            409,
            "Status: 409 Conflict"
        )
        t.is(
            validate(headers, "headers"),
            true,
            "Expected headers"
        )
        t.is(
            validate(data, "conflict"),
            true,
            "Valid against the JSON schema"
        )
        t.is(
            data.error,
            "An instrument with the specified name already exists",
            "Relevant error message"
        )
    })

    test("Searching for a non-existent instrument", async (t) => {
        let search = faker.word.words()
        while (await getCount(search) !== 0) {
            search = faker.word.words()
        }
        request = {
            url: "/api",
            method: "GET",
            params: {
                search
            }
        }
        const {
            time,
            status,
            headers,
            data
        } = response = await sendRequest(request)
        t.comment(
            `Response time: ${time} ms`
        )
        t.is(
            status,
            404,
            "Status: 404 Not Found"
        )
        t.is(
            validate(headers, "headers"),
            true,
            "Expected headers"
        )
        t.is(
            validate(data, "notFound"),
            true,
            "Valid against the JSON schema"
        )
        t.is(
            data.error,
            "No instruments were found",
            "Relevant error message"
        )
    })

    for (const method of ["GET", "PUT", "DELETE"]) {
        test(`Non-existent _id (${method})`, async (t) => {
            await client.connect()
            const { _id: last_id } = await db.findOne(
                {},
                {
                    sort: {
                        _id: -1
                    }
                }
            )
            await client.close()
            let body
            if (method === "PUT") {
                body = new Body()
            }
            request = {
                url: "/api/" + (last_id + 1),
                headers: {
                    "API-Key": process.env.API_KEY
                },
                method,
                data: body
            }
            const {
                time,
                status,
                headers,
                data
            } = response = await sendRequest(request)
            t.comment(
                `Response time: ${time} ms`
            )
            t.is(
                status,
                404,
                "Status: 404 Not Found"
            )
            t.is(
                validate(headers, "headers"),
                true,
                "Expected headers"
            )
            t.is(
                validate(data, "notFound"),
                true,
                "Valid against the JSON schema"
            )
            t.is(
                data.error,
                "No instrument with the specified _id",
                "Relevant error message"
            )
        })
    }

    test("Page doesn't exist", async (t) => {
        const count = await getCount()
        const page_size = faker.helpers.arrayElement([5, 10, 25])
        const numOfPages = Math.ceil(count / page_size)
        request = {
            url: "/api",
            method: "GET",
            params: {
                page_size,
                page: numOfPages + 1
            }
        }
        const {
            time,
            status,
            headers,
            data,
        } = response = await sendRequest(request)
        t.comment(
            `Response time: ${time} ms`
        )
        t.is(
            status,
            404,
            "Status: 404 Not Found"
        )
        t.is(
            validate(headers, "headers"),
            true,
            "Expected headers"
        )
        t.is(
            validate(data, "notFound"),
            true,
            "Valid against the JSON schema"
        )
        t.is(
            data.error,
            "Page does not exist",
            "Relevant error message"
        )
    })

    const allMethods = [
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ]

    test("Unsupported HTTP methods", async (t) => {
        for (const url of ["/api", "/api/" + _id]) {
            request = {
                url,
                method: "OPTIONS"
            }
            response = await sendRequest(request)
            t.comment(
                `OPTIONS request to "${url}"`
            )
            t.comment(
                `Response time: ${response.time} ms`
            )
            t.is(
                response.status,
                200,
                "Status: 200 OK"
            )
            t.is(
                validate(response.headers, "corsHeaders"),
                true,
                "Expected headers"
            )
            const allowed = response.headers["access-control-allow-methods"]
            const notAllowed = allMethods.filter(
                method => !allowed.includes(method)
            )
            for (const method of notAllowed) {
                request = {
                    url,
                    method
                }
                response = await sendRequest(request)
                t.comment(
                    `${method} request to "${url}"`
                )
                t.comment(
                    `Response time: ${response.time} ms`
                )
                t.is(
                    response.status,
                    405,
                    "Status: 405 Method Not Allowed"
                )
                t.is(
                    validate(response.headers, "headers"),
                    true,
                    "Expected headers"
                )
                t.is(
                    validate(response.data, "methodNotAllowed"),
                    true,
                    "Valid against the JSON schema"
                )
                t.is(
                    response.data.error,
                    "Method not allowed",
                    "Relevant error message"
                )
            }
        }
    })

    test("Endpoint doesn't exist", async (t) => {
        const url = faker.helpers.arrayElement(
            [
                "/" + faker.word.words(1),
                "/api/" + _id + "/" + faker.word.words(1)
            ]
        )
        const method = faker.helpers.arrayElement(allMethods)
        request = {
            url,
            method
        }
        const {
            time,
            status,
            headers,
            data,
        } = response = await sendRequest(request)
        t.comment(
            `Response time: ${time} ms`
        )
        t.is(
            status,
            404,
            "Status: 404 Not Found"
        )
        t.is(
            validate(headers, "headers"),
            true,
            "Expected headers"
        )
        if (method !== "HEAD") {
            t.is(
                validate(data, "notFound"),
                true,
                "Valid against the JSON schema"
            )
            t.is(
                data.error,
                "The requested endpoint does not exist",
                "Relevant error message"
            )
        }
    })

    test.onFailure(() => {
        reportAndBail(request, response)
    })

}

await errorHandling()