# usdc-sdk-examples

A tiny USDC helper (`src/usdc.js`) and a runnable example (`examples/transfer.mjs`).
`npm test` runs the unit tests and the example. Requires Node 22.

This repository is a safe, public sandbox used to dogfood [Bon Travail](https://github.com/Svector-anu):
Aeon watches the **Examples** workflow, investigates repeated failures, and an engineer
decides whether to hand the fix to an approved contributor who is paid in testnet USDC
once GitHub Actions passes.

## Open work

Two helpers have a written contract and a strict test suite, and neither
implementation meets it yet. Each is checked by its own job in the
**Examples** workflow, and each is paid work on [bon travail](https://bontravail.xyz/tasks):

| Helper | Job | Spec |
|---|---|---|
| `splitUsdc` (`src/split.js`) | `split` | `test/split.test.js` |
| `parseUsdcLoose` (`src/parse-loose.js`) | `parse` | `test/parse-loose.test.js` |

Rewards are paid in USDC on **Arc testnet**. Change only the file under `src/`;
the tests and the workflow are the judge and cannot be edited by a fix.

Each job prints exactly which cases fail, so a fix can be checked locally with `npm run test:split` or `npm run test:parse`.
