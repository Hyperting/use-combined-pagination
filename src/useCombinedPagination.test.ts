/* eslint-disable @typescript-eslint/no-loop-func */
/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
import { act, renderHook } from '@testing-library/react-hooks'
import faker from 'faker'
import { useMemo } from 'react'
import { useCombinedPagination } from '.'

jest.setTimeout(30000)

faker.seed(10)

const modernHats = [
  {
    name: 'Baseball Cap',
    sorting: { popularity: 95 }
  },
  {
    name: 'Beanie',
    sorting: { popularity: 70 }
  },
  {
    name: 'Golf',
    sorting: { popularity: 20 }
  },
  {
    name: 'Other',
    sorting: { popularity: 10 }
  }
]

const oldHats = [
  {
    name: 'Top Hat',
    sorting: { popularity: 60 }
  },
  {
    name: 'Beret',
    sorting: { popularity: 15 }
  },
  {
    name: 'Bowler Cap',
    sorting: { popularity: 9 }
  },
  {
    name: 'Sombrero',
    sorting: { popularity: 5 }
  },
  {
    name: 'Stetson',
    sorting: { popularity: 2 }
  }
]

const getData = (data: any[], page: number | null = 0, pageSize = 3) =>
  data.slice((page || 0) * pageSize, ((page || 0) + 1) * pageSize)

const combinedPaginationParams = {
  getters: [(page: number) => getData(modernHats, page), (page: number) => getData(oldHats, page)],
  sortKey: 'sorting.popularity'
}

