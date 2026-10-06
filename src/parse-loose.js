/**
 * Reads an amount the way people type it, for the "send USDC" box:
 * "$1,234.56", "1.5k", "2M", "1.5e3", "250 USDC".
 *
 * Contract (returns bigint micro-units, 1 USDC = 1_000_000n):
 * - Outer whitespace is ignored. A leading "$" or a trailing "USDC" (any case,
 *   optionally after a space) is allowed, but not both.
 * - Thousands separators are "," in real groups of three ("12,345", never "1,23").
 * - At most six decimals; a seventh is an error, never rounded.
 * - A "k" or "m" suffix (any case) multiplies by a thousand or a million, and
 *   "e"/"E" with an optional sign and up to three digits is a power of ten.
 *   Neither combines with separators or with each other. The result must be a
 *   whole number of micro-units.
 * - Zero is allowed; signs, negatives, and anything over 2^63 - 1 micro-units are not.
 * - Anything else throws a RangeError.
 */
const MAX_MICRO = (1n << 63n) - 1n

function notAnAmount(input) {
  throw new RangeError(`not an amount: ${typeof input === 'string' ? JSON.stringify(input) : String(input)}`)
}

export function parseUsdcLoose(input) {
  if (typeof input !== 'string') notAnAmount(input)
  let s = input.trim()
  if (s === '') notAnAmount(input)

  // a leading "$" or a trailing "USDC", never both, never anywhere else
  const hasDollar = s.startsWith('$')
  if (hasDollar) s = s.slice(1).trimStart()
  const usdc = /\s*usdc$/i.exec(s)
  const hasUsdc = usdc !== null
  if (hasUsdc) s = s.slice(0, usdc.index).trimEnd()
  if (hasDollar && hasUsdc) notAnAmount(input)
  if (s === '') notAnAmount(input)
  if (s.includes('$') || /usdc/i.test(s)) notAnAmount(input)

  // "k"/"m" suffix or exponent, never both, never mixed with separators
  let pow = 0
  let hasScale = false

  const suffix = /^([\s\S]*?)([km])$/i.exec(s)
  if (suffix) {
    pow = suffix[2].toLowerCase() === 'k' ? 3 : 6
    s = suffix[1]
    hasScale = true
  }

  const exp = /^([\s\S]*?)[eE]([+-]?\d{1,3})$/.exec(s)
  if (exp) {
    if (hasScale) notAnAmount(input)
    if (exp[2].length > 3) notAnAmount(input)
    pow = parseInt(exp[2], 10)
    s = exp[1]
    hasScale = true
  }

  if (hasScale && s.includes(',')) notAnAmount(input)

  // a plain decimal amount: integer part, optional fraction, digits only
  const whole = s.split('.')
  if (whole.length > 2) notAnAmount(input)
  const [intPart, fracPart = ''] = whole
  // a trailing or leading dot ("1.", ".5") is not a plain decimal amount
  if (s.includes('.') && fracPart === '') notAnAmount(input)
  if (!/^\d*$/.test(fracPart)) notAnAmount(input)
  // thousands separators, only in real groups of three, stripped before the rest
  if (intPart.includes(',')) {
    const groups = intPart.split(',')
    if (groups.some(g => g === '')) notAnAmount(input)
    if (groups[0].length > 3) notAnAmount(input)
    if (groups.slice(1).some(g => g.length !== 3)) notAnAmount(input)
  }
  const intDigits = intPart.replace(/,/g, '')
  if (intDigits === '' || !/^\d+$/.test(intDigits)) notAnAmount(input)

  // exact bigint math, no floats anywhere:
  // intDigits.fracPart * 10^(6 + pow) micro-units must be a whole number
  const digits = BigInt(intDigits + fracPart)
  const scale = BigInt(6 + pow - fracPart.length)
  let value
  if (scale >= 0) {
    value = digits * 10n ** scale
  } else {
    const divisor = 10n ** -scale
    if (digits % divisor !== 0n) notAnAmount(input)
    value = digits / divisor
  }

  if (value > MAX_MICRO) notAnAmount(input)
  return value
}
