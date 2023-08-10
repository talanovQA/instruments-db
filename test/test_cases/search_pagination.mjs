import { searchString, diacriticString } from "../utils/helpers.mjs"
import { pict } from "pict-pairwise-testing"
import { faker } from "@faker-js/faker"
import diacritics from "diacritics"

export const testCases = new Map()
	.set("Normal search parameters", async () => {
		return {
			orig: await searchString()
		}
	})
	.set("Case insensitivity check", async () => {
		const orig = await searchString()
		return {
			orig,
			mod: pickOne(
				[
					orig.toLowerCase(),
					orig.toUpperCase()
				]
			)
		}
	})
	.set("Diacritic insensitivity check", async () => {
		const orig = await diacriticString()
		return {
			orig,
			mod: diacritics.remove(orig)
		}
	})

const pairwise = {
	parameters: [
		{
			property: "search",
			values: [true, false]
		},
		{
			property: "sort_by",
			values: ["_id", "name", "default"]
		},
		{
			property: "sort_direction",
			values: ["asc", "desc", "default"]
		},
		{
			property: "page_size",
			values: [5, 10, 25, "default"]
		}
	]
}

const allPairs = pict(pairwise).testCases

export async function* generateTestCase() {
	for (const query of allPairs) {
		query.search = JSON.parse(query.search)
			? await searchString()
			: undefined
		const descr = (
			query.search
				? `Search: "${query.search}"`
				: "No search parameters"
		)
			+ `, page size: ${query.page_size}`
			+ `, sort_by: ${query.sort_by}`
			+ `, sort_direction: ${query.sort_direction}`
		for (const param in query) {
			if (query[param] === "default") {
				delete query[param]
			}
		}
		yield {
			descr,
			query
		}
	}
}

const {
	helpers: {
		arrayElement: pickOne
	}
} = faker