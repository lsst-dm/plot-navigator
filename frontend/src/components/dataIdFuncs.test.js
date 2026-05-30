import { expect, test } from 'vitest'
import { DataIdSortFunc, DataIdMerge } from './dataIdFuncs.js'

test('sort by tracts', () => {
    expect(DataIdSortFunc({tract: 9}, {tract: 5})).toBeGreaterThanOrEqual(1)
})

test('sort by band', () => {
    expect(DataIdSortFunc({band: "g"}, {band: "y"})).toBeLessThanOrEqual(-1)
})

test('sort by tract then band', () => {
    expect(DataIdSortFunc({tract: 9, band: "g"}, {tract: 5, band: "y"})).toBeGreaterThanOrEqual(-1)
    expect(DataIdSortFunc({tract: 9, band: "y"}, {tract: 5, band: "g"})).toBeGreaterThanOrEqual(-1)
})

test('Merge matching DataID arrays', () => {
    const merged = DataIdMerge([{tract: 9}, {tract: 10}], [{tract: 9}, {tract: 10}], DataIdSortFunc)
    expect(merged[0].a.tract).toBe(9)
    expect(merged[0].b.tract).toBe(9)

    expect(merged[1].a.tract).toBe(10)
    expect(merged[1].b.tract).toBe(10)

})

test('Merge DataID arrays with one gap', () => {
    const merged = DataIdMerge([{tract: 9}, {tract: 11}], [{tract: 9}, {tract: 10}, {tract: 11}], DataIdSortFunc)
    expect(merged[0].a.tract).toBe(9)
    expect(merged[0].b.tract).toBe(9)

    expect(merged[1].a).toBe(null)
    expect(merged[1].b.tract).toBe(10)

    expect(merged[2].a.tract).toBe(11)
    expect(merged[2].b.tract).toBe(11)

})

test('Merge DataID arrays with the other gap', () => {
    const merged = DataIdMerge([{tract: 9}, {tract: 10}, {tract: 11}], [{tract: 9}, {tract: 11}], DataIdSortFunc)
    expect(merged[0].a.tract).toBe(9)
    expect(merged[0].b.tract).toBe(9)

    expect(merged[1].a.tract).toBe(10)
    expect(merged[1].b).toBe(null)

    expect(merged[2].a.tract).toBe(11)
    expect(merged[2].b.tract).toBe(11)

})

test('Merge DataID arrays with payload', () => {
    const merged = DataIdMerge([
        {something: 1234, dataId: {tract: 9}},
        {something: 5678, dataId: {tract: 10}},
        {something: 9, dataId: {tract: 11}}],

        [{something: 9999, dataId: {tract: 9}}],
        (a, b) => DataIdSortFunc(a.dataId, b.dataId))
    expect(merged[0].a.something).toBe(1234)
    expect(merged[0].b.something).toBe(9999)
    console.log(JSON.stringify(merged))

    expect(merged[1].a.something).toBe(5678)
    expect(merged[1].b).toBe(null)
})
