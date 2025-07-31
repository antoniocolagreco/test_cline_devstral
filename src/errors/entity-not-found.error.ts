class EntityNotFoundError extends Error {
	constructor(entityName: string, id: number | string) {
		super(`${entityName} with ID ${id} not found`)
		this.name = 'EntityNotFoundError'
	}
}
export default EntityNotFoundError
