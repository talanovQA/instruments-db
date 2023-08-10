import test from "tape"
import dotenv from "dotenv"
import {
    sendRequest,
    validate,
    Body,
    reportAndBail
} from "./utils/helpers.mjs"

dotenv.config()

function crudTest() {

    let _id, body, request, response

    test("Adding a new instrument", async (t) => {
        request = {
            url: "/api",
            method: "POST",
            headers: {
                "API-Key": process.env.API_KEY
            },
            data: body = new Body()
        }
        const {
            time,
            status,
            headers,
            data
        } = response = await sendRequest(request)
        _id = data._id
        t.comment(
            `Response time: ${time} ms`
        )
        t.is(
            status,
            201,
            "Status: 201 Created"
        )
        t.is(
            validate(headers, "headers"),
            true,
            "Expected headers"
        )
        t.is(
            validate(data, "post"),
            true,
            "Valid against the JSON schema"
        )
    })

    test("Finding the instrument", async (t) => {
        request = {
            url: "/api/" + _id,
            method: "GET"
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
            200,
            "Status: 200 OK"
        )
        t.is(
            validate(headers, "headers"),
            true,
            "Expected headers"
        )
        t.is(
            validate(data, "instrument"),
            true,
            "Valid against the JSON schema"
        )
        t.deepEqual(
            data,
            { _id, ...body },
            "Identical to the POST request body"
        )
    })

    test("Updating the instrument", async (t) => {
        request = {
            url: "/api/" + _id,
            method: "PUT",
            headers: {
                "API-Key": process.env.API_KEY
            },
            data: body = new Body()
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
            200,
            "Status: 200 OK"
        )
        t.is(
            validate(headers, "headers"),
            true,
            "Expected headers"
        )
        t.is(
            validate(data, "put"),
            true,
            "Valid against the JSON schema"
        )
    })

    test("Checking if updated", async (t) => {
        request = {
            url: "/api/" + _id,
            method: "GET"
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
            200,
            "Status: 200 OK"
        )
        t.is(
            validate(headers, "headers"),
            true,
            "Expected headers"
        )
        t.is(
            validate(data, "instrument"),
            true,
            "Valid against the JSON schema"
        )
        t.deepEqual(
            data,
            { _id, ...body },
            "Identical to PUT request body"
        )
    })

    test("Deleting the instrument", async (t) => {
        request = {
            url: "/api/" + _id,
            method: "DELETE",
            headers: {
                "API-Key": process.env.API_KEY
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
            200,
            "Status: 200 OK"
        )
        t.is(
            validate(headers, "headers"),
            true,
            "Expected headers"
        )
        t.is(
            validate(data, "delete"),
            true,
            "Valid against the JSON schema"
        )
    })

    test("Checking if deleted", async (t) => {
        request = {
            url: "/api/" + _id,
            method: "GET"
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
    })

    test.onFailure(() => {
        reportAndBail(request, response)
    })

}

crudTest()