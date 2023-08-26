import { MongoClient } from "mongodb"
import Ajv from "ajv"
import ajvErrors from "ajv-errors"
import { schemas } from "./ajv-schemas.mjs"
import dotenv from "dotenv"

dotenv.config()

export async function connectDB() {
	try {
		const client = new MongoClient(process.env.MONGO_URI)
		await client.connect()
		return client.db()
	} catch (error) {
		console.error(error)
	}
}

const ajv = new Ajv({ allErrors: true, schemas: [schemas] })
ajvErrors(ajv)

export function validate(...objects) {
	return (req, res, next) => {
		try {
			for (const object of objects) {
				const validate = ajv.getSchema(`inputSchemas#/$defs/${object}`)
				if (!validate(req[object])) {
					throw validate.errors.map(error => new SlimError(error, object))
				}
			}
			next()
		} catch (errors) {
			res.status(400).json(errors)
		}
	}
}

class SlimError {
	constructor({ instancePath, message }, object) {
		this[object === "body"
			? "property"
			: "parameter"] = instancePath.slice(1)
		this.error = message
	}
}

export function authenticate(req, res, next) {
	try {
		const regex = /^[0-9a-f]{64}$/
		const {
			"api-key": apiKey
		} = req.headers
		if (regex.test(apiKey) && apiKey === process.env.API_KEY) {
			next()
		} else {
			throw {
				error: "Unauthorized request: A valid API key is required"
			}
		}
	} catch (error) {
		res.status(401).json(error)
	}
}

export function parseQuery({ ...query }) {
	query.page_size = query.page_size
		? parseInt(query.page_size)
		: 10
	query.page = query.page
		? parseInt(query.page)
		: 1
	query.sort_by = query.sort_by || "_id"
	query.sort_direction = query.sort_direction || "asc"
	return query
}

export function navigation(query, page, numOfPages) {
	const baseURL = process.env.BASE_URL
	const params = new URLSearchParams(query)
	let next, previous
	if (page < numOfPages) {
		params.set("page", page + 1)
		next = baseURL + "/api" + "?" + params.toString()
	}
	if (page > 1) {
		params.set("page", page - 1)
		previous = baseURL + "/api" + "?" + params.toString()
	}
	return {
		next,
		previous
	}
}

export function commonHeaders(req, res, next) {
	res.set(
		{
			"Access-Control-Allow-Origin": "*",
			"Strict-Transport-Security": "max-age=15768000",
			"Cache-Control": "no-store"
		}
	)
	next()
}

export function corsHeaders(req, res) {
		const methods = req.url === "/api"
			? "GET, HEAD, POST, OPTIONS"
			: "GET, HEAD, PUT, DELETE, OPTIONS"
		res.set(
			{
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "API-Key, Content-Type",
				"Access-Control-Allow-Methods": methods,
			}
		)
		res.status(200).end()
}

export function redirectToHTTPS(req, res, next) {
	if (req.secure) {
		next()
	} else {
		res.redirect(301, `${process.env.BASE_URL}` + req.url)
	}
}

