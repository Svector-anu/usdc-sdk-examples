import assert from 'node:assert/strict'
import { test } from 'node:test'
import { splitUsdc } from '../src/split.js'

const micro = (s) => {
  const [w, f = ''] = s.split('.')
  return BigInt(w) * 1_000_000n + BigInt(f.padEnd(6, '0'))
}

test('splits evenly and formats with exactly six decimals', () => {
  assert.deepEqual(splitUsdc('10', [1, 1]), ['5.000000', '5.000000'])
  assert.deepEqual(splitUsdc('1', [1, 1, 1]), ['0.333334', '0.333333', '0.333333'])
})

test('gives leftover micro-units to the largest remainders, ties to the lower index', () => {
  assert.deepEqual(splitUsdc('0.000001', [1, 1, 1]), ['0.000001', '0.000000', '0.000000'])
  assert.deepEqual(splitUsdc('0.000010', [1, 2, 4]), ['0.000001', '0.000003', '0.000006'])
  assert.deepEqual(splitUsdc('0.000005', [3, 3, 1]), ['0.000002', '0.000002', '0.000001'])
})

test('never gives anything to a zero weight', () => {
  assert.deepEqual(splitUsdc('1', [0, 1, 0]), ['0.000000', '1.000000', '0.000000'])
  assert.deepEqual(splitUsdc('0.000003', [0, 1, 1, 0]), ['0.000000', '0.000002', '0.000001', '0.000000'])
})

test('stays exact far beyond 2^53 micro-units', () => {
  assert.deepEqual(splitUsdc('9223372036854.775807', [1, 1]), ['4611686018427.387904', '4611686018427.387903'])
  assert.deepEqual(splitUsdc('9007199254740.993', [1, 2]), ['3002399751580.331000', '6004799503160.662000'])
})

test('accepts bigint weights larger than any safe number', () => {
  assert.deepEqual(splitUsdc('1', [2n ** 60n, 1n]), ['1.000000', '0.000000'])
  assert.deepEqual(splitUsdc('0.000002', [2n ** 70n, 2n ** 70n, 1n]), ['0.000001', '0.000001', '0.000000'])
})

test('always adds back to the exact amount and stays within one micro-unit of the true share', () => {
  let seed = 0x2f6b
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648)
  for (let i = 0; i < 300; i++) {
    const total = BigInt(next()) * BigInt(next() % 100000) + BigInt(next() % 1000)
    const amount = `${total / 1_000_000n}.${(total % 1_000_000n).toString().padStart(6, '0')}`
    const weights = Array.from({ length: 1 + (next() % 7) }, () => next() % 50)
    if (weights.every((w) => w === 0)) weights[0] = 1
    const shares = splitUsdc(amount, weights).map(micro)
    assert.equal(shares.reduce((a, b) => a + b, 0n), total, `sum for ${amount} / ${weights}`)
    const W = BigInt(weights.reduce((a, b) => a + b, 0))
    shares.forEach((s, j) => {
      const exactTimesW = total * BigInt(weights[j])
      assert.ok(s * W >= exactTimesW - W && s * W <= exactTimesW + W, `share ${j} of ${amount} / ${weights}`)
    })
  }
})

test('refuses amounts it cannot split exactly', () => {
  for (const bad of ['-1', '1.0000001', '', ' 1', '1e3', '1.', '.5', '1,000', 'abc']) {
    assert.throws(() => splitUsdc(bad, [1]), RangeError, `amount ${JSON.stringify(bad)}`)
  }
  assert.throws(() => splitUsdc(1, [1]), RangeError)
})

test('refuses weights that are not non-negative integers with a positive total', () => {
  for (const bad of [[], [0, 0], [-1, 2], [1.5], [Number.NaN], ['1'], [2 ** 53], [-1n]]) {
    assert.throws(() => splitUsdc('1', bad), RangeError, `weights ${String(bad)}`)
  }
})
