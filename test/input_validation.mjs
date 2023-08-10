import test from "tape"
import dotenv from "dotenv"
import {
    bodyTest,
    queryTest,
    pathTest
} from "./test_cases/input_validation.mjs"
import {
    sendRequest,
    validate,
    Body,
    getSample,
    reportAndBail
} from "./utils/helpers.mjs"

dotenv.config()

async function inputValidation() {

    let request, response

    const { _id } = await getSample()

    const params = new Map()
        .set("/api", "POST")
        .set("/api/" + _id, "PUT")

    for (const [url, method] of params) {
        test(`Invalid ${method} request body`, async (t) => {
            for (const [descr, testCase] of bodyTest) {
                const { body, message } = testCase(new Body())
                request = {
                    url,
                    method,
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
                    descr
                )
                t.comment(
                    `Response time: ${time} ms`
                )
                t.is(
                    status,
                    400,
                    "Status: 400 Bad Request"
                )
                t.is(
                    validate(headers, "headers"),
                    true,
                    "Expected headers"
                )
                t.is(
                    validate(data, "badRequest"),
                    true,
                    "Valid against the JSON schema"
                )
                t.is(
                    data[0].error,
                    message,
                    "Relevant error message"
                )
            }
        })
    }

    test("Invalid query parameters", async (t) => {
        for (const [queryParams, testCase] of queryTest) {
            for (const currParam of queryParams) {
                const { descr, params, message } = testCase(currParam)
                request = {
                    url: "/api",
                    method: "GET",
                    params,
                    paramsSerializer: {
                        indexes: null
                    }
                }
                const {
                    time,
                    status,
                    headers,
                    data
                } = response = await sendRequest(request)
                t.comment(
                    descr
                )
                t.comment(
                    `Response time: ${time} ms`
                )
                t.is(
                    status,
                    400,
                    "Status: 400 Bad Request"
                )
                t.is(
                    validate(headers, "headers"),
                    true,
                    "Expected headers"
                )
                t.is(
                    validate(data, "badRequest"),
                    true,
                    "Valid against the JSON schema"
                )
                t.is(
                    data[0].error,
                    message,
                    "Relevant error message"
                )
            }
        }
    })

    test("Invalid path parameters", async (t) => {
        for (const method of ["GET", "PUT", "DELETE"]) {
            for (const [descr, testCase] of pathTest) {
                const { url, message } = testCase()
                request = {
                    url,
                    headers: {
                        "API-Key": process.env.API_KEY
                    },
                    method
                }
                const {
                    time,
                    status,
                    headers,
                    data
                } = response = await sendRequest(request)
                t.comment(
                    `${descr} (${method})`
                )
                t.comment(
                    `Response time: ${time} ms`
                )
                t.is(
                    status,
                    400,
                    "Status: 400 Bad Request"
                )
                t.is(
                    validate(headers, "headers"),
                    true,
                    "Expected headers"
                )
                t.is(
                    validate(data, "badRequest"),
                    true,
                    "Valid against the JSON schema"
                )
                t.is(
                    data[0].error,
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

await inputValidation()