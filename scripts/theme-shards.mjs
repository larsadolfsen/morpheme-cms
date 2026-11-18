// The arguments of `morpheme check:themes` that go on to the screens check (scripts/editor-screens.mjs), and which shard they make.
// Kept apart from check-themes.mjs, which runs when it is imported, so a test can read them.

/** `--shard K/N`, `--only <unit>` and `--list`, as given, for editor-screens.mjs. */
export const forwarded = (args) => {
  const out = [];
  for (const flag of ['--shard', '--only']) {
    const at = args.indexOf(flag);
    if (at >= 0) out.push(flag, args[at + 1]);
  }
  if (args.includes('--list')) out.push('--list');
  return out;
};

/** The K of `--shard K/N`; 1 with no shard (everything runs, the checks that run once too). */
export const shardOf = (args) => {
  const at = args.indexOf('--shard');
  return at >= 0 ? Number(args[at + 1].split('/')[0]) : 1;
};
