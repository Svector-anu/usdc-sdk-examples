import assert from 'node:assert/strict'
import { formatUsdc, parseUsdc } from '../src/usdc.js'

// What a wallet UI would show for a 1.5 USDC transfer.
const amount = parseUsdc('1.5')
const label = `Sending ${formatUsdc(amount)} USDC`
console.log(label)
assert.equal(label, 'Sending 1.50 USDC')
