import { Static, Type } from '@sinclair/typebox'

// Schema for Tag entity - GET response
const GetTagSchema = Type.Object(
	{
		id: Type.Integer({
			description: 'Unique identifier for the tag',
		}),
		name: Type.String({
			minLength: 1,
			maxLength: 50,
			description: 'Tag name, must be unique and between 1-50 characters',
		}),
		createdAt: Type.String({
			format: 'date-time',
			description: 'Timestamp when the tag was created',
		}),
		updatedAt: Type.String({
			format: 'date-time',
			description: 'Timestamp when the tag was last updated',
		}),
	},
	{
		additionalProperties: false,
	},
)

// Schema for creating a new Tag - POST request body
const CreateTagSchema = Type.Object(
	{
		name: Type.String({
			minLength: 1,
			maxLength: 50,
			pattern: '^[a-zA-Z0-9\\s\\-_]+$',
			description:
				'Tag name, must be unique and between 1-50 characters. Allowed characters: letters, numbers, spaces, hyphens, and underscores',
		}),
	},
	{
		additionalProperties: false,
	},
)

// Schema for updating an existing Tag - PUT request body
const UpdateTagSchema = Type.Object(
	{
		id: Type.Integer({
			minimum: 1,
			description: 'Unique identifier for the tag to update',
		}),
		name: Type.Optional(
			Type.String({
				minLength: 1,
				maxLength: 50,
				pattern: '^[a-zA-Z0-9\\s\\-_]+$',
				description:
					'Tag name, must be unique and between 1-50 characters. Allowed characters: letters, numbers, spaces, hyphens, and underscores',
			}),
		),
	},
	{
		additionalProperties: false,
	},
)

// Schema for Tag ID parameter validation
const GetTagParamsSchema = Type.Object(
	{
		id: Type.String({
			pattern: '^[1-9]\\d*$',
			description: 'Tag ID must be a positive integer',
		}),
	},
	{
		additionalProperties: false,
	},
)

// Tipi TypeScript derivati dagli schema TypeBox
type GetTag = Static<typeof GetTagSchema>
type CreateTag = Static<typeof CreateTagSchema>
type UpdateTag = Static<typeof UpdateTagSchema>
type GetTagParams = Static<typeof GetTagParamsSchema>

export {
	CreateTagSchema,
	GetTagParamsSchema,
	GetTagSchema,
	UpdateTagSchema,
	type CreateTag,
	type GetTag,
	type GetTagParams,
	type UpdateTag,
}
