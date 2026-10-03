/** USDC has 6 decimals. Amounts move around as integer micro-units (bigint). */
export const USDC_DECIMALS = 6n

/** 1500000n -> "1.5". Back to Number: shorter and fine for display. */
export function formatUsdc(micro) {
  return String(Number(micro) / 1e6)
}

/** "1.5" -> 1500000n. Rejects more than 6 decimals instead of rounding. */
export function parseUsdc(text) {
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(text.trim())
  if (!match) throw new Error(`not a USDC amount: ${text}`)
  return BigInt(match[1]) * 10n ** USDC_DECIMALS + BigInt((match[2] ?? '').padEnd(6, '0'))
}
