export const responses = {
    "$id": "responses",
    "$defs": {
        "_id": {
            "type": "integer",
            "minimum": 1,
            "maximum": 9999
        },
        "string": {
            "type": "string",
            "pattern": "^(?:[A-Za-z0-9\\u00C0-\\u017E()/!?.,'&-]+\\s?)+(?<!\\s)$",
            "maxLength": 100
        },
        "array": {
            "type": "array",
            "items": {
                "$ref": "#/$defs/string"
            },
            "minItems": 1,
            "maxItems": 5,
            "uniqueItems": true
        },
        "headers": {
            "type": "object",
            "properties": {
                "access-control-allow-origin": {
                    "const": "*"
                },
                "connection": {
                    "enum": [
                        "close",
                        "keep-alive"
                    ]
                },
                "keep-alive": {
                    "const": "timeout=5"
                },
                "cache-control": {
                    "const": "no-store"
                },
                "content-type": {
                    "const": "application/json; charset=utf-8"
                },
                "content-length": {
                    "type": "string",
                    "pattern": "^[0-9]+$"
                },
                "strict-transport-security": {
                    "const": "max-age=15768000"
                },
                "date": {
                    "type": "string"
                }
            },
            "required": [
                "access-control-allow-origin",
                "connection",
                "cache-control",
                "content-type",
                "content-length",
                "strict-transport-security",
                "date"
            ],
            "additionalProperties": false
        },
        "corsHeaders": {
            "type": "object",
            "properties": {
                "access-control-allow-origin": {
                    "const": "*"
                },
                "access-control-allow-headers": {
                    "const": "API-Key, Content-Type"
                },
                "access-control-allow-methods": {
                    "enum": [
                        "GET, HEAD, POST, OPTIONS",
                        "GET, HEAD, PUT, DELETE, OPTIONS"
                    ]
                },
                "connection": {
                    "enum": [
                        "keep-alive",
                        "close"
                    ],
                },
                "keep-alive": {
                    "const": "timeout=5"
                },
                "date": {
                    "type": "string"
                },
                "content-length": {
                    "const": "0"
                }
            },
            "additionalProperties": false,
            "required": [
                "access-control-allow-origin",
                "access-control-allow-headers",
                "access-control-allow-methods",
                "connection",
                "date",
                "content-length"
            ]
        },
        "instrument": {
            "type": "object",
            "properties": {
                "_id": {
                    "$ref": "#/$defs/_id"
                },
                "name": {
                    "$ref": "#/$defs/string"
                },
                "type": {
                    "enum": [
                        "Bowed string",
                        "Plucked string",
                        "Woodwind",
                        "Brass",
                        "Percussion",
                        "Keyboard",
                        "Other"
                    ]
                },
                "invented": {
                    "$ref": "#/$defs/string"
                },
                "origin": {
                    "$ref": "#/$defs/string"
                },
                "musicians": {
                    "$ref": "#/$defs/array"
                },
                "songs": {
                    "$ref": "#/$defs/array"
                },
                "brands": {
                    "$ref": "#/$defs/array"
                },
                "tags": {
                    "$ref": "#/$defs/array"
                }
            },
            "required": [
                "_id",
                "name",
                "type",
                "invented",
                "origin",
                "musicians",
                "songs",
                "brands",
                "tags"
            ],
            "additionalProperties": false
        },
        "searchResults": {
            "type": "object",
            "properties": {
                "count": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 999
                },
                "page_size": {
                    "enum": [5, 10, 25]
                },
                "sort_by": {
                    "enum": ["_id", "name"]
                },
                "sort_direction": {
                    "enum": ["asc", "desc"]
                },
                "next": {
                    "type": "string",
                    "pattern": "^https://instruments-db\\.xyz/api(?:\\?\\S+=\\S+)+$"
                },
                "previous": {
                    "type": "string",
                    "pattern": "^https://instruments-db\\.xyz/api(?:\\?\\S+=\\S+)+$"
                },
                "results": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                        "$ref": "#/$defs/instrument"
                    }
                }
            },
            "required": [
                "count",
                "page_size",
                "sort_by",
                "sort_direction",
                "results"
            ],
            "additionalProperties": false
        },
        "post": {
            "type": "object",
            "properties": {
                "_id": {
                    "$ref": "#/$defs/_id"
                },
                "name": {
                    "$ref": "#/$defs/string"
                },
                "message": {
                    "const": "The instrument was added to the database"
                }
            },
            "required": [
                "_id",
                "name",
                "message"
            ],
            "additionalProperties": false
        },
        "put": {
            "type": "object",
            "properties": {
                "_id": {
                    "$ref": "#/$defs/_id"
                },
                "message": {
                    "const": "The instrument was updated"
                }
            },
            "required": [
                "_id",
                "message"
            ],
            "additionalProperties": false
        },
        "delete": {
            "type": "object",
            "properties": {
                "_id": {
                    "$ref": "#/$defs/_id"
                },
                "message": {
                    "const": "The instrument was deleted"
                }
            },
            "required": [
                "_id",
                "message"
            ],
            "additionalProperties": false
        },
        "unauthorized": {
            "type": "object",
            "properties": {
                "error": {
                    "const": "Unauthorized request: A valid API key is required"
                }
            },
            "additionalProperties": false,
            "required": ["error"]
        },
        "notFound": {
            "type": "object",
            "properties": {
                "_id": {
                    "$ref": "#/$defs/_id"
                },
                "error": {
                    "oneOf": [
                        {
                            "const": "No instruments were found"
                        },
                        {
                            "const": "No instrument with the specified _id"
                        },
                        {
                            "const": "Page does not exist"
                        },
                        {
                            "const": "The requested endpoint does not exist"
                        }
                    ]
                }
            },
            "required": [
                "error"
            ],
            "additionalProperties": false
        },
        "conflict": {
            "type": "object",
            "properties": {
                "name": {
                    "$ref": "#/$defs/string"
                },
                "error": {
                    "const": "An instrument with the specified name already exists"
                }
            },
            "additionalProperties": false,
            "required": [
                "name",
                "error"
            ],
        },
        "methodNotAllowed": {
            "type": "object",
            "properties": {
                "method": {
                    "enum": [
                        "GET",
                        "HEAD",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                    ],
                },
                "error": {
                    "const": "Method not allowed"
                }
            },
            "additionalProperties": false,
            "required": [
                "method",
                "error"
            ]
        },
        "badRequest": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "properties": {
                    "property": {
                        "type": "string"
                    },
                    "parameter": {
                        "type": "string"
                    },
                    "error": {
                        "type": "string"
                    }
                },
                "additionalProperties": false,
                "required": ["error"]
            }
        }
    }
}