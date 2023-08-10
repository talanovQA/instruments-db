import test from "tape"
import { faker } from "@faker-js/faker"
import { randomBytes } from "crypto"
import {
    sendRequest,
    validate,
    getSample,
    Body,
    reportAndBail
} from "./utils/helpers.mjs"

async function authTest() {

    let request, response

    const { _id } = await getSample()

    const params = new Map()
        .set("/api", ["POST"])
        .set("/api/" + _id, ["PUT", "DELETE"])

    const message = "Unauthorized request: A valid API key is required"

    test("Missing API-Key header", async (t) => {
        for (const [url, methods] of params) {
            for (const method of methods) {
                request = {
                    url,
                    method,
                    data: method !== "DELETE"
                        ? new Body()
                        : undefined
                }
                const {
                    time,
                    status,
                    headers,
                    data
                } = response = await sendRequest(request)
                t.comment(
                    `${method} request to "${url}"`
                )
                t.comment(
                    `Response time: ${time} ms`
                )
                t.is(
                    status,
                    401,
                    "Status: 401 Unauthorized"
                )
                t.is(
                    validate(headers, "headers"),
                    true,
                    "Expected headers"
                )
                t.is(
                    validate(data, "unauthorized"),
                    true,
                    "Valid against the JSON schema"
                )
                t.is(
                    data.error,
                    message,
                    "Relevant error message"
                )
            }
        }
    })

    test("Incorrect API key value", async (t) => {
        for (const [url, methods] of params) {
            for (const method of methods) {
                request = {
                    url,
                    method,
                    headers: {
                        "API-Key": randomBytes(32).toString("hex")
                    },
                    data: method !== "DELETE"
                        ? new Body()
                        : undefined
                }
                const {
                    time,
                    status,
                    headers,
                    data
                } = response = await sendRequest(request)
                t.comment(
                    `${method} request to "${url}"`
                )
                t.comment(
                    `Response time: ${time} ms`
                )
                t.is(
                    status,
                    401,
                    "Status: 401 Unauthorized"
                )
                t.is(
                    validate(headers, "headers"),
                    true,
                    "Expected headers"
                )
                t.is(
                    validate(data, "unauthorized"),
                    true,
                    "Valid against the JSON schema"
                )
                t.is(
                    data.error,
                    message,
                    "Relevant error message"
                )
            }
        }
    })

    test("Invalid API key", async (t) => {
        for (const [url, methods] of params) {
            for (const method of methods) {
                request = {
                    url,
                    method,
                    headers: {
                        "API-Key": faker.string.sample(100)
                    },
                    data: method !== "DELETE"
                        ? new Body()
                        : undefined
                }
                const {
                    time,
                    status,
                    headers,
                    data
                } = await sendRequest(request)
                t.comment(
                    `${method} request to "${url}"`
                )
                t.comment(
                    `Response time: ${time} ms`
                )
                t.is(
                    status,
                    401,
                    "Status: 401 Unauthorized"
                )
                t.is(
                    validate(headers, "headers"),
                    true,
                    "Expected headers"
                )
                t.is(
                    validate(data, "unauthorized"),
                    true,
                    "Valid against the JSON schema"
                )
                t.is(
                    data.error,
                    message,
                    "Relevant error message"
                )
            }
        }
    })

    test.onFailure(() => {
        reportAndBail(request, response)
    })

}

await authTest()