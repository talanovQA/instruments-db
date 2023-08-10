import express from "express"
import swaggerUI from "swagger-ui-express"
import dotenv from "dotenv"
import https from "https"
import fs from "fs"
import {
	connectDB,
	validate,
	authenticate,
	parseQuery,
	navigation,
	setHeaders,
	redirectToHTTPS,
	allowMethods
} from "./utils.mjs"

const app = express()

app.disable("x-powered-by")
app.disable("etag")

dotenv.config()

const db = await connectDB()

const openAPI = JSON.parse(fs.readFileSync("./swagger.json"))

app.use("*", redirectToHTTPS)

app.use("/docs", swaggerUI.serve, swaggerUI.setup(openAPI))

app.all("/", (req, res) => {
	res.redirect("/docs")
})

app.use("*", express.json(), setHeaders)

app.get("/api", validate("query"), async (req, res) => {
	try {
		let {
			search,
			page,
			page_size,
			sort_by,
			sort_direction
		} = parseQuery(req.query)
		if (search) {
			search = {
				$text: {
					$search: `"${search}"`
				}
			}
		}
		const count = await db.collection("instruments").countDocuments(search)
		if (count === 0) {
			throw {
				status: 404,
				message: "No instruments were found"
			}
		}
		const numOfPages = Math.ceil(count / page_size)
		if (page > numOfPages) {
			throw {
				status: 404,
				message: "Page does not exist"
			}
		}
		const results = await db.collection("instruments")
			.find(search)
			.collation(
				{
					locale: "en",
					strength: 1
				}
			)
			.sort(
				{
					[sort_by]: sort_direction === "asc" ? 1 : -1
				}
			)
			.skip((page - 1) * page_size)
			.limit(page_size)
			.toArray()
		res.status(200).json(
			{
				count,
				page_size,
				sort_by,
				sort_direction,
				...navigation(req.query, page, numOfPages),
				results
			}
		)
	} catch ({ status, message }) {
		res.status(status || 500).json(
			{
				error: message
			}
		)
	}
})

app.post("/api", validate("body"), authenticate, async (req, res) => {
	const { name } = req.body
	try {
		const {
			value: {
				last_id: _id
			}
		} = await db.collection("counter").findOneAndUpdate(
			{
				last_id: {
					$exists: true
				}
			},
			{
				$inc: {
					last_id: 1
				}
			},
			{
				returnDocument: "after"
			}
		)
		await db.collection("instruments").insertOne(
			{
				_id,
				...req.body
			}
		)
		res.status(201).json({
			_id,
			name,
			message: "The instrument was added to the database"
		})
	} catch ({ code, message }) {
		if (code === 11000) {
			res.status(409).json(
				{
					name,
					error: "An instrument with the specified name already exists"
				}
			)
		} else {
			res.status(500).json(
				{
					error: message
				}
			)
		}
	}
})

app.options("/api", allowMethods(
	[
		"GET",
		"HEAD",
		"POST",
		"OPTIONS"
	]
))

app.all("/api", (req, res) => {
	res.status(405).json(
		{
			method: req.method,
			error: "Method not allowed"
		}
	)
})

app.get("/api/:_id", validate("params"), async (req, res) => {
	const _id = parseInt(req.params._id)
	try {
		const instrument = await db.collection("instruments").findOne({ _id })
		if (!instrument) {
			throw {
				status: 404,
				message: "No instrument with the specified _id"
			}
		}
		res.status(200).json(instrument)
	} catch ({ status, message }) {
		res.status(status || 500).json(
			{
				_id,
				error: message
			}
		)
	}
})

app.put("/api/:_id", validate("params", "body"), authenticate, async (req, res) => {
	const _id = parseInt(req.params._id)
	const { name } = req.body
	try {
		const { value } = await db.collection("instruments").findOneAndReplace(
			{ _id },
			req.body
		)
		if (!value) {
			throw {
				status: 404,
				message: "No instrument with the specified _id"
			}
		}
		res.status(200).json(
			{
				_id,
				message: "The instrument was updated"
			}
		)
	} catch ({ status, code, message }) {
		if (code === 11000) {
			res.status(409).json(
				{
					name,
					error: "An instrument with the specified name already exists"
				}
			)
		} else {
			res.status(status || 500).json(
				{
					_id,
					error: message
				}
			)
		}
	}
})

app.delete("/api/:_id", validate("params"), authenticate, async (req, res) => {
	const _id = parseInt(req.params._id)
	try {
		const { value } = await db.collection("instruments").findOneAndDelete({ _id })
		if (!value) {
			throw {
				status: 404,
				message: "No instrument with the specified _id"
			}
		}
		res.status(200).json(
			{
				_id,
				message: "The instrument was deleted"
			}
		)
	} catch ({ status, message }) {
		res.status(status || 500).json(
			{
				_id,
				error: message
			}
		)
	}
})

app.options("/api/:_id", allowMethods(
	[
		"GET",
		"HEAD",
		"PUT",
		"DELETE",
		"OPTIONS"
	]
))

app.all("/api/:_id", (req, res) => {
	res.status(405).json(
		{
			method: req.method,
			error: "Method not allowed"
		}
	)
})

app.all("*", (req, res) => {
	res.status(404).json(
		{
			error: "The requested endpoint does not exist"
		}
	)
})

app.listen(80)

https.createServer(
	{
		key: fs.readFileSync(process.env.PRIV_KEY_PATH),
		cert: fs.readFileSync(process.env.CERT_PATH)
	},
	app
)
	.listen(443)