import {
	createCharacterController,
	deleteCharacterController,
	getCharacterController,
	getCharactersController,
	updateCharacterController,
} from '../src/controllers/characters.controller.js'
import BusinessLogicError from '../src/errors/business-logic.error.js'
import EntityNotFoundError from '../src/errors/entity-not-found.error.js'
import ValidationError from '../src/errors/validation.error.js'

// Mock services
jest.mock('../src/services/characters.service.js', () => ({
	getCharactersService: jest.fn(),
	getCharacterService: jest.fn(),
	createCharacterService: jest.fn(),
	updateCharacterService: jest.fn(),
	deleteCharacterService: jest.fn(),
}))

import {
	createCharacterService,
	deleteCharacterService,
	getCharacterService,
	getCharactersService,
	updateCharacterService,
} from '../src/services/characters.service.js'

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

describe('Characters Controller', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getCharactersController', () => {
		const mockCharactersResult = {
			data: [
				{
					id: 1,
					name: 'Thorin',
					surname: 'Oakenshield',
					nickname: 'The Dwarf King',
					description: 'A brave dwarf warrior',
					avatarPath: '/avatars/thorin.jpg',
					health: 100,
					stamina: 80,
					mana: 30,
					strength: 18,
					dexterity: 12,
					constitution: 16,
					intelligence: 10,
					wisdom: 14,
					charisma: 12,
					aggregateHealth: 120,
					aggregateStamina: 92,
					aggregateMana: 40,
					aggregateStrength: 20,
					aggregateDexterity: 14,
					aggregateConstitution: 18,
					aggregateIntelligence: 12,
					aggregateWisdom: 16,
					aggregateCharisma: 14,
					raceId: 1,
					archetypeId: 1,
					userId: 1,
					isPublic: true,
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
				{
					id: 2,
					name: 'Gandalf',
					surname: 'The Grey',
					nickname: 'Mithrandir',
					description: 'A wise wizard',
					avatarPath: '/avatars/gandalf.jpg',
					health: 70,
					stamina: 60,
					mana: 120,
					strength: 8,
					dexterity: 10,
					constitution: 12,
					intelligence: 20,
					wisdom: 18,
					charisma: 16,
					aggregateHealth: 82,
					aggregateStamina: 70,
					aggregateMana: 140,
					aggregateStrength: 10,
					aggregateDexterity: 12,
					aggregateConstitution: 14,
					aggregateIntelligence: 22,
					aggregateWisdom: 20,
					aggregateCharisma: 18,
					raceId: 2,
					archetypeId: 2,
					userId: 2,
					isPublic: true,
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

		it('should return paginated characters successfully', async () => {
			const mockGetCharactersService = jest.mocked(getCharactersService)
			mockGetCharactersService.mockResolvedValue(mockCharactersResult)

			const request = createMockRequest({
				query: { page: 1, pageSize: 10 },
			})
			const reply = createMockReply()

			await getCharactersController(request, reply)

			expect(mockGetCharactersService).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockCharactersResult.data,
				pagination: mockCharactersResult.pagination,
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetCharactersService = jest.mocked(getCharactersService)
			const validationError = new ValidationError('Page number must be greater than 0')
			mockGetCharactersService.mockRejectedValue(validationError)

			const request = createMockRequest({
				query: { page: 0 },
			})
			const reply = createMockReply()

			await getCharactersController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Page number must be greater than 0',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetCharactersService = jest.mocked(getCharactersService)
			mockGetCharactersService.mockRejectedValue(new Error('Database connection failed'))

			const request = createMockRequest()
			const reply = createMockReply()

			await getCharactersController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('getCharacterController', () => {
		const mockCharacter = {
			id: 1,
			name: 'Thorin',
			surname: 'Oakenshield',
			nickname: 'The Dwarf King',
			description: 'A brave dwarf warrior',
			avatarPath: '/avatars/thorin.jpg',
			health: 100,
			stamina: 80,
			mana: 30,
			strength: 18,
			dexterity: 12,
			constitution: 16,
			intelligence: 10,
			wisdom: 14,
			charisma: 12,
			aggregateHealth: 120,
			aggregateStamina: 92,
			aggregateMana: 40,
			aggregateStrength: 20,
			aggregateDexterity: 14,
			aggregateConstitution: 18,
			aggregateIntelligence: 12,
			aggregateWisdom: 16,
			aggregateCharisma: 14,
			raceId: 1,
			archetypeId: 1,
			userId: 1,
			isPublic: true,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		it('should return a character successfully', async () => {
			const mockGetCharacterService = jest.mocked(getCharacterService)
			mockGetCharacterService.mockResolvedValue(mockCharacter)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getCharacterController(request, reply)

			expect(mockGetCharacterService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockCharacter,
			})
		})

		it('should return 404 when character not found', async () => {
			const mockGetCharacterService = jest.mocked(getCharacterService)
			mockGetCharacterService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await getCharacterController(request, reply)

			expect(mockGetCharacterService).toHaveBeenCalledWith(999)
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Character not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await getCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Character ID must be a positive integer',
			})
		})

		it('should return 400 for negative ID', async () => {
			const request = createMockRequest({
				params: { id: '-1' },
			})
			const reply = createMockReply()

			await getCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Character ID must be a positive integer',
			})
		})

		it('should return 400 for zero ID', async () => {
			const request = createMockRequest({
				params: { id: '0' },
			})
			const reply = createMockReply()

			await getCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Character ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockGetCharacterService = jest.mocked(getCharacterService)
			const validationError = new ValidationError('Service validation error')
			mockGetCharacterService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Service validation error',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockGetCharacterService = jest.mocked(getCharacterService)
			mockGetCharacterService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await getCharacterController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('createCharacterController', () => {
		const mockCreatedCharacter = {
			id: 1,
			name: 'Thorin',
			surname: 'Oakenshield',
			nickname: 'The Dwarf King',
			description: 'A brave dwarf warrior',
			avatarPath: '/avatars/thorin.jpg',
			health: 100,
			stamina: 80,
			mana: 30,
			strength: 18,
			dexterity: 12,
			constitution: 16,
			intelligence: 10,
			wisdom: 14,
			charisma: 12,
			aggregateHealth: 120,
			aggregateStamina: 92,
			aggregateMana: 40,
			aggregateStrength: 20,
			aggregateDexterity: 14,
			aggregateConstitution: 18,
			aggregateIntelligence: 12,
			aggregateWisdom: 16,
			aggregateCharisma: 14,
			raceId: 1,
			archetypeId: 1,
			userId: 1,
			isPublic: true,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-01T00:00:00.000Z',
		}

		const characterBody = {
			name: 'Thorin',
			surname: 'Oakenshield',
			nickname: 'The Dwarf King',
			description: 'A brave dwarf warrior',
			avatarPath: '/avatars/thorin.jpg',
			health: 100,
			stamina: 80,
			mana: 30,
			strength: 18,
			dexterity: 12,
			constitution: 16,
			intelligence: 10,
			wisdom: 14,
			charisma: 12,
			raceId: 1,
			archetypeId: 1,
			userId: 1,
			isPublic: true,
		}

		it('should create a character successfully', async () => {
			const mockCreateCharacterService = jest.mocked(createCharacterService)
			mockCreateCharacterService.mockResolvedValue(mockCreatedCharacter)

			const request = createMockRequest({
				body: characterBody,
			})
			const reply = createMockReply()

			await createCharacterController(request, reply)

			expect(mockCreateCharacterService).toHaveBeenCalledWith(characterBody)
			expect(reply.status).toHaveBeenCalledWith(201)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockCreatedCharacter,
				message: 'Character created successfully',
			})
		})

		it('should create a minimal character', async () => {
			const minimalBody = {
				name: 'Simple Character',
				health: 100,
				stamina: 80,
				mana: 30,
				strength: 10,
				dexterity: 10,
				constitution: 10,
				intelligence: 10,
				wisdom: 10,
				charisma: 10,
				raceId: 1,
				archetypeId: 1,
				userId: 1,
				isPublic: false,
			}

			const mockCreateCharacterService = jest.mocked(createCharacterService)
			mockCreateCharacterService.mockResolvedValue({
				...minimalBody,
				id: 1,
				aggregateHealth: 100,
				aggregateStamina: 80,
				aggregateMana: 30,
				aggregateStrength: 10,
				aggregateDexterity: 10,
				aggregateConstitution: 10,
				aggregateIntelligence: 10,
				aggregateWisdom: 10,
				aggregateCharisma: 10,
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-01-01T00:00:00.000Z',
			})

			const request = createMockRequest({
				body: minimalBody,
			})
			const reply = createMockReply()

			await createCharacterController(request, reply)

			expect(mockCreateCharacterService).toHaveBeenCalledWith(minimalBody)
			expect(reply.status).toHaveBeenCalledWith(201)
		})

		it('should handle ValidationError from service', async () => {
			const mockCreateCharacterService = jest.mocked(createCharacterService)
			const validationError = new ValidationError('Character name cannot be empty')
			mockCreateCharacterService.mockRejectedValue(validationError)

			const request = createMockRequest({
				body: { ...characterBody, name: '' },
			})
			const reply = createMockReply()

			await createCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Character name cannot be empty',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockCreateCharacterService = jest.mocked(createCharacterService)
			const businessError = new BusinessLogicError('Invalid race or archetype combination')
			mockCreateCharacterService.mockRejectedValue(businessError)

			const request = createMockRequest({
				body: characterBody,
			})
			const reply = createMockReply()

			await createCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Invalid race or archetype combination',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockCreateCharacterService = jest.mocked(createCharacterService)
			mockCreateCharacterService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				body: characterBody,
			})
			const reply = createMockReply()

			await createCharacterController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('updateCharacterController', () => {
		const mockUpdatedCharacter = {
			id: 1,
			name: 'Updated Thorin',
			surname: 'Oakenshield',
			nickname: 'The Updated King',
			description: 'An updated brave dwarf warrior',
			avatarPath: '/avatars/thorin-updated.jpg',
			health: 110,
			stamina: 85,
			mana: 35,
			strength: 19,
			dexterity: 13,
			constitution: 17,
			intelligence: 11,
			wisdom: 15,
			charisma: 13,
			aggregateHealth: 130,
			aggregateStamina: 97,
			aggregateMana: 45,
			aggregateStrength: 21,
			aggregateDexterity: 15,
			aggregateConstitution: 19,
			aggregateIntelligence: 13,
			aggregateWisdom: 17,
			aggregateCharisma: 15,
			raceId: 1,
			archetypeId: 1,
			userId: 1,
			isPublic: true,
			createdAt: '2024-01-01T00:00:00.000Z',
			updatedAt: '2024-01-02T00:00:00.000Z',
		}

		it('should update a character successfully', async () => {
			const mockUpdateCharacterService = jest.mocked(updateCharacterService)
			mockUpdateCharacterService.mockResolvedValue(mockUpdatedCharacter)

			const updateBody = {
				name: 'Updated Thorin',
				nickname: 'The Updated King',
				health: 110,
				strength: 19,
			}

			const request = createMockRequest({
				params: { id: '1' },
				body: updateBody,
			})
			const reply = createMockReply()

			await updateCharacterController(request, reply)

			expect(mockUpdateCharacterService).toHaveBeenCalledWith({
				id: 1,
				...updateBody,
			})
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				data: mockUpdatedCharacter,
				message: 'Character updated successfully',
			})
		})

		it('should return 404 when character not found', async () => {
			const mockUpdateCharacterService = jest.mocked(updateCharacterService)
			mockUpdateCharacterService.mockResolvedValue(null)

			const request = createMockRequest({
				params: { id: '999' },
				body: { name: 'Updated Character' },
			})
			const reply = createMockReply()

			await updateCharacterController(request, reply)

			expect(mockUpdateCharacterService).toHaveBeenCalledWith({
				id: 999,
				name: 'Updated Character',
			})
			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Character not found',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
				body: { name: 'Updated Character' },
			})
			const reply = createMockReply()

			await updateCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Character ID must be a positive integer',
			})
		})

		it('should handle empty body (partial update)', async () => {
			const mockUpdateCharacterService = jest.mocked(updateCharacterService)
			mockUpdateCharacterService.mockResolvedValue(mockUpdatedCharacter)

			const request = createMockRequest({
				params: { id: '1' },
				body: {},
			})
			const reply = createMockReply()

			await updateCharacterController(request, reply)

			expect(mockUpdateCharacterService).toHaveBeenCalledWith({ id: 1 })
			expect(reply.status).toHaveBeenCalledWith(200)
		})

		it('should handle ValidationError from service', async () => {
			const mockUpdateCharacterService = jest.mocked(updateCharacterService)
			const validationError = new ValidationError('Character name cannot be empty')
			mockUpdateCharacterService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: '' },
			})
			const reply = createMockReply()

			await updateCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Character name cannot be empty',
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockUpdateCharacterService = jest.mocked(updateCharacterService)
			const businessError = new BusinessLogicError('Invalid equipment combination')
			mockUpdateCharacterService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
				body: { primaryWeaponId: 999 },
			})
			const reply = createMockReply()

			await updateCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Invalid equipment combination',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockUpdateCharacterService = jest.mocked(updateCharacterService)
			mockUpdateCharacterService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
				body: { name: 'Updated Character' },
			})
			const reply = createMockReply()

			await updateCharacterController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})

	describe('deleteCharacterController', () => {
		it('should delete a character successfully', async () => {
			const mockDeleteCharacterService = jest.mocked(deleteCharacterService)
			mockDeleteCharacterService.mockResolvedValue()

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteCharacterController(request, reply)

			expect(mockDeleteCharacterService).toHaveBeenCalledWith(1)
			expect(reply.status).toHaveBeenCalledWith(200)
			expect(reply.send).toHaveBeenCalledWith({
				success: true,
				message: 'Character deleted successfully',
			})
		})

		it('should return 400 for invalid ID parameter', async () => {
			const request = createMockRequest({
				params: { id: 'invalid' },
			})
			const reply = createMockReply()

			await deleteCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Character ID must be a positive integer',
			})
		})

		it('should handle ValidationError from service', async () => {
			const mockDeleteCharacterService = jest.mocked(deleteCharacterService)
			const validationError = new ValidationError('Character ID must be a positive integer')
			mockDeleteCharacterService.mockRejectedValue(validationError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(400)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Character ID must be a positive integer',
			})
		})

		it('should handle EntityNotFoundError from service', async () => {
			const mockDeleteCharacterService = jest.mocked(deleteCharacterService)
			const entityError = new EntityNotFoundError('Character', 999)
			mockDeleteCharacterService.mockRejectedValue(entityError)

			const request = createMockRequest({
				params: { id: '999' },
			})
			const reply = createMockReply()

			await deleteCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(404)
			expect(reply.send).toHaveBeenCalledWith({
				error: entityError.message,
			})
		})

		it('should handle BusinessLogicError from service', async () => {
			const mockDeleteCharacterService = jest.mocked(deleteCharacterService)
			const businessError = new BusinessLogicError(
				'Cannot delete character as it is being used in active campaigns',
			)
			mockDeleteCharacterService.mockRejectedValue(businessError)

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteCharacterController(request, reply)

			expect(reply.status).toHaveBeenCalledWith(409)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Cannot delete character as it is being used in active campaigns',
			})
		})

		it('should handle unexpected errors', async () => {
			const mockDeleteCharacterService = jest.mocked(deleteCharacterService)
			mockDeleteCharacterService.mockRejectedValue(new Error('Database error'))

			const request = createMockRequest({
				params: { id: '1' },
			})
			const reply = createMockReply()

			await deleteCharacterController(request, reply)

			expect(request.log.error).toHaveBeenCalledWith(expect.any(Error))
			expect(reply.status).toHaveBeenCalledWith(500)
			expect(reply.send).toHaveBeenCalledWith({
				error: 'Internal server error',
			})
		})
	})
})
