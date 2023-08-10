export const schemas = {
    "$id": "inputSchemas",
    "$defs": {
        "string": {
            "type": "string",
            "pattern": "^(?:[A-Za-z0-9\\u00C0-\\u017E()/!?.,'&-]+\\s?)+(?<!\\s)$",
            "maxLength": 100,
            "errorMessage": {
                "type": "should be string",
                "pattern": "should have only alphanumeric characters, spaces, and the symbols: ()/!?.,'&-",
                "maxLength": "should not have more than 100 characters"
            }
        },
        "array": {
            "type": "array",
            "items": {
                "$ref": "#/$defs/string"
            },
            "minItems": 1,
            "maxItems": 5,
            "uniqueItems": true,
            "errorMessage": {
                "type": "should be array",
                "minItems": "should not have fewer than 1 item",
                "maxItems": "should not have more than 5 items",
                "uniqueItems": "should not have duplicate items"
            }
        },
        "params": {
            "type": "object",
            "properties": {
                "_id": {
                    "type": "string",
                    "pattern": "^[1-9][0-9]*$",
                    "maxLength": 4,
                    "errorMessage": "should be a number 1-9999"
                }
            },
            "additionalProperties": false
        },
        "query": {
            "type": "object",
            "properties": {
                "search": {
                    "$ref": "#/$defs/string"
                },
                "page": {
                    "type": "string",
                    "pattern": "^[1-9][0-9]{0,2}$",
                    "errorMessage": {
                        "type": "should be string",
                        "pattern": "should be a number 1-999"
                    }
                },
                "page_size": {
                    "enum": [
                        "5",
                        "10",
                        "25"
                    ],
                    "errorMessage": "should be equal to one of the allowed values"
                },
                "sort_by": {
                    "enum": [
                        "_id",
                        "name"
                    ],
                    "errorMessage": "should be equal to one of the allowed values"
                },
                "sort_direction": {
                    "enum": [
                        "asc",
                        "desc"
                    ],
                    "errorMessage": "should be equal to one of the allowed values"
                }
            },
            "additionalProperties": false,
            "errorMessage": {
                "additionalProperties": "should not have additional parameters",
            }
        },
        "body": {
            "type": "object",
            "properties": {
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
                    ],
                    "errorMessage": "should be equal to one of the allowed values"
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
                "name",
                "type",
                "invented",
                "origin",
                "musicians",
                "songs",
                "brands",
                "tags"
            ],
            "additionalProperties": false,
            "errorMessage": {
                "additionalProperties": "should not have additional properties",
                "required": "should have all of the required properties"
            }
        },
    }
}