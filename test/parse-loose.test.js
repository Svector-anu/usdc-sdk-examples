import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseUsdcLoose } from '../src/parse-loose.js'

const ok = (input, micro) => assert.equal(parseUsdcLoose(input), micro, JSON.stringify(input))
const bad = (input) => assert.throws(() => parseUsdcLoose(input), RangeError, JSON.stringify(input))

test('reads plain amounts, with outer whitespace', () => {
  ok('1', 1_000_000n)
  ok(' 1.5 ', 1_500_000n)
  ok('0', 0n)
  ok('0.000001', 1n)
  ok('007.25', 7_250_000n)
})

test('reads a currency sign or a USDC suffix, but not both', () => {
  ok('$1,234.56', 1_234_560_000n)
  ok('1 usdc', 1_000_000n)
  ok('1USDC', 1_000_000n)
  ok('1,234,567.000001 USDC', 1_234_567_000_001n)
  bad('$1 USDC')
  bad('usdc 1')
  bad('$')
  bad('USDC')
})

test('accepts thousands separators only in real groups of three', () => {
  ok('12,345', 12_345_000_000n)
  ok('999,999,999.999999', 999_999_999_999_999n)
  for (const s of ['1,23', '1,2345', ',123', '1,,234', '1234,567', '1,234,56', '1,234.', '1_000', '1 000']) bad(s)
})

test('refuses rounding: more than six decimals is an error, never a guess', () => {
  bad('1.0000001')
  bad('0.0000005')
})

test('reads k and m suffixes exactly, as long as the result is whole micro-units', () => {
  ok('1.5k', 1_500_000_000n)
  ok('2M', 2_000_000_000_000n)
  ok('1.0000001k', 1_000_000_100n)
  ok('0.000001m', 1_000_000n)
  ok('0.000000001m', 1_000n)
  ok('0.000000000001m', 1n)
  bad('0.0000000000001m')
  bad('1.0000000001k')
  bad('1,234k')
  bad('1.5e3k')
  bad('k')
})

test('reads scientific notation exactly', () => {
  ok('1.5e3', 1_500_000_000n)
  ok('2E-6', 2n)
  ok('1e+3', 1_000_000_000n)
  ok('1.23456789e2', 123_456_789n)
  ok('123456789e-6', 123_456_789n)
  bad('123456789e-8')
  bad('1e-7')
  bad('1e')
  bad('1e1234')
  bad('1,000e3')
})

test('stays exact up to the largest signed 64-bit amount and no further', () => {
  ok('9223372036854.775807', 9_223_372_036_854_775_807n)
  ok('9,223,372,036,854.775807', 9_223_372_036_854_775_807n)
  bad('9223372036854.775808')
  bad('1e19')
  bad('9223372036855k')
})

test('refuses negatives and anything that is not a plain decimal amount', () => {
  for (const s of ['-1', '-0', '+1', '', '   ', '1.', '.5', '0x10', 'NaN', 'Infinity', '١', '1/2', '1..2', '1.2.3']) bad(s)
  assert.throws(() => parseUsdcLoose(1), RangeError)
  assert.throws(() => parseUsdcLoose(null), RangeError)
})
