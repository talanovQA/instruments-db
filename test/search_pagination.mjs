import test from "tape"
import { testCases, generateTestCase } from "./test_cases/search_pagination.mjs"
import {
    nextPage,
    validate,
    sortResults,
    checkResults,
    getCount,
    getSkip,
    reportAndBail
} from "./utils/helpers.mjs"

function searchTest() {

    let request, response

    test("Search functionality test", async (t) => {
        for (const [descr, params] of testCases) {
            t.comment(descr)
            const { orig, mod } = await params()
            const query = {
                search: mod || orig
            }
            const expCount = await getCount(orig)
            let count = 0
            for await ({ request, response } of nextPage(query)) {
                const {
                    time,
                    status,
                    headers,
                    data,
                    data: {
                        results,
                        next
                    }
                } = response
                count = count + results.length
                t.comment(
                    `Page ${request.params.page}`
                )
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
                    validate(data, "searchResults"),
                    true,
                    "Valid against the JSON schema"
                )
                t.ok(
                    checkResults(results, orig),
                    "All search results are relevant"
                )
                if (!next) {
                    t.is(
                        count,
                        expCount,
                        "Expected number of search results"
                    )
                }
            }
        }
    })

    test("Pairwise search, sorting and pagination test", async (t) => {
        for await (const { descr, query } of generateTestCase()) {
            t.comment(descr)
            const expCount = await getCount(query.search)
            let count = 0
            for await ({ request, response } of nextPage(query)) {
                const {
                    time,
                    status,
                    headers,
                    data,
                    data: {
                        next,
                        results
                    }
                } = response
                const page_size = parseInt(query.page_size) || 10
                const expSkip = (request.params.page - 1) * page_size
                const expOnPage = next ? page_size : expCount - expSkip
                count = count + results.length
                t.comment(
                    `Page ${request.params.page}`
                )
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
                    validate(data, "searchResults"),
                    true,
                    "Valid against the JSON schema"
                )
                t.is(
                    results.length,
                    expOnPage,
                    "The page contains the expected number of items"
                )
                t.is(
                    await getSkip(results[0], query),
                    expSkip,
                    "Expected number of items is skipped"
                )
                t.deepEqual(
                    results,
                    sortResults(results, query),
                    "Sorted in the expected order"
                )
                if (query.search) {
                    t.ok(
                        checkResults(results, query.search),
                        "All search results are relevant"
                    )
                }
                if (!next) {
                    t.is(
                        count,
                        expCount,
                        "Expected number of search results"
                    )
                }
            }
        }
    })

    test.onFailure(() => {
        reportAndBail(request, response)
    })

}

searchTest()