// Gully stack check (gully-ops stack/, owner rule 2026-11-25 "Whole-stack sync"): this repo must match the stack registry
// snapshot in .stack/. Never edit .stack/snapshot.json or .stack/stack-check.mjs here: change the registry in gully-ops and run
// stack/tools/propagate.mjs. .stack/checks.json is this repo's own list of what it promises.
import { execFileSync } from 'child_process'
import path from 'path'

const root = path.resolve(__dirname, '../../../../../..')

test('stack check: this repo matches the Gully stack registry', () => {
  let out = ''
  try {
    out = execFileSync(process.execPath, [path.join(root, '.stack/stack-check.mjs'), '--root', root], { encoding: 'utf8' })
  } catch (e) {
    throw new Error(String((e as { stdout?: string }).stdout || e))
  }
  expect(out).toMatch(/: PASS/)
})
