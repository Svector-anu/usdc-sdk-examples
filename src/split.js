/**
 * Splits a USDC amount between recipients by weight, for payouts shared
 * between several contributors.
 *
 *   splitUsdc('1', [1, 1, 1]) -> ['0.333334', '0.333333', '0.333333']
 *
 * Contract:
 * - `amount` is a USDC string with at most six decimals ("10", "0.000001").
 * - `weights` are non-negative integers (numbers or bigints) with a positive total.
 * - Shares add up to `amount` exactly, in micro-units.
 * - Each recipient gets floor(amount * weight / total); the micro-units left
 *   over go one each to the recipients with the largest remainders, ties to
 *   the lower index. A zero weight never receives anything.
 * - Shares are returned with exactly six decimals.
 * - Anything else throws a RangeError.
 */
export function splitUsdc(amount, weights) {
  const total = Number(amount)
  const sum = weights.reduce((a, b) => a + Number(b), 0)
  const shares = weights.map((w) => Math.round((total * Number(w) * 1e6) / sum) / 1e6)
  const drift = total - shares.reduce((a, b) => a + b, 0)
  shares[shares.length - 1] += drift
  return shares.map((s) => s.toFixed(6))
}
