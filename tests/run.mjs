/* Runner Node: `node tests/run.mjs`  (ou `npm test`, se houver package.json) */
import { runAll, suites } from "./harness.js";
import "./pvm-engine.test.js";
import "./pvm-validator.test.js";

const t0 = Date.now();
const RED = "\x1b[31m", GREEN = "\x1b[32m", DIM = "\x1b[2m", BOLD = "\x1b[1m", OFF = "\x1b[0m";
let lastSuite = null;

const res = await runAll(ev => {
  if (ev.suite !== lastSuite) { lastSuite = ev.suite; console.log("\n" + BOLD + ev.suite + OFF); }
  if (ev.ok) console.log("  " + GREEN + "PASS" + OFF + " " + DIM + ev.title + OFF);
  else console.log("  " + RED + "FAIL" + OFF + " " + ev.title + "\n       " + RED + ev.error + OFF);
});

const ms = Date.now() - t0;
console.log("\n" + "=".repeat(72));
console.log(BOLD + "PVM test suite" + OFF + " — " + res.suites + " suites, " + res.total + " testes em " + ms + " ms");
console.log((res.failed === 0 ? GREEN + res.passed + "/" + res.total + " PASSARAM" : RED + res.failed + " FALHARAM de " + res.total) + OFF);
console.log("=".repeat(72));
if (res.failed) {
  for (const f of res.failures) console.log(RED + "✕" + OFF + " [" + f.suite + "] " + f.title + "\n  " + f.error);
  process.exit(1);
}
