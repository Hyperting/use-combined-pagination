/* eslint-disable no-underscore-dangle */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Source, State, UseCombinedPaginationParams, UseCombinedPaginationResult } from './types'

export const get = <T = never>(obj: T, accessor: string): any =>
  accessor.split('.').reduce((o, i) => o[i], obj)

export const getInitialState = <T = never>(getters: Source<T>[]): State<T> => ({
  pages: getters.map(() => []),
  getNext: {
    data: getters.map(() => []),
    meta: {},
    nextPageForGetters: getters.map(() => 0)
  },
  getNextForGetter: {
    nextPageForGetters: getters.map(() => 0)
  }
})

export const useCombinedPagination = <T = never>({
  getters,
  sortKey,
  sort,
  sortDirection = 'desc'
}: UseCombinedPaginationParams<T>): UseCombinedPaginationResult<T> => {
  const [state, setState] = useState<State<T>>(getInitialState<T>(getters))
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<T[]>([])
  const [resetCounter, setResetCounter] = useState<number>(0)

  const _getSortKey = useCallback((hit: T) => get<T>(hit, sortKey), [sortKey])

  const _isAfter = useCallback(
    (a: T, b: T, { eq } = { eq: true }) => {
      if (sort) {
        return eq ? sort(a, b) >= 0 : sort(a, b) > 0
      }

      if (sortDirection === 'asc') {
        return eq ? _getSortKey(a) >= _getSortKey(b) : _getSortKey(a) > _getSortKey(b)
      }

      return eq ? _getSortKey(a) <= _getSortKey(b) : _getSortKey(a) < _getSortKey(b)
    },
    [_getSortKey, sort, sortDirection]
  )

  const _isBefore = useCallback(
    (a: T, b: T, { eq } = { eq: true }) => {
      if (sort) {
        return eq ? sort(a, b) <= 0 : sort(a, b) < 0
      }

      if (sortDirection === 'asc') {
        return eq ? _getSortKey(a) <= _getSortKey(b) : _getSortKey(a) < _getSortKey(b)
      }

      return eq ? _getSortKey(a) >= _getSortKey(b) : _getSortKey(a) > _getSortKey(b)
    },
    [_getSortKey, sort, sortDirection]
  )

  const _sortPage = useCallback(
    (hits: T[]): T[] =>
      sort
        ? hits.sort(sort)
        : hits.sort((a, b) =>
            sortDirection === 'asc'
              ? get(a, sortKey) - get(b, sortKey)
              : get(b, sortKey) - get(a, sortKey)
          ),
    [sort, sortDirection, sortKey]
  )

  const _mergeData = useCallback(
    (data: T[][]) => _sortPage(data.reduce((acc, hitsForGetter) => [...acc, ...hitsForGetter], [])),
    [_sortPage]
  )

  const _trimPage = useCallback(
    ({ page, meta }: { page: T[]; meta: any }) => {
      const { earliestLastHit, firstHit } = meta

      const trimmedPage = page.filter(
        (hit: T) => _isAfter(hit, firstHit) && _isBefore(hit, earliestLastHit)
      )

      return trimmedPage
    },
    [_isAfter, _isBefore]
  )

  const _getMeta = useCallback(
    ({ currentMeta, results }) => {
      const lastHitForGetter = results[results.length - 1]
      const { earliestLastHit = lastHitForGetter, firstHit = results[0] } = currentMeta

      return {
        firstHit: _isBefore(results[0], firstHit, { eq: false }) ? results[0] : firstHit,
        earliestLastHit: _isBefore(lastHitForGetter, earliestLastHit, {
          eq: false
        })
          ? lastHitForGetter
          : earliestLastHit
      }
    },
    [_isBefore]
  )

  const _shouldProcessPage = useCallback(
    ({ data, page, getterIndex }: { data: T[][]; page: number | null; getterIndex: number }) =>
      data[getterIndex]?.length === 0 && page !== null,
    []
  )

  const _tidyData = useCallback(
    ({ data, trimmedPage }: { data: T[][]; trimmedPage: T[] }): T[][] =>
      data.reduce<T[][]>(
        (acc, getterData) => [...acc, getterData.filter((hit) => trimmedPage.indexOf(hit) === -1)],
        []
      ),
    []
  )

  const _getData = useCallback(
    async ({
      getterIndex,
      page,
      userOptions,
      inputState
    }: {
      getterIndex: number
      page: number | null
      userOptions?: any
      inputState?: State<T>
    }): Promise<{ results: T[]; newState: State<T> }> => {
      const getter = getters[getterIndex]
      const cachedPage = state.pages[getterIndex][page || 0]

      let results
      const newState = { ...state, ...(inputState || {}) }

      if (cachedPage) {
        results = cachedPage
      } else {
        results = await getter(page || 0, userOptions)
        newState.pages[getterIndex].push(results)
      }

      return { results, newState }
    },
    [getters, state]
  )

  const getNext = useCallback(
    async (userOptions?: any) => {
      if (loading) {
        return []
      }

      setLoading(true)
      let newState = { ...state }

      // // We recalculate these meta params on each page
      newState.getNext.meta.firstHit = undefined
      newState.getNext.meta.earliestLastHit = undefined

      for (let getterIndex = 0; getterIndex < getters.length; getterIndex++) {
        const page = newState.getNext.nextPageForGetters[getterIndex]

        if (
          _shouldProcessPage({
            data: newState.getNext.data,
            page,
            getterIndex
          })
        ) {
          // eslint-disable-next-line no-await-in-loop
          const { results, newState: newStateToSave } = await _getData({
            getterIndex,
            page,
            userOptions,
            inputState: newState
          })

          newState = { ...newStateToSave }
          if (results.length > 0) {
            newState.getNext.data[getterIndex] = results
            newState.getNext.nextPageForGetters[getterIndex] = (page || 0) + 1
            newState.getNext.meta = _getMeta({
              currentMeta: newState.getNext.meta,
              getterIndex,
              results
            })
          } else {
            newState.getNext.nextPageForGetters[getterIndex] = null
          }
        } else if (newState.getNext?.data[getterIndex]?.length > 0) {
          newState.getNext.meta = _getMeta({
            currentMeta: newState.getNext.meta,
            getterIndex,
            results: newState.getNext.data[getterIndex]
          })
        }
      }

      const page = _mergeData(newState.getNext.data)

      const trimmedPage =
        page.length > 0
          ? _trimPage({
              page,
              meta: newState.getNext.meta
            })
          : page

      newState.getNext.data = _tidyData({ data: newState.getNext.data, trimmedPage })

      setState(newState)
      setLoading(false)
      setData([...data, ...trimmedPage])
      return trimmedPage
    },
    [
      _getData,
      _getMeta,
      _mergeData,
      _shouldProcessPage,
      _tidyData,
      _trimPage,
      data,
      getters.length,
      loading,
      state
    ]
  )

  const getNextForGetter = useCallback(
    async (getterIndex: number, userOptions: any) => {
      const page = state.getNextForGetter.nextPageForGetters[getterIndex]

      if (page === null) {
        return []
      }

      const { results, newState: newStateToSave } = await _getData({
        getterIndex,
        page,
        userOptions
      })

      const newState = { ...newStateToSave }
      if (results.length === 0) {
        newState.getNextForGetter.nextPageForGetters[getterIndex] = null
      } else {
        newState.getNextForGetter.nextPageForGetters[getterIndex] = page + 1
      }
      setState(newState)

      return results
    },
    [_getData, state?.getNextForGetter?.nextPageForGetters]
  )

  const hasNext = useMemo(() => {
    return state.getNext?.nextPageForGetters.filter((i) => i !== null).length > 0
  }, [state])

  const reset = useCallback(() => {
    setState(getInitialState(getters))
    setData([])
  }, [getters])

  const refetch = useCallback(() => {
    reset()
    setResetCounter(resetCounter + 1)
  }, [reset, resetCounter])

  useEffect(() => {
    if (resetCounter > 0) {
      getNext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter])

  return {
    getNext,
    getNextForGetter,
    state,
    setState,
    loading,
    data,
    hasNext,
    reset,
    refetch
  }
}
