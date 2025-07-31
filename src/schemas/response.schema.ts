const ErrorResponseSchema = {
	type: 'object',
	required: ['error'],
	properties: {
		error: {
			type: 'string',
			description: 'Error message describing what went wrong',
		},
	},
	additionalProperties: false,
}

export { ErrorResponseSchema }
