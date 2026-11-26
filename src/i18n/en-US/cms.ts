// "Morpheme" under "Settings" (the CMS's update page, #morpheme): the running version, the notes of the update just
// installed, a new one and its notes, and an update's progress; also the notifications and commit messages (worker/cms-update.js).

export const cms = {
  running: (v: string) => `Version ${v}`,
  /** When npm was last asked for a new version, as when.ts writes it. */
  checked: (when: string) => `Checked ${when}`,
  notChecked: 'Not checked yet',
  upToDate: 'Up to date',
  available: (v: string) => `Version ${v} is available`,
  whatsNew: 'What’s new',
  newInYourVersion: 'New in your version',
  /** Over a version's notes on that page: "New in Morpheme Braies 0.14.3" (library.cmsEdition, else cmsVersion). */
  newIn: (name: string) => `New in ${name}`,
  /** The older minor lines under the running one's notes, each a row to its page (VersionLinePage.tsx). */
  earlierVersions: 'Earlier versions',
  versionCount: (count: number) => (count === 1 ? '1 version' : `${count} versions`),
  /** A minor line's page (#morpheme/<line>) for a line the package has no notes for. */
  lineNotFound: 'This version doesn’t exist',
  /** The arrows to the newer and the older line at the bottom of a line's notes (LineNav), for screen readers. */
  otherVersions: 'Other versions',
  alsoInThisVersion: 'Also in this version',
  storeConnection: 'Store connection',
  /** Followed by the command, in a code block. */
  needsNpm: 'Updating needs npm. Run this in the website’s repository:',
  tryAgain: 'Try again',
  /** The update is built on a copy of the website first (a branch); only when that builds is it saved to the website. */
  trying: (v: string) => `Trying version ${v} on a copy of the website first. This takes a few minutes.`,
  /** A version that failed its trial: why, the website as it was, and when Morpheme tries again (24 hours after the try). */
  failedBuild: (v: string) => `Version ${v} didn’t build, so it wasn’t installed. The website still works as before.`,
  failedNoAnswer: (v: string) => `Version ${v} didn’t finish building in time, so it wasn’t installed. The website still works as before.`,
  failedMerge: (v: string) => `Version ${v} built, but GitHub wouldn’t let Morpheme save it. The website still works as before.`,
  nextTry: (when: string) => `Next try: ${when}`,
  /** A link to the build's checks on GitHub, beside a failed or stuck update. */
  seeBuild: (v: string) => `See the build of ${v}`,
  noPreview: 'The website has no preview address (PREVIEW_URL), so Morpheme can’t try an update first.',
  waiting: (v: string) => `Updating to ${v}. This takes a few minutes.`,
  undoing: (v: string) => `Undoing the update to ${v}.`,
  done: (v: string) => `Updated to ${v}`,
  undone: (v: string) => `The update to ${v} was undone because the website couldn’t be updated with it.`,
  stuck: (v: string) =>
    `The website couldn’t be updated with ${v}, and going back to the earlier version failed too. Fix the website by hand.`,
  unreachable: 'npm or GitHub couldn’t be reached.',
  cannotWrite: 'The website’s GitHub token can’t save changes. In GitHub, give it Contents: Read and write.',
  noToken: 'The website has no GitHub token (GITHUB_PUBLISH_TOKEN).',
  noKv: 'The website has no KV namespace bound as PUSH, so it can’t look for new versions.',
  notManaged: 'The version is fixed in the website’s package.json, so it can’t be updated here.',
  slowUndo: 'The GitHub token can’t see whether a build worked, so an update that fails after it is installed is undone after 20 minutes.',
  /** On the start screen, over a reason the site can't update itself (BlockedUpdateNotice.tsx); the reasons are in cmsBlocked.mjs. */
  blockedTitle: 'Morpheme can’t update itself',
  blockedNeedsNpm: (v: string) => `Version ${v} needs npm to install. Open Morpheme for the command.`,
  blockedUnsafeCode: (v: string, places: string) =>
    `Version ${v} isn’t installed because Morpheme can’t rewrite these places in your own themes and apps: ${places}. Fix them, then update.`,
  andMore: (n: number) => ` and ${n} more`,
  blockedNoToken: 'Add a GITHUB_PUBLISH_TOKEN secret in Cloudflare so the website can update itself.',
  blockedNoKv: 'Bind a KV namespace named PUSH in Cloudflare so the website can update itself.',
  blockedTheme: (v: string, id: string) => `Version ${v} isn’t installed because the theme ${id} doesn’t work with it yet.`,
  blockedApp: (v: string, id: string) => `Version ${v} isn’t installed because the app ${id} doesn’t work with it yet.`,
  blockedThemeUnsure: (v: string, id: string) => `Version ${v} isn’t installed because Morpheme couldn’t check the theme ${id}.`,
  blockedAppUnsure: (v: string, id: string) => `Version ${v} isn’t installed because Morpheme couldn’t check the app ${id}.`,
  /** The site's notifications (Notifications.tsx) and the commits the Worker writes, in the site's language. */
  notifyDone: (v: string) => `Morpheme was updated to ${v}`,
  notifyUndone: (v: string) => `The update of Morpheme to ${v} was undone because the website couldn’t be updated with it`,
  notifyStuck: (v: string) => `The website couldn’t be updated with Morpheme ${v}, and going back failed too. Fix the website by hand.`,
  commitUpdate: (v: string) => `Update Morpheme to ${v}`,
  commitUndo: (v: string) => `Undo the update of Morpheme to ${v}`,
  /** On a site that posts the CMS's releases on its blog (worker/release-post.js): the commit with a version's post. */
  commitReleasePost: (v: string) => `Post what’s new in Morpheme ${v}`,
  /** At the end of that post: who took the edition's photo, and where (`unsplash`: a link to it on Unsplash). */
  postPhoto: (place: string, by: string, unsplash: string) => `Photo of ${place} by ${by} on ${unsplash}`,
};
