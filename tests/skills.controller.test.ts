import {
	createSkillController,
	deleteSkillController,
	getSkillController,
	getSkillsController,
	updateSkillController,
} from '../src/controllers/skills.controller.js'
import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock services
jest.mock('../src/services/skills.service.js', () => ({
	getSkillsService: jest.fn(),
	getSkillService: jest.fn(),
	createSkillService: jest.fn(),
	updateSkillService: jest.fn(),
	deleteSkillService: jest.fn(),
}))

import {
	createSkillService,
	deleteSkillService,
	getSkillService,
	getSkillsService,
	updateSkillService,
} from '../src/services/skills.service.js'

// Mock Fastify objects
const createMockRequest = (overrides = {}) =>
	({
		log: {
			error: jest.fn(),
		},
		query: {},
		params: {},
		body: {},
		...overrides,
	}) as any

const createMockReply = () => {
	const reply = {
		status: jest.fn().mockReturnThis(),
		send: jest.fn().mockReturnThis(),
	}

	return reply as any
}

describe('Skills Controller', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getSkillsController', () => {
		const mockSkillsResult = {
			data: [
				{
					id: 1,
					name: 'Athletics',
					description:
						'Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming.',
					abilityScore: 'Strength',
					isProficiencyRequired: false,
					difficultyClass: 15,
					usageFrequency: 'Common',
					applicableSituations: 'Climbing, jumping, swimming, breaking objects',
					synergies: 'Acrobatics for parkour movements',
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
				{
					id: 2,
					name: 'Stealth',
					description: 'Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies.',
					abilityScore: 'Dexterity',
					isProficiencyRequired: true,
					difficultyClass: 20,
					usageFrequency: 'Frequent',
					applicableSituations: 'Hiding, sneaking, avoiding detection',
					synergies: 'Sleight of Hand for pickpocketing',
					createdAt: '2024-01-02T00:00:00.000Z',
					updatedAt: '2024-01-02T00:00:00.000Z',
				},
			],
			pagination: {
				page: 1,
				pageSize: 10,
				total: 2,
				totalPages: 1,
			},
		}

		it('should return paginated skills successfully', async () => {
			const mockGetSkillsService = jest.mocked(getSkillsService)
			mockGetSkillsService.mockResolvedValue(mockSkillsResult)

			const request = createMockRequest({
				query: { page: 1, pageSize: 10 },
			})
			const reply = createMockReply()

			await getSkillsController(request, reply)

			expect(mockGetSkillsService).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockSkillsResult.data,
				pagination: mockSkillsResult.pagination,
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetSkillsService = jest.mocked(getSkillsService)
			const validationError = new ValidationError('Page number must be greater than 0')
			mockGetSkillsService.mockRejectedValue(validationError)

			const request = createMockRequest({
				query: { page: 0 },
			})
			const reply = createMockReply()

			await getSkillsController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Page number must be greater than 0',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetSkillsService = jest.mocked(getSkillsService)
			mockGetSkillsService.mockRejectedValue(new Error('Database connection failed'))

			const request = createMockRequest()
			const reply = createMockReply()

			await getSkillsController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('getSkillController', () => {
		const mockSkill = {
			id: 1,
			name: 'Athletics',
			description:
				'Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming.',
			abilityScore: 'Strength',
			isProficiencyRequired: false,
			difficultyClass: 15,
			usageFrequency: 'Common',
			applicableSituations: 'Climbing, jumping, swimming, breaking objects',
			synergies: 'Acrobatics for parkour movements',
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		it('should return a skill successfully', async () => {
			const mockGetSkillService = jest.mocked(getSkillService)
			mockGetSkillService.mockResolvedValue(mockSkill)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getSkillController(request, reply)

			expect(mockGetSkillService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockSkill,
			})
		})

		it('should return 404 when skill not found', async () => {
			const mockGetSkillService = jest.mocked(getSkillService)
			mockGetSkillService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await getSkillController(request, reply)

			expect(mockGetSkillService).toHaveBeenCalledWith(999)
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Skill not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await getSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Skill ID must be a positive integer',
			})
		})

		it('should return 400 for negative ID', async () => {
			const request = createMockRequest({
				params: { id: '-1' },
			})
			const reply = createMockReply()

			await getSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Skill ID must be a positive integer',
			})
		})

		it('should return 400 for zero ID', async () => {
			const request = createMockRequest({
				params: { id: '0' },
			})
			const reply = createMockReply()

			await getSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Skill ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetSkillService = jest.mocked(getSkillService)
			const validationError = new ValidationError('Service validation error')
			mockGetSkillService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Service validation error',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetSkillService = jest.mocked(getSkillService)
			mockGetSkillService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getSkillController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('createSkillController', () => {
		const mockCreatedSkill = {
			id: 1,
			name: 'Arcana',
			description:
				'Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, and the planes of existence.',
			abilityScore: 'Intelligence',
			isProficiencyRequired: true,
			difficultyClass: 18,
			usageFrequency: 'Rare',
			applicableSituations: 'Identifying magical effects, recalling magical knowledge',
			synergies: 'Investigation for magical research, Religion for divine magic',
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		const skillBody = {
			name: 'Arcana',
			description:
				'Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, and the planes of existence.',
			abilityScore: 'Intelligence',
			isProficiencyRequired: true,
			difficultyClass: 18,
			usageFrequency: 'Rare',
			applicableSituations: 'Identifying magical effects, recalling magical knowledge',
			synergies: 'Investigation for magical research, Religion for divine magic',
		}

		it('should create a skill successfully', async () => {
			const mockCreateSkillService = jest.mocked(createSkillService)
			mockCreateSkillService.mockResolvedValue(mockCreatedSkill)

			const request = createMockRequest({
				body: skillBody,
			})
			const reply = createMockReply()

			await createSkillController(request, reply)

			expect(mockCreateSkillService).toHaveBeenCalledWith(skillBody)
			expect(reply.status).toHaveBeenCalledWith(201)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockCreatedSkill,
				message: 'Skill created successfully',
			})
		})

		it('should create a skill with minimal required fields', async () => {
			const minimalBody = {
				name: 'Test Skill',
				description: 'A test skill',
				abilityScore: 'Wisdom',
				isProficiencyRequired: false,
				difficultyClass: 10,
				usageFrequency: 'Common',
				applicableSituations: 'Testing',
				synergies: 'None',
			}

			const mockCreateSkillService = jest.mocked(createSkillService)
			mockCreateSkillService.mockResolvedValue({
				...minimalBody,
				id: 1,
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-01-01T00:00:00.000Z',
			})

			const request = createMockRequest({
				body: minimalBody,
			})
			const reply = createMockReply()

			await createSkillController(request, reply)

			expect(mockCreateSkillService).toHaveBeenCalledWith(minimalBody)
			expect(reply.status).toHaveBeenCalledWith(201)
		})

		it('should handle ValidationError from service', async () => {
			const mockCreateSkillService = jest.mocked(createSkillService)
			const validationError = new ValidationError('Skill name cannot be empty')
			mockCreateSkillService.mockRejectedValue(validationError)

			const request = createMockRequest({
				body: { ...skillBody, name: '' },
			})
			const reply = createMockReply()

			await createSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Skill name cannot be empty',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockCreateSkillService = jest.mocked(createSkillService)
			const businessError = new BusinessLogicError('Skill with name "Arcana" already exists')
			mockCreateSkillService.mockRejectedValue(businessError)

			const request = createMockRequest({
				body: skillBody,
			})
			const reply = createMockReply()

			await createSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Skill with name "Arcana" already exists',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockCreateSkillService = jest.mocked(createSkillService)
			mockCreateSkillService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				body: skillBody,
			})
			const reply = createMockReply()

			await createSkillController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('updateSkillController', () => {
		const mockUpdatedSkill = {
			id: 1,
			name: 'Updated Arcana',
			description: 'An improved understanding of magical knowledge and spellcasting.',
			abilityScore: 'Intelligence',
			isProficiencyRequired: true,
			difficultyClass: 20,
			usageFrequency: 'Uncommon',
			applicableSituations: 'Identifying magical effects, recalling magical knowledge, dispelling magic',
			synergies: 'Investigation for magical research, Religion for divine magic, History for ancient magic',
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-02T00:00:00.000Z',
		}

		it('should update a skill successfully', async () => {
			const mockUpdateSkillService = jest.mocked(updateSkillService)
			mockUpdateSkillService.mockResolvedValue(mockUpdatedSkill)

			const updateBody = {
				name: 'Updated Arcana',
				description: 'An improved understanding of magical knowledge and spellcasting.',
				difficultyClass: 20,
				usageFrequency: 'Uncommon',
			}

			const request = createMockRequest({
				params: { id: '1' },
				body: updateBody,
			})
			const reply = createMockReply()

			await updateSkillController(request, reply)

			expect(mockUpdateSkillService).toHaveBeenCalledWith({
				id: 1,
				...updateBody,
			})
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockUpdatedSkill,
				message: 'Skill updated successfully',
			})
		})

		it('should return 404 when skill not found', async () => {
			const mockUpdateSkillService = jest.mocked(updateSkillService)
			mockUpdateSkillService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
				body: { name: 'Updated Skill' },
			})
			const reply = createMockReply()

			await updateSkillController(request, reply)

			expect(mockUpdateSkillService).toHaveBeenCalledWith({
				id: 999,
				name: 'Updated Skill',
			})
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Skill not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
				body: { name: 'Updated Skill' },
			})
			const reply = createMockReply()

			await updateSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Skill ID must be a positive integer',
			})
		})

		it('should handle empty body (partial update)', async () => {
			const mockUpdateSkillService = jest.mocked(updateSkillService)
			mockUpdateSkillService.mockResolvedValue(mockUpdatedSkill)

			const request = createMockRequest({
				params: { id: '1' },
				body: {},
			})
			const reply = createMockReply()

			await updateSkillController(request, reply)

			expect(mockUpdateSkillService).toHaveBeenCalledWith({ id: 1 })
			expect(reply.status).toHaveBeenCalledWith(200)
		})

		it('should handle proficiency requirement updates', async () => {
			const mockUpdateSkillService = jest.mocked(updateSkillService)
			mockUpdateSkillService.mockResolvedValue(mockUpdatedSkill)

			const updateBody = {
				isProficiencyRequired: false,
				difficultyClass: 12,
				usageFrequency: 'Common',
			}

			const request = createMockRequest({
				params: { id: '1' },
				body: updateBody,
			})
			const reply = createMockReply()

			await updateSkillController(request, reply)

			expect(mockUpdateSkillService).toHaveBeenCalledWith({
				id: 1,
				...updateBody,
			})
			expect(reply.status).toHaveBeenCalledWith(200)
		})

		it('should handle ability score changes', async () => {
			const mockUpdateSkillService = jest.mocked(updateSkillService)
			mockUpdateSkillService.mockResolvedValue(mockUpdatedSkill)

			const updateBody = {
				abilityScore: 'Wisdom',
				difficultyClass: 16,
			}

			const request = createMockRequest({
				params: { id: '1' },
				body: updateBody,
			})
			const reply = createMockReply()

			await updateSkillController(request, reply)

			expect(mockUpdateSkillService).toHaveBeenCalledWith({
				id: 1,
				...updateBody,
			})
			expect(reply.status).toHaveBeenCalledWith(200)
		})

		it('should handle ValidationError from service', async () => {
			const mockUpdateSkillService = jest.mocked(updateSkillService)
			const validationError = new ValidationError('Difficulty class must be between 5 and 30')
			mockUpdateSkillService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { difficultyClass: 50 },
			})
			const reply = createMockReply()

			await updateSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Difficulty class must be between 5 and 30',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockUpdateSkillService = jest.mocked(updateSkillService)
			const businessError = new BusinessLogicError('Cannot update skill difficulty: would break game balance')
			mockUpdateSkillService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { difficultyClass: 5 },
			})
			const reply = createMockReply()

			await updateSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot update skill difficulty: would break game balance',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockUpdateSkillService = jest.mocked(updateSkillService)
			mockUpdateSkillService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'Updated Skill' },
			})
			const reply = createMockReply()

			await updateSkillController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('deleteSkillController', () => {
		it('should delete a skill successfully', async () => {
			const mockDeleteSkillService = jest.mocked(deleteSkillService)
			mockDeleteSkillService.mockResolvedValue()

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteSkillController(request, reply)

			expect(mockDeleteSkillService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				message: 'Skill deleted successfully',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await deleteSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Skill ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockDeleteSkillService = jest.mocked(deleteSkillService)
			const validationError = new ValidationError('Skill ID must be a positive integer')
			mockDeleteSkillService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Skill ID must be a positive integer',
			})
		})

		it('should handle EntityNotFoundError from service', async () => {
			const mockDeleteSkillService = jest.mocked(deleteSkillService)
			const entityError = new EntityNotFoundError('Skill', 999)
			mockDeleteSkillService.mockRejectedValue(entityError)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await deleteSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: entityError.message,
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockDeleteSkillService = jest.mocked(deleteSkillService)
			const businessError = new BusinessLogicError(
				'Cannot delete skill "Athletics" as it is being used by characters',
			)
			mockDeleteSkillService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteSkillController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot delete skill "Athletics" as it is being used by characters',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockDeleteSkillService = jest.mocked(deleteSkillService)
			mockDeleteSkillService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteSkillController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})
})
