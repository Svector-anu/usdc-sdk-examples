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

const MAX_MICRO = 9_223_372_036_854_775_807n // 2^63 - 1

// Either a grouped decimal ("1,234,567.89"; separators only in real groups of
// three, and never combined with a suffix) or a plain decimal that may carry a
// single suffix: "k"/"m", or "e" notation with an optional sign and <=3 digits.
const AMOUNT = /^(?:(\d{1,3}(?:,\d{3})+(?:\.\d+)?)|(\d+(?:\.\d+)?)([km]|[e][+-]?\d{1,3})?)$/i

export function parseUsdcLoose(input) {
  if (typeof input !== 'string') throw new RangeError(`not an amount: ${input}`)
  let s = input.trim()

  // A leading "$" and a trailing "USDC" (any case, optionally after a space)
  // are each allowed, but not together.
  const trailing = s.match(/(?:\s+usdc|usdc)$/i)
  const hasUsdc = trailing !== null
  if (trailing) s = s.slice(0, s.length - trailing[0].length)
  const hasDollar = s.startsWith('$')
  if (hasDollar) s = s.slice(1)
  if (hasUsdc && hasDollar) throw new RangeError(`not an amount: ${input}`)

  const match = AMOUNT.exec(s)
  if (!match) throw new RangeError(`not an amount: ${input}`)

  const literal = match[1] ?? match[2]
  const suffix = match[3]
  const [whole, fraction = ''] = literal.replace(/,/g, '').split('.')

  let scale = 0
  if (suffix) {
    const token = suffix.toLowerCase()
    if (token === 'k') scale = 3
    else if (token === 'm') scale = 6
    else scale = Number(token.slice(1)) // e-notation exponent, sign included
  }

  // micro-units = digits x 10^(scale + 6 - decimals). Exact only: a negative
  // power that does not divide evenly means the value is not whole micro-units.
  const shift = scale + 6 - fraction.length
  const digits = BigInt(whole + fraction)
  let micro
  if (shift >= 0) {
    micro = digits * 10n ** BigInt(shift)
  } else {
    const divisor = 10n ** BigInt(-shift)
    if (digits % divisor !== 0n) throw new RangeError(`not an amount: ${input}`)
    micro = digits / divisor
  }

  if (micro > MAX_MICRO) throw new RangeError(`not an amount: ${input}`)
  return micro
}
