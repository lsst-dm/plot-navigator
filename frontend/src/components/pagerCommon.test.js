
import { vi, expect, test } from 'vitest'
import { useQueryParam } from './pagerCommon'
import * as router from 'react-router'
import { z } from 'zod';

/*
  This mocks the useSearchParams function that usesQueryPram calls to get the
  query string.  This defaults to the query string having o=1, but that can be
  configured by calling overrideSearchParamsMock at the start of a test.
*/
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal()
  const retValue = {}
  return {
    ...actual,
    useSearchParams: vi.fn(() => [{get: (key) => retValue[key]}, (param) => {}]),
  }
})

/*
   TODO: setParamCallback is common to all of the tests, so it needs to be
   cleared before use in tests that count the number of invocations.
*/
const setParamCallback = vi.fn(() => {})
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useCallback: () => setParamCallback,
  }
})

/*
  Set the query string value that the useSearchParams mock returns.
*/
function overrideSearchParamsMock(paramsObj, setSearchParamsMock = vi.fn()) {
  vi.mocked(router.useSearchParams).mockReturnValueOnce([
      { get: (key) => paramsObj[key] ?? null },
      setSearchParamsMock,
  ])
}

test('query params should return the default', () => {
    const [paramValue, setParamValue] = useQueryParam("o", 1, z.coerce.number())
    expect(paramValue).toEqual(1)
})

test('Non-default query params should return numbers', () => {
    overrideSearchParamsMock({o: "3"})
    const [paramValue, setParamValue] = useQueryParam("o", 1, z.coerce.number())
    expect(paramValue).toEqual(3)
})

/* Ensure that value + 1 results in addition not concatenation. */
test('increment returned values param', () => {
    setParamCallback.mockClear()
    const [paramValue, setParamValue] = useQueryParam("o", 1, z.coerce.number())
    /* setParamValue does not actually change the parameter */
    setParamValue(paramValue + 1)
    expect(setParamCallback).toHaveBeenCalledExactlyOnceWith(2)
})

test('default should be returned when parameter data is invalid', () => {
    overrideSearchParamsMock({o: "asdf"})
    const [paramValue, setParamValue] = useQueryParam("o", 1, z.coerce.number())
    expect(paramValue).toEqual(1)
})
