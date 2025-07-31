type TransformSearchToQuery = (search: object | undefined) =>
	| {
			[k: string]: {
				contains: string | number
			}
	  }
	| undefined

const transformSearchToQuery: TransformSearchToQuery = (search) =>
	search ? Object.fromEntries(Object.entries(search).map(([key, value]) => [key, { contains: value }])) : undefined

export { transformSearchToQuery }
