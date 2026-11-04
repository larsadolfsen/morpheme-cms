// "Morpheme" under "Indstillinger" (the CMS's update page, #morpheme): the running version, a new one and its notes,
// and an update's progress; also the Worker's notifications and commit messages (worker/cms-update.js).

export const cms = {
  running: (v: string) => `Version ${v}`,
  /** When the Worker last asked npm, as when.ts writes it. */
  checked: (when: string) => `Checked ${when}`,
  notChecked: 'Not checked yet',
  upToDate: 'Up to date',
  available: (v: string) => `Version ${v} is available`,
  whatsNew: 'What’s new',
  major: 'A new major version isn’t installed by itself.',
  skipped: (v: string) => `${v} was undone because the site couldn’t be built.`,
  /** Followed by the command, in a code block. */
  needsNpm: 'It needs npm. Run this in the site’s repository:',
  update: 'Update',
  tryAgain: 'Try again',
  waiting: (v: string) => `Updating to ${v}. Waiting for the site to be built.`,
  undoing: (v: string) => `Undoing the update to ${v}.`,
  done: (v: string) => `Updated to ${v}`,
  undone: (v: string) => `The update to ${v} was undone because the site couldn’t be built.`,
  stuck: (v: string) => `The update to ${v} and its undo couldn’t be built. The site must be fixed by hand.`,
  unreachable: 'npm or GitHub couldn’t be reached.',
  cannotWrite: 'The site’s GitHub token can’t save. Give it Contents: Read and write.',
  noToken: 'The site has no GitHub token (GITHUB_PUBLISH_TOKEN).',
  notManaged: 'The site’s package.json decides the version.',
  slowUndo: 'The token can’t read check runs, so a failed update is undone after 20 minutes.',
  /** The site's notifications (Notifications.tsx) and the commits the Worker writes, in the site's language. */
  notifyDone: (v: string) => `Morpheme was updated to ${v}`,
  notifyUndone: (v: string) => `The update of Morpheme to ${v} was undone because the site couldn’t be built`,
  notifyStuck: (v: string) => `Morpheme ${v} couldn’t be built, and neither could its undo. Fix the site by hand.`,
  commitUpdate: (v: string) => `Update Morpheme to ${v}`,
  commitUndo: (v: string) => `Undo the update of Morpheme to ${v}`,
};
