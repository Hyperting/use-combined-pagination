export type Getter<T = never> = (page: number, userOptions?: any) => Promise<T[]> | T[]

// export type Source<T = never> = {
//   sortKey?: string
//   get: Getter<T>
// }

export type Source<T = never> = Getter<T>

export type State<T = never> = {
  pages: T[][][]
  getNext: {
    data: T[][]
    meta: Record<string, any>
    nextPageForGetters: (number | null)[]
  }
  getNextForGetter: {
    nextPageForGetters: (number | null)[]
  }
}

export type UseCombinedPaginationParams<T = never> = {
  getters: Source<T>[]
  sortKey: string
  sort?: (a: T, b: T) => number
  sortDirection?: 'asc' | 'desc'
}

export type UseCombinedPaginationResult<T = never> = {
  getNext: (userOptions?: any) => Promise<T[]>
  getNextForGetter: (getterIndex: number, userOptions?: any) => Promise<T[]>
  state: State<T>
  setState: (state: State<T>) => void
  loading: boolean
  data?: T[]
  hasNext: boolean
}
