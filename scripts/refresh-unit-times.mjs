// Refreshes scripts/screens/unit-times.json from the logs of a full run of the screens check (every unit, all shards).
//   node scripts/refresh-unit-times.mjs <shard log> [<shard log> ...] [--from "<where the logs are from>"] [--target <seconds>]
// A log is a CI job log, or any text that holds the runner's lines `unit <n> <name>: <s> s`. The file is replaced by the times found
// (a unit the logs do not hold gets the average, see scripts/screens/support/balance.mjs). It then prints the shard count the same times
// suggest for a target wall time (default 240 s per shard) and the time of each shard for 8 shards. Never hand-edit the file.
// To get the logs: a pull request into main (or a run with `areas=all`) runs every unit; open each `screens` job's log and save it.
import { readFileSync, writeFileSync } from 'node:fs';
import { TIMES_FILE, parseUnitLines, shardLoads, suggestShards } from './screens/support/balance.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : fallback;
};
const files = args.filter((a, i) => !a.startsWith('--') && !['--from', '--target'].includes(args[i - 1]));
if (!files.length) {
  console.error('Give the log file of each screens shard: node scripts/refresh-unit-times.mjs shard1.txt shard2.txt ...');
  process.exit(1);
}
const times = new Map();
for (const file of files) for (const [name, s] of parseUnitLines(readFileSync(file, 'utf8'))) times.set(name, s);
if (!times.size) {
  console.error('No line "unit <n> <name>: <s> s" in these files; nothing written.');
  process.exit(1);
}
const seconds = Object.fromEntries([...times].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(TIMES_FILE, `${JSON.stringify({ measured: option('--from', 'a full run of the screens check'), seconds }, null, 2)}\n`);
const names = [...times.keys()];
const total = [...times.values()].reduce((a, b) => a + b, 0);
const target = Number(option('--target', 240));
console.log(`${names.length} units, ${total} s in all, written to scripts/screens/unit-times.json.`);
console.log(`For ${target} s per shard: ${suggestShards(names, times, target)} shards.`);
for (const n of [4, 6, 8, 10, 12]) console.log(`${n} shards: ${shardLoads(names, n, times).map(Math.round).join(' ')} s`);
