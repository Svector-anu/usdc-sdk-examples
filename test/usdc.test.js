import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatUsdc, parseUsdc } from '../src/usdc.js'

test('formats micro-units as USDC', () => {
  assert.equal(formatUsdc(1_500_000n), '1.50')
  assert.equal(formatUsdc(1_000_000n), '1.00')
  assert.equal(formatUsdc(123_456n), '0.123456')
})

test('parses exact amounts and refuses rounding', () => {
  assert.equal(parseUsdc('1.5'), 1_500_000n)
  assert.throws(() => parseUsdc('1.0000001'))
})
