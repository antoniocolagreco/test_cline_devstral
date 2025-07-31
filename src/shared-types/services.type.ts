type GetManyQueryParams<T> = {
	page?: number
	pageSize?: number
	search?: T
	orderBy?: { field: keyof T; direction: 'asc' | 'desc' }
}

type GetManyResult<T> = {
	data: T[]
	pagination: {
		page: number
		pageSize: number
		total: number
		totalPages: number
	}
}

type GetManyService<T> = (params: GetManyQueryParams<T>) => Promise<GetManyResult<T>>

type GetOneService<T> = (id: number) => Promise<T | null>

type CreateService<T, R> = (data: T) => Promise<R>

type UpdateService<T, R> = (data: T) => Promise<R | null>

type DeleteService = (id: number) => Promise<void>

export type { CreateService, DeleteService, GetManyQueryParams, GetManyService, GetOneService, UpdateService }
