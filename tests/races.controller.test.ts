import {
	createRaceController,
	deleteRaceController,
	getRaceController,
	getRacesController,
	updateRaceController,
} from '../src/controllers/races.controller.js'
import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock services
jest.mock('../src/services/races.service.js', () => ({
	getRacesService: jest.fn(),
	getRaceService: jest.fn(),
	createRaceService: jest.fn(),
	updateRaceService: jest.fn(),
	deleteRaceService: jest.fn(),
}))

import {
	createRaceService,
	deleteRaceService,
	getRaceService,
	getRacesService,
	updateRaceService,
} from '../src/services/races.service.js'

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

describe('Races Controller', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getRacesController', () => {
		const mockRacesResult = {
			data: [
				{
					id: 1,
					name: 'Human',
					description: 'Versatile and adaptable race',
					healthModifier: 2,
					staminaModifier: 2,
					manaModifier: 0,
					strengthModifier: 1,
					dexterityModifier: 1,
					constitutionModifier: 1,
					intelligenceModifier: 1,
					wisdomModifier: 1,
					charismaModifier: 1,
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
				{
					id: 2,
					name: 'Elf',
					description: 'Graceful and long-lived race',
					healthModifier: 0,
					staminaModifier: 1,
					manaModifier: 2,
					strengthModifier: 0,
					dexterityModifier: 2,
					constitutionModifier: 0,
					intelligenceModifier: 0,
					wisdomModifier: 1,
					charismaModifier: 0,
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

		it('should return paginated races successfully', async () => {
			const mockGetRacesService = jest.mocked(getRacesService)
			mockGetRacesService.mockResolvedValue(mockRacesResult)

			const request = createMockRequest({
				query: { page: 1, pageSize: 10 },
			})
			const reply = createMockReply()

			await getRacesController(request, reply)

			expect(mockGetRacesService).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockRacesResult.data,
				pagination: mockRacesResult.pagination,
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetRacesService = jest.mocked(getRacesService)
			const validationError = new ValidationError('Page number must be greater than 0')
			mockGetRacesService.mockRejectedValue(validationError)

			const request = createMockRequest({
				query: { page: 0 },
			})
			const reply = createMockReply()

			await getRacesController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Page number must be greater than 0',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetRacesService = jest.mocked(getRacesService)
			mockGetRacesService.mockRejectedValue(new Error('Database connection failed'))

			const request = createMockRequest()
			const reply = createMockReply()

			await getRacesController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('getRaceController', () => {
		const mockRace = {
			id: 1,
			name: 'Human',
			description: 'Versatile and adaptable race',
			healthModifier: 2,
			staminaModifier: 2,
			manaModifier: 0,
			strengthModifier: 1,
			dexterityModifier: 1,
			constitutionModifier: 1,
			intelligenceModifier: 1,
			wisdomModifier: 1,
			charismaModifier: 1,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		it('should return a race successfully', async () => {
			const mockGetRaceService = jest.mocked(getRaceService)
			mockGetRaceService.mockResolvedValue(mockRace)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getRaceController(request, reply)

			expect(mockGetRaceService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockRace,
			})
		})

		it('should return 404 when race not found', async () => {
			const mockGetRaceService = jest.mocked(getRaceService)
			mockGetRaceService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await getRaceController(request, reply)

			expect(mockGetRaceService).toHaveBeenCalledWith(999)
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Race not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await getRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Race ID must be a positive integer',
			})
		})

		it('should return 400 for negative ID', async () => {
			const request = createMockRequest({
				params: { id: '-1' },
			})
			const reply = createMockReply()

			await getRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Race ID must be a positive integer',
			})
		})

		it('should return 400 for zero ID', async () => {
			const request = createMockRequest({
				params: { id: '0' },
			})
			const reply = createMockReply()

			await getRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Race ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetRaceService = jest.mocked(getRaceService)
			const validationError = new ValidationError('Service validation error')
			mockGetRaceService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Service validation error',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetRaceService = jest.mocked(getRaceService)
			mockGetRaceService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getRaceController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('createRaceController', () => {
		const mockCreatedRace = {
			id: 1,
			name: 'Dragonborn',
			description: 'Proud dragon-born race with elemental breath',
			healthModifier: 1,
			staminaModifier: 0,
			manaModifier: 1,
			strengthModifier: 2,
			dexterityModifier: 0,
			constitutionModifier: 0,
			intelligenceModifier: 0,
			wisdomModifier: 0,
			charismaModifier: 1,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		const raceBody = {
			name: 'Dragonborn',
			description: 'Proud dragon-born race with elemental breath',
			healthModifier: 1,
			staminaModifier: 0,
			manaModifier: 1,
			strengthModifier: 2,
			dexterityModifier: 0,
			constitutionModifier: 0,
			intelligenceModifier: 0,
			wisdomModifier: 0,
			charismaModifier: 1,
		}

		it('should create a race successfully', async () => {
			const mockCreateRaceService = jest.mocked(createRaceService)
			mockCreateRaceService.mockResolvedValue(mockCreatedRace)

			const request = createMockRequest({
				body: raceBody,
			})
			const reply = createMockReply()

			await createRaceController(request, reply)

			expect(mockCreateRaceService).toHaveBeenCalledWith(raceBody)
			expect(reply.status).toHaveBeenCalledWith(201)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockCreatedRace,
				message: 'Race created successfully',
			})
		})

		it('should create a race with minimal required fields', async () => {
			const minimalBody = {
				name: 'Test Race',
				description: 'A test race',
				healthModifier: 0,
				staminaModifier: 0,
				manaModifier: 0,
				strengthModifier: 0,
				dexterityModifier: 0,
				constitutionModifier: 0,
				intelligenceModifier: 0,
				wisdomModifier: 0,
				charismaModifier: 0,
			}

			const mockCreateRaceService = jest.mocked(createRaceService)
			mockCreateRaceService.mockResolvedValue({
				...minimalBody,
				id: 1,
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-01-01T00:00:00.000Z',
			})

			const request = createMockRequest({
				body: minimalBody,
			})
			const reply = createMockReply()

			await createRaceController(request, reply)

			expect(mockCreateRaceService).toHaveBeenCalledWith(minimalBody)
			expect(reply.status).toHaveBeenCalledWith(201)
		})

		it('should handle ValidationError from service', async () => {
			const mockCreateRaceService = jest.mocked(createRaceService)
			const validationError = new ValidationError('Race name cannot be empty')
			mockCreateRaceService.mockRejectedValue(validationError)

			const request = createMockRequest({
				body: { ...raceBody, name: '' },
			})
			const reply = createMockReply()

			await createRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Race name cannot be empty',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockCreateRaceService = jest.mocked(createRaceService)
			const businessError = new BusinessLogicError('Race with name "Dragonborn" already exists')
			mockCreateRaceService.mockRejectedValue(businessError)

			const request = createMockRequest({
				body: raceBody,
			})
			const reply = createMockReply()

			await createRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Race with name "Dragonborn" already exists',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockCreateRaceService = jest.mocked(createRaceService)
			mockCreateRaceService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				body: raceBody,
			})
			const reply = createMockReply()

			await createRaceController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('updateRaceController', () => {
		const mockUpdatedRace = {
			id: 1,
			name: 'Updated Dragonborn',
			description: 'An improved dragonborn race',
			healthModifier: 2,
			staminaModifier: 1,
			manaModifier: 1,
			strengthModifier: 2,
			dexterityModifier: 0,
			constitutionModifier: 1,
			intelligenceModifier: 0,
			wisdomModifier: 0,
			charismaModifier: 2,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-02T00:00:00.000Z',
		}

		it('should update a race successfully', async () => {
			const mockUpdateRaceService = jest.mocked(updateRaceService)
			mockUpdateRaceService.mockResolvedValue(mockUpdatedRace)

			const updateBody = {
				name: 'Updated Dragonborn',
				description: 'An improved dragonborn race',
				healthModifier: 2,
				charismaModifier: 2,
				constitutionModifier: 1,
			}

			const request = createMockRequest({
				params: { id: '1' },
				body: updateBody,
			})
			const reply = createMockReply()

			await updateRaceController(request, reply)

			expect(mockUpdateRaceService).toHaveBeenCalledWith({
				id: 1,
				...updateBody,
			})
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockUpdatedRace,
				message: 'Race updated successfully',
			})
		})

		it('should return 404 when race not found', async () => {
			const mockUpdateRaceService = jest.mocked(updateRaceService)
			mockUpdateRaceService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
				body: { name: 'Updated Race' },
			})
			const reply = createMockReply()

			await updateRaceController(request, reply)

			expect(mockUpdateRaceService).toHaveBeenCalledWith({
				id: 999,
				name: 'Updated Race',
			})
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Race not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
				body: { name: 'Updated Race' },
			})
			const reply = createMockReply()

			await updateRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Race ID must be a positive integer',
			})
		})

		it('should handle empty body (partial update)', async () => {
			const mockUpdateRaceService = jest.mocked(updateRaceService)
			mockUpdateRaceService.mockResolvedValue(mockUpdatedRace)

			const request = createMockRequest({
				params: { id: '1' },
				body: {},
			})
			const reply = createMockReply()

			await updateRaceController(request, reply)

			expect(mockUpdateRaceService).toHaveBeenCalledWith({ id: 1 })
			expect(reply.status).toHaveBeenCalledWith(200)
		})

		it('should handle stat modifier updates', async () => {
			const mockUpdateRaceService = jest.mocked(updateRaceService)
			mockUpdateRaceService.mockResolvedValue(mockUpdatedRace)

			const updateBody = {
				strengthModifier: 3,
				dexterityModifier: -1,
				constitutionModifier: 2,
				intelligenceModifier: 1,
				wisdomModifier: -2,
				charismaModifier: 1,
				healthModifier: 1,
				staminaModifier: 0,
				manaModifier: 2,
			}

			const request = createMockRequest({
				params: { id: '1' },
				body: updateBody,
			})
			const reply = createMockReply()

			await updateRaceController(request, reply)

			expect(mockUpdateRaceService).toHaveBeenCalledWith({
				id: 1,
				...updateBody,
			})
			expect(reply.status).toHaveBeenCalledWith(200)
		})

		it('should handle ValidationError from service', async () => {
			const mockUpdateRaceService = jest.mocked(updateRaceService)
			const validationError = new ValidationError('Health modifier must be between -10 and 10')
			mockUpdateRaceService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { healthModifier: 15 },
			})
			const reply = createMockReply()

			await updateRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Health modifier must be between -10 and 10',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockUpdateRaceService = jest.mocked(updateRaceService)
			const businessError = new BusinessLogicError('Cannot update race stats: would make game unbalanced')
			mockUpdateRaceService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { strengthModifier: 10 },
			})
			const reply = createMockReply()

			await updateRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot update race stats: would make game unbalanced',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockUpdateRaceService = jest.mocked(updateRaceService)
			mockUpdateRaceService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'Updated Race' },
			})
			const reply = createMockReply()

			await updateRaceController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('deleteRaceController', () => {
		it('should delete a race successfully', async () => {
			const mockDeleteRaceService = jest.mocked(deleteRaceService)
			mockDeleteRaceService.mockResolvedValue()

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteRaceController(request, reply)

			expect(mockDeleteRaceService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				message: 'Race deleted successfully',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await deleteRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Race ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockDeleteRaceService = jest.mocked(deleteRaceService)
			const validationError = new ValidationError('Race ID must be a positive integer')
			mockDeleteRaceService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Race ID must be a positive integer',
			})
		})

		it('should handle EntityNotFoundError from service', async () => {
			const mockDeleteRaceService = jest.mocked(deleteRaceService)
			const entityError = new EntityNotFoundError('Race', 999)
			mockDeleteRaceService.mockRejectedValue(entityError)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await deleteRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: entityError.message,
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockDeleteRaceService = jest.mocked(deleteRaceService)
			const businessError = new BusinessLogicError('Cannot delete race "Human" as it is being used by characters')
			mockDeleteRaceService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteRaceController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot delete race "Human" as it is being used by characters',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockDeleteRaceService = jest.mocked(deleteRaceService)
			mockDeleteRaceService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteRaceController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})
})