describe('useCombinedPagination Hook', () => {
  describe('test data', () => {
    it('is valid test data, generating out of order results', () => {
      expect([
        ...[...getData(modernHats, 0), ...getData(oldHats, 0)].sort(
          (a, b) => b.sorting.popularity - a.sorting.popularity
        ),
        ...[...getData(modernHats, 1), ...getData(oldHats, 1)].sort(
          (a, b) => b.sorting.popularity - a.sorting.popularity
        )
      ]).toEqual([
        modernHats[0],
        modernHats[1],
        oldHats[0],
        modernHats[2],
        oldHats[1],
        oldHats[2],
        modernHats[3],
        oldHats[3],
        oldHats[4]
      ])
    })
  })

  describe('getNext()', () => {
    it('get intersecting hits for first page of known data set', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let page: any
      await act(async () => {
        page = await result.current.getNext()
      })
      expect(page).toEqual([modernHats[0], modernHats[1], oldHats[0], modernHats[2]])
    })
    it('get intersecting hits for second page of known data set', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let page: any
      await act(async () => {
        await result.current.getNext()
        page = await result.current.getNext()
      })
      expect(page).toEqual([oldHats[1], modernHats[3]])
    })
    it('get hits for third page of known data set', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let page: any
      await act(async () => {
        await result.current.getNext()
        await result.current.getNext()
        page = await result.current.getNext()
      })
      expect(page).toEqual([oldHats[2]])
    })
    it('get trailing hits for fourth page of known data set', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let page: any
      await act(async () => {
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
        page = await result.current.getNext()
      })
      expect(page).toEqual([oldHats[3], oldHats[4]])
    })
    it('return empty array when known data set is exhausted', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let page: any
      await act(async () => {
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
        page = await result.current.getNext()
      })
      expect(page).toEqual([])
    })
    it('should return data in correct order when using ascending sort direction', async () => {
      const reversedModernHats = [...modernHats].reverse()
      const reversedOldHats = [...oldHats].reverse()
      const { result } = renderHook(() =>
        useCombinedPagination({
          getters: [
            (page: number) => getData(reversedModernHats, page),
            (page: number) => getData(reversedOldHats, page)
          ],
          sortKey: 'sorting.popularity',
          sortDirection: 'asc'
        })
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let page: any
      await act(async () => {
        page = await result.current.getNext()
      })
      expect(page).toEqual([reversedOldHats[0], reversedOldHats[1], reversedOldHats[2]])
      let nextPage: any
      await act(async () => {
        nextPage = await result.current.getNext()
      })
      expect(nextPage).toEqual([
        reversedModernHats[0],
        reversedOldHats[3],
        reversedModernHats[1],
        reversedOldHats[4]
      ])
    })

    // Randomly generating data sets ensures robustness against edge cases
    it('should return all results in order for 1000 random data sets', async () => {
      const minimumLength = 1
      const maximumLength = 500
      const minimumPopularity = 0
      const maximumPopularity = 1000
      const minimumPageSize = 1
      const maximumPageSize = 100
      const minimumNumberOfDataSets = 2
      const maximumNumberOfDataSets = 5
      for (let index = 0; index < 1000; index++) {
        // We ensure same maximum popularity is kept throughout run
        // This causes data to get distributed
        const maximumPopularityForRun = faker.datatype.number({
          min: minimumPopularity,
          max: maximumPopularity
        })
        const numberDataSets = faker.datatype.number({
          min: minimumNumberOfDataSets,
          max: maximumNumberOfDataSets
        })
        const dataSets = Array.from(
          {
            length: numberDataSets
          },
          () =>
            Array.from(
              { length: faker.datatype.number({ min: minimumLength, max: maximumLength }) },
              () => ({
                sorting: {
                  popularity: faker.datatype.number({
                    min: minimumPopularity,
                    max: maximumPopularityForRun
                  })
                }
              })
            ).sort((a, b) => b.sorting.popularity - a.sorting.popularity)
        )
        const pageSizeForDataSets = Array.from(
          {
            length: numberDataSets
          },
          () => faker.datatype.number({ min: minimumPageSize, max: maximumPageSize })
        )
        const expectedResult = dataSets
          .reduce((acc, dataSet) => [...acc, ...dataSet], [])
          .sort((a, b) => b.sorting.popularity - a.sorting.popularity)
        const getters = dataSets.map(
          (dataSet, index) => (page: number) => getData(dataSet, page, pageSizeForDataSets[index])
        )
        const { result } = renderHook(() =>
          useCombinedPagination({
            getters,
            sortKey: 'sorting.popularity'
          })
        )
        let lastResult: any[] = []
        let allResults: any[] = []
        while (lastResult !== []) {
          await act(async () => {
            lastResult = await result.current.getNext()
          })
          if (lastResult.length === 0) {
            break
          }
          allResults = [...allResults, ...lastResult]
        }
        expect(allResults).toEqual(expectedResult)
      }
    })

    it('should not fetch data while already fetching', async () => {
      function timeout(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
      }

      const { result, waitForValueToChange } = renderHook(() =>
        useCombinedPagination({
          ...combinedPaginationParams,
          getters: [
            async (page: number): Promise<any[]> => {
              await timeout(300)
              return getData(modernHats, page)
            },
            async (page: number): Promise<any[]> => {
              await timeout(300)
              return getData(oldHats, page)
            }
          ]
        })
      )

      act(() => {
        result.current.getNext()
      })

      act(() => {
        result.current.getNext()
      })

      act(() => {
        result.current.getNext()
      })

      await waitForValueToChange(() => result.current.data)

      expect(result.current.data).toEqual([modernHats[0], modernHats[1], oldHats[0], modernHats[2]])
    })
  })

  describe('getNextForGetter()', () => {
    it('should get next results for a specific getter', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let page: any
      await act(async () => {
        page = await result.current.getNextForGetter(0)
      })

      expect(page).toEqual([modernHats[0], modernHats[1], modernHats[2]])
    })

    it('should get next results from a specific getter, regardless of the getNext state', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let page: any
      await act(async () => {
        await result.current.getNext()
        page = await result.current.getNextForGetter(0)
      })

      expect(page).toEqual([modernHats[0], modernHats[1], modernHats[2]])
    })

    it('should get results for a specific getter, without interfering with getNext', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let page: any
      await act(async () => {
        await result.current.getNext()
        await result.current.getNextForGetter(1)
        await result.current.getNextForGetter(1)
        page = await result.current.getNext()
      })

      expect(page).toEqual([oldHats[1], modernHats[3]])
    })

    it('should return [] when next page is null', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      act(() => {
        result.current.setState({
          ...result.current.state,
          getNextForGetter: { nextPageForGetters: [null, null] }
        })
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let page: any
      await act(async () => {
        page = await result.current.getNextForGetter(1)
      })

      expect(page).toEqual([])
    })

    it('should return [] when pages are exhausted', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      await act(async () => {
        await result.current.getNextForGetter(1)
      })
      await act(async () => {
        await result.current.getNextForGetter(1)
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let page: any
      await act(async () => {
        page = await result.current.getNextForGetter(1)
      })

      expect(page).toEqual([])
    })
  })

  describe('data', () => {
    it('get intersecting hits for first page of known data set', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      await act(async () => {
        await result.current.getNext()
      })

      expect(result.current.data).toEqual([modernHats[0], modernHats[1], oldHats[0], modernHats[2]])
    })

    it('get intersecting hits for second page of known data set', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      await act(async () => {
        await result.current.getNext()
        await result.current.getNext()
      })

      expect(result.current.data).toEqual([
        modernHats[0],
        modernHats[1],
        oldHats[0],
        modernHats[2],
        oldHats[1],
        modernHats[3]
      ])
    })

    it('get hits for third page of known data set', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      await act(async () => {
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
      })

      expect(result.current.data).toEqual([
        modernHats[0],
        modernHats[1],
        oldHats[0],
        modernHats[2],
        oldHats[1],
        modernHats[3],
        oldHats[2]
      ])
    })

    it('get trailing hits for fourth page of known data set', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await act(async () => {
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
      })

      expect(result.current.data).toEqual([
        modernHats[0],
        modernHats[1],
        oldHats[0],
        modernHats[2],
        oldHats[1],
        modernHats[3],
        oldHats[2],
        oldHats[3],
        oldHats[4]
      ])
    })

    it('does not change data array when known data set is exhausted', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await act(async () => {
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
      })

      expect(result.current.data).toEqual([
        modernHats[0],
        modernHats[1],
        oldHats[0],
        modernHats[2],
        oldHats[1],
        modernHats[3],
        oldHats[2],
        oldHats[3],
        oldHats[4]
      ])
    })
  })

  describe('hasNext', () => {
    it('return true if there are more pages to get', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      await act(async () => {
        await result.current.getNext()
      })

      expect(result.current.hasNext).toBe(true)
    })

    it('return false if getters are exhausted', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      await act(async () => {
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
      })

      expect(result.current.hasNext).toBe(false)
    })
  })

  describe('reset()', () => {
    it('should reset state', async () => {
      const { result } = renderHook(() => useCombinedPagination({ ...combinedPaginationParams }))

      await act(async () => {
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
      })

      expect(result.current.data).toEqual([
        modernHats[0],
        modernHats[1],
        oldHats[0],
        modernHats[2],
        oldHats[1],
        modernHats[3],
        oldHats[2]
      ])

      act(() => {
        result.current.reset()
      })

      expect(result.current.data).toEqual([])

      await act(async () => {
        await result.current.getNext()
      })

      expect(result.current.data).toEqual([modernHats[0], modernHats[1], oldHats[0], modernHats[2]])
    })
  })

  describe('refetch()', () => {
    it('should reset state and fetch the first two pages', async () => {
      const { result, waitForValueToChange } = renderHook(() =>
        useCombinedPagination({ ...combinedPaginationParams })
      )

      await act(async () => {
        await result.current.getNext()
        await result.current.getNext()
        await result.current.getNext()
      })

      expect(result.current.data).toEqual([
        modernHats[0],
        modernHats[1],
        oldHats[0],
        modernHats[2],
        oldHats[1],
        modernHats[3],
        oldHats[2]
      ])

      act(() => {
        result.current.refetch()
      })

      expect(result.current.data).toEqual([])

      await waitForValueToChange(() => result.current.data)

      expect(result.current.data).toEqual([modernHats[0], modernHats[1], oldHats[0], modernHats[2]])

      await act(async () => {
        await result.current.getNext()
      })

      expect(result.current.data).toEqual([
        modernHats[0],
        modernHats[1],
        oldHats[0],
        modernHats[2],
        oldHats[1],
        modernHats[3]
      ])
    })
  })

  describe('hook function input params', () => {
    it('should accept dynamic getters without crashing', async () => {
      let inputParams = {
        ...combinedPaginationParams,
        getters: [combinedPaginationParams.getters[0]]
      }

      const { result, rerender, waitForValueToChange } = renderHook(() =>
        useCombinedPagination(inputParams)
      )

      await act(async () => {
        await result.current.getNext()
      })

      inputParams = {
        ...combinedPaginationParams
      }
      rerender()

      act(() => {
        result.current.refetch()
      })

      await waitForValueToChange(() => result.current.data)
      expect(result.current.data).toEqual([modernHats[0], modernHats[1], oldHats[0], modernHats[2]])
    })
  })
})
