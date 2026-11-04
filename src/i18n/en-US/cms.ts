// "Morpheme" under "Indstillinger" (the CMS's update page, #morpheme): the running version, a new one and its notes,
// and an update's progress; also the notifications and commit messages (worker/cms-update.js).

export const cms = {
  running: (v: string) => `Version ${v}`,
  /** When npm was last asked for a new version, as when.ts writes it. */
  checked: (when: string) => `Checked ${when}`,
  notChecked: 'Not checked yet',
  upToDate: 'Up to date',
  available: (v: string) => `Version ${v} is available`,
  whatsNew: 'What’s new',
  major: 'A new major version isn’t installed by itself.',
  skipped: (v: string) => `Version ${v} was undone because the website couldn’t be updated with it.`,
  /** Followed by the command, in a code block. */
  needsNpm: 'Updating needs npm. Run this in the website’s repository:',
  update: 'Update',
  tryAgain: 'Try again',
  waiting: (v: string) => `Updating to ${v}. This takes a few minutes.`,
  undoing: (v: string) => `Undoing the update to ${v}.`,
  done: (v: string) => `Updated to ${v}`,
  undone: (v: string) => `The update to ${v} was undone because the website couldn’t be updated with it.`,
  stuck: (v: string) =>
    `The website couldn’t be updated with ${v}, and going back to the earlier version failed too. Fix the website by hand.`,
  unreachable: 'npm or GitHub couldn’t be reached.',
  cannotWrite: 'The website’s GitHub token can’t save changes. In GitHub, give it Contents: Read and write.',
  noToken: 'The website has no GitHub token (GITHUB_PUBLISH_TOKEN).',
  noKv: 'The website has no KV storage (PUSH), so it can’t look for new versions.',
  notManaged: 'The version is fixed in the website’s package.json, so it can’t be updated here.',
  slowUndo: 'The GitHub token can’t see whether the update worked, so a failed update is undone after 20 minutes.',
  /** The site's notifications (Notifications.tsx) and the commits the Worker writes, in the site's language. */
  notifyDone: (v: string) => `Morpheme was updated to ${v}`,
  notifyUndone: (v: string) => `The update of Morpheme to ${v} was undone because the website couldn’t be updated with it`,
  notifyStuck: (v: string) => `The website couldn’t be updated with Morpheme ${v}, and going back failed too. Fix the website by hand.`,
  commitUpdate: (v: string) => `Update Morpheme to ${v}`,
  commitUndo: (v: string) => `Undo the update of Morpheme to ${v}`,
};
