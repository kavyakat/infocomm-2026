import { describe, it, expect } from 'vitest'
import { toCsv } from '../../lib/export'

describe('toCsv', () => {
  it('happy path: 2 rows, 3 columns', () => {
    const rows = [
      { name: 'Alice', age: 30, city: 'Delhi' },
      { name: 'Bob', age: 25, city: 'Mumbai' },
    ]
    const result = toCsv(rows, ['name', 'age', 'city'])
    expect(result).toBe('name,age,city\r\nAlice,30,Delhi\r\nBob,25,Mumbai')
  })

  it('empty rows returns empty string', () => {
    expect(toCsv([], ['name', 'age'])).toBe('')
  })

  it('value containing comma is wrapped in double quotes', () => {
    const rows = [{ name: 'Smith, John', score: 10 }]
    const result = toCsv(rows, ['name', 'score'])
    expect(result).toBe('name,score\r\n"Smith, John",10')
  })

  it('value containing newline is wrapped in double quotes', () => {
    const rows = [{ note: 'line1\nline2', id: 1 }]
    const result = toCsv(rows, ['note', 'id'])
    expect(result).toBe('note,id\r\n"line1\nline2",1')
  })

  it('value containing double quote is escaped as "" inside quotes', () => {
    const rows = [{ title: 'He said "hello"', id: 2 }]
    const result = toCsv(rows, ['title', 'id'])
    expect(result).toBe('title,id\r\n"He said ""hello""",2')
  })

  it('null value becomes empty string cell', () => {
    const rows = [{ name: 'Alice', rating: null }]
    const result = toCsv(rows, ['name', 'rating'])
    expect(result).toBe('name,rating\r\nAlice,')
  })

  it('undefined value becomes empty string cell', () => {
    const rows = [{ name: 'Bob', rating: undefined }]
    const result = toCsv(rows, ['name', 'rating'])
    expect(result).toBe('name,rating\r\nBob,')
  })
})
