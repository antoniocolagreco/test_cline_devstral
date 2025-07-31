class BusinessLogicError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'BusinessLogicError'
	}
}

export default BusinessLogicError
