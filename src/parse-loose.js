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
export function parseUsdcLoose(input) {
  let s = String(input).trim().replace('$', '').replace(/usdc/i, '').replace(/,/g, '').trim()
  let scale = 1
  if (/k$/i.test(s)) { scale = 1e3; s = s.slice(0, -1) }
  if (/m$/i.test(s)) { scale = 1e6; s = s.slice(0, -1) }
  const value = parseFloat(s) * scale
  if (Number.isNaN(value) || value < 0) throw new RangeError(`not an amount: ${input}`)
  return BigInt(Math.round(value * 1e6))
}
