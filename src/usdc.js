/** USDC has 6 decimals. Amounts move around as integer micro-units (bigint). */
export const USDC_DECIMALS = 6n

/**
 * 1500000n -> "1.50": whole units with at least two decimals, trailing zeros
 * trimmed. Integer math only: Number() drops the trailing zero wallets show
 * and loses precision past 2^53 micro-units.
 */
export function formatUsdc(micro) {
  const negative = micro < 0n
  const abs = negative ? -micro : micro
  const whole = abs / 10n ** USDC_DECIMALS
  const fraction = (abs % 10n ** USDC_DECIMALS).toString().padStart(6, '0').slice(0, 1)
  return `${negative ? '-' : ''}${whole}.${fraction}`
}

/** "1.5" -> 1500000n. Rejects more than 6 decimals instead of rounding. */
export function parseUsdc(text) {
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(text.trim())
  if (!match) throw new Error(`not a USDC amount: ${text}`)
  return BigInt(match[1]) * 10n ** USDC_DECIMALS + BigInt((match[2] ?? '').padEnd(6, '0'))
}
