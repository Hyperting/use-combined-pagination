# use-combined-pagination 🦑

[![NPM](https://img.shields.io/npm/v/use-combined-pagination.svg)](https://www.npmjs.com/package/use-combined-pagination) [![eslint formatted](https://img.shields.io/badge/code_style-eslint-brightgreen.svg)](https://eslint.org/) [![eslint formatted](https://img.shields.io/badge/code_style-prettier-brightgreen.svg)](https://prettier.io/)

`use-combined-pagination` is a React hook for paginating across multiple data sources at once, whilst retaining the sort order.

- **Great for Infinity Scroll**: easily support multiple data sources in your infinity scroll.
- **Retain order**: your data is always in order, even when it comes from different sources.
- **Service agnostic**: work with any data service, whether REST, GraphQL or another.
- **Mix-and-match services**: mix data services as you see fit, making one query from GraphQL and one from a REST API.
- **Efficient**: only fetch data when needed for that data source.

> This is a refactor of the [combine-pagination](https://github.com/chrisvxd/combine-pagination) module made by [@chrisvxd](https://github.com/chrisvxd).

## Install

```bash
npm install --save use-combined-pagination
```

or with Yarn:

```bash
yarn add use-combined-pagination
```

## Basic Usage

This module is meant to be used for merge and sort multiple data sources at once, before start using this module, please read [the problem](https://github.com/chrisvxd/combine-pagination#the-problem) that this module solves.

```tsx
import React, { Component } from 'react'
import { useCombinedPagination } from 'use-combined-pagination'

const MyDataList = () => {
  const fetchData1 = async (page: number) => {
    // ... fetch data from data source 1
  }

  const fetchData2 = async (page: number) => {
    // ... fetch data from data source 1
  }

  const { loading, data, getNext, hasNext } = useCombinedPagination({
    getters: [fetchData1, fetchData2],
    sortKey: 'popularity'
  })

  useEffect(() => {
    // fetch the first page on mount
    getNext()
  }, [])

  return (
    <div>
      {loading && <div>Loading...</div>}
      {data && data.map((item) => <div key={item.id}>{item.name}</div>)}
      {hasNext && (
        <button disabled={loading} onClick={getNext}>
          Load more
        </button>
      )}
    </div>
  )
}
```

### getNext() Usage

`getNext()` function is used to fetch the next page of data.

It returns a promise that resolves with an array of sorted data.

```tsx
const { getNext } = useCombinedPagination({
  getters: [fetchData1, fetchData2],
  sortKey: 'popularity'
})

...
const page1 = await getNext()
const page2 = await getNext()
const page3 = await getNext()
```

## More Information

More information about the problem, the solution, use cases, Framed Range Intersecting and fuzzy pagination can be found on the [combine-pagination README](https://github.com/chrisvxd/combine-pagination).

## TODO

- [ ] CONTRIBUTING Guide
- [ ] create-react-app example
- [ ] Add tests for `loading`
- [ ] Reset functionality
- [ ] Add support for multiple `sortKey`

## Credits

This module is a `React Hook` + `Typescript` refactor of the [combine-pagination](https://github.com/chrisvxd/combine-pagination) project.

This project would not have existed without the excellent work of [@chrisvxd](https://github.com/chrisvxd).

## License

MIT © [Hyperting S.r.l.](https://www.hyperting.com/)
